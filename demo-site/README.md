# Demo Site - Insydr Widget Integration Test

This is a **demo website** that simulates a real customer site embedding the Insydr chatbot widget. It's like how you would test Google Analytics - a completely separate website loading the tracking script.

## 🚀 Quick Start

### Prerequisites
Make sure these are running:

1. **Backend** (Port 8000):
   ```bash
   cd ../backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Widget Dev Server** (Port 5173):
   ```bash
   cd ../widget
   npm run dev
   ```

### Run Demo Site (Port 3001):
```bash
cd demo-site
npm start
```

Then open: **http://localhost:3001**

## 📁 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with hero section |
| About | `/about.html` | About page with team section |
| Pricing | `/pricing.html` | Pricing plans |
| Contact | `/contact.html` | Contact form |

## 🔧 Configuration

Each page includes this widget embed code:

```html
<script 
    src="http://localhost:5173/src/main.jsx" 
    type="module"
    data-agent-id="YOUR_AGENT_ID" 
    data-api-base="http://127.0.0.1:8000/api/v1"
></script>
```

**To use a different agent:**
1. Create an agent in the Insydr dashboard
2. Copy the Agent ID
3. Replace `data-agent-id` in each HTML file

## 🔍 What This Tests

- ✅ Widget loads on external site
- ✅ Page URL tracking
- ✅ Session management across pages
- ✅ Domain validation (allowed_domains)
- ✅ Chat functionality
- ✅ Analytics events

## 📊 Tracking Flow

```
1. User visits demo-site (port 3001)
2. Page loads widget.js from widget server (port 5173)
3. Widget initializes → POST /api/v1/widget/init
4. Backend validates domain & returns session
5. User opens chat → tracks "widget_open" event
6. User sends message → POST /api/v1/widget/chat
7. Response shown → message saved in DB
```

## 🛠️ Troubleshooting

**Widget not appearing?**
- Check browser console for errors
- Make sure widget dev server is running on port 5173
- Make sure backend is running on port 8000

**CORS errors?**
- Backend should have `allow_origins=["*"]` in CORS config
- Restart backend after config changes
