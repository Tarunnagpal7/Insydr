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
    api_key: Optional[str] = None
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
    """Extract hostname from URL (ignoring port)"""
    try:
        parsed = urlparse(url)
        # parsed.hostname returns the host without port, parsed.netloc includes port
        hostname = parsed.hostname or parsed.netloc
        return hostname.lower().replace('www.', '')
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
    
    # DEV FRIENDLY: Treat localhost and 127.0.0.1 as equivalent to avoid confusion
    dev_hosts = {'localhost', '127.0.0.1'}
    if hostname_clean in dev_hosts:
        print("[DEBUG] Allowing localhost request implicitly")
        return True 

    is_dev_request = hostname_clean in dev_hosts

    for domain in allowed_domains:
        domain_clean = domain.lower().replace('www.', '').strip()
        if not domain_clean:
            continue
        
        # Exact match or subdomain match
        if hostname_clean == domain_clean or hostname_clean.endswith('.' + domain_clean):
            return True
            
        # Dev equivalence check
        if is_dev_request and domain_clean in dev_hosts:
            return True
    
    return False


# ============ ENDPOINTS ============

@router.post("/init", response_model=WidgetInitResponse)
async def widget_init(
    request: WidgetInitRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
    api_key_service = Depends(deps.get_api_key_service)
):
    """
    Initialize secure widget session.
    
    This is the first call the widget makes. It:
    1. Validates the agent exists
    2. Checks if the embedding domain is allowed
    3. Creates a session for tracking
    4. Returns widget configuration
    """
    try:
        agent_uuid = UUID(request.agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id format")
    
    stmt = select(Agent).where(Agent.id == agent_uuid)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if agent is active (inactive agents should not be visible on websites)
    if not agent.is_active:
        return WidgetInitResponse(
            agent_id=str(agent.id),
            agent_name=agent.name,
            widget_settings={},
            session_id="",
            allowed=False,
            error="This agent is currently inactive and not available for chat."
        )
        
    hostname = extract_hostname(request.page_url)
    
    # === SECURITY CHECK ===
    is_allowed = False
    print(f"DEBUG: Widget Init for Agent {request.agent_id} from Host: {hostname}")
    
    if request.api_key:
        print(f"DEBUG: Validating API Key: {request.api_key[:15]}...")
        # Validate API Key Identity (Skip key-level domain check as per user request)
        key_record = await api_key_service.validate_api_key(request.api_key, None)
        
        if not key_record:
            print("DEBUG: API Key Lookup FAILED. Key not found or inactive.")
            is_allowed = False
            auth_error = "Invalid API Key."
        elif key_record.workspace_id != agent.workspace_id:
            print(f"DEBUG: Workspace Mismatch! Key WS: {key_record.workspace_id}, Agent WS: {agent.workspace_id}")
            is_allowed = False
            auth_error = "API Key does not belong to this agent's workspace."
        else:
            print(f"DEBUG: API Key Valid. Checking Agent Domains: {agent.allowed_domains}")
            # Enforce Agent-Level Domain Whitelist
            # If agent has allowed_domains set, we MUST match one of them.
            if agent.allowed_domains and len(agent.allowed_domains) > 0:
                if not is_domain_allowed(hostname, agent.allowed_domains):
                    print(f"SECURITY BLOCK: Hostname '{hostname}' (Original: {request.page_url}) not in allowed domains: {agent.allowed_domains}")
                    is_allowed = False
                    auth_error = f"Domain '{hostname}' is not authorized by Agent settings."
                else:
                    print("DEBUG: Domain Allowed.")
                    is_allowed = True
            else:
                print("DEBUG: No Agent domains set. Allowing all.")
                # If Agent has no domains set, allow all (since API key is valid)
                is_allowed = True
            
    else:
        print("DEBUG: No API Key provided.")
        # STRICT SECURITY: API Key is mandatory
        is_allowed = False
        auth_error = "API Key is required. Please configure it in your integration settings."

    if not is_allowed:
        return WidgetInitResponse(
            agent_id=str(agent.id),
            agent_name=agent.name,
            widget_settings={},
            session_id="",
            allowed=False,
            error=auth_error or "Access denied"
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
            "init_time": datetime.utcnow().isoformat(),
            "auth_method": "api_key" if request.api_key else "domain_whitelist"
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
            "auth_method": "api_key" if request.api_key else "domain_whitelist"
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
    
    # Extract behavior settings for dynamic prompt
    behavior_settings = agent.behavior_settings or {}
    custom_prompt = ""
    if agent.configuration and "custom_prompt" in agent.configuration:
        custom_prompt = agent.configuration["custom_prompt"]
    
    # Extract response config and conversation rules
    response_config = agent.response_config or {}
    conversation_rules = agent.conversation_rules or {}
    
    import time
    import random
    
    start_time = time.time()
    try:
        response_text = await rag.process_message(
            question=request.message,
            workspace_id=agent.workspace_id,
            agent_id=str(agent.id),
            conversation_id=conversation.id,
            document_ids=document_ids,
            agent_type=agent.agent_type,
            behavior_settings=behavior_settings,
            custom_prompt=custom_prompt,
            agent_name=agent.name,
            response_config=response_config,
            conversation_rules=conversation_rules,
        )
        status = "success"
    except Exception as e:
        print(f"RAG Error: {e}")
        response_text = agent.fallback_message or "I'm sorry, I couldn't process your request. Please try again."
        status = "error"
    
    end_time = time.time()
    response_time_ms = int((end_time - start_time) * 1000)
    
    # Simulate confidence score for now (0.85 - 0.99) as LLM doesn't return it yet
    # In a real scenario, this would come from the RAG pipeline's relevance score
    confidence_score = round(random.uniform(0.85, 0.99), 2)
    
    # Save assistant message
    assistant_message = Message(
        conversation_id=conversation.id,
        workspace_id=agent.workspace_id,
        role="assistant",
        content=response_text,
        token_count=len(response_text.split()),
        response_time_ms=response_time_ms,
        confidence_score=confidence_score
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
            "response_time_ms": response_time_ms,
            "confidence_score": confidence_score,
            "status": status
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


# ============ LEAD EMAIL CTA ============

class LeadEmailRequest(BaseModel):
    """Visitor submits their contact info via the widget CTA"""
    agent_id: str
    session_id: str
    visitor_name: Optional[str] = None
    visitor_email: str
    visitor_phone: Optional[str] = None
    visitor_message: Optional[str] = None


@router.post("/send-lead-email")
async def send_lead_email(
    request: LeadEmailRequest,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Public endpoint — visitor clicks 'Send Email' in widget.
    
    Sends a lead notification email to the agent owner's verified CTA email
    with the visitor's info and a conversation summary.
    """
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Fetch agent
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if agent has a verified CTA email
    rules = agent.conversation_rules or {}
    cta_email = rules.get("cta_email")
    cta_verified = rules.get("cta_email_verified", False)
    
    if not cta_email or not cta_verified:
        raise HTTPException(
            status_code=400, 
            detail="This agent does not have a verified contact email configured."
        )
    
    # Fetch conversation messages to build summary
    msgs_stmt = (
        select(Message)
        .where(Message.conversation_id == session_id)
        .order_by(Message.created_at)
    )
    msgs_result = await db.execute(msgs_stmt)
    messages = msgs_result.scalars().all()
    
    # Fetch conversation metadata
    conv_stmt = select(Conversation).where(Conversation.id == session_id)
    conv_result = await db.execute(conv_stmt)
    conversation = conv_result.scalar_one_or_none()
    
    page_url = conversation.referrer_url if conversation else "Unknown"
    
    # Build formatted conversation HTML
    visitor_name = request.visitor_name or "Anonymous Visitor"
    visitor_phone = request.visitor_phone or "Not provided"
    visitor_msg = request.visitor_message or ""
    
    conv_html_lines = []
    for msg in messages:
        role_label = "🧑 Visitor" if msg.role == "user" else f"🤖 {agent.name}"
        bg_color = "#f0f0f0" if msg.role == "user" else "#e8f4fd"
        conv_html_lines.append(
            f'<div style="background:{bg_color};padding:10px 14px;border-radius:8px;margin-bottom:8px;">'
            f'<strong>{role_label}:</strong><br/>{msg.content}</div>'
        )
    
    conv_html = "\n".join(conv_html_lines) if conv_html_lines else "<p>No conversation history available.</p>"
    
    visitor_msg_block = ""
    if visitor_msg:
        visitor_msg_block = (
            '<div style="margin:16px 0;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">'
            f'<strong>Message from visitor:</strong><br/>{visitor_msg}</div>'
        )
    
    html_body = f"""
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:linear-gradient(135deg,#EF4444,#991B1B);padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">🔥 New Lead from {agent.name}</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">A visitor wants to connect with you</p>
        </div>
        <div style="background:white;padding:24px 32px;border:1px solid #e5e7eb;">
            <h2 style="font-size:16px;color:#111;margin:0 0 16px;">📋 Visitor Information</h2>
            <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">{visitor_name}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:{request.visitor_email}" style="color:#EF4444;">{request.visitor_email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">{visitor_phone}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Page URL</td><td style="padding:8px 0;font-size:13px;">{page_url}</td></tr>
            </table>
            {visitor_msg_block}
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="font-size:16px;color:#111;margin:0 0 16px;">💬 Conversation Summary</h2>
            {conv_html}
        </div>
        <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
            Powered by <strong>Insydr</strong> — AI-powered chatbots
        </div>
    </div>
    """
    
    # Send lead email
    from app.services.email_service import EmailService
    from fastapi_mail import MessageSchema, MessageType
    
    email_service = EmailService()
    message = MessageSchema(
        subject=f"🔥 New Lead: {visitor_name} via {agent.name}",
        recipients=[cta_email],
        body=html_body,
        subtype=MessageType.html,
    )
    
    try:
        await email_service.fastmail.send_message(message)
    except Exception as e:
        print(f"Failed to send lead email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send lead email.")
    
    # Track analytics
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=session_id,
        event_type="lead_email_sent",
        event_data={
            "visitor_name": visitor_name,
            "visitor_email": request.visitor_email,
            "visitor_phone": visitor_phone,
            "page_url": page_url,
        }
    )
    db.add(event)
    await db.commit()
    
    return {"status": "ok", "message": "Lead email sent successfully"}

