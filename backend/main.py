import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.core.config import settings
from backend.core.logging import setup_logging, RequestIdFilter
from backend.db.database import engine, Base
from backend.api import routes_health, routes_scan, routes_reports, routes_evaluation

# Initialize logging
setup_logging()
logger = logging.getLogger("backend.main")

# Create database tables automatically
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Successfully synchronized database schema structures.")
except Exception as e:
    logger.critical(f"Failed to synchronize database schema: {str(e)}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Backend API for SecureCode Reasoning Agent"
)

# Request ID Middleware
class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Inject request_id into logging context
        logger_filter = RequestIdFilter(request_id=request_id)
        logging.getLogger().addFilter(logger_filter)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        # Cleanup filter
        logging.getLogger().removeFilter(logger_filter)
        
        return response

app.add_middleware(RequestIdMiddleware)

# Enable CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routers
app.include_router(routes_health.router)
app.include_router(routes_scan.router)
app.include_router(routes_reports.router)
app.include_router(routes_evaluation.router)

@app.get("/")
def get_root():
    return {
        "message": "Welcome to the SecureCode Reasoning Agent API",
        "health": "/health",
        "docs": "/docs"
    }
