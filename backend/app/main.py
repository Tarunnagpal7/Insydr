from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.redis_client import RedisClient
from app.api.middleware.logging import StructuredLoggingMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspace_router
from app.api.v1.api_keys import router as api_key_router
from app.api.v1.agents import router as agents_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.widget import router as widget_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.admin import router as admin_router
from app.api.v1.health import router as health_router

app = FastAPI(
    title="Insydr.AI Backend",
    description="AI-powered chatbot platform API",
    version="1.0.0"
)

# Initialize structured JSON logging
setup_logging()

@app.on_event("startup")
async def startup_event():
    # Initialize Redis connection pool on startup
    await RedisClient.init()

@app.on_event("shutdown")
async def shutdown_event():
    # Close Redis connection pool on shutdown
    await RedisClient.close()

# Add Tracing/Logging middleware (should be added before CORS so we log CORS options requests too)
app.add_middleware(StructuredLoggingMiddleware)

# CORS middleware - Allow all origins for widget embeds to work on customer sites
# In production, you may want to restrict non-widget endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for widget embedding
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
app.include_router(widget_router, prefix="/api/v1/widget", tags=["Widget (Public)"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(invitations_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/api/v1/health/readiness"
    }
