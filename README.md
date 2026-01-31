# 🚀 Insydr.AI - AI-Powered Chatbot Platform

> Create, train, and embed intelligent chatbots on your website in minutes

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-MVP%20Development-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 What is Insydr.AI?

Insydr.AI is a **SaaS platform** that enables businesses to create AI-powered chatbots trained on their custom knowledge base. Users can embed these chatbots on their websites with a simple script tag.

### ✨ Key Features

- 🤖 **Smart AI Agents** - Create unlimited AI chatbots with custom personalities
- 📚 **Knowledge Base** - Upload PDFs, docs, or crawl your website
- 🎨 **Customizable Widget** - Brand-matched chat interface
- 📊 **Analytics Dashboard** - Track conversations, questions, and performance
- 🏢 **Multi-Workspace** - Separate environments for different projects
- 🔐 **Secure & Scalable** - Enterprise-grade multi-tenant architecture

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Landing    │  │   Dashboard  │  │   Widget SDK    │ │
│  │     Page     │  │   (Admin)    │  │  (Embeddable)   │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (FastAPI + Python)                 │
│  • Authentication     • Workspace Management                │
│  • Agent Management   • Knowledge Processing                │
│  • RAG Pipeline      • Analytics                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  PostgreSQL + pgvector     Redis         LLM (OpenAI)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy 2.0** - Async ORM for database operations
- **PostgreSQL + pgvector** - Vector database for embeddings
- **Redis** - Caching and job queues
- **Celery** - Background task processing
- **LangChain** - LLM orchestration
- **OpenAI/Gemini** - AI models

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **TailwindCSS 4** - Utility-first styling
- **Headless UI** - Accessible components
- **Heroicons** - Beautiful icons

### Widget SDK
- **Vanilla JavaScript** - Zero dependencies
- **Shadow DOM** - Style isolation
- **CSS Variables** - Dynamic theming

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with pgvector
- Redis (optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/insydr.git
cd insydr
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

**Backend running at:** http://localhost:8000  
**API docs at:** http://localhost:8000/docs

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1' > .env.local

# Start development server
npm run dev
```

**Frontend running at:** http://localhost:3000

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Complete project roadmap with sprint planning |
| [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) | Full API reference with examples |
| [QUICK_START.md](./docs/QUICK_START.md) | Developer setup guide |
| [WORKSPACE_MODULE.md](./docs/WORKSPACE_MODULE.md) | Workspace system documentation |
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | Setup verification checklist |

---

## ✅ Current Status (Phase 1 MVP)

### Completed ✓
- [x] **Authentication System** - Signup, login, OTP verification, password reset
- [x] **Workspace Management** - Multi-tenant architecture with Google Cloud-style UI
- [x] **Frontend Auth Pages** - Beautiful, responsive authentication flows
- [x] **Database Models** - Complete ERD with all tables
- [x] **Redux Store** - State management setup
- [x] **Dashboard Layout** - Collapsible sidebar, workspace switcher

### In Progress 🔄
- [ ] **Agent Management** - Create and configure AI agents
- [ ] **Knowledge Base** - Upload & process documents
- [ ] **RAG Pipeline** - Vector search and retrieval
- [ ] **Widget SDK** - Embeddable chat widget
- [ ] **Analytics Dashboard** - Metrics and insights

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed roadmap.

---

## 🎨 Screenshots

### Dashboard Overview
Beautiful Google Cloud-style dashboard with workspace management:
- Collapsible sidebar
- Workspace switcher
- Stats cards
- Quick actions

### Create Workspace Modal
Smooth workspace creation with:
- Form validation
- Error handling
- Loading states
- Success notifications

### API Documentation
Interactive Swagger UI at `/docs` with all endpoints documented.

---

## 🧪 Testing

### Run Automated Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Quick API Test
```bash
# Run the automated test script
chmod +x test-workspace.sh
./test-workspace.sh
```

---

## 📊 Project Structure

```
insydr/
├── backend/                    # FastAPI backend
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── api/               # API routes & schemas
│   │   ├── db/                # Models & repositories
│   │   ├── services/          # Business logic
│   │   ├── security/          # Auth & permissions
│   │   └── main.py            # FastAPI app
│   └── requirements.txt
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App Router pages
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── lib/               # API clients
│   │   └── store/             # Redux store
│   └── package.json
│
├── docs/                      # Documentation
├── IMPLEMENTATION_PLAN.md     # Project roadmap
├── SETUP_CHECKLIST.md         # Setup guide
└── test-workspace.sh          # Test script
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FastAPI** for the amazing Python framework
- **Next.js** team for the excellent React framework
- **OpenAI** for LLM capabilities
- **pgvector** for vector search functionality

---

## 📞 Support

- 📧 Email: support@insydr.ai
- 💬 Discord: [Join our community](https://discord.gg/insydr)
- 📖 Docs: [docs.insydr.ai](https://docs.insydr.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/insydr/issues)

---

## 🗺️ Roadmap

### Phase 1: Core Platform (Current) ✓
- Authentication & User Management
- Workspace System
- Basic Dashboard

### Phase 2: AI Features (Next)
- Agent Management
- Knowledge Base Processing
- RAG Implementation
- Widget SDK

### Phase 3: Advanced Features
- Analytics Dashboard
- Webhooks & Integrations
- Team Collaboration
- Advanced Customization

### Phase 4: Enterprise
- SSO Integration
- White-labeling
- Custom Integrations
- SLA & Support

---

## 🎯 Goals

- **MVP Launch**: March 2026
- **First 100 Users**: April 2026
- **Revenue**: May 2026
- **Series A**: Q4 2026

---

**Built with ❤️ by the Insydr.AI team**

⭐ **Star us on GitHub** if you find this project useful!

---

## 🚀 Get Started Now!

```bash
# One command to rule them all
git clone https://github.com/yourusername/insydr.git && cd insydr && ./setup.sh
```

Visit [docs.insydr.ai](https://docs.insydr.ai) for complete documentation.

**Happy coding!** 🎉
