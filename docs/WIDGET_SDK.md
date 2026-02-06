# Widget SDK & Customization Module

## Overview
The Insydr Widget SDK allows users to embed a fully functional, customizable AI chatbot into any website using a single script tag. The widget communicates with the Insydr backend to retrieve its configuration (theme, behavior, etc.) and perform chat operations.

## Architecture

### 1. Widget Application (`/widget`)
The widget is a standalone React application built with Vite.
- **Path**: `/widget`
- **Build Output**: `dist/widget.js` (IIFE bundle) and `dist/widget.css`.
- **Mounting**: It attaches to the host page's `<body>`, creating a container `#insydr-widget-{agentId}`.
- **Shadow DOM**: Uses Shadow DOM (partially implemented, currently direct mount for simplicity) or namespaces to avoid style conflicts.
- **CSS**: Uses Tailwind CSS, bundled into `widget.css`. The script automatically injects a `<link>` tag to load this CSS from the same location as the script.

### 2. Backend Integration
- **Public Endpoint**: `GET /api/v1/agents/{agent_id}/widget-config`
  - Returns agent details including `configuration.widget_settings` (colors, position, welcome message, etc.).
  - Does NOT require authentication (designed for public web widgets).
- **Chat Endpoint**: `POST /api/v1/agents/{agent_id}/chat`
  - Handles message processing via LangGraph + Gemini.

### 3. Frontend Customization UI
Located at `/workspace/[id]/agents/[agentId]/page.tsx`.
- **Playground Tab**: Test the agent internally.
- **Customization Tab**:
  - Configure Branding (Name, Color, Theme).
  - Configure Layout (Position).
  - Configure Behavior (Welcome Message).
  - Live Preview: React component simulating the widget appearance.
- **Integration Tab**:
  - Generates the ready-to-copy HTML code snippet.

## How to Work on the Widget

### Development
1. Navigate to widget directory: `cd widget`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev` (Runs on port 5173)
   - Note: In dev mode, use `index.html` to test.

### Production Build
1. Run build: `npm run build`
2. Output is generated in `widget/dist/`.
3. Serve `widget.js` and `widget.css` from a CDN or static host.

### Integration
Add the following to your website's HTML:
```html
<script src="https://your-cdn.com/widget.js" data-agent-id="YOUR_AGENT_UUID" defer></script>
```

## Features Implemented
- **Customizable Appearance**: Primary color, dark/light mode preference.
- **Positioning**: 4 corners supported.
- **Dynamic Content**: Welcome message, Agent name configurable via Dashboard.
- **Seamless Loading**: Async script loading, clean UI with animations.
- **Powered By Badge**: Toggleable branding.

## Next Steps
- Add File Upload support in widget.
- Implement Domain Whitelisting in backend `widget-config` endpoint.
- Enhance Shadow DOM support for perfect style isolation.
