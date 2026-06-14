import os
import json
import logging
from sqlalchemy.orm import Session
from backend.db import repository

logger = logging.getLogger("ReportService")

class ReportService:
    """
    Handles report retrieval, fetching Markdown/JSON formats from disk locations
    stored in scan histories.
    """
    def get_markdown_report(self, db: Session, scan_id: str) -> str:
        scan = repository.get_scan(db, scan_id)
        if not scan or not scan.report_markdown_path:
            raise ValueError(f"Scan report not found for ID: {scan_id}")

        if os.path.exists(scan.report_markdown_path):
            with open(scan.report_markdown_path, "r", encoding="utf-8") as f:
                return f.read()
        
        # Fallback to reconstructing basic report if file deleted
        raise FileNotFoundError(f"Markdown report file missing at path: {scan.report_markdown_path}")

    def get_json_report(self, db: Session, scan_id: str) -> dict:
        scan = repository.get_scan(db, scan_id)
        if not scan or not scan.report_json_path:
            raise ValueError(f"Scan report not found for ID: {scan_id}")

        if os.path.exists(scan.report_json_path):
            with open(scan.report_json_path, "r", encoding="utf-8") as f:
                return json.load(f)
                
        raise FileNotFoundError(f"JSON report file missing at path: {scan.report_json_path}")
