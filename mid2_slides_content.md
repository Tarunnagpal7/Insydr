# Insydr.AI — Mid 2 Presentation Content

Here is the prepared content for your Mid 2 presentation. It highlights your progress since Mid 1, focusing on the core AI engine, widget SDK, RAG pipeline, billing, and security integrations.

---

## Slide 1: Title Slide
**Title:** Insydr.AI – The Smartest Way to Automate Customer Conversations (Mid-Semester Review 2)
**Subtitle:** Progress & Technical Implementation Complete
**Footers/Details:** 
- Name: Tarun Nagpal | ID: 22CP075
- Subject: 4CP33
- AI/ML Intern At Simform

---

## Slide 2: Recap of Mid-1
**Title:** Recap: Where We Left Off (Mid-1)
**Points:**
- Successfully launched the initial Landing Page.
- Integrated secure user authentication (Login/Signup/OTP).
- Developed Workspace Management UI for organization and administration.
- Initiated the core API Management layer architecture.

---

## Slide 3: Mid-2 Objectives & Focus
**Title:** Focus for Mid-2
**Points:**
- Transitioning from foundational structure to the **Core AI Capabilities**.
- Implementing the **Knowledge Base & RAG Pipeline**.
- Developing the scalable **Agent Engine** for customized interactions.
- Building an embeddable **Widget SDK** for seamless client integration.
- Securing the platform and integrating a robust **Billing & Subscription Model**.

---

## Slide 4: Upgraded System Architecture
**Title:** Comprehensive System Architecture
**Points:**
- **Frontend Layer:** Next.js 16 (Dashboard, Agent Editor, Knowledge Base UI) + Tailwind CSS 4.
- **Widget SDK:** Vite + Vanilla JS (Isolated using Shadow DOM).
- **Backend API:** FastAPI with SQLAlchemy 2.0 Async for high-performance non-blocking APIs.
- **Data & Storage:** PostgreSQL customized with **pgvector** for embeddings, Redis for caching/rate limits, and Cloudinary for file storage.
- **AI Core:** LangGraph orchestrating data flow, Google Gemini 2.5 Flash for generation, and HuggingFace API for vector embeddings.

---

## Slide 5: The RAG Pipeline & Knowledge Base
**Title:** Implementing Retrieval-Augmented Generation (RAG)
**Points:**
- **Diverse Data Ingestion:** Users can train agents by uploading PDFs, DOCX, CSVs, and Raw Text.
- **Web Crawler Integration:** Developed an asynchronous BFS crawler with content deduplication to learn directly from client websites.
- **Vector Search:** Documents are chunked and transformed into embeddings via HuggingFace, stored securely in PostgreSQL + pgvector.
- **Contextual Responses:** LangGraph retrieves the most relevant knowledge chunks to ground the Gemini LLM responses, avoiding hallucinations.

---

## Slide 6: Dynamic Agent Engine
**Title:** Agent Configuration & Management
**Points:**
- **Behavior Customization:** Users can dictate agent tone, system prompts, specific rules, and fallback responses natively from the UI.
- **Multilingual Support:** Agents accurately detect and converse in multiple languages.
- **Advanced Agent Settings:** Designed UI/UX for advanced response configurations and specific instruction rule-sets for individual agents.
- **Real-Time Playground:** Built an interactive playground within the dashboard to test agent behavior before deployment.

---

## Slide 7: Widget SDK Integration
**Title:** Embeddable Widget SDK
**Points:**
- **Seamless Setup:** A lightweight, embeddable SDK (only ~19KB) that clients can inject into any website via a simple `<script>` tag.
- **Shadow DOM Isolation:** Widget CSS and layout are completely isolated to prevent style conflicts with the client's host website.
- **Streaming Responses:** Implemented Server-Sent Events (SSE) for real-time, typewriter-effect streaming of AI responses.
- **Domain Security:** Enhanced security protocols by verifying API keys and validating host domains before authorizing widget initialization.

---

## Slide 8: Lead Generation & Advanced Flow
**Title:** Integrated Lead Generation
**Points:**
- **Visitor Capture:** Agents proactively prompt or collect user details (Name, Email) organically during a conversation.
- **OTP Verification Flow:** Implemented an email OTP verification system inside the widget for secure, verified lead capture.
- **Analytics & Tracking:** Backend tracks unanswered questions, conversion rates, and total message counts for proactive improvement.

---

## Slide 9: Scalability: Billing & Security Hardening
**Title:** Enterprise Readiness (Billing & Security)
**Points:**
- **Stripe Integration:** Integrated Stripe Checkout, Webhooks, and Customer Portal for automated subscription management.
- **Plan-Based Enforcement:** Implemented strict feature limits checking (agents, messages, storage capacity) based on the user's subscription tier.
- **Security Hardening:** Conducted a massive security sweep:
  - Cryptographically secure OTP generation.
  - Granular RBAC (Role-Based Access Control) across workspaces.
  - Strict CORS policies for separating the Dashboard API vs Widget SDK access.
  - Elimination of JWT/Auth vulnerabilities for production deployment.

---

## Slide 10: Progress Summary (Mid-2 Completion)
**Title:** Phase 1 & 2 Completed Successfully
**Points:**
- ✅ Comprehensive Chatbot & Agent Management.
- ✅ Full Knowledge Base (Files + Crawler) & RAG functionality.
- ✅ Embeddable Widget SDK with Lead Gen features.
- ✅ Tiered Billing, Usage Limits, and Platform Security.

---

## Slide 11: Future Scope (Next Steps / Phase 3)
**Title:** Roadmap to Phase 3: Action-Performing Operators
**Points:**
- **Tool / Function Calling:** Empowering agents to fetch live data (calendar booking, triggering external APIs).
- **Business System Control:** Direct CRM/ERP integrations natively from the chat widget.
- **Human Approval Workflows:** Complex query escalation mechanisms seamlessly routing to human support agents.

---
*Tip: When presenting, feel free to use the Mermaid Architecture map from your `insydr_project_analysis.md` file as a visual aid for Slide 4!*
