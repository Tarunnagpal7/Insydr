# 🚀 Insydr.AI - Complete Implementation Plan

> **Version:** 1.0  
> **Last Updated:** January 26, 2026  
> **Status:** Phase 1 MVP Development

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Progress](#current-progress)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Sprint Plan](#sprint-plan)
6. [Module Implementation Details](#module-implementation-details)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Frontend Pages & Components](#frontend-pages--components)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)

---

## 🎯 Project Overview

**Insydr.AI** is a SaaS platform that enables businesses to create AI-powered chatbots trained on their custom knowledge base. Users can embed these chatbots on their websites with a simple script tag.

### Core Value Proposition
- **No-code chatbot creation** - Upload docs, configure agent, embed widget
- **Multi-tenant architecture** - Isolated workspaces with separate data
- **Customizable widgets** - Brand-matched chat interfaces
- **Analytics & insights** - Understand customer interactions

---

## ✅ Current Progress

### Completed ✓
| Module | Component | Status |
|--------|-----------|--------|
| **Authentication** | User Registration | ✅ Done |
| **Authentication** | Email OTP Verification | ✅ Done |
| **Authentication** | Login with JWT | ✅ Done |
| **Authentication** | Password Recovery | ✅ Done |
| **Authentication** | Protected Routes | ✅ Done |
| **Frontend** | Auth Pages (Login, Signup, Verify, Reset) | ✅ Done |
| **Frontend** | Landing Page | ✅ Done |
| **Frontend** | Redux Store Setup | ✅ Done |
| **Database** | User & OTP Models | ✅ Done |
| **Database** | All ERD Models Created | ✅ Done |

### Pending (To Build)
| Module | Priority |
|--------|----------|
| Workspace Management | 🔴 High |
| Agent Management | 🔴 High |
| Knowledge Base | 🔴 High |
| Widget SDK | 🔴 High |
| Analytics Dashboard | 🟡 Medium |
| Webhooks | 🟡 Medium |
| Admin Dashboard UI | 🟡 Medium |

---

## 🛠 Technology Stack

### Backend (Python + FastAPI)
```
├── FastAPI         → REST API framework
├── SQLAlchemy 2.0  → Async ORM
├── PostgreSQL      → Database
├── pgvector        → Vector embeddings
├── Alembic         → Migrations
├── PyJWT           → Authentication
├── Celery          → Background jobs
├── Redis           → Caching & queues
├── LangChain       → LLM orchestration
├── OpenAI/Gemini   → LLM providers
```

### Frontend (Next.js 16 + TypeScript)
```
├── Next.js 16      → React framework
├── TypeScript      → Type safety
├── Redux Toolkit   → State management
├── TailwindCSS 4   → Styling
├── Axios           → HTTP client
├── Recharts        → Analytics charts
├── React Hook Form → Form handling
```

### Widget SDK
```
├── Vanilla JS      → No dependencies
├── Shadow DOM      → Style isolation
├── WebSocket       → Real-time chat
├── CSS Variables   → Theming
```

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Next.js    │  │   Admin     │  │      Widget SDK         │ │
│  │  Landing    │  │  Dashboard  │  │   (Embeddable Chat)     │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│              (FastAPI - /api/v1/...)                           │
└─────────────────────────────────────────────────────────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│    Auth      │  │   Agent &    │  │      Knowledge &         │
│   Service    │  │  Workspace   │  │    RAG Pipeline          │
└──────────────┘  └──────────────┘  └──────────────────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │   pgvector   │  │       Redis          │  │
│  │  (Primary)   │  │ (Embeddings) │  │   (Cache/Queue)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Sprint Plan

### Sprint 1-2: Workspace & API Keys (Weeks 1-4)
> **Goal:** Users can create workspaces and manage API keys

| Task | Backend | Frontend | Effort |
|------|---------|----------|--------|
| Workspace CRUD API | ✓ | | 3 days |
| Workspace Settings | ✓ | | 2 days |
| API Key Generation | ✓ | | 3 days |
| API Key Management | ✓ | ✓ | 4 days |
| Domain Whitelisting | ✓ | ✓ | 2 days |
| Workspace Dashboard | | ✓ | 4 days |
| Settings Page | | ✓ | 3 days |

### Sprint 3-4: Agent Management (Weeks 5-8)
> **Goal:** Users can create and configure AI agents

| Task | Backend | Frontend | Effort |
|------|---------|----------|--------|
| Agent CRUD API | ✓ | | 3 days |
| Agent Configuration | ✓ | | 4 days |
| Agent Types & Behavior | ✓ | | 3 days |
| Agent Builder UI | | ✓ | 5 days |
| Agent Preview | | ✓ | 2 days |
| Agent List/Grid View | | ✓ | 2 days |

### Sprint 5-6: Knowledge Base (Weeks 9-12)
> **Goal:** Upload documents and build searchable knowledge

| Task | Backend | Frontend | Effort |
|------|---------|----------|--------|
| File Upload API | ✓ | | 3 days |
| PDF/DOCX Parsing | ✓ | | 4 days |
| Text Chunking | ✓ | | 2 days |
| Embedding Generation | ✓ | | 3 days |
| Vector Search | ✓ | | 3 days |
| URL Crawler | ✓ | | 4 days |
| Knowledge UI | | ✓ | 4 days |
| Document Preview | | ✓ | 2 days |

### Sprint 7-8: Widget SDK (Weeks 13-16)
> **Goal:** Embeddable chat widget with customization

| Task | Backend | Frontend | Effort |
|------|---------|----------|--------|
| Chat API (Streaming) | ✓ | | 4 days |
| Widget Bundle Build | | ✓ | 3 days |
| Widget Customization | ✓ | ✓ | 4 days |
| Widget Configurator UI | | ✓ | 4 days |
| Integration Docs | ✓ | ✓ | 2 days |

### Sprint 9-10: Analytics (Weeks 17-20)
> **Goal:** Dashboard with conversation insights

| Task | Backend | Frontend | Effort |
|------|---------|----------|--------|
| Analytics Events API | ✓ | | 3 days |
| Metrics Aggregation | ✓ | | 4 days |
| Dashboard Charts | | ✓ | 5 days |
| Exports (CSV/JSON) | ✓ | ✓ | 2 days |

### Sprint 11-12: Polish & Launch (Weeks 21-24)
> **Goal:** Bug fixes, optimization, documentation

| Task | Effort |
|------|--------|
| UI/UX Polish | 5 days |
| Performance Optimization | 3 days |
| API Documentation | 3 days |
| Testing & Bug Fixes | 5 days |
| Demo Preparation | 2 days |

---

## 📦 Module Implementation Details

> **Note:** Each module section below provides detailed implementation guidance.

---

## Module 1: Workspace Management

### Backend Implementation

#### File: `backend/app/api/v1/workspaces.py`
```python
# Endpoints to implement:
# POST   /api/v1/workspaces              → Create workspace
# GET    /api/v1/workspaces              → List user workspaces
# GET    /api/v1/workspaces/{id}         → Get workspace details
# PATCH  /api/v1/workspaces/{id}         → Update workspace
# DELETE /api/v1/workspaces/{id}         → Delete workspace
# POST   /api/v1/workspaces/{id}/members → Invite member
# GET    /api/v1/workspaces/{id}/members → List members
```

#### File: `backend/app/services/workspace_service.py`
```python
class WorkspaceService:
    async def create_workspace(self, user_id: UUID, name: str, settings: dict) -> Workspace
    async def get_user_workspaces(self, user_id: UUID) -> List[Workspace]
    async def get_workspace(self, workspace_id: UUID, user_id: UUID) -> Workspace
    async def update_workspace(self, workspace_id: UUID, user_id: UUID, data: dict) -> Workspace
    async def delete_workspace(self, workspace_id: UUID, user_id: UUID) -> bool
    async def add_member(self, workspace_id: UUID, email: str, role: str) -> WorkspaceMember
    async def remove_member(self, workspace_id: UUID, member_id: UUID) -> bool
```

#### File: `backend/app/api/schemas/workspace.py`
```python
class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    timezone: str = "UTC"
    settings: dict = {}

class WorkspaceUpdate(BaseModel):
    name: Optional[str]
    logo_url: Optional[str]
    timezone: Optional[str]
    settings: Optional[dict]

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str]
    timezone: str
    subscription_tier: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Frontend Implementation

#### File: `frontend/app/dashboard/workspaces/page.tsx`
- Workspace list/grid view
- Create workspace modal
- Workspace card with quick actions

#### File: `frontend/app/dashboard/workspaces/[id]/page.tsx`
- Workspace overview
- Quick stats (agents, documents, conversations)
- Recent activity

#### File: `frontend/app/dashboard/workspaces/[id]/settings/page.tsx`
- General settings form
- Logo upload
- Danger zone (delete workspace)

#### File: `frontend/src/store/workspace.store.ts`
```typescript
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

// Thunks
export const fetchWorkspaces = createAsyncThunk(...)
export const createWorkspace = createAsyncThunk(...)
export const updateWorkspace = createAsyncThunk(...)
export const deleteWorkspace = createAsyncThunk(...)
export const switchWorkspace = createAsyncThunk(...)
```

---

## Module 2: API Key Management

### Backend Implementation

#### File: `backend/app/api/v1/api_keys.py`
```python
# Endpoints:
# POST   /api/v1/workspaces/{id}/api-keys     → Generate new key
# GET    /api/v1/workspaces/{id}/api-keys     → List keys
# DELETE /api/v1/workspaces/{id}/api-keys/{key_id} → Revoke key
# PATCH  /api/v1/workspaces/{id}/api-keys/{key_id} → Update key settings
```

#### File: `backend/app/services/api_key_service.py`
```python
class APIKeyService:
    def generate_api_key(self) -> tuple[str, str]:
        """Returns (full_key, key_hash) - full_key shown once"""
        import secrets
        key = f"pk_live_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        return key, key_hash
    
    async def create_api_key(self, workspace_id: UUID, name: str, domains: list) -> ApiKey
    async def validate_api_key(self, key: str, domain: str) -> tuple[bool, Workspace]
    async def list_keys(self, workspace_id: UUID) -> List[ApiKey]
    async def revoke_key(self, key_id: UUID) -> bool
```

### Frontend Implementation

#### File: `frontend/app/dashboard/workspaces/[id]/settings/api-keys/page.tsx`
- API key list with masked keys
- Generate new key modal (show once warning)
- Domain whitelist configuration
- Usage stats per key

---

## Module 3: Agent Management

### Backend Implementation

#### File: `backend/app/api/v1/agents.py`
```python
# Endpoints:
# POST   /api/v1/workspaces/{wid}/agents          → Create agent
# GET    /api/v1/workspaces/{wid}/agents          → List agents
# GET    /api/v1/workspaces/{wid}/agents/{id}     → Get agent
# PATCH  /api/v1/workspaces/{wid}/agents/{id}     → Update agent
# DELETE /api/v1/workspaces/{wid}/agents/{id}     → Delete agent
# POST   /api/v1/workspaces/{wid}/agents/{id}/publish → Publish agent
# POST   /api/v1/workspaces/{wid}/agents/{id}/test    → Test agent
```

#### File: `backend/app/api/schemas/agent.py`
```python
class AgentCreate(BaseModel):
    name: str
    description: Optional[str]
    agent_type: AgentType = AgentType.SUPPORT
    behavior_settings: BehaviorSettings = BehaviorSettings()
    response_config: ResponseConfig = ResponseConfig()
    conversation_rules: ConversationRules = ConversationRules()
    greeting_message: str = "Hello! How can I help you today?"
    fallback_message: str = "I'm sorry, I don't have information about that."

class BehaviorSettings(BaseModel):
    tone: str = "friendly"  # friendly, professional, formal, casual
    response_style: str = "conversational"  # brief, detailed, conversational
    language_mode: str = "auto"  # auto, fixed
    fixed_language: Optional[str] = None

class ResponseConfig(BaseModel):
    max_response_length: int = 500
    confidence_threshold: float = 0.7
    show_sources: bool = True
    stream_response: bool = True

class ConversationRules(BaseModel):
    allowed_topics: List[str] = []
    blocked_words: List[str] = []
    custom_system_prompt: Optional[str] = None
```

### Frontend Implementation

#### File: `frontend/app/dashboard/workspaces/[id]/agents/page.tsx`
- Agent cards grid
- Status indicators (Draft, Published, Archived)
- Quick actions (Edit, Duplicate, Delete)

#### File: `frontend/app/dashboard/workspaces/[id]/agents/new/page.tsx`
- Step-by-step agent builder wizard
- Step 1: Basic Info (name, type, description)
- Step 2: Behavior Settings (tone, style, language)
- Step 3: Response Configuration
- Step 4: Knowledge Selection
- Step 5: Widget Preview

#### File: `frontend/app/dashboard/workspaces/[id]/agents/[agentId]/page.tsx`
- Agent overview with stats
- Live preview panel
- Test chat interface
- Quick edit sections

---

## Module 4: Knowledge Management

### Backend Implementation

#### File: `backend/app/api/v1/knowledge.py`
```python
# Endpoints:
# POST   /api/v1/workspaces/{wid}/collections     → Create collection
# GET    /api/v1/workspaces/{wid}/collections     → List collections
# POST   /api/v1/workspaces/{wid}/documents       → Upload document
# POST   /api/v1/workspaces/{wid}/documents/url   → Crawl URL
# GET    /api/v1/workspaces/{wid}/documents       → List documents
# GET    /api/v1/workspaces/{wid}/documents/{id}  → Get document details
# DELETE /api/v1/workspaces/{wid}/documents/{id}  → Delete document
# POST   /api/v1/workspaces/{wid}/documents/{id}/reprocess → Reprocess
```

#### File: `backend/app/services/knowledge_service.py`
```python
class KnowledgeService:
    async def create_collection(self, workspace_id: UUID, name: str) -> KnowledgeCollection
    async def upload_document(self, workspace_id: UUID, collection_id: UUID, file: UploadFile) -> Document
    async def crawl_url(self, workspace_id: UUID, collection_id: UUID, url: str, max_pages: int) -> Document
    async def process_document(self, document_id: UUID) -> None  # Background task
    async def search_knowledge(self, workspace_id: UUID, query: str, limit: int) -> List[SearchResult]
```

#### File: `backend/app/workers/document_processor.py`
```python
from celery import shared_task

@shared_task
def process_document_task(document_id: str):
    """
    Background task to process document:
    1. Extract text from file
    2. Clean and normalize text
    3. Split into chunks
    4. Generate embeddings
    5. Store in pgvector
    """
    pass

def extract_text(file_path: str, file_type: str) -> str:
    """Extract text from PDF, DOCX, TXT, CSV"""
    pass

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    pass

def generate_embeddings(chunks: List[str]) -> List[List[float]]:
    """Generate embeddings using OpenAI/local model"""
    pass
```

### Frontend Implementation

#### File: `frontend/app/dashboard/workspaces/[id]/knowledge/page.tsx`
- Collection tabs/sidebar
- Document list with status indicators
- Drag-and-drop upload zone
- URL crawler input

#### File: `frontend/app/dashboard/workspaces/[id]/knowledge/[docId]/page.tsx`
- Document details
- Chunk preview
- Version history
- Reprocess button

---

## Module 5: Widget SDK

### Backend Implementation

#### File: `backend/app/api/v1/widget.py`
```python
# Endpoints:
# GET    /api/v1/widget/config/{agent_id}    → Get widget config (public)
# POST   /api/v1/widget/chat                 → Send message (streaming)
# POST   /api/v1/widget/feedback             → Submit feedback
# POST   /api/v1/widget/escalate             → Request human support
```

#### File: `backend/app/services/chat_service.py`
```python
class ChatService:
    async def process_message(
        self,
        agent_id: UUID,
        session_id: str,
        message: str
    ) -> AsyncGenerator[str, None]:
        """
        Process chat message with RAG:
        1. Retrieve relevant chunks from knowledge base
        2. Build context prompt
        3. Stream LLM response
        4. Log conversation
        """
        pass
    
    async def get_relevant_context(
        self,
        workspace_id: UUID,
        query: str,
        limit: int = 5
    ) -> List[DocumentChunk]:
        """Vector similarity search"""
        pass
```

### Widget SDK Implementation

#### File: `widget/src/index.ts`
```typescript
interface InsydrConfig {
  agentId: string;
  apiKey: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  greeting?: boolean;
  greetingDelay?: number;
}

class InsydrAI {
  private config: InsydrConfig;
  private container: HTMLElement;
  private shadowRoot: ShadowRoot;
  
  init(config: InsydrConfig): void
  open(): void
  close(): void
  toggle(): void
  sendMessage(message: string): void
  clearHistory(): void
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}

// Auto-init from script attributes
(function() {
  const script = document.currentScript;
  if (script?.dataset.agentId) {
    window.InsydrAI = new InsydrAI();
    window.InsydrAI.init({
      agentId: script.dataset.agentId,
      apiKey: script.dataset.apiKey || '',
    });
  }
})();
```

#### Build Output: `widget/dist/widget.js`
- Single minified JS file (~30KB)
- Includes CSS (injected into Shadow DOM)
- No external dependencies

### Widget Configurator (Admin)

#### File: `frontend/app/dashboard/workspaces/[id]/agents/[agentId]/widget/page.tsx`
- Visual theme customizer
- Position selector
- Live preview iframe
- Copy integration code
- Download widget bundle

---

## Module 6: Analytics Dashboard

### Backend Implementation

#### File: `backend/app/api/v1/analytics.py`
```python
# Endpoints:
# GET /api/v1/workspaces/{wid}/analytics/overview     → Dashboard stats
# GET /api/v1/workspaces/{wid}/analytics/conversations → Conversation metrics
# GET /api/v1/workspaces/{wid}/analytics/questions    → Top questions
# GET /api/v1/workspaces/{wid}/analytics/unanswered   → Gap analysis
# GET /api/v1/workspaces/{wid}/analytics/feedback     → Feedback summary
# GET /api/v1/workspaces/{wid}/analytics/export       → Export data
```

#### File: `backend/app/services/analytics_service.py`
```python
class AnalyticsService:
    async def get_overview(self, workspace_id: UUID, days: int = 30) -> OverviewStats
    async def get_conversation_metrics(self, workspace_id: UUID, period: str) -> ConversationMetrics
    async def get_top_questions(self, workspace_id: UUID, limit: int) -> List[TopQuestion]
    async def get_unanswered_questions(self, workspace_id: UUID) -> List[UnansweredQuestion]
    async def track_event(self, event_type: str, data: dict) -> None
```

### Frontend Implementation

#### File: `frontend/app/dashboard/workspaces/[id]/analytics/page.tsx`
- Overview cards (conversations, messages, satisfaction)
- Conversation volume chart (line/area)
- Top questions list
- Unanswered questions table
- Date range picker
- Export button

---

## Module 7: Webhooks

### Backend Implementation

#### File: `backend/app/api/v1/webhooks.py`
```python
# Endpoints:
# POST   /api/v1/workspaces/{wid}/webhooks     → Create webhook
# GET    /api/v1/workspaces/{wid}/webhooks     → List webhooks
# PATCH  /api/v1/workspaces/{wid}/webhooks/{id} → Update webhook
# DELETE /api/v1/workspaces/{wid}/webhooks/{id} → Delete webhook
# GET    /api/v1/workspaces/{wid}/webhooks/{id}/logs → Get delivery logs
```

#### File: `backend/app/services/webhook_service.py`
```python
class WebhookService:
    async def trigger_webhook(self, workspace_id: UUID, event_type: str, payload: dict):
        """Send webhook with retry logic"""
        pass
    
    async def verify_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """HMAC signature verification"""
        pass
```

---

## 🔗 API Reference Summary

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | None | Register |
| POST | `/api/v1/auth/login` | None | Login |
| POST | `/api/v1/auth/verify-otp` | None | Verify email |
| POST | `/api/v1/auth/forgot-password` | None | Request reset |
| POST | `/api/v1/auth/reset-password` | None | Reset password |
| GET | `/api/v1/auth/me` | JWT | Get profile |

### Workspaces
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/workspaces` | JWT | Create workspace |
| GET | `/api/v1/workspaces` | JWT | List workspaces |
| GET | `/api/v1/workspaces/{id}` | JWT | Get workspace |
| PATCH | `/api/v1/workspaces/{id}` | JWT | Update workspace |
| DELETE | `/api/v1/workspaces/{id}` | JWT | Delete workspace |

### Agents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/workspaces/{wid}/agents` | JWT | Create agent |
| GET | `/api/v1/workspaces/{wid}/agents` | JWT | List agents |
| GET | `/api/v1/workspaces/{wid}/agents/{id}` | JWT | Get agent |
| PATCH | `/api/v1/workspaces/{wid}/agents/{id}` | JWT | Update agent |
| DELETE | `/api/v1/workspaces/{wid}/agents/{id}` | JWT | Delete agent |
| POST | `/api/v1/workspaces/{wid}/agents/{id}/publish` | JWT | Publish |

### Knowledge
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/workspaces/{wid}/collections` | JWT | Create collection |
| POST | `/api/v1/workspaces/{wid}/documents` | JWT | Upload document |
| POST | `/api/v1/workspaces/{wid}/documents/url` | JWT | Crawl URL |
| GET | `/api/v1/workspaces/{wid}/documents` | JWT | List documents |

### Widget (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/widget/config/{agent_id}` | API Key | Get config |
| POST | `/api/v1/widget/chat` | API Key | Send message |
| POST | `/api/v1/widget/feedback` | API Key | Submit feedback |

---

## 🗄 Database Schema Reference

The complete schema is defined in your Prisma ERD. Key tables:

### Core Tables
- `users` - User accounts
- `workspaces` - Tenant isolation
- `workspace_members` - Team access
- `api_keys` - Authentication keys

### Agent Tables
- `agents` - AI agent configurations
- `widget_configs` - Widget customization
- `agent_knowledge_collections` - Knowledge links

### Knowledge Tables
- `knowledge_collections` - Document groups
- `documents` - Source documents
- `document_chunks` - Processed chunks
- `document_versions` - Version history
- `embeddings` - Vector embeddings

### Conversation Tables
- `conversations` - Chat sessions
- `messages` - Chat messages
- `message_sources` - Source citations
- `message_feedback` - User feedback

### Analytics Tables
- `analytics_events` - Event tracking
- `usage_metrics` - Aggregated stats
- `unanswered_questions` - Gap tracking

### Integration Tables
- `webhooks` - Webhook configs
- `webhook_logs` - Delivery logs

---

## 🎨 Frontend Pages Structure

```
frontend/app/
├── page.tsx                              # Landing page
├── login/page.tsx                        # Login
├── signup/page.tsx                       # Register
├── verify-otp/page.tsx                   # OTP verification
├── forgot-password/page.tsx              # Request reset
├── reset-password/page.tsx               # New password
└── dashboard/
    ├── page.tsx                          # Dashboard home
    ├── layout.tsx                        # Dashboard layout
    ├── workspaces/
    │   ├── page.tsx                      # Workspace list
    │   └── [id]/
    │       ├── page.tsx                  # Workspace overview
    │       ├── agents/
    │       │   ├── page.tsx              # Agent list
    │       │   ├── new/page.tsx          # Create agent
    │       │   └── [agentId]/
    │       │       ├── page.tsx          # Agent details
    │       │       ├── edit/page.tsx     # Edit agent
    │       │       └── widget/page.tsx   # Widget config
    │       ├── knowledge/
    │       │   ├── page.tsx              # Knowledge base
    │       │   └── [docId]/page.tsx      # Document details
    │       ├── analytics/
    │       │   └── page.tsx              # Analytics dashboard
    │       └── settings/
    │           ├── page.tsx              # General settings
    │           ├── api-keys/page.tsx     # API keys
    │           ├── members/page.tsx      # Team members
    │           └── webhooks/page.tsx     # Webhooks
    └── profile/
        └── page.tsx                      # User profile
```

---

## 🧪 Testing Strategy

### Backend Tests
```
backend/app/tests/
├── conftest.py                 # Pytest fixtures
├── test_auth.py               # Auth endpoint tests
├── test_workspaces.py         # Workspace tests
├── test_agents.py             # Agent tests
├── test_knowledge.py          # Knowledge tests
├── test_chat.py               # Chat/RAG tests
└── test_analytics.py          # Analytics tests
```

### Frontend Tests
```
frontend/__tests__/
├── auth.test.tsx              # Auth flows
├── workspace.test.tsx         # Workspace CRUD
├── agent.test.tsx             # Agent CRUD
└── widget.test.tsx            # Widget SDK
```

### E2E Tests (Playwright)
```
e2e/
├── auth.spec.ts               # Full auth flow
├── agent-creation.spec.ts     # Create agent flow
├── knowledge-upload.spec.ts   # Upload documents
└── widget-embed.spec.ts       # Widget integration
```

---

## 🚀 Deployment Guide

### Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Production (Free Tier)
| Service | Provider | Cost |
|---------|----------|------|
| Backend | Railway.app / Render | Free |
| Frontend | Vercel | Free |
| Database | Neon (PostgreSQL + pgvector) | Free |
| Cache | Upstash Redis | Free |
| CDN | Cloudflare | Free |
| Storage | Cloudinary | Free |

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
OTP_EXPIRY_MINUTES=10
ALLOWED_ORIGINS=http://localhost:3000
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WIDGET_URL=https://cdn.insydr.ai/widget.js
```

---

## 📝 Next Steps (Action Items)

### Immediate (This Week)
1. [ ] Implement Workspace CRUD API
2. [ ] Create Workspace service layer
3. [ ] Build workspace list/create UI
4. [ ] Add workspace context to auth

### Short Term (Next 2 Weeks)
1. [ ] Implement API Key management
2. [ ] Build Agent CRUD API
3. [ ] Create Agent Builder UI
4. [ ] Set up Celery for background jobs

### Medium Term (Next Month)
1. [ ] Complete Knowledge Base pipeline
2. [ ] Implement RAG search
3. [ ] Build Widget SDK
4. [ ] Create Analytics dashboard

---

## 📚 Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [pgvector Setup](https://github.com/pgvector/pgvector)
- [LangChain RAG](https://python.langchain.com/docs/tutorials/rag/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**Built with ❤️ for Insydr.AI**
