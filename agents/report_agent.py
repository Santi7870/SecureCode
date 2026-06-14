import os
import json
import re
import uuid
from agents.base_agent import BaseAgent
from backend.core.config import settings

class ReportAgent(BaseAgent):
    """
    Assembles final security findings, posture metrics, attack scenarios,
    grounding references, and workflow logs into an enterprise-grade report.
    """
    def __init__(self, reports_dir: str = None):
        super().__init__("ReportAgent")
        if not reports_dir:
            self.reports_dir = settings.REPORTS_DIR
        else:
            self.reports_dir = reports_dir

    def compile_reports(self, findings: list, trace_logs: list, metadata: dict, posture: dict, executive_summary: str, trace_id: str = "") -> dict:
        self.log("Assembling comprehensive 10-point security report payloads...")
        
        # Ensure reports directory exists
        if not os.path.exists(self.reports_dir):
            os.makedirs(self.reports_dir)

        # 1. Generate JSON Report
        json_report = {
            "metadata": {
                "analyzed_file": metadata.get("filepath", "Unknown"),
                "filename": metadata.get("filename", "Unknown"),
                "lines_of_code": metadata.get("loc", 0),
                "language": metadata.get("language", "Unknown"),
                "findings_count": len(findings),
                "trace_id": trace_id
            },
            "posture": posture,
            "executive_summary": executive_summary,
            "findings": findings,
            "agent_trace_logs": trace_logs
        }
        
        report_basename = self._build_report_basename(metadata, trace_id)
        json_path = os.path.join(self.reports_dir, f"{report_basename}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(json_report, f, indent=2)
        self.log(f"JSON report written to: {json_path}")

        # 2. Generate Markdown Report
        md_content = self._build_markdown_report(findings, trace_logs, metadata, posture, executive_summary, trace_id)
        md_path = os.path.join(self.reports_dir, f"{report_basename}.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        self.log(f"Markdown report written to: {md_path}")

        return {
            "json_path": json_path,
            "markdown_path": md_path,
            "findings_count": len(findings)
        }

    def _build_report_basename(self, metadata: dict, trace_id: str) -> str:
        label = metadata.get("filename") or metadata.get("filepath") or "scan"
        slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", str(label)).strip("-").lower() or "scan"
        suffix = trace_id or uuid.uuid4().hex
        prefix = "repository_report" if metadata.get("is_repository") else "security_report"
        return f"{prefix}_{slug}_{suffix}"

    def _build_markdown_report(self, findings: list, trace_logs: list, metadata: dict, posture: dict, executive_summary: str, trace_id: str = "") -> str:
        score = posture.get("security_score", 100)
        risk_level = posture.get("risk_level", "Low")
        biz_risk = posture.get("business_risk", "Low")
        total_findings = len(findings)
        
        md = []
        md.append("# Enterprise Security Intelligence Assessment Report")
        md.append(f"**Target Module:** `{metadata.get('filepath')}`")
        if trace_id:
            md.append(f"**Trace ID:** `{trace_id}`")
        md.append(f"**Language:** {metadata.get('language', 'Unknown').upper()} | **Lines of Code:** {metadata.get('loc', 0)}")
        md.append(f"**Status:** SUCCESS | **Date:** {os.popen('date /t').read().strip() if os.name == 'nt' else 'Today'}")
        md.append("\n---\n")
        
        # 1. Executive Summary
        md.append("## 1. Executive Summary")
        md.append(executive_summary)
        md.append("")

        # 2. Security Score
        md.append("## 2. Security Posture Score")
        md.append(f"**Overall Posture Score:** `{score}/100`")
        md.append(f"- **Risk Level Classification:** **{risk_level}**")
        md.append(f"- **Security Posture:** The scoring engine evaluated the severity distribution of all findings to assign a normalized posture assessment.")
        md.append("")

        # 3. Business Risk Assessment
        md.append("## 3. Business Risk Assessment")
        md.append(f"**Business Risk Level:** **{biz_risk}**")
        if total_findings > 0:
            md.append("The identified vulnerabilities pose direct risks to company resources. Unauthorized access, data leakage, and command injections represent critical threat vectors in cloud deployment scenarios.")
        else:
            md.append("No active vulnerabilities matching our rulesets were detected, representing an acceptable risk profile for production release.")
        md.append("")

        # 4. Prioritized Findings
        md.append("## 4. Prioritized Remediation Backlog")
        if total_findings > 0:
            md.append("| Remediation Order | Severity | Title | CWE ID | Line | Confidence |")
            md.append("|---|---|---|---|---|---|")
            for f in findings:
                md.append(f"| **Priority {f.get('remediation_priority', 1)}** | {f['severity']} | {f['title']} | {f['cwe']} | {f['line_number']} | {f.get('confidence', 80)}% |")
        else:
            md.append("*No issues requiring remediation backlog prioritization.*")
        md.append("")

        # 5. Finding Details & 6. Attack Scenarios
        md.append("## 5. Detailed Findings & Attack Scenarios")
        for f in findings:
            scenario = f.get("attack_scenario", {})
            g_data = f.get("grounding_data", {})
            
            md.append(f"### Priority {f.get('remediation_priority', 1)}: {f['title']} ({f['cwe']})")
            md.append(f"- **Severity:** {f['severity']} | **Confidence:** {f.get('confidence', 85)}% | **Line:** {f['line_number']}")
            md.append(f"- **Observed Code Evidence:** `{f['evidence']}`")
            md.append(f"- **Risk Explanation:** {f['explanation']}")
            md.append(f"- **Vulnerability Impact:** {f['impact']}")
            md.append("")
            
            md.append("#### Attack Scenario")
            md.append(f"- **Attack Path:** {scenario.get('attack_path', 'N/A')}")
            md.append(f"- **Exploitation Example (Educational Only):** *{scenario.get('exploitation_example', 'N/A')}*")
            md.append(f"- **Business Impact:** {scenario.get('business_impact', 'N/A')}")
            md.append("")

            # 7. Remediation Guidance
            md.append("#### 7. Remediation Guidance")
            md.append(f"```python\n{f.get('recommendation', '')}\n```" if f["language"] == "python" else f"```javascript\n{f.get('recommendation', '')}\n```")
            md.append("")
            
            # 8. Validation Tests
            md.append("#### 8. Validation Tests")
            md.append(f"```python\n{f.get('validation_tests', '')}\n```" if f["language"] == "python" else f"```javascript\n{f.get('validation_tests', '')}\n```")
            md.append("")
            
            # 9. Grounded References
            md.append("#### 9. Grounded References (Azure AI Foundry Grounding Layer)")
            citations = g_data.get("citations", [])
            for c in citations:
                md.append(f"- [✓] **{c.get('source')}** - Section: *{c.get('section')}* (Relevance Score: {c.get('relevance_score', 0.90)})")
            md.append("\n---\n")

        # 10. Appendix
        md.append("## 10. Appendix: Multi-Agent System Trace")
        md.append("The trace log below captures the messages and sequencing in the multi-agent pipeline:")
        md.append("```text")
        for log in trace_logs:
            md.append(log)
        md.append("```")
        md.append("")
        
        md.append("> [!NOTE]")
        md.append("> Generated dynamically by Azure AI Foundry Grounding Layer utilizing GPT-4.1-mini and text-embedding-3-small.")
        
        return "\n".join(md)
