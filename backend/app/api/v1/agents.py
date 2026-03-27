import os
import tempfile
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api import deps
from app.api.schemas.agent import AgentCreate, AgentResponse, AgentUpdate, ChatRequest, ChatResponse
from app.services.agent_service import AgentService
from app.db.models.user import User
from app.rag.graph import RAGGraph
from app.rag.retriever import Retriever
from app.core.agent_templates import get_all_agent_types
from app.core.cache import cache_response

router = APIRouter()

# ============ AGENT TYPES ============

@router.get("/types")
@cache_response(ttl_seconds=3600, key_prefix="cache:agent_types")
async def list_agent_types():
    """
    Returns all available agent type templates with their metadata.
    Used by frontend to render the type selection cards.
    """
    return get_all_agent_types()


# ============ AGENT LIMIT ============

@router.get("/limit")
async def get_agent_limit(
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Get the current agent count and limit for a workspace.
    Used by frontend to display "2 / 5 agents" and control the create button.
    """
    limit_info = await service.check_agent_limit(workspace_id)
    return limit_info


# ============ CRUD ============

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_in: AgentCreate,
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Create a new agent in a workspace.
    Enforces plan-based agent limits.
    """
    try:
        return await service.create_agent(
            workspace_id=workspace_id,
            name=agent_in.name,
            description=agent_in.description,
            agent_type=agent_in.agent_type,
            configuration=agent_in.configuration,
            behavior_settings=agent_in.behavior_settings,
            document_ids=agent_in.document_ids,
            allowed_domains=agent_in.allowed_domains
        )
    except ValueError as e:
        # Plan limit exceeded
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    List all agents in a workspace.
    """
    return await service.get_agents(workspace_id)

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Get a specific agent.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/{agent_id}/widget-config", response_model=AgentResponse)
async def get_agent_widget_config(
    agent_id: UUID,
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Get agent configuration for public widget.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    agent_update: AgentUpdate,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Update an agent's configuration.
    """
    try:
        agent = await service.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        updated_agent = await service.update_agent(
            agent_id, 
            name=agent_update.name,
            description=agent_update.description,
            configuration=agent_update.configuration,
            behavior_settings=agent_update.behavior_settings,
            response_config=agent_update.response_config,
            conversation_rules=agent_update.conversation_rules,
            status=agent_update.status,
            is_active=agent_update.is_active,
            allowed_domains=agent_update.allowed_domains
        )
        return updated_agent
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update agent: {str(e)}")


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """Delete an agent."""
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete avatar from Cloudinary if it exists
    if agent.avatar_public_id:
        try:
            from app.services.cloudinary_service import delete_file_async
            await delete_file_async(agent.avatar_public_id, resource_type="image")
        except Exception as e:
            print(f"Warning: Failed to delete avatar during agent deletion: {e}")
    
    await service.agent_repo.delete(agent)


# ============ AVATAR MANAGEMENT ============

@router.post("/{agent_id}/avatar", response_model=AgentResponse)
async def upload_agent_avatar(
    agent_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Upload or replace an agent's avatar.
    If an avatar already exists, the old one is deleted from Cloudinary before uploading the new one.
    Accepts: JPEG, PNG, WebP, GIF (max 5MB)
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, GIF"
        )
    
    # Validate file size (5MB max)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar image must be under 5MB")
    
    # Save to temp file
    suffix = os.path.splitext(file.filename or "avatar.png")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        agent = await service.update_avatar(agent_id, tmp_path)
        return agent
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.delete("/{agent_id}/avatar", response_model=AgentResponse)
async def delete_agent_avatar(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Remove an agent's avatar and delete it from Cloudinary.
    """
    try:
        agent = await service.delete_avatar(agent_id)
        return agent
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete avatar: {str(e)}")


# ============ STATUS TOGGLE ============

@router.patch("/{agent_id}/toggle-active", response_model=AgentResponse)
async def toggle_agent_active(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Toggle an agent's active state.
    Active agents are visible to the widget on websites.
    Inactive agents are hidden from the widget.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    new_state = not agent.is_active
    updated = await service.toggle_active(agent_id, new_state)
    return updated


# ============ DUPLICATE ============

@router.post("/{agent_id}/duplicate", response_model=AgentResponse)
async def duplicate_agent(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Duplicate an existing agent with all its settings.
    Creates a new agent with the same configuration but a '(Copy)' suffix.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        new_agent = await service.create_agent(
            workspace_id=agent.workspace_id,
            name=f"{agent.name} (Copy)",
            description=agent.description,
            agent_type=agent.agent_type,
            configuration=agent.configuration,
            behavior_settings=agent.behavior_settings,
            allowed_domains=agent.allowed_domains,
        )
        return new_agent
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to duplicate agent: {str(e)}")


# ============ CTA EMAIL VERIFICATION ============

# Simple in-memory OTP store: { "agent_id:email": { "otp": "123456", "expires": datetime } }
_cta_otp_store: dict = {}

from pydantic import BaseModel as PydanticBaseModel

class CTAEmailRequest(PydanticBaseModel):
    email: str

class CTAOTPVerifyRequest(PydanticBaseModel):
    email: str
    otp: str

@router.post("/{agent_id}/cta-email/send-otp")
async def send_cta_email_otp(
    agent_id: UUID,
    request: CTAEmailRequest,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Send an OTP verification code to the CTA email.
    The agent owner sets an email where they want to receive leads.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    from app.security.auth import generate_otp
    from app.services.email_service import EmailService
    from datetime import datetime, timedelta
    
    otp_code = generate_otp()
    key = f"{agent_id}:{request.email}"
    _cta_otp_store[key] = {
        "otp": otp_code,
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }
    
    email_service = EmailService()
    await email_service.send_email(
        subject="Verify your CTA Email — Insydr",
        recipients=[request.email],
        template_name="verification.html",
        template_body={
            "name": current_user.full_name or "there",
            "otp_code": otp_code,
            "expiry_minutes": 10,
        }
    )
    
    return {"message": "OTP sent successfully", "email": request.email}


@router.post("/{agent_id}/cta-email/verify-otp")
async def verify_cta_email_otp(
    agent_id: UUID,
    request: CTAOTPVerifyRequest,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Verify the OTP and save the CTA email to the agent's conversation_rules.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    from datetime import datetime
    
    key = f"{agent_id}:{request.email}"
    entry = _cta_otp_store.get(key)
    
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP found for this email. Please request a new one.")
    
    if datetime.utcnow() > entry["expires"]:
        del _cta_otp_store[key]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    if entry["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    
    # OTP verified — save to agent conversation_rules
    del _cta_otp_store[key]
    
    rules = agent.conversation_rules or {}
    rules["cta_email"] = request.email
    rules["cta_email_verified"] = True
    
    await service.update_agent(agent_id, conversation_rules=rules)
    
    return {"message": "Email verified successfully", "email": request.email, "verified": True}


# ============ CONVERSATIONS (Chat History + Leads) ============

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.analytics_event import AnalyticsEvent


def _compute_lead_score(messages_list, conversation) -> int:
    """
    Compute a heuristic lead score (0–100) based on:
    - Number of user messages (engagement)
    - Avg length of user messages (intent depth)
    - Conversation duration
    """
    user_msgs = [m for m in messages_list if m.role == "user"]
    if not user_msgs:
        return 0

    score = 0

    # 1. Message volume (max 40 pts)
    msg_count = len(user_msgs)
    score += min(msg_count * 8, 40)

    # 2. Average message length (max 30 pts) — longer msgs = more intent
    avg_len = sum(len(m.content) for m in user_msgs) / len(user_msgs)
    if avg_len > 100:
        score += 30
    elif avg_len > 50:
        score += 20
    elif avg_len > 20:
        score += 10

    # 3. Conversation duration (max 20 pts)
    if conversation.ended_at and conversation.started_at:
        duration_secs = (conversation.ended_at - conversation.started_at).total_seconds()
        if duration_secs > 300:
            score += 20
        elif duration_secs > 60:
            score += 10

    # 4. Has lead_email_sent event (bonus 10 pts — they already submitted)
    # This is checked via a flag we'll pass in
    return min(score, 100)


@router.get("/{agent_id}/conversations")
async def list_agent_conversations(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    List all conversations for a specific agent, with messages and lead score.
    Ordered by most recent first.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get all conversations for this agent
    conv_stmt = (
        select(Conversation)
        .where(Conversation.agent_id == agent_id)
        .order_by(Conversation.started_at.desc())
        .limit(100)
    )
    conv_result = await db.execute(conv_stmt)
    conversations = conv_result.scalars().all()

    # Get lead_email_sent events for this agent
    lead_stmt = select(AnalyticsEvent.conversation_id).where(
        AnalyticsEvent.agent_id == agent_id,
        AnalyticsEvent.event_type == "lead_email_sent",
    )
    lead_result = await db.execute(lead_stmt)
    lead_conv_ids = {row[0] for row in lead_result.all()}

    results = []
    for conv in conversations:
        # Get messages for this conversation
        msg_stmt = (
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
        )
        msg_result = await db.execute(msg_stmt)
        msgs = msg_result.scalars().all()

        lead_score = _compute_lead_score(msgs, conv)
        # Bonus if lead email was already sent
        if conv.id in lead_conv_ids:
            lead_score = min(lead_score + 10, 100)

        results.append({
            "id": str(conv.id),
            "session_id": conv.session_id,
            "status": conv.status,
            "started_at": conv.started_at.isoformat() if conv.started_at else None,
            "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
            "referrer_url": conv.referrer_url,
            "page_title": conv.page_title,
            "hostname": conv.hostname,
            "user_ip": conv.user_ip,
            "lead_score": lead_score,
            "lead_email_sent": conv.id in lead_conv_ids,
            "message_count": len(msgs),
            "messages": [
                {
                    "id": str(m.id),
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "confidence_score": m.confidence_score,
                }
                for m in msgs
            ],
        })

    return results

@router.post("/{agent_id}/chat", response_model=ChatResponse)
async def chat_agent(
    agent_id: UUID,
    chat_request: ChatRequest,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
    db_session = Depends(deps.get_db),
):
    """
    Chat with an agent (playground).
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # Initialize RAG Graph
    rag = RAGGraph(db_session)
    
    # Extract document IDs from agent configuration
    document_ids = None
    if agent.configuration and "knowledge_sources" in agent.configuration:
        document_ids = agent.configuration["knowledge_sources"]
    
    # Extract behavior settings
    behavior_settings = agent.behavior_settings or {}
    custom_prompt = ""
    if agent.configuration and "custom_prompt" in agent.configuration:
        custom_prompt = agent.configuration["custom_prompt"]
    
    # Extract response config and conversation rules
    response_config = agent.response_config or {}
    conversation_rules = agent.conversation_rules or {}
    
    # Process
    try:
        response = await rag.process_message(
            question=chat_request.message, 
            workspace_id=agent.workspace_id,
            agent_id=str(agent.id),
            document_ids=document_ids,
            agent_type=agent.agent_type,
            behavior_settings=behavior_settings,
            custom_prompt=custom_prompt,
            agent_name=agent.name,
            response_config=response_config,
            conversation_rules=conversation_rules,
        )
        return {"response": response}
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
