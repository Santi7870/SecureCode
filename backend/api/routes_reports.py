from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, HTMLResponse
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.services.report_service import ReportService

router = APIRouter(prefix="/api/reports")
report_service = ReportService()

@router.get("/{scan_id}/markdown", response_class=PlainTextResponse)
def get_markdown_report(scan_id: str, db: Session = Depends(get_db)):
    """
    Exports a scan report in Markdown layout.
    """
    try:
        return report_service.get_markdown_report(db, scan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load report: {str(e)}")

@router.get("/{scan_id}/json")
def get_json_report(scan_id: str, db: Session = Depends(get_db)):
    """
    Exports a scan report in JSON format structure.
    """
    try:
        return report_service.get_json_report(db, scan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load report: {str(e)}")

@router.get("/{scan_id}/html", response_class=HTMLResponse)
def get_html_report(scan_id: str, db: Session = Depends(get_db)):
    """
    Exports a scan report in corporate HTML layout suitable for browser print-to-PDF.
    """
    try:
        return report_service.get_html_report(db, scan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load report: {str(e)}")
