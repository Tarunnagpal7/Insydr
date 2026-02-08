"""
Public Widget API Endpoints

These endpoints are PUBLIC and do not require authentication.
They are designed to be called from the embeddable widget JS.

Flow (similar to Google Analytics):
① Browser loads customer's page
② Browser loads widget.js from CDN/server
③ Widget script runs automatically
④ It initializes with agent_id and collects page data
⑤ Sends initialization event + chat messages to these endpoints
"""

from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models.agent import Agent
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.analytics_event import AnalyticsEvent
from app.rag.graph import RAGGraph

router = APIRouter()


# ============ SCHEMAS ============

class WidgetInitRequest(BaseModel):
    """Sent when widget loads on a page"""
    agent_id: str
    page_url: str           # Full URL of the page
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    language: Optional[str] = None


class WidgetInitResponse(BaseModel):
    """Widget configuration returned after successful init"""
    agent_id: str
    agent_name: str
    widget_settings: dict
    session_id: str
    allowed: bool
    error: Optional[str] = None


class WidgetChatRequest(BaseModel):
    """Chat message from widget"""
    agent_id: str
    session_id: str
    message: str
    page_url: Optional[str] = None


class WidgetChatResponse(BaseModel):
    """Chat response to widget"""
    response: str
    message_id: str


class WidgetEventRequest(BaseModel):
    """Analytics event from widget"""
    agent_id: str
    session_id: str
    event_type: str  # "widget_open", "widget_close", "feedback", etc.
    event_data: Optional[dict] = {}


# ============ HELPER FUNCTIONS ============

def extract_hostname(url: str) -> str:
    """Extract hostname from URL"""
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower().replace('www.', '')
    except:
        return ""


def is_domain_allowed(hostname: str, allowed_domains: list) -> bool:
    """
    Check if hostname is in allowed domains list.
    Empty list = allow all (for testing/development)
    """
    if not allowed_domains or len(allowed_domains) == 0:
        return True  # Allow all if no restrictions set
    
    hostname_clean = hostname.lower().replace('www.', '')
    
    for domain in allowed_domains:
        domain_clean = domain.lower().replace('www.', '').strip()
        if not domain_clean:
            continue
        # Exact match or subdomain match
        if hostname_clean == domain_clean or hostname_clean.endswith('.' + domain_clean):
            return True
    
    return False


# ============ ENDPOINTS ============

@router.post("/init", response_model=WidgetInitResponse)
async def widget_init(
    request: WidgetInitRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Initialize widget session - called when widget loads on a page.
    
    This is the first call the widget makes. It:
    1. Validates the agent exists
    2. Checks if the embedding domain is allowed
    3. Creates a session for tracking
    4. Returns widget configuration
    """
    try:
        agent_id = UUID(request.agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id format")
    
    # Fetch agent
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Extract hostname and check domain whitelist
    hostname = extract_hostname(request.page_url)
    allowed_domains = agent.allowed_domains or []
    
    is_allowed = is_domain_allowed(hostname, allowed_domains)
    
    if not is_allowed:
        return WidgetInitResponse(
            agent_id=str(agent.id),
            agent_name=agent.name,
            widget_settings={},
            session_id="",
            allowed=False,
            error=f"Domain '{hostname}' is not authorized to use this widget"
        )
    
    # Generate session ID
    session_id = str(uuid4())
    
    # Get client info
    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("user-agent", "")
    
    # Create conversation record
    conversation = Conversation(
        id=UUID(session_id),
        agent_id=agent.id,
        workspace_id=agent.workspace_id,
        session_id=session_id,
        user_ip=client_ip,
        user_agent=user_agent,
        language=request.language,
        referrer_url=request.page_url,
        page_title=request.page_title,
        hostname=hostname,
        status="active",
        started_at=datetime.utcnow(),
        meta={
            "referrer": request.referrer,
            "init_time": datetime.utcnow().isoformat()
        }
    )
    db.add(conversation)
    
    # Track analytics event
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=UUID(session_id),
        event_type="widget_init",
        event_data={
            "page_url": request.page_url,
            "page_title": request.page_title,
            "hostname": hostname,
            "referrer": request.referrer,
            "user_agent": user_agent,
        }
    )
    db.add(event)
    
    await db.commit()
    
    # Build widget settings
    widget_settings = agent.configuration.get("widget_settings", {}) if agent.configuration else {}
    
    # Set defaults if not present
    if not widget_settings.get("primaryColor"):
        widget_settings["primaryColor"] = "#EF4444"
    if not widget_settings.get("agentName"):
        widget_settings["agentName"] = agent.name
    if not widget_settings.get("welcomeMessage"):
        widget_settings["welcomeMessage"] = agent.greeting_message or "Hello! How can I help you today?"
    if not widget_settings.get("position"):
        widget_settings["position"] = "bottom-right"
    
    return WidgetInitResponse(
        agent_id=str(agent.id),
        agent_name=agent.name,
        widget_settings=widget_settings,
        session_id=session_id,
        allowed=True
    )


@router.post("/chat", response_model=WidgetChatResponse)
async def widget_chat(
    request: WidgetChatRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Handle chat message from widget.
    
    This is PUBLIC - no auth required.
    Validates session and processes message through RAG pipeline.
    """
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Verify session exists
    stmt = select(Conversation).where(Conversation.id == session_id)
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=400, detail="Invalid session. Please refresh the page.")
    
    # Fetch agent
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        workspace_id=agent.workspace_id,
        role="user",
        content=request.message,
        token_count=len(request.message.split()),  # Simple token count
    )
    db.add(user_message)
    await db.flush()
    
    # Process with RAG
    rag = RAGGraph(db)
    
    # Extract document IDs from agent configuration
    document_ids = None
    if agent.configuration and "knowledge_sources" in agent.configuration:
        document_ids = agent.configuration["knowledge_sources"]
    
    try:
        response_text = await rag.process_message(
            question=request.message,
            workspace_id=agent.workspace_id,
            agent_id=str(agent.id),
            document_ids=document_ids
        )
    except Exception as e:
        print(f"RAG Error: {e}")
        response_text = agent.fallback_message or "I'm sorry, I couldn't process your request. Please try again."
    
    # Save assistant message
    assistant_message = Message(
        conversation_id=conversation.id,
        workspace_id=agent.workspace_id,
        role="assistant",
        content=response_text,
        token_count=len(response_text.split()),
    )
    db.add(assistant_message)
    
    # Track analytics
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=conversation.id,
        event_type="chat_message",
        event_data={
            "user_message_length": len(request.message),
            "response_length": len(response_text),
        }
    )
    db.add(event)
    
    await db.commit()
    
    return WidgetChatResponse(
        response=response_text,
        message_id=str(assistant_message.id)
    )


@router.post("/event")
async def widget_track_event(
    request: WidgetEventRequest,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Track analytics events from widget.
    
    Event types:
    - widget_open: User opened the chat widget
    - widget_close: User closed the chat widget
    - feedback_positive: User gave positive feedback
    - feedback_negative: User gave negative feedback
    """
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id) if request.session_id else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Fetch agent to get workspace_id
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Create event
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=session_id,
        event_type=request.event_type,
        event_data=request.event_data or {}
    )
    db.add(event)
    await db.commit()
    
    return {"status": "ok"}


@router.get("/config/{agent_id}")
async def widget_get_config(
    agent_id: str,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Quick config endpoint for widget (lightweight version of /init).
    Used for prefetching settings before full init.
    """
    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id format")
    
    stmt = select(Agent).where(Agent.id == agent_uuid)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    widget_settings = agent.configuration.get("widget_settings", {}) if agent.configuration else {}
    
    return {
        "agent_id": str(agent.id),
        "name": agent.name,
        "configuration": {
            "widget_settings": {
                "primaryColor": widget_settings.get("primaryColor", "#EF4444"),
                "agentName": widget_settings.get("agentName", agent.name),
                "welcomeMessage": widget_settings.get("welcomeMessage", agent.greeting_message or "Hello! How can I help you?"),
                "position": widget_settings.get("position", "bottom-right"),
                "showPoweredBy": widget_settings.get("showPoweredBy", True),
                "theme": widget_settings.get("theme", "auto"),
            }
        }
    }
