import os
import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session

from orchestrator.orchestrator import AgentOrchestrator
from backend.db.models import Scan
from backend.db import repository
from backend.services.executive_summary_service import ExecutiveSummaryService
from backend.services.repository_service import RepositoryService
from backend.services.repository_indexer import RepositoryIndexer
from backend.core.config import settings


class ScanService:
    """
    Main service handling code scans, invoking the Multi-Agent engine,
    calculating security score posture, and generating board reports.
    """
    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.summary_service = ExecutiveSummaryService()

    def scan_code(self, db: Session, code_content: str, filename: str, language: str) -> Scan:
        # 1. Determine temporary file path
        scan_id = str(uuid.uuid4())
        ext = ".py" if language.lower() == "python" else ".js" if language.lower() == "javascript" else ".py"
        if not filename.endswith(ext):
            filename = f"{filename}{ext}"

        temp_dir = settings.TEMP_SCANS_DIR
        os.makedirs(temp_dir, exist_ok=True)
        temp_filepath = os.path.join(temp_dir, f"temp_{scan_id}{ext}")

        # 2. Write code content to temporary file
        try:
            with open(temp_filepath, "w", encoding="utf-8") as f:
                f.write(code_content)

            # Run Multi-Agent Orchestrator
            result = self.orchestrator.run_analysis(temp_filepath)
            
            if result.get("status") == "error":
                raise Exception(result.get("error_message", "Unknown analysis error"))

            report_res = result.get("report_results", {})
            markdown_path = report_res.get("markdown_path")
            json_path = report_res.get("json_path")

            # 3. Read findings and trace logs
            findings = []
            trace_logs = []
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    findings = raw_data.get("findings", [])
                    trace_logs = raw_data.get("agent_trace_logs", [])

            # 4. Count severities
            severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            for f in findings:
                sev = f["severity"].upper()
                if sev in severity_counts:
                    severity_counts[sev] += 1
                else:
                    severity_counts["LOW"] += 1

            # Get posture calculations from the orchestrator run
            posture = result.get("posture", {
                "security_score": 100,
                "risk_level": "Excellent",
                "business_risk": "Low"
            })

            # 5. Generate CASO Executive board summary via GPT-4.1-mini
            executive_summary = self.summary_service.generate_caso_summary(findings, posture, filename)

            # 6. Populate Scan Database Model
            scan = Scan(
                scan_id=scan_id,
                filename=filename,
                language=language,
                created_at=datetime.utcnow(),
                total_findings=len(findings),
                critical_count=severity_counts["CRITICAL"],
                high_count=severity_counts["HIGH"],
                medium_count=severity_counts["MEDIUM"],
                low_count=severity_counts["LOW"],
                
                # Dynamic security posture metrics
                security_score=posture["security_score"],
                risk_level=posture["risk_level"],
                business_risk=posture["business_risk"],
                executive_summary=executive_summary,

                # Observability telemetry
                trace_id=result.get("trace_id", ""),
                telemetry_json=json.dumps(result.get("telemetry", {})),

                status="SUCCESS",
                report_markdown_path=markdown_path,
                report_json_path=json_path,
                raw_result_json=json.dumps({
                    "findings": findings,
                    "agent_trace": trace_logs
                })
            )

            # Persist to SQLite database
            repository.create_scan(db, scan)
            return scan

        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filepath):
                try:
                    os.remove(temp_filepath)
                except Exception:
                    pass

    def scan_uploaded_file(self, db: Session, file_bytes: bytes, filename: str) -> Scan:
        # Determine language from extension
        _, ext = os.path.splitext(filename)
        language = "python" if ext in [".py"] else "javascript" if ext in [".js", ".jsx", ".ts", ".tsx"] else "unknown"
        
        # Decode file contents
        code_content = file_bytes.decode("utf-8", errors="ignore")
        return self.scan_code(db, code_content, filename, language)

    def scan_repository_zip(self, db: Session, file_bytes: bytes, filename: str) -> Scan:
        """
        Ingests a ZIP uploaded repository, runs safe validations, recursive index audits,
        and coordinates multi-agent intelligence assessments.
        """
        repo_service = RepositoryService()
        
        # Safely extract ZIP and get path
        repo_path = repo_service.extract_zip(file_bytes)
        repo_name = os.path.splitext(filename)[0]
        
        try:
            return self._scan_repo_path(db, repo_path, repo_name, is_git=False)
        finally:
            repo_service.cleanup(repo_path)

    def scan_github_repository(self, db: Session, git_url: str) -> Scan:
        """
        Clones a GitHub repository, strips it, and performs recursive multi-agent auditing.
        """
        repo_service = RepositoryService()
        
        # Safely clone git repo and get path
        repo_path = repo_service.clone_github_repo(git_url)
        # Parse project name
        repo_name = git_url.strip("/").split("/")[-1].replace(".git", "")
        if not repo_name:
            repo_name = "github_repo"
            
        try:
            return self._scan_repo_path(db, repo_path, repo_name, is_git=True)
        finally:
            repo_service.cleanup(repo_path)

    def _scan_repo_path(self, db: Session, repo_path: str, repo_name: str, is_git: bool) -> Scan:
        scan_id = str(uuid.uuid4())
        
        # 1. Index code files
        indexer = RepositoryIndexer()
        indexed_data = indexer.index_repository(repo_path)
        files_list = indexed_data["files_list"]
        manifest = indexed_data["manifest"]
        
        # 2. Extract Dependency Summary
        dep_summary = self.orchestrator.dependency_agent.analyze_dependencies(repo_path)
        
        # 3. Discover Repository Profile / Architecture Stack
        repo_profile = self.orchestrator.discovery_agent.profile_repository(
            repo_path, indexed_data, dep_summary["total_dependencies"]
        )
        
        # 4. Perform static file scanning recursively
        raw_findings = []
        for file_meta in files_list:
            filepath_abs = os.path.join(repo_path, file_meta["path"])
            file_findings = self.orchestrator.risk_agent.detector.scan_file(filepath_abs)
            
            # Map absolute path back to relative file paths
            for f in file_findings:
                f["filepath"] = file_meta["path"]
                f["filename"] = os.path.basename(file_meta["path"])
                raw_findings.append(f)
                
        # 5. Delegate to multi-agent repository orchestration pipeline
        result = self.orchestrator.run_repository_analysis(
            repo_path=repo_path,
            repo_name=repo_name,
            manifest=manifest,
            files_list=files_list,
            raw_findings=raw_findings,
            dep_summary=dep_summary,
            repo_profile=repo_profile
        )
        
        if result.get("status") == "error":
            raise Exception(result.get("error_message", "Unknown analysis error"))
            
        findings = result.get("findings", [])
        report_res = result.get("report_results", {})
        markdown_path = report_res.get("markdown_path")
        json_path = report_res.get("json_path")
        
        # Count severities
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for f in findings:
            sev = f["severity"].upper()
            if sev in severity_counts:
                severity_counts[sev] += 1
            else:
                severity_counts["LOW"] += 1
                
        posture = result.get("posture", {
            "security_score": 100,
            "risk_level": "LOW",
            "business_risk": "LOW"
        })
        
        exec_summary = result.get("executive_assessment", "")
        
        # 6. Save Scan history database record
        scan = Scan(
            scan_id=scan_id,
            filename=repo_name,
            language="Multi-Language" if len(repo_profile.get("languages", [])) > 1 else (repo_profile.get("languages", ["Unknown"])[0]),
            created_at=datetime.utcnow(),
            total_findings=len(findings),
            critical_count=severity_counts["CRITICAL"],
            high_count=severity_counts["HIGH"],
            medium_count=severity_counts["MEDIUM"],
            low_count=severity_counts["LOW"],
            
            security_score=posture["security_score"],
            risk_level=posture["risk_level"],
            business_risk=posture["business_risk"],
            executive_summary=exec_summary,
            
            trace_id=result.get("trace_id", ""),
            telemetry_json=json.dumps(result.get("telemetry", {})),
            
            status="SUCCESS",
            report_markdown_path=markdown_path,
            report_json_path=json_path,
            raw_result_json=json.dumps({
                "findings": findings,
                "agent_trace": result.get("telemetry", {}).get("agent_trace_logs", []),
                "manifest": manifest,
                "profile": repo_profile,
                "dependencies": dep_summary,
                "roadmap": result.get("roadmap", [])
            })
        )
        
        repository.create_scan(db, scan)
        return scan
