"""
Billing API routes for Stripe subscription management.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.services.stripe_service import StripeService
from app.db.repositories.workspace_repository import WorkspaceRepository
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(prefix="/billing", tags=["Billing"])


# ─── Request / Response schemas ───

class CheckoutRequest(BaseModel):
    workspace_id: str
    plan: str          # STARTER, GROWTH, PRO
    interval: str = "monthly"  # monthly | annual


class PortalRequest(BaseModel):
    workspace_id: str


class URLResponse(BaseModel):
    url: str


# ─── Helper ───

async def _get_workspace_for_billing(workspace_id: str, user: User, db: AsyncSession):
    """Verify workspace access and return workspace."""
    repo = WorkspaceRepository(db)
    from uuid import UUID
    ws = await repo.get_by_id(UUID(workspace_id))
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    has_access = await repo.user_has_access(ws.id, user.id)
    if not has_access:
        raise HTTPException(status_code=403, detail="No access to this workspace")
    return ws


# ─── Endpoints ───

@router.post("/checkout", response_model=URLResponse)
async def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session for plan subscription."""
    workspace = await _get_workspace_for_billing(request.workspace_id, current_user, db)

    service = StripeService(db)
    try:
        url = await service.create_checkout_session(
            workspace=workspace,
            email=current_user.email,
            name=current_user.full_name,
            plan=request.plan,
            interval=request.interval,
        )
        return URLResponse(url=url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "No such price" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Invalid Stripe Price ID configured. Make sure STRIPE_PRICE_ID_* env vars use Price IDs (price_...), not Product IDs (prod_...)."
            )
        raise HTTPException(status_code=500, detail=f"Stripe error: {error_msg}")


class SyncRequest(BaseModel):
    session_id: str

@router.post("/sync")
async def sync_checkout(
    request: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually sync a completed checkout session."""
    service = StripeService(db)
    await service.sync_checkout(request.session_id)
    return {"status": "ok"}


@router.post("/portal", response_model=URLResponse)
async def create_portal(
    request: PortalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for managing billing."""
    workspace = await _get_workspace_for_billing(request.workspace_id, current_user, db)

    service = StripeService(db)
    try:
        url = await service.create_portal_session(workspace)
        return URLResponse(url=url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription/{workspace_id}")
async def get_subscription(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current subscription details for a workspace."""
    workspace = await _get_workspace_for_billing(workspace_id, current_user, db)

    service = StripeService(db)
    return await service.get_subscription_info(workspace)


@router.get("/usage/{workspace_id}")
async def get_usage(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get usage statistics for a workspace."""
    workspace = await _get_workspace_for_billing(workspace_id, current_user, db)

    service = StripeService(db)
    return await service.get_usage_stats(workspace.id)


@router.get("/invoices/{workspace_id}")
async def get_invoices(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get invoice history for a workspace."""
    workspace = await _get_workspace_for_billing(workspace_id, current_user, db)

    service = StripeService(db)
    return await service.get_invoices(workspace)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Stripe webhook events.
    This endpoint does NOT require authentication — Stripe calls it directly.
    It uses the webhook signature for verification.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    service = StripeService(db)
    try:
        result = await service.handle_webhook(payload, sig_header)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
