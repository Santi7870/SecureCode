from sqlalchemy import Column, String, Integer, DateTime, Text
from datetime import datetime
from backend.db.database import Base

class Scan(Base):
    """
    SQLAlchemy Database Model representing historical scan runs.
    Includes posture metrics, CASO executive assessments, and OpenTelemetry trace logs.
    """
    __tablename__ = "scans"

    scan_id = Column(String(50), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    language = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    # Security posture metrics
    security_score = Column(Integer, default=100)
    risk_level = Column(String(50), default="Excellent")
    business_risk = Column(String(50), default="Low")
    executive_summary = Column(Text, nullable=True)
    
    # Observability tracking fields
    trace_id = Column(String(50), nullable=True)
    telemetry_json = Column(Text, nullable=True)

    status = Column(String(50), default="PENDING")
    
    report_markdown_path = Column(String(512), nullable=True)
    report_json_path = Column(String(512), nullable=True)
    
    # Store complete scan result json serialized
    raw_result_json = Column(Text, nullable=True)
