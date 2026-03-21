"""
Admin-only API endpoints.
Only accessible by admin@gmail.com.
Provides platform-wide data across all workspaces.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update, delete as sa_delete
from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.models.workspace_member import WorkspaceMember
from app.db.models.agent import Agent
from app.db.models.document import Document
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.api_key import ApiKey
from app.db.models.document_chunk import DocumentChunk
from app.db.models.widget_config import WidgetConfig
from app.db.models.knowledge import KnowledgeCollection
from app.services.alert_service import ErrorAlertService
from uuid import UUID as PyUUID

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_EMAIL = "admin@gmail.com"


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the current user is admin."""
    if current_user.email != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ─── Platform Stats ───

@router.get("/stats")
async def get_platform_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get global platform statistics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_workspaces = (await db.execute(select(func.count(Workspace.id)))).scalar() or 0
    total_agents = (await db.execute(select(func.count(Agent.id)))).scalar() or 0
    total_documents = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    total_conversations = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar() or 0
    total_api_keys = (await db.execute(select(func.count(ApiKey.id)))).scalar() or 0

    # Active agents
    active_agents = (await db.execute(
        select(func.count(Agent.id)).where(Agent.is_active == True)
    )).scalar() or 0

    return {
        "total_users": total_users,
        "total_workspaces": total_workspaces,
        "total_agents": total_agents,
        "active_agents": active_agents,
        "total_documents": total_documents,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_api_keys": total_api_keys,
    }


# ─── Users ───

@router.get("/users")
async def list_all_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all platform users."""
    result = await db.execute(
        select(User)
        .order_by(desc(User.created_at))
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()

    total = (await db.execute(select(func.count(User.id)))).scalar() or 0

    return {
        "total": total,
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "email_verified": u.email_verified,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


# ─── Workspaces ───

@router.get("/workspaces")
async def list_all_workspaces(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all workspaces with owner info."""
    result = await db.execute(
        select(Workspace)
        .order_by(desc(Workspace.created_at))
        .limit(limit)
        .offset(offset)
    )
    workspaces = result.scalars().all()

    total = (await db.execute(select(func.count(Workspace.id)))).scalar() or 0

    ws_data = []
    for ws in workspaces:
        # Get owner
        owner = (await db.execute(
            select(User).where(User.id == ws.owner_id)
        )).scalar_one_or_none()

        # Get counts
        agent_count = (await db.execute(
            select(func.count(Agent.id)).where(Agent.workspace_id == ws.id)
        )).scalar() or 0

        doc_count = (await db.execute(
            select(func.count(Document.id)).where(Document.workspace_id == ws.id)
        )).scalar() or 0

        conv_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.workspace_id == ws.id)
        )).scalar() or 0

        member_count = (await db.execute(
            select(func.count(WorkspaceMember.id)).where(WorkspaceMember.workspace_id == ws.id)
        )).scalar() or 0

        ws_data.append({
            "id": str(ws.id),
            "name": ws.name,
            "slug": ws.slug,
            "subscription_tier": ws.subscription_tier,
            "owner_name": owner.full_name if owner else "Unknown",
            "owner_email": owner.email if owner else "Unknown",
            "agent_count": agent_count,
            "document_count": doc_count,
            "conversation_count": conv_count,
            "member_count": member_count,
            "created_at": ws.created_at.isoformat() if ws.created_at else None,
        })

    return {"total": total, "workspaces": ws_data}


# ─── Agents ───

@router.get("/agents")
async def list_all_agents(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all agents across all workspaces."""
    result = await db.execute(
        select(Agent)
        .order_by(desc(Agent.created_at))
        .limit(limit)
        .offset(offset)
    )
    agents = result.scalars().all()

    total = (await db.execute(select(func.count(Agent.id)))).scalar() or 0

    agents_data = []
    for agent in agents:
        # Get workspace name
        ws = (await db.execute(
            select(Workspace.name).where(Workspace.id == agent.workspace_id)
        )).scalar_one_or_none()

        conv_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.agent_id == agent.id)
        )).scalar() or 0

        agents_data.append({
            "id": str(agent.id),
            "name": agent.name,
            "agent_type": agent.agent_type,
            "status": agent.status,
            "is_active": agent.is_active,
            "workspace_name": ws or "Unknown",
            "workspace_id": str(agent.workspace_id),
            "conversation_count": conv_count,
            "created_at": agent.created_at.isoformat() if agent.created_at else None,
        })

    return {"total": total, "agents": agents_data}


# ─── Conversations ───

@router.get("/conversations")
async def list_recent_conversations(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """List recent conversations across the platform."""
    result = await db.execute(
        select(Conversation)
        .order_by(desc(Conversation.created_at))
        .limit(limit)
        .offset(offset)
    )
    conversations = result.scalars().all()

    total = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0

    conv_data = []
    for conv in conversations:
        # Get agent name
        agent_name = (await db.execute(
            select(Agent.name).where(Agent.id == conv.agent_id)
        )).scalar_one_or_none()

        # Get message count
        msg_count = (await db.execute(
            select(func.count(Message.id)).where(Message.conversation_id == conv.id)
        )).scalar() or 0

        conv_data.append({
            "id": str(conv.id),
            "agent_name": agent_name or "Unknown",
            "agent_id": str(conv.agent_id),
            "workspace_id": str(conv.workspace_id),
            "session_id": conv.session_id,
            "status": conv.status,
            "hostname": conv.hostname,
            "page_title": conv.page_title,
            "message_count": msg_count,
            "started_at": conv.started_at.isoformat() if conv.started_at else None,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
        })

    return {"total": total, "conversations": conv_data}


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single conversation with all its messages."""
    conv = (await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )).scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get agent name
    agent_name = (await db.execute(
        select(Agent.name).where(Agent.id == conv.agent_id)
    )).scalar_one_or_none()

    # Get workspace name
    ws_name = (await db.execute(
        select(Workspace.name).where(Workspace.id == conv.workspace_id)
    )).scalar_one_or_none()

    # Get all messages ordered by creation time
    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = messages_result.scalars().all()

    return {
        "id": str(conv.id),
        "agent_name": agent_name or "Unknown",
        "agent_id": str(conv.agent_id),
        "workspace_name": ws_name or "Unknown",
        "workspace_id": str(conv.workspace_id),
        "session_id": conv.session_id,
        "status": conv.status,
        "hostname": conv.hostname,
        "page_title": conv.page_title,
        "user_ip": conv.user_ip,
        "user_agent": conv.user_agent,
        "referrer_url": conv.referrer_url,
        "started_at": conv.started_at.isoformat() if conv.started_at else None,
        "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "confidence_score": m.confidence_score,
                "token_count": m.token_count,
                "response_time_ms": m.response_time_ms,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


# ─── Documents ───

@router.get("/documents")
async def list_all_documents(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all documents across the platform."""
    result = await db.execute(
        select(Document)
        .order_by(desc(Document.created_at))
        .limit(limit)
        .offset(offset)
    )
    documents = result.scalars().all()

    total = (await db.execute(select(func.count(Document.id)))).scalar() or 0

    docs_data = []
    for doc in documents:
        ws_name = (await db.execute(
            select(Workspace.name).where(Workspace.id == doc.workspace_id)
        )).scalar_one_or_none()

        # Get chunk count
        chunk_count = (await db.execute(
            select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc.id)
        )).scalar() or 0

        docs_data.append({
            "id": str(doc.id),
            "title": doc.title,
            "source_type": doc.source_type,
            "source_url": doc.source_url,
            "status": doc.status,
            "workspace_name": ws_name or "Unknown",
            "workspace_id": str(doc.workspace_id),
            "chunk_count": chunk_count,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        })

    return {"total": total, "documents": docs_data}


@router.get("/documents/{document_id}")
async def get_document_detail(
    document_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single document with all its chunks."""
    doc = (await db.execute(
        select(Document).where(Document.id == document_id)
    )).scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ws_name = (await db.execute(
        select(Workspace.name).where(Workspace.id == doc.workspace_id)
    )).scalar_one_or_none()

    # Get chunks
    chunks_result = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index)
    )
    chunks = chunks_result.scalars().all()

    return {
        "id": str(doc.id),
        "title": doc.title,
        "source_type": doc.source_type,
        "source_url": doc.source_url,
        "file_path": doc.file_path,
        "status": doc.status,
        "version_number": doc.version_number,
        "language": doc.language,
        "meta": doc.meta,
        "workspace_name": ws_name or "Unknown",
        "workspace_id": str(doc.workspace_id),
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
        "chunks": [
            {
                "id": str(c.id),
                "chunk_index": c.chunk_index,
                "content": c.content,
                "token_count": c.token_count,
            }
            for c in chunks
        ],
    }


# ─── User Detail ───

@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user with workspaces they belong to."""
    target = (await db.execute(
        select(User).where(User.id == user_id)
    )).scalar_one_or_none()

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Workspaces owned
    owned = await db.execute(
        select(Workspace).where(Workspace.owner_id == user_id)
    )
    owned_ws = owned.scalars().all()

    # Workspaces member of
    memberships = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.user_id == user_id)
    )
    member_rows = memberships.scalars().all()

    member_ws = []
    for m in member_rows:
        ws = (await db.execute(
            select(Workspace).where(Workspace.id == m.workspace_id)
        )).scalar_one_or_none()
        if ws:
            member_ws.append({
                "workspace_id": str(ws.id),
                "workspace_name": ws.name,
                "role": m.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            })

    return {
        "id": str(target.id),
        "email": target.email,
        "full_name": target.full_name,
        "email_verified": target.email_verified,
        "last_login_at": target.last_login_at.isoformat() if target.last_login_at else None,
        "created_at": target.created_at.isoformat() if target.created_at else None,
        "owned_workspaces": [
            {"id": str(w.id), "name": w.name, "slug": w.slug, "subscription_tier": w.subscription_tier}
            for w in owned_ws
        ],
        "memberships": member_ws,
    }


# ─── Workspace Detail ───

@router.get("/workspaces/{workspace_id}")
async def get_workspace_detail(
    workspace_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get workspace with members, agents, docs, API keys."""
    ws = (await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )).scalar_one_or_none()

    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    owner = (await db.execute(
        select(User).where(User.id == ws.owner_id)
    )).scalar_one_or_none()

    # Members
    members_result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
    )
    members = members_result.scalars().all()
    members_data = []
    for m in members:
        u = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one_or_none()
        members_data.append({
            "user_id": str(m.user_id),
            "email": u.email if u else "Unknown",
            "full_name": u.full_name if u else "Unknown",
            "role": m.role,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        })

    # Agents
    agents_result = await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id).order_by(desc(Agent.created_at))
    )
    agents_data = [{
        "id": str(a.id), "name": a.name, "agent_type": a.agent_type,
        "is_active": a.is_active, "created_at": a.created_at.isoformat() if a.created_at else None,
    } for a in agents_result.scalars().all()]

    # Documents
    docs_result = await db.execute(
        select(Document).where(Document.workspace_id == workspace_id).order_by(desc(Document.created_at))
    )
    docs_data = [{
        "id": str(d.id), "title": d.title, "source_type": d.source_type,
        "status": d.status, "created_at": d.created_at.isoformat() if d.created_at else None,
    } for d in docs_result.scalars().all()]

    # API Keys
    keys_result = await db.execute(
        select(ApiKey).where(ApiKey.workspace_id == workspace_id).order_by(desc(ApiKey.created_at))
    )
    keys_data = [{
        "id": str(k.id), "name": k.name, "key_prefix": k.key_prefix,
        "is_active": k.is_active, "requests_count": k.requests_count,
        "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        "created_at": k.created_at.isoformat() if k.created_at else None,
    } for k in keys_result.scalars().all()]

    # Collections
    collections_result = await db.execute(
        select(KnowledgeCollection).where(KnowledgeCollection.workspace_id == workspace_id)
    )
    collections_data = [{
        "id": str(c.id), "name": c.name, "description": c.description,
    } for c in collections_result.scalars().all()]

    return {
        "id": str(ws.id),
        "name": ws.name,
        "slug": ws.slug,
        "subscription_tier": ws.subscription_tier,
        "timezone": ws.timezone,
        "language": ws.language,
        "owner_name": owner.full_name if owner else "Unknown",
        "owner_email": owner.email if owner else "Unknown",
        "created_at": ws.created_at.isoformat() if ws.created_at else None,
        "members": members_data,
        "agents": agents_data,
        "documents": docs_data,
        "api_keys": keys_data,
        "collections": collections_data,
    }


# ─── Agent Detail ───

@router.get("/agents/{agent_id}")
async def get_agent_detail(
    agent_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single agent with full configuration and widget config."""
    agent = (await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )).scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    ws_name = (await db.execute(
        select(Workspace.name).where(Workspace.id == agent.workspace_id)
    )).scalar_one_or_none()

    conv_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.agent_id == agent.id)
    )).scalar() or 0

    msg_count = (await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id.in_(
                select(Conversation.id).where(Conversation.agent_id == agent.id)
            )
        )
    )).scalar() or 0

    # Widget config
    widget = None
    if agent.widget_config_id:
        wc = (await db.execute(
            select(WidgetConfig).where(WidgetConfig.id == agent.widget_config_id)
        )).scalar_one_or_none()
        if wc:
            widget = {
                "appearance": wc.appearance,
                "behavior": wc.behavior,
                "security": wc.security,
            }

    # Knowledge collections linked
    from app.db.models.agent_knowledge_collection import AgentKnowledgeCollection
    akc_result = await db.execute(
        select(AgentKnowledgeCollection).where(AgentKnowledgeCollection.agent_id == agent_id)
    )
    linked_collections = []
    for akc in akc_result.scalars().all():
        coll = (await db.execute(
            select(KnowledgeCollection).where(KnowledgeCollection.id == akc.collection_id)
        )).scalar_one_or_none()
        if coll:
            linked_collections.append({"id": str(coll.id), "name": coll.name})

    return {
        "id": str(agent.id),
        "name": agent.name,
        "description": agent.description,
        "avatar_url": agent.avatar_url,
        "agent_type": agent.agent_type,
        "status": agent.status,
        "is_active": agent.is_active,
        "version": agent.version,
        "workspace_name": ws_name or "Unknown",
        "workspace_id": str(agent.workspace_id),
        "conversation_count": conv_count,
        "message_count": msg_count,
        "configuration": agent.configuration,
        "behavior_settings": agent.behavior_settings,
        "response_config": agent.response_config,
        "conversation_rules": agent.conversation_rules,
        "allowed_domains": agent.allowed_domains,
        "greeting_message": agent.greeting_message,
        "fallback_message": agent.fallback_message,
        "published_at": agent.published_at.isoformat() if agent.published_at else None,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
        "updated_at": agent.updated_at.isoformat() if agent.updated_at else None,
        "widget_config": widget,
        "knowledge_collections": linked_collections,
    }


# ─── API Keys ───

@router.get("/api-keys")
async def list_all_api_keys(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """List all API keys across the platform."""
    result = await db.execute(
        select(ApiKey)
        .order_by(desc(ApiKey.created_at))
        .limit(limit)
        .offset(offset)
    )
    keys = result.scalars().all()
    total = (await db.execute(select(func.count(ApiKey.id)))).scalar() or 0

    keys_data = []
    for k in keys:
        ws_name = (await db.execute(
            select(Workspace.name).where(Workspace.id == k.workspace_id)
        )).scalar_one_or_none()
        keys_data.append({
            "id": str(k.id),
            "name": k.name,
            "key_prefix": k.key_prefix,
            "is_active": k.is_active,
            "allowed_domains": k.allowed_domains,
            "requests_count": k.requests_count,
            "workspace_name": ws_name or "Unknown",
            "workspace_id": str(k.workspace_id),
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "expires_at": k.expires_at.isoformat() if k.expires_at else None,
            "created_at": k.created_at.isoformat() if k.created_at else None,
        })

    return {"total": total, "api_keys": keys_data}


# ─── Admin Operations ───

@router.patch("/agents/{agent_id}/toggle")
async def toggle_agent_active(
    agent_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle an agent's active status."""
    agent = (await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )).scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.is_active = not agent.is_active
    await db.commit()

    return {"id": str(agent.id), "is_active": agent.is_active}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user from the platform (does not cascade to owned workspaces)."""
    target = (await db.execute(
        select(User).where(User.id == user_id)
    )).scalar_one_or_none()

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.email == ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")

    # Remove workspace memberships
    await db.execute(
        sa_delete(WorkspaceMember).where(WorkspaceMember.user_id == user_id)
    )
    # Delete user
    await db.delete(target)
    await db.commit()

    return {"deleted": True, "id": str(user_id)}


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: PyUUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revoke (deactivate) an API key."""
    key = (await db.execute(
        select(ApiKey).where(ApiKey.id == key_id)
    )).scalar_one_or_none()

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    key.is_active = False
    await db.commit()

    return {"revoked": True, "id": str(key_id)}


# ─── Recent Activity ───

@router.get("/activity")
async def get_recent_activity(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get recent platform activity (latest conversations, docs, agents)."""
    # Recent conversations
    recent_convs = (await db.execute(
        select(Conversation).order_by(desc(Conversation.created_at)).limit(limit)
    )).scalars().all()

    convs = []
    for c in recent_convs:
        agent_name = (await db.execute(
            select(Agent.name).where(Agent.id == c.agent_id)
        )).scalar_one_or_none()
        convs.append({
            "type": "conversation",
            "id": str(c.id),
            "label": f"New conversation with {agent_name or 'Unknown'}",
            "hostname": c.hostname,
            "timestamp": c.created_at.isoformat() if c.created_at else None,
        })

    # Recent documents
    recent_docs = (await db.execute(
        select(Document).order_by(desc(Document.created_at)).limit(limit)
    )).scalars().all()

    docs = []
    for d in recent_docs:
        ws_name = (await db.execute(
            select(Workspace.name).where(Workspace.id == d.workspace_id)
        )).scalar_one_or_none()
        docs.append({
            "type": "document",
            "id": str(d.id),
            "label": f"Document '{d.title}' uploaded in {ws_name or 'Unknown'}",
            "status": d.status,
            "timestamp": d.created_at.isoformat() if d.created_at else None,
        })

    # Recent agents
    recent_agents = (await db.execute(
        select(Agent).order_by(desc(Agent.created_at)).limit(limit)
    )).scalars().all()

    agents = []
    for a in recent_agents:
        ws_name = (await db.execute(
            select(Workspace.name).where(Workspace.id == a.workspace_id)
        )).scalar_one_or_none()
        agents.append({
            "type": "agent",
            "id": str(a.id),
            "label": f"Agent '{a.name}' created in {ws_name or 'Unknown'}",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
        })

    # Merge + sort by timestamp
    all_items = convs + docs + agents
    all_items.sort(key=lambda x: x.get("timestamp") or "", reverse=True)

    return {"activity": all_items[:limit]}


# ─── Monitoring & Alerts ───

@router.get("/monitoring/alerts")
async def get_active_alerts(
    admin: User = Depends(require_admin),
):
    """Get active, deduplicated system errors tracked by Redis."""
    alerts = await ErrorAlertService.get_active_alerts()
    return {"alerts": alerts}

@router.post("/monitoring/alerts/{error_hash}/resolve")
async def resolve_alert(
    error_hash: str,
    admin: User = Depends(require_admin),
):
    """Mark a system error as resolved."""
    resolved = await ErrorAlertService.resolve_alert(error_hash)
    if not resolved:
        raise HTTPException(status_code=404, detail="Alert not found or already resolved.")
    return {"status": "ok", "message": "Alert resolved"}
