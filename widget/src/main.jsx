import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Insydr Widget Loader
 * 
 * Flow (similar to Google Analytics):
 * ① Browser loads customer's page
 * ② Browser loads this widget.js from CDN/server
 * ③ This script runs automatically
 * ④ It collects page data (URL, title, referrer)
 * ⑤ Sends initialization event to Insydr servers
 * ⑥ Receives configuration and session ID
 * ⑦ Renders the chat widget
 */

// Find the script tag that loaded this widget
// In production: document.currentScript works
// In dev mode (module): need fallback to find by ID or data-agent-id
let scriptTag = document.currentScript;
if (!scriptTag) {
    // Dev fallback 1: find script with ID
    scriptTag = document.getElementById('insydr-widget-script');
}
if (!scriptTag) {
    // Dev fallback 2: find any script with data-agent-id
    scriptTag = document.querySelector('script[data-agent-id]');
}

const agentId = scriptTag?.getAttribute('data-agent-id');
const apiBase = scriptTag?.getAttribute('data-api-base') || 'http://127.0.0.1:8000/api/v1';
const apiKey = scriptTag?.getAttribute('data-api-key');
console.log('[Insydr] Script Config:', { agentId, apiKey: apiKey ? '***' + apiKey.slice(-4) : 'MISSING', apiBase });

if (agentId) {
    // Collect page data (like Google Analytics)
    const pageData = {
        agent_id: agentId,
        api_key: apiKey || null,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || null,
        language: navigator.language || 'en',
    };

    console.log('[Insydr] Initializing widget...', { agentId, pageUrl: pageData.page_url });

    // Create host element
    const host = document.createElement('div');
    host.id = `insydr-widget-${agentId}`;
    document.body.appendChild(host);

    // Create Shadow DOM for style isolation
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Create mount point inside shadow
    const mountPoint = document.createElement('div');
    mountPoint.id = 'insydr-root';
    shadow.appendChild(mountPoint);

    // Link CSS - handle both production (widget.js) and dev mode (module)
    const src = scriptTag?.src || '';
    let cssPath;
    if (src && !src.includes('/src/')) {
        // Production: CSS is next to widget.js
        const basePath = src.substring(0, src.lastIndexOf('/'));
        cssPath = `${basePath}/widget.css`;
    } else {
        // Dev mode: CSS served from Vite
        cssPath = 'http://localhost:5173/src/index.css';
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    shadow.appendChild(link);

    // Mount React app
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
        <React.StrictMode>
            <App 
                agentId={agentId} 
                apiBase={apiBase}
                pageData={pageData}
            />
        </React.StrictMode>
    );

} else {
    console.error("[Insydr] Missing data-agent-id attribute on script tag.");
}
