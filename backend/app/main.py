from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspace_router
from app.api.v1.api_keys import router as api_key_router
from app.api.v1.agents import router as agents_router
from app.api.v1.knowledge import router as knowledge_router

app = FastAPI(
    title="Insydr.AI Backend",
    description="AI-powered chatbot platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(api_key_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["Knowledge"])


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/health"
    }
