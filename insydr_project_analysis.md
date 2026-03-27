# 🔍 Insydr.AI — Comprehensive Project Analysis & Improvement Guide

> **Purpose**: This document provides a complete analysis of the Insydr.AI codebase for AI or developer use to systematically improve the project. It covers architecture, security vulnerabilities, code quality, edge cases, testing strategy, and a prioritized improvement roadmap.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend — Next.js 16 + TypeScript"
        LP[Landing Page]
        AUTH[Auth Pages<br/>Login/Signup/OTP/Reset]
        DASH[Dashboard]
        WS[Workspace Pages]
        AGENT_UI[Agent Editor/Preview]
        KB_UI[Knowledge Base UI]
        BILLING_UI[Billing/Pricing]
        ADMIN[Admin Panel]
    end

    subgraph "Widget SDK — Vite + Vanilla JS"
        WIDGET[Embeddable Chat Widget<br/>Shadow DOM Isolated]
    end

    subgraph "Backend — FastAPI + Python 3.11+"
        API[API Layer<br/>v1 Routers]
        MW[Middleware<br/>CORS / Rate Limit / Logging]
        SVC[Service Layer<br/>Auth / Workspace / Agent /<br/>Knowledge / Stripe / Email]
        SEC[Security Module<br/>JWT / bcrypt / API Keys]
        RAG[RAG Pipeline<br/>LangGraph + Gemini + HF Embeddings]
        AGENTS_ENGINE[Agent Engine<br/>Templates / Policies / Runtime]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL + pgvector)]
        REDIS[(Redis<br/>Cache / Rate Limits)]
        CLOUD[Cloudinary<br/>File Storage]
        STRIPE_API[Stripe API<br/>Billing]
        GEMINI[Google Gemini 2.5 Flash]
        HF[HuggingFace API<br/>Embeddings]
    end

    LP --> API
    AUTH --> API
    DASH --> API
    WS --> API
    AGENT_UI --> API
    KB_UI --> API
    BILLING_UI --> API
    ADMIN --> API
    WIDGET --> API

    API --> MW --> SVC
    SVC --> SEC
    SVC --> RAG
    SVC --> AGENTS_ENGINE
    SVC --> PG
    SVC --> REDIS
    SVC --> CLOUD
    SVC --> STRIPE_API
    RAG --> GEMINI
    RAG --> HF
    RAG --> PG
```

### Key Components

| Component | Technology | Files |
|-----------|-----------|-------|
| **Backend API** | FastAPI, SQLAlchemy 2.0 Async | 129 Python files |
| **Frontend** | Next.js 16, TypeScript, Redux, TailwindCSS 4 | 64 components, 45 pages |
| **Widget SDK** | Vite, Vanilla JS, Shadow DOM | 3 source files |
| **Database** | PostgreSQL + pgvector | 25 models |
| **AI/RAG** | LangGraph, Gemini 2.5 Flash, HuggingFace Embeddings | 10 files |
| **Billing** | Stripe (Checkout, Portal, Webhooks) | [stripe_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/stripe_service.py) |
| **Caching** | Redis (embeddings, rate limits) | [cache.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/cache.py), [rate_limit.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/rate_limit.py) |

---

## 2. Code Structure Map

```
insydr/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/           # 13 route files (auth, agents, knowledge, widget, billing, etc.)
│   │   │   ├── schemas/      # Pydantic request/response models
│   │   │   ├── middleware/    # rate_limit.py, logging.py
│   │   │   └── deps.py       # Dependency injection (DB sessions, services, auth)
│   │   ├── agents/           # Agent engine: templates, policies, prompts, runtime
│   │   ├── analytics/        # Aggregations, reports, trackers
│   │   ├── core/             # Config, cache, constants, exceptions, rate_limit, logging
│   │   ├── db/
│   │   │   ├── models/       # 25 SQLAlchemy models
│   │   │   ├── repositories/ # Data access layer
│   │   │   ├── session.py    # Async engine + session factory
│   │   │   └── base.py       # ORM base classes
│   │   ├── rag/              # RAG pipeline: embeddings, chunker, crawler, retriever, graph
│   │   ├── security/         # auth.py (JWT/bcrypt), api_keys.py, permissions.py, rate_limit.py
│   │   ├── services/         # Business logic: auth, workspace, agent, knowledge, stripe, email, plan_limits
│   │   ├── templates/        # Email HTML templates
│   │   ├── tests/            # ⚠️ ALL TEST FILES ARE EMPTY
│   │   ├── utils/            # Utility helpers
│   │   ├── webhooks/         # Webhook processing
│   │   ├── workers/          # Background task workers
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js App Router (45 pages)
│   └── src/
│       ├── components/       # UI components (auth, landing, layout, public, ui)
│       ├── features/         # Feature modules (agents, analytics, knowledge, admin)
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # API client, auth, billing, utils
│       ├── store/            # Redux Toolkit store + slices
│       ├── styles/           # Global CSS
│       └── widget/           # Widget-related frontend code
├── widget/                   # Standalone embeddable widget (Vite build)
│   └── src/
│       ├── App.jsx           # Full widget implementation (19KB)
│       ├── main.jsx          # Widget bootstrap + auto-init
│       └── index.css         # Widget styles
└── docs/                     # API specs, pricing, widget SDK docs
```

---

## 3. Security Vulnerabilities & Issues

> [!CAUTION]
> **14 security issues identified.** Items marked 🔴 are critical and must be fixed before any production deployment.

### 🔴 CRITICAL

| # | Issue | File | Line(s) | Detail |
|---|-------|------|---------|--------|
| 1 | **Hardcoded JWT Secret** | [config.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/config.py#L10) | 10 | Default `JWT_SECRET_KEY = "insydr-secret-key-change-in-production-2026"`. If [.env](file:///Users/tarunnagpal/Documents/insydr/backend/.env) is missing this key, production uses a guessable secret. **Anyone can forge JWTs.** |
| 2 | **Insecure OTP Generation** | [auth.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/auth.py#L55-L58) | 55–58 | Uses `random.randint()` instead of `secrets.randbelow()`. Python's `random` module is **not cryptographically secure**; OTPs are predictable. |
| 3 | **Email Verification Disabled** | [deps.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py#L111-L115) | 111–115 | The email verification check in [get_current_user](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py#78-118) is **commented out**. Unverified users can access all authenticated endpoints. Same in [auth_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py#L67-L68) login flow. |
| 4 | **CORS Allows All Origins** | [main.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/main.py#L47) | 47 | `allow_origins=["*"]` with `allow_credentials=True`. This is a **CORS misconfiguration per OWASP**. Cookies/tokens from any site can access this API. Widget endpoints should be separated from dashboard API. |
| 5 | **DEBUG Mode Default True** | [config.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/config.py#L34) | 34 | `DEBUG: bool = True`. Stack traces and internal errors leak to clients in production if [.env](file:///Users/tarunnagpal/Documents/insydr/backend/.env) doesn't explicitly set `DEBUG=False`. |
| 6 | **SQL Echo Enabled** | [session.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/db/session.py#L6) | 6 | `echo=True` in the SQL engine logs all queries incl. potentially sensitive data to stdout. |

### 🟡 HIGH

| # | Issue | File | Detail |
|---|-------|------|--------|
| 7 | **No JWT Token Blacklisting** | [auth.py L181-189](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/auth.py#L181-L189) | Logout just returns a message; the JWT remains valid until expiry. Compromised tokens cannot be revoked. |
| 8 | **No Password Strength Validation** | [auth_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py#L25) | No minimum length, complexity, or breach-check for passwords. Users can set `"a"` as a password. |
| 9 | **Widget Chat Has No Session Validation** | [widget.py L268-L402](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py#L268-L402) | `/chat` and `/chat/stream` verify the session exists but don't verify the API key again. A valid session_id can be hijacked from another domain. |
| 10 | **Lead Email XSS** | [widget.py L709-L751](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py#L709-L751) | User-provided `visitor_name`, `visitor_email`, and chat `content` are interpolated directly into HTML email body without escaping. Stored XSS in emails. |
| 11 | **API Key in Query Params** | [rate_limit.py L34](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/middleware/rate_limit.py#L34) | `request.query_params.get("api_key")` — API keys in URLs are logged in servers, proxies, and browser history. |
| 12 | **Empty Security Modules** | [security/api_keys.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/api_keys.py), [permissions.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/permissions.py), [rate_limit.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/rate_limit.py) | All three security files are completely empty. No RBAC, no API key validation logic at the security layer, no centralized rate limiting. |
| 13 | **OTP Logged to Console** | [auth_service.py L183-188](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py#L183-L188) | OTP codes are printed to stdout with emoji banners. In production, logs may be accessible to ops teams or log aggregation services. |
| 14 | **JWT Token Stored in localStorage** | [api.ts L19](file:///Users/tarunnagpal/Documents/insydr/frontend/src/lib/api.ts#L19) | `localStorage.getItem('access_token')` — vulnerable to XSS. If any XSS exists, all tokens are exfiltrated. Should use HttpOnly cookies. |

---

## 4. Code Quality Issues

### Backend

| Issue | Location | Impact |
|-------|----------|--------|
| **`asyncio.run()` inside async context** | [embeddings.py L38,95,107,113](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py#L38) | `asyncio.run()` called within an already-running event loop crashes or creates a new loop. Should use `await` directly. |
| **Bare `except` clauses** | [embeddings.py L101](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py#L101), multiple files | `except:` catches `SystemExit`, `KeyboardInterrupt`. Use `except Exception:` minimum. |
| **Duplicate variable assignments** | [deps.py L59-62](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py#L59-L62) | `api_key_repo` and `workspace_repo` are assigned twice with identical values. |
| **`datetime.utcnow()` deprecated** | Throughout codebase | Python 3.12+ deprecates `datetime.utcnow()`. Use `datetime.now(timezone.utc)`. |
| **`print()` for logging** | Nearly all files | Uses `print()` instead of structured logging via the existing `app.core.logging` module. No log levels, no structured output. |
| **No input sanitization** | [widget.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py) | User messages are passed directly to the LLM prompt without any sanitization or length limits (prompt injection vector). |
| **Synchronous embedding calls in async service** | [embeddings.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py) | [embed_query()](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py#23-25) is synchronous and blocks the event loop. When called from async routes, it blocks all concurrent requests. |
| **MD5 for content hashing** | [crawler.py L141](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/crawler.py#L141) | MD5 is broken for security; fine for dedup but should use SHA-256 for consistency. |
| **No connection pool limits** | [session.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/db/session.py) | No `pool_size`, `max_overflow`, or `pool_timeout` configured. Under load, DB connections are exhausted. |
| **Hardcoded 10MB file limit** | [knowledge.py L96](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/knowledge.py#L96) | File size check is hardcoded to 10MB but [plan_limits.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/plan_limits.py) defines per-plan limits (2MB-50MB). The hardcoded check overrides plan limits. |

### Frontend

| Issue | Location | Impact |
|-------|----------|--------|
| **Wrong default API URL** | [api.ts L3](file:///Users/tarunnagpal/Documents/insydr/frontend/src/lib/api.ts#L3) | Fallback is `http://localhost:800` (port 800 instead of 8000). App breaks if [.env.local](file:///Users/tarunnagpal/Documents/insydr/frontend/.env.local) is missing. |
| **No CSRF protection** | Entire frontend | No CSRF tokens for state-changing requests. Combined with CORS `*`, this is exploitable. |
| **No input validation on forms** | Auth pages, agent editor | Client-side validation is inconsistent. Some forms submit without validating. |

---

## 5. Missing Implementations

> [!IMPORTANT]
> These are placeholder files that are **completely empty** and represent missing functionality.

| File | Purpose | Risk |
|------|---------|------|
| [security/api_keys.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/api_keys.py) | API key hashing, validation, rotation | API keys may be stored in plaintext |
| [security/permissions.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/permissions.py) | RBAC, workspace role enforcement | No authorization checks beyond ownership |
| [security/rate_limit.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/rate_limit.py) | Security-layer rate limiting | Rate limiting only exists in middleware |
| [agents/runtime.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/agents/runtime.py) | Agent execution runtime | Not implemented |
| [tests/test_security.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/tests/test_security.py) | Security tests | Empty |
| [tests/test_api.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/tests/test_api.py) | API tests | Empty |
| [tests/test_rag.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/tests/test_rag.py) | RAG pipeline tests | Empty |
| [tests/test_agents.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/tests/test_agents.py) | Agent tests | Empty |

---

## 6. Edge Cases & Failure Scenarios

### Authentication & Authorization

| Edge Case | Current Behavior | Expected Behavior |
|-----------|-----------------|-------------------|
| Expired JWT used for API call | Returns 401 with "Invalid or expired token" | ✅ Handled |
| Unverified user accesses endpoints | **Allowed** (check commented out) | Should return 403 |
| Concurrent OTP requests for same email | Creates multiple valid OTPs | Should invalidate all previous ✅ (already does this) |
| User deletes account but JWT still valid | JWT remains valid until expiry | Should be blacklisted immediately |
| Workspace member tries owner-only action | Handled via `PermissionError` | ✅ Handled in workspace routes |
| API key used from unauthorized domain | Blocked at widget init, **but not at chat** | Should verify on every request |

### Knowledge Base & RAG

| Edge Case | Current Behavior | Expected Behavior |
|-----------|-----------------|-------------------|
| Empty document uploaded (0 bytes) | Processed, creates 0 chunks | Should reject with explicit error |
| Malicious PDF (PDF bomb) | `PdfReader` may hang or OOM | Should have timeout + size limits on extraction |
| CSV with 100K+ rows | Loads entire file into memory | Should stream/limit rows |
| Embeddings API rate limited | Raises exception, document status = `error_embedding` | ✅ Status tracked, but no retry mechanism |
| Crawled page returns non-UTF8 | `errors='replace'` handles it | ✅ Handled |
| Duplicate documents uploaded | No dedup check | Should check content hash before processing |
| Large prompt injection via chat | Passed directly to Gemini | Should have input length limits and sanitization |
| Knowledge base has 0 documents | RAG returns empty context, LLM may hallucinate | Should return fallback message immediately |
| Concurrent web crawls for same URL | Both crawls proceed independently | Should check for in-progress crawls |

### Billing & Subscriptions

| Edge Case | Current Behavior | Expected Behavior |
|-----------|-----------------|-------------------|
| Stripe webhook arrives before checkout redirect | [sync_checkout()](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/stripe_service.py#133-146) handles this | ✅ Designed for this |
| User downgrades but exceeds new limits | Limits checked on new actions, existing data untouched | Should warn user about over-limit state |
| Webhook signature validation fails | Raises `ValueError("Invalid signature")` | ✅ Handled |
| Multiple workspaces with different tiers | [check_workspace_limit](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/plan_limits.py#300-329) uses highest tier | ✅ Handled |
| Free user hits message limit mid-conversation | Returns 403 | Should show graceful "upgrade" message in widget |

### Widget

| Edge Case | Current Behavior | Expected Behavior |
|-----------|-----------------|-------------------|
| Widget loaded on page with CSP headers | May be blocked by Content Security Policy | Should document required CSP rules |
| Session ID reused after conversation ends | Can continue sending messages | Should expire sessions after inactivity |
| Widget init with invalid agent_id format | Returns 400 "Invalid agent_id format" | ✅ Handled |
| Extremely long user message (100K+ chars) | Passed directly to LLM | Should truncate or reject |
| SSE stream disconnects mid-response | Partial response saved | Should handle incomplete responses gracefully |

---

## 7. Testing Strategy

> [!WARNING]
> **All 4 test files are currently empty.** There are zero automated tests in the project.

### Recommended Test Structure

```
backend/app/tests/
├── conftest.py                 # Shared fixtures (test DB, client, auth tokens)
├── test_auth.py                # Auth flow tests
├── test_workspaces.py          # Workspace CRUD + membership
├── test_agents.py              # Agent CRUD + configuration
├── test_knowledge.py           # Upload, ingest, crawl
├── test_rag.py                 # Retrieval quality, embedding, chunking
├── test_widget.py              # Widget init, chat, streaming
├── test_billing.py             # Stripe checkout, webhooks, limits
├── test_plan_limits.py         # Plan enforcement edge cases
├── test_security.py            # Auth bypass, injection, CORS
└── test_admin.py               # Admin panel access control
```

### Priority Test Cases

#### 🔴 P0 — Security Tests (write first)

```python
# test_security.py — Critical tests to write immediately

class TestJWTSecurity:
    """Verify JWT tokens cannot be forged with default/weak secrets."""
    - test_expired_token_rejected()
    - test_malformed_token_rejected()
    - test_token_without_sub_claim_rejected()
    - test_token_with_nonexistent_user_rejected()

class TestAuthEndpoints:
    """Verify auth flows cannot be abused."""
    - test_signup_duplicate_email()
    - test_login_wrong_password()
    - test_login_nonexistent_email()
    - test_otp_brute_force_rate_limited()
    - test_expired_otp_rejected()
    - test_used_otp_rejected()
    - test_forgot_password_nonexistent_email_returns_success()  # no email enumeration

class TestWidgetSecurity:
    """Verify widget cannot be abused."""
    - test_init_without_api_key_rejected()
    - test_init_with_invalid_api_key_rejected()
    - test_init_from_unauthorized_domain_rejected()
    - test_chat_with_invalid_session_rejected()
    - test_chat_message_length_limit()
    - test_rate_limiting_widget_endpoints()
```

#### 🟡 P1 — Core Functionality Tests

```python
# test_rag.py
class TestRAGPipeline:
    - test_pdf_extraction()
    - test_docx_extraction()
    - test_csv_extraction()
    - test_text_chunking_preserves_context()
    - test_embedding_dimension_consistency()
    - test_retrieval_returns_relevant_chunks()
    - test_retrieval_with_no_documents()
    - test_low_confidence_tracked_as_unanswered()

# test_plan_limits.py
class TestPlanLimits:
    - test_free_plan_agent_limit()
    - test_free_plan_message_limit()
    - test_free_plan_document_limit()
    - test_unlimited_plan_allows_all()
    - test_storage_calculation()
    - test_workspace_limit_across_tiers()
```

#### 🟢 P2 — Integration & E2E Tests

```python
# test_widget_e2e.py  (browser-based)
- test_widget_loads_on_demo_site()
- test_widget_chat_flow()
- test_widget_streaming_response()
- test_widget_lead_form_submission()

# test_billing_e2e.py
- test_checkout_flow()
- test_webhook_updates_subscription()
- test_downgrade_flow()
```

### Test Infrastructure Setup

```python
# conftest.py skeleton
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.api.deps import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/insydr_test"

@pytest.fixture
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL)
    # Create tables, yield session, drop tables
    ...

@pytest.fixture
async def client(test_db):
    async def override_get_db():
        yield test_db
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_headers(client):
    # Register + login, return {"Authorization": "Bearer <token>"}
    ...
```

---

## 8. Prioritized Improvement Roadmap

### 🔴 Phase 1: Security Hardening (Do Immediately)

| # | Task | Files to Modify | Effort |
|---|------|----------------|--------|
| 1 | **Remove default JWT secret**; require env var or fail on startup | [config.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/config.py) | S |
| 2 | **Use `secrets.randbelow()`** for OTP generation | [auth.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/auth.py) | S |
| 3 | **Re-enable email verification** check in [get_current_user](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py#78-118) | [deps.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py) | S |
| 4 | **Split CORS policy**: restrict dashboard API origins, allow `*` only for widget routes | [main.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/main.py) | M |
| 5 | **Set `DEBUG=False` default**, `echo=False` in engine | [config.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/config.py), [session.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/db/session.py) | S |
| 6 | **HTML-escape all user input** in lead emails | [widget.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py) | S |
| 7 | **Add password strength validation** (min 8 chars, complexity) | [auth_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py) | S |
| 8 | **Add input length limits** on chat messages (e.g., 4096 chars max) | [widget.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py) | S |
| 9 | **Remove OTP console logging** in production | [auth_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py) | S |
| 10 | **Fix fallback API URL** from port 800 to 8000 | [api.ts](file:///Users/tarunnagpal/Documents/insydr/frontend/src/lib/api.ts) | S |

### 🟡 Phase 2: Architecture & Code Quality (1-2 weeks)

| # | Task | Impact |
|---|------|--------|
| 11 | **Implement JWT blacklisting** via Redis (for logout/password change) | Revoke compromised tokens |
| 12 | **Make embedding calls async** using `asyncio.to_thread()` or `run_in_executor()` | Unblock event loop, 5-10x throughput |
| 13 | **Fix `asyncio.run()` calls** in embeddings.py (replace with `await`) | Prevent runtime errors |
| 14 | **Add DB connection pooling** (`pool_size=20`, `max_overflow=10`) | Prevent connection exhaustion |
| 15 | **Replace `print()` with structured logging** throughout | Production observability |
| 16 | **Implement RBAC** in [security/permissions.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/permissions.py) | Enforce workspace roles |
| 17 | **Add prompt injection guards** (input sanitization, output filtering) | Prevent LLM abuse |
| 18 | **Implement document deduplication** (content hash check before ingest) | Save storage & cost |
| 19 | **Add retry logic** for embedding API failures with exponential backoff | Improve reliability |
| 20 | **Move tokens to HttpOnly cookies** instead of localStorage | Prevent XSS token theft |

### 🟢 Phase 3: Features & Optimization (2-4 weeks)

| # | Task | Impact |
|---|------|--------|
| 21 | **Add conversation history** to RAG prompt (memory) | More contextual responses |
| 22 | **Implement hybrid search** (BM25 + vector) | Better retrieval quality |
| 23 | **Add re-ranking** with a cross-encoder | More precise top-k results |
| 24 | **Implement webhook system** (using empty `webhooks/` module) | Enable integrations |
| 25 | **Add Celery background workers** (email, large file processing) | Non-blocking operations |
| 26 | **Implement SSE keep-alive pings** for streaming chat | Prevent proxy timeouts |
| 27 | **Add document versioning** (models exist but not connected) | Track knowledge changes |
| 28 | **Implement admin analytics aggregation** (hourly/daily rollups) | Dashboard performance |
| 29 | **Add multi-model support** (switch between Gemini/OpenAI/Claude) | Feature flag in plan_limits |
| 30 | **Write comprehensive test suite** (see Section 7) | Prevent regressions |

---

## 9. Performance Bottlenecks

| Bottleneck | Location | Fix |
|-----------|----------|-----|
| **Synchronous HuggingFace API calls** block the event loop | [embeddings.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py) [_get_embedding()](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py#29-117) | Wrap in `asyncio.to_thread()` or use async HF client |
| **Double retrieval in `/chat`** — one for response, one for confidence score | [widget.py L362-370](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py#L362-L370) | Use the RAGGraph's avg_similarity directly instead of re-running retrieval |
| **No caching of agent configuration** | Every chat message queries the Agent table | Cache in Redis with 60s TTL |
| **SQL echo=True** | [session.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/db/session.py) | Set to `False` in production; creates massive log volume |
| **Full table scan for message counts** | [plan_limits.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/plan_limits.py), [stripe_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/stripe_service.py) | Add index on [(workspace_id, created_at)](file:///Users/tarunnagpal/Documents/insydr/backend/app/main.py#66-74) on Messages table |
| **No pagination** on list endpoints | [knowledge.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/knowledge.py), [workspaces.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/workspaces.py) | Add [limit](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/plan_limits.py#123-126)/`offset` or cursor-based pagination |

---

## 10. Database Schema Notes

### 25 Models Identified

| Category | Models |
|----------|--------|
| **Auth** | User, OTP |
| **Workspace** | Workspace, WorkspaceMember, WorkspaceInvitation |
| **Agents** | Agent, AgentKnowledgeCollection |
| **Knowledge** | KnowledgeCollection, Document, DocumentChunk, DocumentVersion, Embedding |
| **Chat** | Conversation, Message, MessageFeedback, MessageSource, ConversationFeedback |
| **Analytics** | AnalyticsEvent, UnansweredQuestion, UsageMetric |
| **Billing** | (Stripe fields on Workspace), APIKey |
| **Integration** | Webhook, WebhookLog, WidgetConfig |

### Missing Indexes (should verify via Alembic migrations)

- `messages(workspace_id, created_at)` — for monthly message count queries
- [documents(workspace_id, source_type)](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/knowledge_service.py#327-331) — for document type filtering
- `analytics_events(workspace_id, event_type, created_at)` — for analytics aggregation
- `conversations(workspace_id, started_at)` — for conversation listing

---

## 11. Environment & Configuration Concerns

| Setting | Current Value | Recommendation |
|---------|-------------|----------------|
| `JWT_SECRET_KEY` | Hardcoded default | **Must be randomly generated, 64+ chars** |
| `DEBUG` | `True` | `False` in production |
| `echo` (SQLAlchemy) | `True` | `False` in production |
| `allow_origins` | `["*"]` | Split: restricted for API, `*` for widget only |
| `JWT_EXPIRATION_HOURS` | 24 | Consider shorter (1–4 hours) with refresh tokens |
| `OTP_EXPIRY_MINUTES` | 10 | Reasonable ✅ |
| Pool size | Not configured | Set `pool_size=20`, `max_overflow=10` |

---

## 12. Quick Reference: File → Responsibility

| File | What It Does |
|------|-------------|
| [main.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/main.py) | FastAPI app setup, CORS, router registration |
| [config.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/core/config.py) | All environment variables and defaults |
| [auth.py (security)](file:///Users/tarunnagpal/Documents/insydr/backend/app/security/auth.py) | JWT creation/decode, password hashing, OTP generation |
| [deps.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/deps.py) | Dependency injection: DB sessions, services, current user |
| [graph.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/graph.py) | LangGraph RAG pipeline (retrieve → generate) |
| [retriever.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/retriever.py) | Vector similarity search with pgvector |
| [embeddings.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/embeddings.py) | HuggingFace embedding service with caching |
| [ingest.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/ingest.py) | Document text extraction + chunking + embedding |
| [crawler.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/rag/crawler.py) | BFS web crawler with content dedup |
| [widget.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/api/v1/widget.py) | Public widget API: init, chat, stream, feedback, leads |
| [stripe_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/stripe_service.py) | Stripe billing: checkout, webhooks, usage stats |
| [plan_limits.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/plan_limits.py) | Plan enforcement: agents, messages, documents, storage |
| [llm_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/llm_service.py) | Google Gemini 2.5 Flash integration |
| [knowledge_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/knowledge_service.py) | Document ingestion, crawling, processing orchestration |
| [auth_service.py](file:///Users/tarunnagpal/Documents/insydr/backend/app/services/auth_service.py) | Auth business logic: signup, login, OTP, password reset |
| [api.ts](file:///Users/tarunnagpal/Documents/insydr/frontend/src/lib/api.ts) | Frontend Axios client with interceptors |
| [App.jsx (widget)](file:///Users/tarunnagpal/Documents/insydr/widget/src/App.jsx) | Full widget UI implementation |

---

> **Last Updated**: 2026-03-24 | **Files Analyzed**: 30+ | **Security Issues**: 14 | **Test Files**: 0/4 implemented
