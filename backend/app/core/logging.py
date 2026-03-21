import logging
import json
import traceback
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the LogRecord.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
        }

        # Add extra fields if passed via 'extra' dictionary
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "process_time"):
            log_data["process_time"] = record.process_time
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            # Send exception traces to our alert service locally if needed

        return json.dumps(log_data)

def setup_logging(level: int = logging.INFO):
    """
    Configure the root logger with JSONFormatter.
    This replaces standard Uvicorn/FastAPI logging.
    """
    logger = logging.getLogger()
    
    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()
        
    logger.setLevel(level)

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    # Apply to specific noisy loggers or re-route them
    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        l = logging.getLogger(logger_name)
        l.handlers.clear()
        l.addHandler(handler)
        l.propagate = False
