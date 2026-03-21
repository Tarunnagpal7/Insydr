import time
import logging
import uuid
from typing import Callable
import traceback
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.alert_service import ErrorAlertService

logger = logging.getLogger(__name__)

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        
        # Skip logging for frequent health checks to avoid log pollution
        if request.url.path in ["/health", "/api/v1/health", "/metrics"]:
            return await call_next(request)

        request_id = str(uuid.uuid4())
        
        # Add request_id to request state so other parts of the app can use it
        request.state.request_id = request_id

        # Extracted client info
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        
        # We don't log full bodies to avoid PII leaks, just metadata
        logger.info(
            f"Incoming Request: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
                "user_agent": request.headers.get("user-agent", ""),
                "event": "request_started"
            }
        )

        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            process_time = time.time() - start_time
            
            logger.info(
                f"Completed Request: {request.method} {request.url.path} - Status {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "process_time_ms": round(process_time * 1000, 2),
                    "event": "request_completed"
                }
            )
            
            # Inject request ID into response headers for client debugging
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            logger.error(
                f"Failed Request: {request.method} {request.url.path} - Unhandled Exception",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "process_time_ms": round(process_time * 1000, 2),
                    "event": "request_failed"
                }
            )
            
            # Send to Alert Service asynchronously
            import asyncio
            stack_trace = traceback.format_exc()
            try:
                # Fire and forget
                asyncio.create_task(ErrorAlertService.track_error(
                    exc_cls=e.__class__.__name__,
                    message=str(e),
                    stack_trace=stack_trace,
                    context={
                        "request_id": request_id,
                        "path": request.url.path,
                        "method": request.method
                    }
                ))
            except Exception as alert_err:
                logger.error(f"Failed to send alert: {alert_err}")
                
            raise e
