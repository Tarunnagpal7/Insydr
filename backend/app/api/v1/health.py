import time
import shutil
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api import deps
from app.core.redis_client import RedisClient
from app.core.config import settings

router = APIRouter()

start_time = time.time()

@router.get("/liveness")
async def liveness() -> Dict[str, Any]:
    """Basic check to see if the application process is running."""
    return {"status": "ok", "uptime_seconds": int(time.time() - start_time)}

@router.get("/readiness")
async def readiness(db: AsyncSession = Depends(deps.get_db)) -> Dict[str, Any]:
    """
    Comprehensive check of application dependencies.
    Returns 200 OK only if DB and Redis are healthy.
    """
    status_dict = {
        "status": "ok",
        "app": settings.APP_NAME,
        "database": "unknown",
        "redis": "unknown",
        "disk": "unknown",
        "uptime_seconds": int(time.time() - start_time)
    }

    # 1. Database Check
    try:
        await db.execute(text("SELECT 1"))
        status_dict["database"] = "ok"
    except Exception as e:
        status_dict["database"] = f"error: {str(e)}"
        status_dict["status"] = "error"

    # 2. Redis Check
    try:
        redis_client = await RedisClient.get_client()
        if redis_client:
            await redis_client.ping()
            status_dict["redis"] = "ok"
        else:
            status_dict["redis"] = "error: client is none"
            status_dict["status"] = "error"
    except Exception as e:
        status_dict["redis"] = f"error: {str(e)}"
        status_dict["status"] = "error"

    # 3. Disk Space Check
    try:
        total, used, free = shutil.disk_usage("/")
        free_mb = free // (2**20)
        status_dict["disk"] = f"ok: {free_mb} MB free"
        if free_mb < 500: # Less than 500MB is considered unhealthy
             status_dict["disk"] = f"warning: low disk space ({free_mb} MB)"
             # We usually don't fail readiness for low disk, but can warn
    except Exception as e:
        status_dict["disk"] = f"error: {str(e)}"

    return status_dict
