import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db import repository
from backend.models.schemas import CodeScanRequest, ScanSummary, ScanResponse
from backend.services.scan_service import ScanService
from backend.services.report_service import ReportService
from backend.core.config import settings

router = APIRouter(prefix="/api")
scan_service = ScanService()
report_service = ReportService()

@router.post("/scan/code", response_model=ScanResponse)
def scan_raw_code(request: CodeScanRequest, db: Session = Depends(get_db)):
    """
    Submits raw pasted source code for multi-agent reasoning check.
    """
    try:
        scan = scan_service.scan_code(db, request.code, request.filename, request.language)
        return _build_full_response(db, scan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/scan/file", response_model=ScanResponse)
def scan_uploaded_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a file to perform security audits.
    """
    # 1. Validate file extension
    import os
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Validate file size (reading headers or chunk)
    try:
        content = file.file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )
        
        # Analyze file
        scan = scan_service.scan_uploaded_file(db, content, file.filename)
        return _build_full_response(db, scan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/scans", response_model=list[ScanSummary])
def get_recent_scans(db: Session = Depends(get_db)):
    """
    Retrieves recent scan histories from SQLite.
    """
    scans = repository.get_recent_scans(db)
    return scans

@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan_details(scan_id: str, db: Session = Depends(get_db)):
    """
    Retrieves detailed findings and agent traces for a specific scan.
    """
    scan = repository.get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan run not found.")
    return _build_full_response(db, scan)

def _build_full_response(db: Session, scan) -> ScanResponse:
    raw_data = {}
    if scan.raw_result_json:
        raw_data = json.loads(scan.raw_result_json)

    # Read markdown and json reports from disk
    report_md = ""
    report_js = {}
    try:
        report_md = report_service.get_markdown_report(db, scan.scan_id)
        report_js = report_service.get_json_report(db, scan.scan_id)
    except Exception:
        # Fallback if reports not found on disk
        pass

    telemetry_payload = {}
    if scan.telemetry_json:
        try:
            telemetry_payload = json.loads(scan.telemetry_json)
        except Exception:
            pass

    return ScanResponse(
        scan_id=scan.scan_id,
        trace_id=scan.trace_id or "",
        filename=scan.filename,
        language=scan.language,
        created_at=scan.created_at,
        total_findings=scan.total_findings,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        
        # New RAG fields mapped back to schema
        security_score=scan.security_score,
        risk_level=scan.risk_level,
        business_risk=scan.business_risk,
        executive_summary=scan.executive_summary or "",
        
        # Telemetry
        telemetry=telemetry_payload,

        status=scan.status,
        findings=raw_data.get("findings", []),
        agent_trace=raw_data.get("agent_trace", []),
        report_markdown=report_md,
        report_json=report_js
    )

@router.get("/scans/{scan_id}/telemetry")
def get_scan_telemetry(scan_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the OpenTelemetry execution trace report for a specific scan.
    """
    scan = repository.get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan run not found.")
    if not scan.telemetry_json:
        raise HTTPException(status_code=404, detail="No telemetry trace recorded for this scan.")
    try:
        return json.loads(scan.telemetry_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse telemetry: {str(e)}")

from pydantic import BaseModel

class GithubScanRequest(BaseModel):
    github_url: str

@router.post("/scan/repository", response_model=ScanResponse)
def scan_repository_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingests and audits an uploaded ZIP archive of a software repository.
    """
    import os
    _, ext = os.path.splitext(file.filename)
    if ext.lower() != ".zip":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Repository scanner only accepts .zip archives."
        )

    try:
        content = file.file.read()
        scan = scan_service.scan_repository_zip(db, content, file.filename)
        return _build_full_response(db, scan)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/scan/github", response_model=ScanResponse)
def scan_github_repository(
    request: GithubScanRequest,
    db: Session = Depends(get_db)
):
    """
    Clones and audits a public GitHub repository URL.
    """
    url = request.github_url.strip()
    if not (url.startswith("http://") or url.startswith("https://")) or "github.com" not in url:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub repository URL. Must start with http/https and contain github.com."
        )

    try:
        scan = scan_service.scan_github_repository(db, url)
        return _build_full_response(db, scan)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
