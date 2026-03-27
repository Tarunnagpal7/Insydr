"""
Stripe billing service for Insydr.AI.
Handles checkout sessions, customer portal, webhooks, and subscription management.
"""

import stripe
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models.workspace import Workspace
from app.db.models.agent import Agent
from app.db.models.document import Document
from app.db.models.document_chunk import DocumentChunk
from app.db.models.message import Message
from app.db.models.conversation import Conversation

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Tier → Stripe Price ID mapping
PRICE_IDS: Dict[str, Dict[str, str]] = {
    "STARTER": {
        "monthly": settings.STRIPE_PRICE_ID_STARTER_MONTHLY,
        "annual": settings.STRIPE_PRICE_ID_STARTER_ANNUAL,
    },
    "GROWTH": {
        "monthly": settings.STRIPE_PRICE_ID_GROWTH_MONTHLY,
        "annual": settings.STRIPE_PRICE_ID_GROWTH_ANNUAL,
    },
    "PRO": {
        "monthly": settings.STRIPE_PRICE_ID_PRO_MONTHLY,
        "annual": settings.STRIPE_PRICE_ID_PRO_ANNUAL,
    },
}

# Reverse lookup: Price ID → tier name
PRICE_TO_TIER: Dict[str, str] = {}
for tier, intervals in PRICE_IDS.items():
    for interval, price_id in intervals.items():
        if price_id:
            PRICE_TO_TIER[price_id] = tier

# Plan limits for usage display
PLAN_LIMITS = {
    "FREE": {"agents": 1, "messages": 100, "documents": 3, "storage_mb": 10, "workspaces": 1},
    "STARTER": {"agents": 2, "messages": 2000, "documents": 25, "storage_mb": 100, "workspaces": 1},
    "GROWTH": {"agents": 5, "messages": 10000, "documents": -1, "storage_mb": 500, "workspaces": 3},
    "PRO": {"agents": -1, "messages": 30000, "documents": -1, "storage_mb": 2048, "workspaces": 10},
    "ENTERPRISE": {"agents": -1, "messages": -1, "documents": -1, "storage_mb": -1, "workspaces": -1},
}


class StripeService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Customer Management ───

    async def get_or_create_customer(
        self, workspace: Workspace, email: str, name: str
    ) -> str:
        """Get existing Stripe customer or create a new one."""
        if workspace.stripe_customer_id:
            return workspace.stripe_customer_id

        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={
                "workspace_id": str(workspace.id),
                "workspace_name": workspace.name,
            },
        )

        workspace.stripe_customer_id = customer.id
        workspace.updated_at = datetime.utcnow()
        await self.session.commit()

        return customer.id

    # ─── Checkout Session ───

    async def create_checkout_session(
        self,
        workspace: Workspace,
        email: str,
        name: str,
        plan: str,
        interval: str = "monthly",
    ) -> str:
        """
        Create a Stripe Checkout Session for subscription.
        Returns the checkout URL.
        """
        plan_upper = plan.upper()
        if plan_upper not in PRICE_IDS:
            raise ValueError(f"Invalid plan: {plan}. Must be one of: {list(PRICE_IDS.keys())}")

        price_id = PRICE_IDS[plan_upper].get(interval)
        if not price_id:
            raise ValueError(f"No price configured for {plan} ({interval})")

        customer_id = await self.get_or_create_customer(workspace, email, name)

        frontend_url = settings.FRONTEND_URL
        billing_url = f"{frontend_url}/workspace/{workspace.id}/settings/billing"

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{billing_url}?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{billing_url}?canceled=true",
            currency="inr",
            metadata={
                "workspace_id": str(workspace.id),
                "plan": plan_upper,
            },
            subscription_data={
                "metadata": {
                    "workspace_id": str(workspace.id),
                    "plan": plan_upper,
                }
            },
        )

        return session.url

    async def sync_checkout(self, session_id: str) -> None:
        """
        Manually sync a checkout session. Useful for immediate updates
        when redirecting back from Stripe before the webhook fires.
        """
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == "paid" and session.status == "complete":
                # Convert the session object to a dict to match webhook payload format
                session_dict = session.to_dict()
                await self._handle_checkout_completed(session_dict)
        except stripe.error.StripeError as e:
            print(f"Failed to sync checkout {session_id}: {e}")

    # ─── Customer Portal ───

    async def create_portal_session(self, workspace: Workspace) -> str:
        """
        Create a Stripe Customer Portal session for managing billing.
        Returns the portal URL.
        """
        if not workspace.stripe_customer_id:
            raise ValueError("No Stripe customer found. Subscribe to a plan first.")

        frontend_url = settings.FRONTEND_URL
        billing_url = f"{frontend_url}/workspace/{workspace.id}/settings/billing"

        session = stripe.billing_portal.Session.create(
            customer=workspace.stripe_customer_id,
            return_url=billing_url,
        )

        return session.url

    # ─── Subscription Info ───

    async def get_subscription_info(self, workspace: Workspace) -> Dict[str, Any]:
        """Get current subscription details."""
        result = {
            "plan": workspace.subscription_tier or "FREE",
            "status": "active",
            "current_period_end": None,
            "cancel_at_period_end": False,
            "payment_method": None,
        }

        if not workspace.stripe_subscription_id:
            return result

        try:
            sub = stripe.Subscription.retrieve(
                workspace.stripe_subscription_id,
                expand=["default_payment_method"],
            )
            result["status"] = sub.status
            
            # Safe extraction of current_period_end
            period_end = sub.get("current_period_end")
            if not period_end and sub.get("items") and sub["items"].get("data"):
                period_end = sub["items"]["data"][0].get("current_period_end")
                
            if period_end:
                result["current_period_end"] = datetime.fromtimestamp(period_end).isoformat()
                
            result["cancel_at_period_end"] = sub.cancel_at_period_end

            pm = sub.default_payment_method
            if pm:
                result["payment_method"] = {
                    "brand": pm.card.brand if pm.card else None,
                    "last4": pm.card.last4 if pm.card else None,
                    "exp_month": pm.card.exp_month if pm.card else None,
                    "exp_year": pm.card.exp_year if pm.card else None,
                }
        except stripe.error.StripeError:
            pass

        return result

    # ─── Invoice History ───

    async def get_invoices(self, workspace: Workspace, limit: int = 12) -> List[Dict[str, Any]]:
        """Get invoice history from Stripe."""
        if not workspace.stripe_customer_id:
            return []

        try:
            invoices = stripe.Invoice.list(
                customer=workspace.stripe_customer_id,
                limit=limit,
            )
            return [
                {
                    "id": inv.id,
                    "number": inv.number,
                    "amount": inv.amount_paid,
                    "currency": inv.currency,
                    "status": inv.status,
                    "created": datetime.fromtimestamp(inv.created).isoformat(),
                    "period_start": datetime.fromtimestamp(inv.period_start).isoformat() if inv.period_start else None,
                    "period_end": datetime.fromtimestamp(inv.period_end).isoformat() if inv.period_end else None,
                    "invoice_pdf": inv.invoice_pdf,
                    "hosted_invoice_url": inv.hosted_invoice_url,
                }
                for inv in invoices.data
            ]
        except stripe.error.StripeError:
            return []

    # ─── Usage Stats ───

    async def get_usage_stats(self, workspace_id: UUID) -> Dict[str, Any]:
        """Get current usage statistics for a workspace."""

        # Get workspace
        stmt = select(Workspace).where(Workspace.id == workspace_id)
        result = await self.session.execute(stmt)
        workspace = result.scalar_one_or_none()
        if not workspace:
            raise ValueError("Workspace not found")

        tier = (workspace.subscription_tier or "FREE").upper()
        limits = PLAN_LIMITS.get(tier, PLAN_LIMITS["FREE"])

        # Count agents
        agent_count = await self.session.execute(
            select(func.count(Agent.id)).where(Agent.workspace_id == workspace_id)
        )
        agents_used = agent_count.scalar() or 0

        # Count documents
        doc_count = await self.session.execute(
            select(func.count(Document.id)).where(Document.workspace_id == workspace_id)
        )
        documents_used = doc_count.scalar() or 0

        # Count messages this month
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        msg_count = await self.session.execute(
            select(func.count(Message.id)).where(
                Message.workspace_id == workspace_id,
                Message.created_at >= month_start,
            )
        )
        messages_used = msg_count.scalar() or 0

        # Estimate storage (count chunks * avg chunk size ~2KB)
        chunk_count = await self.session.execute(
            select(func.count(DocumentChunk.id))
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Document.workspace_id == workspace_id)
        )
        chunks = chunk_count.scalar() or 0
        storage_used_mb = round((chunks * 2) / 1024, 1)  # rough estimate

        # Count conversations this month
        conv_count = await self.session.execute(
            select(func.count(Conversation.id)).where(
                Conversation.workspace_id == workspace_id,
                Conversation.created_at >= month_start,
            )
        )
        conversations_used = conv_count.scalar() or 0

        return {
            "plan": tier,
            "agents": {"used": agents_used, "limit": limits["agents"]},
            "messages": {"used": messages_used, "limit": limits["messages"]},
            "documents": {"used": documents_used, "limit": limits["documents"]},
            "storage_mb": {"used": storage_used_mb, "limit": limits["storage_mb"]},
            "conversations": {"used": conversations_used, "limit": -1},
            "billing_period_start": month_start.isoformat(),
        }

    # ─── Webhook Handling ───

    async def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, str]:
        """Process Stripe webhook events."""
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            await self._handle_checkout_completed(data)
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(data)
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(data)
        elif event_type == "invoice.paid":
            pass  # Stripe records this automatically

        return {"status": "ok", "event": event_type}

    async def _handle_checkout_completed(self, session_data: dict):
        """Handle successful checkout — activate subscription."""
        workspace_id = session_data.get("metadata", {}).get("workspace_id")
        if not workspace_id:
            return

        subscription_id = session_data.get("subscription")
        customer_id = session_data.get("customer")

        stmt = select(Workspace).where(Workspace.id == UUID(workspace_id))
        result = await self.session.execute(stmt)
        workspace = result.scalar_one_or_none()

        if not workspace:
            return

        # Get subscription details for plan tier
        if subscription_id:
            sub = stripe.Subscription.retrieve(subscription_id)
            price_id = sub["items"]["data"][0]["price"]["id"] if sub["items"]["data"] else None
            tier = PRICE_TO_TIER.get(price_id, "STARTER")

            workspace.stripe_subscription_id = subscription_id
            workspace.stripe_customer_id = customer_id
            workspace.subscription_tier = tier
            
            # Safe extraction of current_period_end
            period_end = sub.get("current_period_end")
            if not period_end and sub.get("items") and sub["items"]["data"]:
                period_end = sub["items"]["data"][0].get("current_period_end")
            
            if period_end:
                workspace.current_period_end = datetime.fromtimestamp(period_end)
            
            workspace.updated_at = datetime.utcnow()
            await self.session.commit()

    async def _handle_subscription_updated(self, sub_data: dict):
        """Handle subscription changes (upgrade/downgrade/renewal)."""
        sub_id = sub_data.get("id")

        stmt = select(Workspace).where(Workspace.stripe_subscription_id == sub_id)
        result = await self.session.execute(stmt)
        workspace = result.scalar_one_or_none()

        if not workspace:
            return

        price_id = sub_data["items"]["data"][0]["price"]["id"] if sub_data.get("items", {}).get("data") else None
        tier = PRICE_TO_TIER.get(price_id, workspace.subscription_tier)

        workspace.subscription_tier = tier
        
        period_end = sub_data.get("current_period_end")
        if not period_end and sub_data.get("items") and sub_data["items"].get("data"):
            period_end = sub_data["items"]["data"][0].get("current_period_end")
            
        if period_end:
            workspace.current_period_end = datetime.fromtimestamp(period_end)
            
        workspace.updated_at = datetime.utcnow()
        await self.session.commit()

    async def _handle_subscription_deleted(self, sub_data: dict):
        """Handle subscription cancellation."""
        sub_id = sub_data.get("id")

        stmt = select(Workspace).where(Workspace.stripe_subscription_id == sub_id)
        result = await self.session.execute(stmt)
        workspace = result.scalar_one_or_none()

        if not workspace:
            return

        workspace.subscription_tier = "FREE"
        workspace.stripe_subscription_id = None
        workspace.current_period_end = None
        workspace.updated_at = datetime.utcnow()
        await self.session.commit()
