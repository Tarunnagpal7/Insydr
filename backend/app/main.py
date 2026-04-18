from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
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
from app.api.v1.billing import router as billing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await RedisClient.init()
    yield
    # Shutdown
    await RedisClient.close()


app = FastAPI(
    title="Insydr.AI Backend",
    description="AI-powered chatbot platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# Initialize structured JSON logging
setup_logging()

# Add Tracing/Logging middleware (should be added before CORS so we log CORS options requests too)
app.add_middleware(StructuredLoggingMiddleware)

# V4 FIX Part 3: Split CORS Policy
# The widget is public and embedded on arbitrary domains, so it cannot be blocked by the dashboard's strict CORS.
# We use a custom ASGI middleware wrapper to route CORS based on the request path.
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

class SplitCORSMiddleware:
    def __init__(self, app, dashboard_origins):
        self.app = app
        self.dashboard_cors = CORSMiddleware(
            app=app,
            allow_origins=dashboard_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.widget_cors = CORSMiddleware(
            app=app,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return
        
        # Route to widget permissive CORS or dashboard strict CORS
        if scope.get("path", "").startswith("/api/v1/widget"):
            await self.widget_cors(scope, receive, send)
        else:
            await self.dashboard_cors(scope, receive, send)

app.add_middleware(SplitCORSMiddleware, dashboard_origins=_allowed_origins)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(api_key_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["Knowledge"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(widget_router, prefix="/api/v1/widget", tags=["Widget (Public)"])
app.include_router(invitations_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])
app.include_router(billing_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/api/v1/health/readiness"
    }
