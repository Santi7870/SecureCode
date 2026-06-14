from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any

class CodeScanRequest(BaseModel):
    """
    Schema for raw code block scans.
    """
    code: str
    filename: str
    language: str

class ScanSummary(BaseModel):
    """
    Summary representation of a scan run.
    """
    scan_id: str
    trace_id: str | None = ""
    filename: str
    language: str
    created_at: datetime
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Security posture metrics
    security_score: int
    risk_level: str
    business_risk: str
    
    status: str

    model_config = ConfigDict(from_attributes=True)

class ScanResponse(BaseModel):
    """
    Full details returned after executing a scan.
    Includes trace identifiers and diagnostic telemetry payloads.
    """
    scan_id: str
    trace_id: str | None = ""
    filename: str
    language: str
    created_at: datetime
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Security posture metrics
    security_score: int
    risk_level: str
    business_risk: str
    executive_summary: str
    
    # Diagnostics telemetry
    telemetry: dict[str, Any] = {}

    status: str
    findings: list[dict[str, Any]]
    agent_trace: list[str]
    report_markdown: str
    report_json: dict[str, Any]
    
    model_config = ConfigDict(from_attributes=True)

class HealthResponse(BaseModel):
    """
    Schema for health check status.
    """
    status: str
    version: str
    environment: str
    engine_ready: bool
