# Insydr.AI Authentication System

A complete authentication system with FastAPI backend and Next.js frontend.

## 🚀 Features

### Backend (FastAPI + Python)
- **User Registration** with email verification
- **Login** with JWT authentication
- **Password Recovery** with OTP
- **OTP Verification** (logged to console for development)
- Async PostgreSQL with SQLAlchemy 2.0
- pgvector for AI embeddings
- Alembic migrations

### Frontend (Next.js 16 + TypeScript)
- Beautiful, responsive UI with Milano Red theme
- Public landing page
- Login & Signup pages
- OTP verification page
- Password recovery flow
- Protected dashboard
- JWT token management

## 📁 Project Structure

```
insydr/
├── backend/
│   ├── alembic/                 # Database migrations
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # FastAPI dependencies
│   │   │   ├── schemas/
│   │   │   │   └── auth.py      # Pydantic schemas
│   │   │   └── v1/
│   │   │       └── auth.py      # Auth routes
│   │   ├── core/
│   │   │   └── config.py        # Settings
│   │   ├── db/
│   │   │   ├── models/          # SQLAlchemy models
│   │   │   ├── repositories/    # Data access layer
│   │   │   ├── base.py          # Base model
│   │   │   └── session.py       # DB session
│   │   ├── security/
│   │   │   └── auth.py          # JWT & password utils
│   │   ├── services/
│   │   │   └── auth_service.py  # Auth business logic
│   │   └── main.py              # FastAPI app
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── dashboard/           # Protected dashboard
    │   ├── forgot-password/     # Password recovery
    │   ├── login/               # Login page
    │   ├── reset-password/      # New password page
    │   ├── signup/              # Registration
    │   ├── verify-otp/          # OTP verification
    │   ├── globals.css          # Design system
    │   ├── layout.tsx           # Root layout
    │   └── page.tsx             # Public home page
    ├── src/
    │   └── lib/
    │       ├── api.ts           # Axios client
    │       └── auth.ts          # Auth API functions
    ├── .env.local
    └── package.json
```

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with pgvector extension

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE insydr_db;
CREATE USER insydr_user WITH PASSWORD 'insydr_pass';
GRANT ALL PRIVILEGES ON DATABASE insydr_db TO insydr_user;
\c insydr_db
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Edit if needed

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| POST | `/api/v1/auth/verify-otp` | Verify email with OTP |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset with OTP |
| POST | `/api/v1/auth/resend-otp` | Resend OTP code |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Logout (client-side) |

### Example Requests

**Signup:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp_code": "123456"
  }'
```

## 🎨 Design System

### Milano Red Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| milano-50 | #fff1f1 | Lightest backgrounds |
| milano-100 | #ffe0e0 | Light backgrounds |
| milano-200 | #ffc6c6 | Hover states |
| milano-500 | #fb3838 | Accents |
| milano-600 | #e91919 | **Primary** |
| milano-700 | #b71010 | Primary hover |
| milano-800 | #a21212 | Dark accents |
| milano-950 | #490606 | Darkest |

### CSS Classes

```css
/* Buttons */
.btn .btn-primary    /* Primary red button */
.btn .btn-secondary  /* Outlined button */
.btn .btn-ghost      /* Text button */

/* Inputs */
.input               /* Standard input */
.input-error         /* Error state */
.otp-input           /* OTP digit input */

/* Cards */
.card                /* Standard card */

/* Alerts */
.alert .alert-error   /* Error message */
.alert .alert-success /* Success message */

/* Backgrounds */
.gradient-primary    /* Red gradient */
.gradient-hero       /* Hero section gradient */
.glass               /* Glassmorphism */
```

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://insydr_user:insydr_pass@localhost:5432/insydr_db
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
OTP_EXPIRY_MINUTES=10
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📝 OTP Testing

During development, OTPs are logged to the console instead of being sent via email:

```
==================================================
📧 OTP for user@example.com
📝 Purpose: email_verification
🔐 OTP Code: 123456
⏰ Expires in: 10 minutes
==================================================
```

Watch the backend terminal for OTP codes when testing.

## 🧪 Testing the Flow

1. **Open** http://localhost:3000
2. **Click** "Get Started Free" or navigate to `/signup`
3. **Fill** the registration form
4. **Check** the backend terminal for the OTP
5. **Enter** the OTP on the verification page
6. **Access** the dashboard

For password reset:
1. Click "Forgot password?" on login
2. Enter your email
3. Check backend terminal for OTP
4. Enter OTP and set new password

## 🚀 Production Deployment

### Backend
- Use Gunicorn with Uvicorn workers
- Set secure `JWT_SECRET_KEY`
- Configure proper CORS origins
- Implement real email service (SendGrid, SES, etc.)

### Frontend
- Run `npm run build`
- Deploy to Vercel, Netlify, or your server
- Update `NEXT_PUBLIC_API_URL` to production API

## 📚 Tech Stack

**Backend:**
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL + pgvector
- Alembic
- PyJWT
- Passlib + bcrypt

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Axios

---

Built with ❤️ for Insydr.AI
