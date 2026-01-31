# 🔌 Insydr.AI - API Specification

> Complete API documentation for Phase 1 MVP

---

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://api.insydr.ai/api/v1
```

## Authentication

All protected endpoints require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

Widget endpoints use API Key:
```
X-API-Key: pk_live_xxxxx
```

---

## 1. Authentication APIs

### POST /auth/signup
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "Account created. Verify email with OTP.",
  "email": "user@example.com",
  "expires_in_minutes": 10
}
```

---

### POST /auth/login
Authenticate and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-01-26T00:00:00Z"
  }
}
```

---

### POST /auth/verify-otp
Verify email with OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### GET /auth/me
Get current user profile. **Requires Auth**

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "email_verified": true,
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

## 2. Workspace APIs

### POST /workspaces
Create a new workspace. **Requires Auth**

**Request:**
```json
{
  "name": "My Company",
  "timezone": "Asia/Kolkata",
  "settings": {
    "notifications_enabled": true
  }
}
```

**Response (201):**
```json
{
  "id": "ws_abc123",
  "name": "My Company",
  "slug": "my-company",
  "owner_id": "user_xyz",
  "subscription_tier": "FREE",
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

### GET /workspaces
List user's workspaces. **Requires Auth**

**Response (200):**
```json
{
  "workspaces": [
    {
      "id": "ws_abc123",
      "name": "My Company",
      "slug": "my-company",
      "role": "OWNER",
      "agent_count": 3,
      "document_count": 15
    }
  ],
  "total": 1
}
```

---

### GET /workspaces/{workspace_id}
Get workspace details. **Requires Auth**

**Response (200):**
```json
{
  "id": "ws_abc123",
  "name": "My Company",
  "slug": "my-company",
  "logo_url": "https://...",
  "timezone": "Asia/Kolkata",
  "subscription_tier": "FREE",
  "settings": {},
  "stats": {
    "total_agents": 3,
    "total_documents": 15,
    "total_conversations": 1250,
    "total_messages": 5600
  },
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

### PATCH /workspaces/{workspace_id}
Update workspace. **Requires Auth (Owner/Admin)**

**Request:**
```json
{
  "name": "Updated Name",
  "logo_url": "https://...",
  "settings": { ... }
}
```

---

### DELETE /workspaces/{workspace_id}
Delete workspace. **Requires Auth (Owner)**

**Response (200):**
```json
{
  "message": "Workspace deleted successfully"
}
```

---

## 3. API Key APIs

### POST /workspaces/{workspace_id}/api-keys
Generate new API key. **Requires Auth (Owner/Admin)**

**Request:**
```json
{
  "name": "Production Key",
  "allowed_domains": ["example.com", "*.example.com"]
}
```

**Response (201):**
```json
{
  "id": "key_xyz",
  "name": "Production Key",
  "key": "pk_live_xxxxxxxxxxxxxx",
  "key_prefix": "pk_live_xxx",
  "allowed_domains": ["example.com"],
  "created_at": "2026-01-26T00:00:00Z",
  "message": "Save this key - it won't be shown again!"
}
```

---

### GET /workspaces/{workspace_id}/api-keys
List API keys. **Requires Auth**

**Response (200):**
```json
{
  "api_keys": [
    {
      "id": "key_xyz",
      "name": "Production Key",
      "key_prefix": "pk_live_xxx...xxx",
      "allowed_domains": ["example.com"],
      "is_active": true,
      "last_used_at": "2026-01-26T12:00:00Z",
      "created_at": "2026-01-26T00:00:00Z"
    }
  ]
}
```

---

### DELETE /workspaces/{workspace_id}/api-keys/{key_id}
Revoke API key. **Requires Auth (Owner/Admin)**

---

## 4. Agent APIs

### POST /workspaces/{workspace_id}/agents
Create new agent. **Requires Auth**

**Request:**
```json
{
  "name": "Support Bot",
  "description": "Customer support assistant",
  "agent_type": "SUPPORT",
  "behavior_settings": {
    "tone": "friendly",
    "response_style": "conversational",
    "language_mode": "auto"
  },
  "response_config": {
    "max_response_length": 500,
    "confidence_threshold": 0.7,
    "show_sources": true
  },
  "greeting_message": "Hi! How can I help you today?",
  "fallback_message": "I don't have info on that. Would you like to talk to a human?"
}
```

**Response (201):**
```json
{
  "id": "agent_abc123",
  "name": "Support Bot",
  "status": "DRAFT",
  "agent_type": "SUPPORT",
  "version": "1.0",
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

### GET /workspaces/{workspace_id}/agents
List agents. **Requires Auth**

**Query Params:**
- `status` - Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- `type` - Filter by agent type

**Response (200):**
```json
{
  "agents": [
    {
      "id": "agent_abc123",
      "name": "Support Bot",
      "status": "PUBLISHED",
      "agent_type": "SUPPORT",
      "conversation_count": 150,
      "created_at": "2026-01-26T00:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET /workspaces/{workspace_id}/agents/{agent_id}
Get agent details. **Requires Auth**

**Response (200):**
```json
{
  "id": "agent_abc123",
  "name": "Support Bot",
  "description": "Customer support assistant",
  "status": "PUBLISHED",
  "agent_type": "SUPPORT",
  "version": "1.0",
  "behavior_settings": { ... },
  "response_config": { ... },
  "conversation_rules": { ... },
  "greeting_message": "...",
  "fallback_message": "...",
  "knowledge_collections": [
    {
      "id": "col_xyz",
      "name": "Product Docs",
      "document_count": 10
    }
  ],
  "stats": {
    "total_conversations": 150,
    "total_messages": 500,
    "avg_satisfaction": 4.5
  },
  "published_at": "2026-01-26T00:00:00Z",
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

### PATCH /workspaces/{workspace_id}/agents/{agent_id}
Update agent. **Requires Auth**

---

### POST /workspaces/{workspace_id}/agents/{agent_id}/publish
Publish agent. **Requires Auth**

**Response (200):**
```json
{
  "message": "Agent published successfully",
  "version": "1.1",
  "published_at": "2026-01-26T00:00:00Z"
}
```

---

### POST /workspaces/{workspace_id}/agents/{agent_id}/test
Test agent with a message. **Requires Auth**

**Request:**
```json
{
  "message": "What are your pricing plans?"
}
```

**Response (200):**
```json
{
  "response": "We offer three plans: Free, Starter, and Pro...",
  "sources": [
    {
      "document_id": "doc_xyz",
      "title": "Pricing Page",
      "chunk_preview": "...",
      "relevance_score": 0.92
    }
  ],
  "confidence": 0.89,
  "response_time_ms": 1250
}
```

---

## 5. Knowledge APIs

### POST /workspaces/{workspace_id}/collections
Create knowledge collection. **Requires Auth**

**Request:**
```json
{
  "name": "Product Documentation",
  "description": "All product-related docs"
}
```

---

### POST /workspaces/{workspace_id}/documents
Upload document. **Requires Auth**

**Request:** `multipart/form-data`
- `file`: File (PDF, DOCX, TXT, CSV)
- `collection_id`: UUID
- `title`: string (optional)

**Response (202):**
```json
{
  "id": "doc_xyz",
  "title": "User Guide.pdf",
  "status": "PROCESSING",
  "message": "Document queued for processing"
}
```

---

### POST /workspaces/{workspace_id}/documents/url
Crawl website. **Requires Auth**

**Request:**
```json
{
  "url": "https://docs.example.com",
  "collection_id": "col_xyz",
  "max_pages": 50,
  "include_patterns": ["/docs/*"],
  "exclude_patterns": ["/blog/*"]
}
```

---

### GET /workspaces/{workspace_id}/documents
List documents. **Requires Auth**

**Query Params:**
- `collection_id` - Filter by collection
- `status` - Filter by status
- `search` - Search in title

**Response (200):**
```json
{
  "documents": [
    {
      "id": "doc_xyz",
      "title": "User Guide.pdf",
      "source_type": "FILE",
      "status": "COMPLETED",
      "chunk_count": 45,
      "created_at": "2026-01-26T00:00:00Z"
    }
  ],
  "total": 15
}
```

---

### GET /workspaces/{workspace_id}/documents/{document_id}
Get document details. **Requires Auth**

**Response (200):**
```json
{
  "id": "doc_xyz",
  "title": "User Guide.pdf",
  "source_type": "FILE",
  "source_url": null,
  "file_path": "/uploads/...",
  "status": "COMPLETED",
  "language": "en",
  "chunk_count": 45,
  "token_count": 12500,
  "versions": [
    { "version": 1, "created_at": "..." }
  ],
  "chunks_preview": [
    {
      "chunk_index": 0,
      "content_preview": "...",
      "token_count": 280
    }
  ],
  "created_at": "2026-01-26T00:00:00Z"
}
```

---

### DELETE /workspaces/{workspace_id}/documents/{document_id}
Delete document. **Requires Auth**

---

### POST /workspaces/{workspace_id}/documents/{document_id}/reprocess
Reprocess document. **Requires Auth**

---

## 6. Widget APIs (Public)

### GET /widget/config/{agent_id}
Get widget configuration. **Requires API Key**

**Headers:**
```
X-API-Key: pk_live_xxxxx
Origin: https://yoursite.com
```

**Response (200):**
```json
{
  "agent_id": "agent_abc123",
  "agent_name": "Support Bot",
  "appearance": {
    "theme": "light",
    "primary_color": "#e91919",
    "border_radius": 12,
    "position": "bottom-right"
  },
  "behavior": {
    "greeting_enabled": true,
    "greeting_delay": 3000,
    "greeting_message": "Hi! How can I help?",
    "suggested_questions": [
      "What are your pricing plans?",
      "How do I get started?"
    ]
  },
  "branding": {
    "show_powered_by": true,
    "avatar_url": "https://..."
  }
}
```

---

### POST /widget/chat
Send chat message (streaming). **Requires API Key**

**Headers:**
```
X-API-Key: pk_live_xxxxx
Origin: https://yoursite.com
Content-Type: application/json
```

**Request:**
```json
{
  "agent_id": "agent_abc123",
  "session_id": "sess_xyz",
  "message": "What are your pricing plans?",
  "metadata": {
    "page_url": "https://yoursite.com/pricing",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Response (200, SSE Stream):**
```
data: {"type": "start", "message_id": "msg_123"}

data: {"type": "token", "content": "We"}

data: {"type": "token", "content": " offer"}

data: {"type": "token", "content": " three"}

data: {"type": "sources", "sources": [...]}

data: {"type": "done", "confidence": 0.89}
```

---

### POST /widget/feedback
Submit message feedback. **Requires API Key**

**Request:**
```json
{
  "message_id": "msg_123",
  "feedback_type": "THUMBS_UP",
  "comment": "Very helpful!"
}
```

---

### POST /widget/escalate
Request human support. **Requires API Key**

**Request:**
```json
{
  "session_id": "sess_xyz",
  "agent_id": "agent_abc123",
  "email": "user@example.com",
  "message": "I need help with billing"
}
```

---

## 7. Analytics APIs

### GET /workspaces/{workspace_id}/analytics/overview
Get dashboard overview. **Requires Auth**

**Query Params:**
- `days` - Number of days (7, 30, 90)

**Response (200):**
```json
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-26"
  },
  "stats": {
    "total_conversations": 1250,
    "total_messages": 5600,
    "active_agents": 3,
    "knowledge_documents": 15,
    "avg_response_time_ms": 1200,
    "satisfaction_score": 4.5
  },
  "trends": {
    "conversations_change": 15.5,
    "messages_change": 12.3
  }
}
```

---

### GET /workspaces/{workspace_id}/analytics/conversations
Get conversation metrics. **Requires Auth**

**Response (200):**
```json
{
  "daily_data": [
    {
      "date": "2026-01-25",
      "conversations": 45,
      "messages": 180,
      "avg_duration_seconds": 120
    }
  ],
  "peak_hours": [
    { "hour": 14, "count": 25 },
    { "hour": 15, "count": 22 }
  ],
  "by_agent": [
    {
      "agent_id": "agent_abc",
      "agent_name": "Support Bot",
      "conversations": 800,
      "percentage": 64
    }
  ]
}
```

---

### GET /workspaces/{workspace_id}/analytics/questions
Get top questions. **Requires Auth**

**Response (200):**
```json
{
  "top_questions": [
    {
      "question": "What are your pricing plans?",
      "count": 150,
      "trend": "up",
      "avg_confidence": 0.92
    }
  ],
  "trending": [...],
  "categories": [
    { "category": "Pricing", "count": 300 },
    { "category": "Features", "count": 250 }
  ]
}
```

---

### GET /workspaces/{workspace_id}/analytics/unanswered
Get unanswered questions. **Requires Auth**

**Response (200):**
```json
{
  "unanswered": [
    {
      "id": "uq_xyz",
      "question": "Do you support webhooks?",
      "occurrences": 15,
      "first_seen": "2026-01-20",
      "last_seen": "2026-01-26",
      "status": "OPEN"
    }
  ],
  "total": 12,
  "resolved_this_week": 5
}
```

---

## 8. Webhook APIs

### POST /workspaces/{workspace_id}/webhooks
Create webhook. **Requires Auth**

**Request:**
```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/...",
  "event_types": ["CONVERSATION_STARTED", "LEAD_CAPTURED"],
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

**Response (201):**
```json
{
  "id": "wh_xyz",
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/...",
  "secret": "whsec_xxxxxx",
  "event_types": [...],
  "is_active": true,
  "created_at": "..."
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here",
  "code": "ERROR_CODE",
  "field": "field_name"  // Optional, for validation errors
}
```

### Common Status Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Plan | Requests/minute | Messages/month |
|------|-----------------|----------------|
| Free | 60 | 100 |
| Starter | 120 | 2,000 |
| Professional | 300 | 10,000 |
| Enterprise | Unlimited | Unlimited |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706275200
```

---

## SDK Usage

### JavaScript (Widget)
```html
<script src="https://cdn.insydr.ai/widget.js"></script>
<script>
  InsydrAI.init({
    agentId: "agent_abc123",
    apiKey: "pk_live_xxxxx",
    position: "bottom-right",
    theme: "dark"
  });
  
  // Event listeners
  InsydrAI.on('message', (data) => {
    console.log('New message:', data);
  });
  
  // Programmatic control
  InsydrAI.open();
  InsydrAI.sendMessage("Hello!");
</script>
```

### Python
```python
import requests

headers = {"Authorization": "Bearer <token>"}
response = requests.get(
    "https://api.insydr.ai/api/v1/workspaces",
    headers=headers
)
print(response.json())
```

### cURL
```bash
curl -X POST https://api.insydr.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass"}'
```

---

**Built with ❤️ for Insydr.AI**
