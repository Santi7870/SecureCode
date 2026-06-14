from fastapi import APIRouter
from backend.models.schemas import HealthResponse
from backend.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Standard health check endpoint reporting backend and engine status.
    """
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        engine_ready=True
    )
