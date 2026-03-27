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
import json

from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models.agent import Agent
from app.db.models.api_key import ApiKey
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.analytics_event import AnalyticsEvent
from app.api.middleware.rate_limit import rate_limit
from app.rag.graph import RAGGraph
from app.services.plan_limits import check_message_limit, PlanLimitExceeded
import html  # V10: for escaping user content in emails

router = APIRouter()


# ============ SCHEMAS ============

class WidgetInitRequest(BaseModel):
    """Sent when widget loads on a page"""
    agent_id: str
    api_key: Optional[str] = None
    page_url: str
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
    sources: Optional[list] = None


class WidgetEventRequest(BaseModel):
    """Analytics event from widget"""
    agent_id: str
    session_id: str
    event_type: str
    event_data: Optional[dict] = {}


class WidgetFeedbackRequest(BaseModel):
    """Feedback on a specific message"""
    agent_id: str
    session_id: str
    message_id: str
    feedback_type: str  # "thumbs_up" or "thumbs_down"
    comment: Optional[str] = None


# ============ HELPERS ============

def extract_hostname(url: str) -> str:
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or parsed.netloc
        return hostname.lower().replace('www.', '')
    except:
        return ""


def is_domain_allowed(hostname: str, allowed_domains: list) -> bool:
    if not allowed_domains or len(allowed_domains) == 0:
        return True
    
    hostname_clean = hostname.lower().replace('www.', '')
    dev_hosts = {'localhost', '127.0.0.1'}
    if hostname_clean in dev_hosts:
        return True

    for domain in allowed_domains:
        domain_clean = domain.lower().replace('www.', '').strip()
        if not domain_clean:
            continue
        if hostname_clean == domain_clean or hostname_clean.endswith('.' + domain_clean):
            return True
    
    return False


async def _validate_session_workspace(db: AsyncSession, session_id, agent_id):
    """
    V9 FIX: Validate that the conversation session belongs to the correct agent
    and that the agent's workspace has a valid API key.
    Prevents session hijacking from unauthorized domains.
    """
    stmt = select(Conversation).where(Conversation.id == session_id)
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    if not conversation:
        return None, None, "Invalid session."

    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        return None, None, "Agent not found"

    # Ensure session belongs to this agent
    if conversation.agent_id != agent.id:
        return None, None, "Session does not belong to this agent."

    # Verify workspace has at least one active API key
    key_stmt = select(ApiKey).where(
        ApiKey.workspace_id == agent.workspace_id,
        ApiKey.is_active == True,
    )
    key_result = await db.execute(key_stmt)
    if not key_result.scalar_one_or_none():
        return None, None, "No active API key found for this workspace."

    return conversation, agent, None


def _build_widget_settings(agent) -> dict:
    """Build widget settings with complete defaults for all fields."""
    widget_settings = agent.configuration.get("widget_settings", {}) if agent.configuration else {}
    
    defaults = {
        "primaryColor": "#EF4444",
        "accentColor": "#3B82F6",
        "agentName": agent.name,
        "welcomeMessage": agent.greeting_message or "Hello! How can I help you today?",
        "position": "bottom-right",
        "theme": "auto",
        "showPoweredBy": True,
        "subtitle": "",
        "suggestedQuestions": [],
        "autoOpenDelay": 0,
        "borderRadius": 16,
        "shadowStyle": "medium",
        "soundEnabled": False,
        "avatarUrl": agent.avatar_url or None,
    }
    
    for key, default_val in defaults.items():
        if key not in widget_settings or widget_settings[key] is None:
            widget_settings[key] = default_val
    
    return widget_settings


# ============ ENDPOINTS ============

@router.post("/init", response_model=WidgetInitResponse, dependencies=[Depends(rate_limit(100, 3600, "widget"))])
async def widget_init(
    request: WidgetInitRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
    api_key_service = Depends(deps.get_api_key_service)
):
    """Initialize secure widget session."""
    try:
        agent_uuid = UUID(request.agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id format")
    
    stmt = select(Agent).where(Agent.id == agent_uuid)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.is_active:
        return WidgetInitResponse(
            agent_id=str(agent.id), agent_name=agent.name,
            widget_settings={}, session_id="", allowed=False,
            error="This agent is currently inactive."
        )
        
    hostname = extract_hostname(request.page_url)
    
    # === SECURITY CHECK ===
    is_allowed = False
    auth_error = ""
    
    if request.api_key:
        key_record = await api_key_service.validate_api_key(request.api_key, None)
        
        if not key_record:
            is_allowed = False
            auth_error = "Invalid API Key."
        elif key_record.workspace_id != agent.workspace_id:
            is_allowed = False
            auth_error = "API Key does not belong to this agent's workspace."
        else:
            if agent.allowed_domains and len(agent.allowed_domains) > 0:
                if not is_domain_allowed(hostname, agent.allowed_domains):
                    is_allowed = False
                    auth_error = f"Domain '{hostname}' is not authorized."
                else:
                    is_allowed = True
            else:
                is_allowed = True
    else:
        is_allowed = False
        auth_error = "API Key is required."

    if not is_allowed:
        return WidgetInitResponse(
            agent_id=str(agent.id), agent_name=agent.name,
            widget_settings={}, session_id="", allowed=False,
            error=auth_error or "Access denied"
        )
    
    # Generate session
    session_id = str(uuid4())
    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("user-agent", "")
    
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
            "auth_method": "api_key"
        }
    )
    db.add(conversation)
    
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
    
    widget_settings = _build_widget_settings(agent)
    
    return WidgetInitResponse(
        agent_id=str(agent.id),
        agent_name=agent.name,
        widget_settings=widget_settings,
        session_id=session_id,
        allowed=True
    )


@router.post("/chat", response_model=WidgetChatResponse, dependencies=[Depends(rate_limit(200, 3600, "widget"))])
async def widget_chat(
    request: WidgetChatRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
):
    """Handle chat message (non-streaming, backwards compatible)."""
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # V9 FIX: Re-validate session and API key on every chat request
    conversation, agent, error = await _validate_session_workspace(db, session_id, agent_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # ── Plan limit: check monthly message quota ──
    try:
        await check_message_limit(db, agent.workspace_id)
    except PlanLimitExceeded as e:
        raise HTTPException(status_code=403, detail=e.message)
    
    user_message = Message(
        conversation_id=conversation.id,
        workspace_id=agent.workspace_id,
        role="user",
        content=request.message,
        token_count=len(request.message.split()),
    )
    db.add(user_message)
    await db.flush()
    
    rag = RAGGraph(db)
    
    document_ids = None
    if agent.configuration and "knowledge_sources" in agent.configuration:
        document_ids = agent.configuration["knowledge_sources"]
    
    behavior_settings = agent.behavior_settings or {}
    custom_prompt = ""
    if agent.configuration and "custom_prompt" in agent.configuration:
        custom_prompt = agent.configuration["custom_prompt"]
    
    response_config = agent.response_config or {}
    conversation_rules = agent.conversation_rules or {}
    
    import time
    
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
        msg_status = "success"
    except Exception as e:
        print(f"RAG Error: {e}")
        response_text = agent.fallback_message or "I'm sorry, I couldn't process your request."
        msg_status = "error"
        
        # Track fallback as unanswered question
        try:
            from app.db.repositories.analytics_repo import AnalyticsRepository
            analytics_repo = AnalyticsRepository(db)
            await analytics_repo.track_unanswered_question(
                workspace_id=agent.workspace_id,
                question=request.message,
                agent_id=agent.id,
                conversation_id=conversation.id,
            )
        except Exception as track_err:
            print(f"Failed to track fallback as unanswered: {track_err}")
    
    end_time = time.time()
    response_time_ms = int((end_time - start_time) * 1000)
    # Use retriever's avg similarity for real confidence score
    try:
        from app.rag.retriever import Retriever
        retriever = Retriever(db)
        _, _, avg_sim = await retriever.retrieve_with_sources(
            request.message, agent.workspace_id
        )
        confidence_score = round(avg_sim, 4)
    except Exception:
        confidence_score = 0.0
    
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
            "status": msg_status
        }
    )
    db.add(event)
    await db.commit()
    
    return WidgetChatResponse(
        response=response_text,
        message_id=str(assistant_message.id)
    )


@router.post("/chat/stream", dependencies=[Depends(rate_limit(200, 3600, "widget"))])
async def widget_chat_stream(
    request: WidgetChatRequest,
    req: Request,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Stream chat response as Server-Sent Events (SSE).
    
    Events:
    - data: {"token": "..."} — streamed text chunks
    - data: {"sources": [...]} — source citations after response
    - data: {"message_id": "..."} — final message ID
    - data: [DONE] — stream complete
    """
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # V9 FIX: Re-validate session and API key on every stream request
    conversation, agent, error = await _validate_session_workspace(db, session_id, agent_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # ── Plan limit: check monthly message quota ──
    try:
        await check_message_limit(db, agent.workspace_id)
    except PlanLimitExceeded as e:
        raise HTTPException(status_code=403, detail=e.message)
    
    user_message = Message(
        conversation_id=conversation.id,
        workspace_id=agent.workspace_id,
        role="user",
        content=request.message,
        token_count=len(request.message.split()),
    )
    db.add(user_message)
    await db.flush()
    
    document_ids = None
    if agent.configuration and "knowledge_sources" in agent.configuration:
        document_ids = agent.configuration["knowledge_sources"]
    
    behavior_settings = agent.behavior_settings or {}
    custom_prompt = ""
    if agent.configuration and "custom_prompt" in agent.configuration:
        custom_prompt = agent.configuration["custom_prompt"]
    
    response_config = agent.response_config or {}
    conversation_rules = agent.conversation_rules or {}

    async def event_generator():
        import time
        
        rag = RAGGraph(db)
        start_time = time.time()
        full_response = ""
        retrieval_confidence = 0.0
        
        try:
            async for chunk in rag.process_message_stream(
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
            ):
                if "token" in chunk:
                    yield f"data: {json.dumps({'token': chunk['token']})}\n\n"
                elif "sources" in chunk:
                    yield f"data: {json.dumps({'sources': chunk['sources']})}\n\n"
                elif "done" in chunk:
                    full_response = chunk.get("full_response", "")
                    retrieval_confidence = chunk.get("confidence", 0.0)
            
        except Exception as e:
            print(f"Streaming RAG Error: {e}")
            fallback = agent.fallback_message or "I'm sorry, I couldn't process your request."
            full_response = fallback
            retrieval_confidence = 0.0
            yield f"data: {json.dumps({'token': fallback})}\n\n"
            
            # Track fallback as unanswered question
            try:
                from app.db.repositories.analytics_repo import AnalyticsRepository
                analytics_repo = AnalyticsRepository(db)
                await analytics_repo.track_unanswered_question(
                    workspace_id=agent.workspace_id,
                    question=request.message,
                    agent_id=agent.id,
                    conversation_id=conversation.id,
                )
            except Exception as track_err:
                print(f"Failed to track fallback as unanswered: {track_err}")
        
        # Save assistant message with real confidence
        end_time = time.time()
        response_time_ms = int((end_time - start_time) * 1000)
        confidence_score = round(retrieval_confidence, 4)
        
        assistant_message = Message(
            conversation_id=conversation.id,
            workspace_id=agent.workspace_id,
            role="assistant",
            content=full_response,
            token_count=len(full_response.split()),
            response_time_ms=response_time_ms,
            confidence_score=confidence_score,
        )
        db.add(assistant_message)
        
        event = AnalyticsEvent(
            workspace_id=agent.workspace_id,
            agent_id=agent.id,
            conversation_id=conversation.id,
            event_type="chat_message",
            event_data={
                "user_message_length": len(request.message),
                "response_length": len(full_response),
                "response_time_ms": response_time_ms,
                "confidence_score": confidence_score,
                "status": "success",
                "streamed": True,
            }
        )
        db.add(event)
        await db.commit()
        
        yield f"data: {json.dumps({'message_id': str(assistant_message.id)})}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/feedback")
async def widget_feedback(
    request: WidgetFeedbackRequest,
    db: AsyncSession = Depends(deps.get_db),
):
    """Record thumbs up/down feedback on a message."""
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
        message_id = UUID(request.message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=session_id,
        event_type=f"feedback_{request.feedback_type}",
        event_data={
            "message_id": str(message_id),
            "feedback_type": request.feedback_type,
            "comment": request.comment,
        }
    )
    db.add(event)
    await db.commit()
    
    return {"status": "ok"}


@router.post("/event")
async def widget_track_event(
    request: WidgetEventRequest,
    db: AsyncSession = Depends(deps.get_db),
):
    """Track analytics events from widget."""
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id) if request.session_id else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
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
    """Quick config endpoint for widget prefetch."""
    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id format")
    
    stmt = select(Agent).where(Agent.id == agent_uuid)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    widget_settings = _build_widget_settings(agent)
    
    return {
        "agent_id": str(agent.id),
        "name": agent.name,
        "configuration": {"widget_settings": widget_settings}
    }


# ============ LEAD EMAIL CTA ============

class LeadEmailRequest(BaseModel):
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
    """Send a lead notification email to the agent owner's CTA email."""
    try:
        agent_id = UUID(request.agent_id)
        session_id = UUID(request.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    stmt = select(Agent).where(Agent.id == agent_id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    rules = agent.conversation_rules or {}
    cta_email = rules.get("cta_email")
    cta_verified = rules.get("cta_email_verified", False)
    
    if not cta_email or not cta_verified:
        raise HTTPException(status_code=400, detail="No verified contact email configured.")
    
    msgs_stmt = (
        select(Message)
        .where(Message.conversation_id == session_id)
        .order_by(Message.created_at)
    )
    msgs_result = await db.execute(msgs_stmt)
    messages = msgs_result.scalars().all()
    
    conv_stmt = select(Conversation).where(Conversation.id == session_id)
    conv_result = await db.execute(conv_stmt)
    conversation = conv_result.scalar_one_or_none()
    page_url = conversation.referrer_url if conversation else "Unknown"
    
    visitor_name = request.visitor_name or "Anonymous Visitor"
    visitor_phone = request.visitor_phone or "Not provided"
    visitor_msg = request.visitor_message or ""
    
    conv_html_lines = []
    for msg in messages:
        role_label = "🧑 Visitor" if msg.role == "user" else f"🤖 {html.escape(agent.name)}"
        bg_color = "#f0f0f0" if msg.role == "user" else "#e8f4fd"
        # V10 FIX: HTML-escape all user content to prevent XSS in emails
        safe_content = html.escape(msg.content)
        conv_html_lines.append(
            f'<div style="background:{bg_color};padding:10px 14px;border-radius:8px;margin-bottom:8px;">'
            f'<strong>{role_label}:</strong><br/>{safe_content}</div>'
        )
    
    conv_html = "\n".join(conv_html_lines) if conv_html_lines else "<p>No conversation history.</p>"
    # V10 FIX: HTML-escape user-provided fields
    safe_visitor_name = html.escape(visitor_name)
    safe_visitor_email = html.escape(request.visitor_email)
    safe_visitor_phone = html.escape(visitor_phone)
    safe_page_url = html.escape(str(page_url))

    visitor_msg_block = ""
    if visitor_msg:
        safe_visitor_msg = html.escape(visitor_msg)
        visitor_msg_block = (
            '<div style="margin:16px 0;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">'
            f'<strong>Message from visitor:</strong><br/>{safe_visitor_msg}</div>'
        )
    
    html_body = f"""
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:linear-gradient(135deg,#EF4444,#991B1B);padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">🔥 New Lead from {html.escape(agent.name)}</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">A visitor wants to connect</p>
        </div>
        <div style="background:white;padding:24px 32px;border:1px solid #e5e7eb;">
            <h2 style="font-size:16px;color:#111;margin:0 0 16px;">📋 Visitor Information</h2>
            <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">{safe_visitor_name}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:{safe_visitor_email}" style="color:#EF4444;">{safe_visitor_email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">{safe_visitor_phone}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Page URL</td><td style="padding:8px 0;font-size:13px;">{safe_page_url}</td></tr>
            </table>
            {visitor_msg_block}
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="font-size:16px;color:#111;margin:0 0 16px;">💬 Conversation Summary</h2>
            {conv_html}
        </div>
        <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
            Powered by <strong>Insydr</strong>
        </div>
    </div>
    """
    
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
    
    event = AnalyticsEvent(
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=session_id,
        event_type="lead_email_sent",
        event_data={
            "visitor_name": visitor_name,
            "visitor_email": request.visitor_email,
            "page_url": page_url,
        }
    )
    db.add(event)
    await db.commit()
    
    return {"status": "ok", "message": "Lead email sent successfully"}
