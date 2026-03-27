import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

# Mock objects to test the logic
class MockAgent:
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.workspace_id = uuid4()
        self.conversation_rules = {"cta_email": "test@lead.com", "cta_email_verified": True}

class MockConversation:
    def __init__(self, id):
        self.id = id
        self.referrer_url = "https://example.com"

class MockMessage:
    def __init__(self, role, content):
        self.role = role
        self.content = content
        self.created_at = "2026-01-01T00:00:00Z"

def test_lead_email_logic_passes():
    """Verify the lead form sends the right data structure in theory."""
    from app.api.v1.widget import LeadEmailRequest
    
    req = LeadEmailRequest(
        agent_id=str(uuid4()),
        session_id=str(uuid4()),
        visitor_name="John Doe",
        visitor_email="john@example.com",
        visitor_phone="555-1234",
        visitor_message="I want to buy!"
    )
    
    assert req.visitor_email == "john@example.com"
    assert req.visitor_message == "I want to buy!"
    print("Lead Email Schema valid.")

test_lead_email_logic_passes()
