import os
import json
import logging
from sqlalchemy.orm import Session
from backend.db import repository
from agents.report_agent import ReportAgent

logger = logging.getLogger("ReportService")

class ReportService:
    """
    Handles report retrieval, fetching Markdown/JSON formats from disk locations
    stored in scan histories.
    """
    def get_markdown_report(self, db: Session, scan_id: str) -> str:
        scan = repository.get_scan(db, scan_id)
        if not scan:
            raise ValueError(f"Scan report not found for ID: {scan_id}")

        if scan.report_markdown_path and os.path.exists(scan.report_markdown_path):
            with open(scan.report_markdown_path, "r", encoding="utf-8") as f:
                return f.read()

        return self._rebuild_markdown_report(scan)

    def get_json_report(self, db: Session, scan_id: str) -> dict:
        scan = repository.get_scan(db, scan_id)
        if not scan:
            raise ValueError(f"Scan report not found for ID: {scan_id}")

        if scan.report_json_path and os.path.exists(scan.report_json_path):
            with open(scan.report_json_path, "r", encoding="utf-8") as f:
                return json.load(f)

        return self._rebuild_json_report(scan)

    def _load_raw_result(self, scan) -> dict:
        if not scan.raw_result_json:
            return {}
        try:
            return json.loads(scan.raw_result_json)
        except Exception:
            logger.exception("Failed to parse raw_result_json for scan %s", scan.scan_id)
            return {}

    def _build_metadata(self, scan, raw_data: dict, findings: list) -> dict:
        first_finding = findings[0] if findings else {}
        profile = raw_data.get("profile", {})
        languages = profile.get("languages", [])

        filepath = first_finding.get("filepath") or scan.filename
        filename = first_finding.get("filename") or scan.filename
        language = (
            first_finding.get("language")
            or scan.language
            or (languages[0] if languages else "Unknown")
        )

        metadata = {
            "filepath": filepath,
            "filename": filename,
            "language": language,
            "loc": raw_data.get("loc", 0),
            "is_repository": bool(raw_data.get("manifest") or raw_data.get("profile") or raw_data.get("dependencies")),
        }
        return metadata

    def _build_posture(self, scan) -> dict:
        return {
            "security_score": scan.security_score or 100,
            "risk_level": scan.risk_level or "LOW",
            "business_risk": scan.business_risk or "LOW",
        }

    def _rebuild_json_report(self, scan) -> dict:
        raw_data = self._load_raw_result(scan)
        findings = raw_data.get("findings", [])
        trace_logs = raw_data.get("agent_trace", [])
        metadata = self._build_metadata(scan, raw_data, findings)

        return {
            "metadata": {
                "analyzed_file": metadata.get("filepath", scan.filename),
                "filename": metadata.get("filename", scan.filename),
                "lines_of_code": metadata.get("loc", 0),
                "language": metadata.get("language", scan.language),
                "findings_count": len(findings),
                "trace_id": scan.trace_id or "",
            },
            "posture": self._build_posture(scan),
            "executive_summary": scan.executive_summary or "",
            "findings": findings,
            "agent_trace_logs": trace_logs,
            "repository_context": {
                "manifest": raw_data.get("manifest", {}),
                "profile": raw_data.get("profile", {}),
                "dependencies": raw_data.get("dependencies", {}),
                "roadmap": raw_data.get("roadmap", []),
            } if metadata.get("is_repository") else {},
        }

    def _rebuild_markdown_report(self, scan) -> str:
        raw_data = self._load_raw_result(scan)
        findings = raw_data.get("findings", [])
        trace_logs = raw_data.get("agent_trace", [])
        metadata = self._build_metadata(scan, raw_data, findings)
        posture = self._build_posture(scan)

        return ReportAgent()._build_markdown_report(
            findings=findings,
            trace_logs=trace_logs,
            metadata=metadata,
            posture=posture,
            executive_summary=scan.executive_summary or "",
            trace_id=scan.trace_id or "",
        )
