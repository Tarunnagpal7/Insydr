# Workspace Module - Complete Guide

## 📖 Overview

The workspace module has been restructured with clear route separation:

| Route | Description |
|-------|-------------|
| `/dashboard` | General user dashboard (account overview, quick stats) |
| `/workspaces` | List all workspaces + create new |
| `/workspace/[id]` | Individual workspace dashboard with sidebar |
| `/workspace/[id]/agents` | Workspace agents (placeholder) |
| `/workspace/[id]/knowledge` | Knowledge base (placeholder) |
| `/workspace/[id]/analytics` | Analytics (placeholder) |
| `/workspace/[id]/settings` | Workspace settings (placeholder) |

---

## 🚀 How to Test

### 1. Start the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Flow

1. **Login** at `http://localhost:3000/login`
   - Test credentials: `apitest@example.com` / `Test123!`
2. **General Dashboard** (`/dashboard`):
   - Shows account overview
   - Lists your workspaces (quick access)
3. **Workspaces List** (`/workspaces`):
   - See all your workspaces
   - Click "New Workspace" to create one
   - Click any workspace card to open it
4. **Workspace Dashboard** (`/workspace/{id}`):
   - Shows workspace-specific sidebar with navigation
   - Overview, Agents, Knowledge, Analytics, Settings
   - "All Workspaces" link to go back

---

## 🔌 API Endpoints (All Tested ✅)

### Backend Routes (Port 8000)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/workspaces` | Create workspace | ✅ Working |
| `GET` | `/api/v1/workspaces` | List all workspaces | ✅ Working |
| `GET` | `/api/v1/workspaces/{id}` | Get workspace by ID | ✅ Working |
| `PATCH` | `/api/v1/workspaces/{id}` | Update workspace | ✅ Working |
| `DELETE` | `/api/v1/workspaces/{id}` | Delete workspace | ✅ Working |

### Test API Manually

```bash
# Login first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"Test123!"}'

# Use the token from response
TOKEN="your_access_token_here"

# List workspaces
curl http://localhost:8000/api/v1/workspaces \
  -H "Authorization: Bearer $TOKEN"

# Create workspace
curl -X POST http://localhost:8000/api/v1/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Workspace","timezone":"UTC"}'

# Get specific workspace
curl http://localhost:8000/api/v1/workspaces/{workspace_id} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 File Structure

```
frontend/app/
├── dashboard/
│   ├── layout.tsx      # Auth-protected layout
│   └── page.tsx        # General dashboard
├── workspaces/
│   ├── layout.tsx      # Auth-protected layout
│   └── page.tsx        # Workspace list + create modal
└── workspace/
    └── [id]/
        ├── layout.tsx  # Workspace sidebar layout
        └── page.tsx    # Workspace dashboard

frontend/src/
├── store/
│   └── workspace.store.ts  # Redux state for workspaces
├── lib/
│   └── workspace.ts        # API client
└── components/ui/
    ├── Logo.tsx
    ├── Loading.tsx
    └── Spinner.tsx

backend/app/
├── api/v1/
│   └── workspaces.py       # API routes
├── db/
│   ├── models/
│   │   └── workspace.py    # SQLAlchemy model
│   └── repositories/
│       └── workspace_repository.py
├── services/
│   └── workspace_service.py
└── api/schemas/
    └── workspace.py        # Pydantic models
```

---

## 🎨 Theme

All pages use the dark fluid theme:
- Base: `bg-zinc-950` (near black)
- Glassmorphism: `bg-black/40 backdrop-blur-xl`
- Accent: Red gradients (`from-red-600 to-red-800`)
- Fluid background blobs for depth

---

## ✅ Summary of Changes

1. **Route Structure**:
   - `/dashboard` → General overview (no workspace context)
   - `/workspaces` → List all workspaces + create
   - `/workspace/[id]` → Workspace-specific dashboard with sidebar

2. **API Fixes**:
   - Fixed `DISTINCT` query issue with JSON columns
   - Added missing `language` field to Workspace model
   - All CRUD operations tested and working

3. **UI Components**:
   - Consistent Logo component everywhere
   - Consistent Spinner for loading states
   - Dark fluid theme matching landing page

---

## 🔧 Database

Make sure migrations are up to date:
```bash
cd backend
alembic upgrade head
```

---

**Last Updated**: 2026-01-26
