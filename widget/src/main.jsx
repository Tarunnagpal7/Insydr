import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import Tailwind directives (we need to bundle this CSS)
import './index.css';

// Identify the script tag that loaded this to get the ID
// In production (IIFE/UMD), currentScript works.
// In Dev (ESM), it is null. We fallback to searching by ID or specific dev tag.
let scriptTag = document.currentScript; 
if (!scriptTag) {
    // Dev fallback
    scriptTag = document.querySelector('script[data-agent-id]');
}

const agentId = scriptTag?.getAttribute('data-agent-id');

if (agentId) {
    // Create host element
    const host = document.createElement('div');
    host.id = `insydr-widget-${agentId}`;
    document.body.appendChild(host);

    // Create Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject styles
    // In production, Vite will emit CSS file. Ideally we define it here or link it.
    // For dev (HMR), styles are injected into head. Shadow DOM won't see them.
    // We need to manually adopt stylesheets or insert <style> into shadow.
    // Since this is a simple setup, we might need a workaround for styles in ShadowDOM + Tailwind.
    
    // Quick Fix for Tailwind in ShadowDOM: 
    // We can fetch the CSS file or just inline it if small.
    // For Dev: We will try to find the style injected by Vite and clone it??
    // Actually simplicity: Let's render without Shadow DOM for MVP to avoid style isolation headache with Tailwind 
    // OR just scope the tailwind config to a unique ID (e.g #insydr-widget-root).
    
    // Decision: Use Shadow DOM for isolation but we need to supply the CSS.
    // We will assume a built CSS file is available or use 'style-loader' equivalent.
    
    const root = ReactDOM.createRoot(shadow);
    
    // We need to inject the CSS into the Shadow DOM
    // For now, let's put a <style> block with some tailwind basics or rely on a build step that inlines CSS.
    // To keep it clean for MVP demo: I will mount directly to Body to ensure styles load (easier dev experience), 
    // but give it a high z-index and unique IDs.
    
    // Changing approach: Mount to DIV in body, no Shadow DOM yet (to ensure Tailwind works out of box with Vite)
    // shadow.appendChild(mountPoint); -> Reverting to Body mount for reliability in this fast demo.
    
    // Remove shadow for now to ensure styles apply.
    // const root = ReactDOM.createRoot(host);
    // root.render(<App agentId={agentId} />);
    
    // Wait, if I don't use Shadow DOM, existing site styles might bleed in, or tailwind resets might break site.
    // Shadow DOM is best. I will try to fetch the stylesheet.
    
    // Let's stick to Shadow DOM but we need the CSS.
    // In built mode, we can link the CSS file.
    
    const mountPoint = document.createElement('div');
    shadow.appendChild(mountPoint);
    
    // Link CSS (Assumes widget.css is next to widget.js)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // Logic to find current script path
    const src = scriptTag.src;
    const basePath = src.substring(0, src.lastIndexOf('/'));
    link.href = `${basePath}/widget.css`; // In dev this might fail if vite styles are in JS.
    
    // For Dev mode, let's just use manual style injection if possible or just rely on global styles (risky).
    // Let's try mounting to shadow and see.
    
    shadow.appendChild(link);
    const root2 = ReactDOM.createRoot(mountPoint);
    root2.render(
        <React.StrictMode>
            <App agentId={agentId} />
        </React.StrictMode>
    );

} else {
    console.error("Insydr Widget: Missing data-agent-id attribute.");
}
