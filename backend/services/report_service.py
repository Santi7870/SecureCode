import os
import json
import logging
from html import escape
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

    def get_html_report(self, db: Session, scan_id: str) -> str:
        scan = repository.get_scan(db, scan_id)
        if not scan:
            raise ValueError(f"Scan report not found for ID: {scan_id}")

        report_json = self.get_json_report(db, scan_id)
        raw_data = self._load_raw_result(scan)
        return self._build_html_report(scan, report_json, raw_data)

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

    def _build_html_report(self, scan, report_json: dict, raw_data: dict) -> str:
        findings = report_json.get("findings", [])
        metadata = report_json.get("metadata", {})
        posture = report_json.get("posture", {})
        repository_context = report_json.get("repository_context", {})
        dependencies = repository_context.get("dependencies", {})
        profile = repository_context.get("profile", {})
        roadmap = repository_context.get("roadmap", [])
        trace_logs = report_json.get("agent_trace_logs", [])

        def safe(value) -> str:
            return escape("" if value is None else str(value))

        def severity_badge(severity: str) -> str:
            sev = (severity or "LOW").upper()
            sev_class = {
                "CRITICAL": "critical",
                "HIGH": "high",
                "MEDIUM": "medium",
                "LOW": "low",
            }.get(sev, "low")
            return f'<span class="severity-badge {sev_class}">{safe(sev)}</span>'

        findings_rows = []
        findings_sections = []
        for index, finding in enumerate(findings, start=1):
            finding_anchor = f"finding-{index}"
            scenario = finding.get("attack_scenario", {})
            grounding_data = finding.get("grounding_data", {})
            citations = grounding_data.get("citations", [])
            citations_html = "".join(
                f"<li><strong>{safe(c.get('source', 'Reference'))}</strong> — {safe(c.get('section', 'General guidance'))}</li>"
                for c in citations
            ) or "<li>No external citations available for this finding.</li>"

            findings_rows.append(
                f"""
                <tr class="finding-row" data-target="{finding_anchor}">
                  <td><a href="#{finding_anchor}">{index}</a></td>
                  <td><a href="#{finding_anchor}" class="table-link">{severity_badge(finding.get('severity'))}</a></td>
                  <td><a href="#{finding_anchor}" class="table-link">{safe(finding.get('title'))}</a></td>
                  <td><a href="#{finding_anchor}" class="table-link">{safe(finding.get('cwe'))}</a></td>
                  <td><a href="#{finding_anchor}" class="table-link">{safe(finding.get('line_number'))}</a></td>
                  <td><a href="#{finding_anchor}" class="table-link">{safe(finding.get('confidence', 'N/A'))}%</a></td>
                </tr>
                """
            )

            findings_sections.append(
                f"""
                <section class="finding-card" id="{finding_anchor}">
                  <div class="finding-header">
                    <div>
                      <div class="eyebrow">Finding {index}</div>
                      <h3>{safe(finding.get('title'))}</h3>
                    </div>
                    {severity_badge(finding.get('severity'))}
                  </div>
                  <div class="finding-meta">
                    <span>CWE: {safe(finding.get('cwe'))}</span>
                    <span>Line: {safe(finding.get('line_number'))}</span>
                    <span>Confidence: {safe(finding.get('confidence', 'N/A'))}%</span>
                  </div>
                  <div class="info-grid">
                    <div class="info-block">
                      <h4>Evidence</h4>
                      <pre>{safe(finding.get('evidence'))}</pre>
                    </div>
                    <div class="info-block">
                      <h4>Risk</h4>
                      <p>{safe(finding.get('explanation'))}</p>
                    </div>
                    <div class="info-block">
                      <h4>Impact</h4>
                      <p>{safe(finding.get('impact'))}</p>
                    </div>
                    <div class="info-block">
                      <h4>Attack Scenario</h4>
                      <p><strong>Path:</strong> {safe(scenario.get('attack_path', 'N/A'))}</p>
                      <p><strong>Business Impact:</strong> {safe(scenario.get('business_impact', 'N/A'))}</p>
                    </div>
                  </div>
                  <div class="code-grid">
                    <div class="code-panel">
                      <h4>Recommended Remediation</h4>
                      <pre>{safe(finding.get('recommendation'))}</pre>
                    </div>
                    <div class="code-panel">
                      <h4>Validation Tests</h4>
                      <pre>{safe(finding.get('validation_tests'))}</pre>
                    </div>
                  </div>
                  <div class="references">
                    <h4>Grounding References</h4>
                    <ul>{citations_html}</ul>
                  </div>
                </section>
                """
            )

        if not findings_rows:
            findings_rows.append(
                """
                <tr>
                  <td colspan="6" class="empty-row">No findings were detected in this scan.</td>
                </tr>
                """
            )

        frameworks_html = "".join(f"<li>{safe(item)}</li>" for item in profile.get("frameworks", []))
        languages_html = "".join(f"<li>{safe(item)}</li>" for item in profile.get("languages", []))
        roadmap_html = "".join(f"<li>{safe(item)}</li>" for item in roadmap)
        trace_html = "".join(f"<li>{safe(item)}</li>" for item in trace_logs[:20])

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SecureCode Corporate Report - {safe(scan.scan_id)}</title>
  <style>
    :root {{
      --bg: #f3f6fb;
      --card: #ffffff;
      --ink: #0f172a;
      --muted: #475569;
      --line: #dbe4f0;
      --brand: #2563eb;
      --brand-dark: #0f3d91;
      --accent: #60a5fa;
      --critical: #b42318;
      --high: #d97706;
      --medium: #2563eb;
      --low: #047857;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(180deg, #eaf1fb 0%, var(--bg) 100%);
      color: var(--ink);
    }}
    .page {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px;
    }}
    .hero {{
      background: linear-gradient(135deg, var(--brand-dark), var(--brand));
      color: white;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    }}
    .hero-top {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }}
    .eyebrow {{
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 12px;
      opacity: 0.82;
      font-weight: 700;
    }}
    h1, h2, h3, h4, p {{ margin-top: 0; }}
    h1 {{ font-size: 34px; margin-bottom: 10px; }}
    .hero p {{ max-width: 760px; color: rgba(255,255,255,0.92); }}
    .hero-grid, .stats-grid, .section-grid, .info-grid, .code-grid {{
      display: grid;
      gap: 16px;
    }}
    .hero-grid {{ grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-top: 24px; }}
    .stat-card, .panel, .finding-card {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    }}
    .stat-card {{
      padding: 20px;
      color: var(--ink);
    }}
    .stat-card .value {{ font-size: 34px; font-weight: 700; margin-top: 10px; }}
    .section {{ margin-top: 24px; }}
    .section-grid {{ grid-template-columns: 1.2fr 0.8fr; }}
    .panel {{ padding: 24px; }}
    .summary {{
      font-size: 16px;
      line-height: 1.7;
      color: var(--muted);
    }}
    .mini-list, .trace-list, .references ul {{
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      overflow: hidden;
      border-radius: 16px;
    }}
    th, td {{
      padding: 14px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }}
    html {{
      scroll-behavior: smooth;
    }}
    a {{
      color: inherit;
    }}
    .table-link {{
      display: inline-block;
      width: 100%;
      text-decoration: none;
    }}
    .finding-row {{
      cursor: pointer;
      transition: background 0.18s ease;
    }}
    .finding-row:hover {{
      background: #f8fbff;
    }}
    .finding-card:target {{
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
    }}
    th {{
      background: #eff6ff;
      color: var(--brand-dark);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }}
    .severity-badge {{
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }}
    .severity-badge.critical {{ background: var(--critical); }}
    .severity-badge.high {{ background: var(--high); }}
    .severity-badge.medium {{ background: var(--medium); }}
    .severity-badge.low {{ background: var(--low); }}
    .finding-card {{
      padding: 24px;
      margin-top: 20px;
    }}
    .finding-header {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }}
    .finding-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      color: var(--muted);
      font-size: 13px;
      margin: 10px 0 18px;
    }}
    .info-grid, .code-grid {{
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }}
    .info-block, .code-panel {{
      background: #f8fbff;
      border: 1px solid #dce9f8;
      border-radius: 16px;
      padding: 16px;
    }}
    pre {{
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Consolas, "Courier New", monospace;
      font-size: 12px;
      color: #0f172a;
    }}
    .footer-note {{
      margin-top: 24px;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }}
    .empty-row {{
      text-align: center;
      color: var(--muted);
      padding: 20px;
    }}
    .print-hint {{
      margin-top: 14px;
      font-size: 13px;
      color: rgba(255,255,255,0.88);
    }}
    @media print {{
      body {{ background: white; }}
      .page {{ max-width: none; padding: 0; }}
      .hero, .stat-card, .panel, .finding-card {{ box-shadow: none; }}
    }}
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow">SecureCode Executive Report</div>
          <h1>Corporate Security Assessment</h1>
          <p>{safe(scan.executive_summary or report_json.get('executive_summary') or 'No executive summary available.')}</p>
          <div class="print-hint">Tip: open this file in a browser and use Print → Save as PDF for a corporate PDF export.</div>
        </div>
        <div>
          <div class="eyebrow">Trace ID</div>
          <strong>{safe(scan.trace_id or metadata.get('trace_id', 'N/A'))}</strong>
        </div>
      </div>
      <div class="hero-grid">
        <div class="stat-card">
          <div class="eyebrow">Target</div>
          <div class="value" style="font-size:22px;">{safe(scan.filename)}</div>
        </div>
        <div class="stat-card">
          <div class="eyebrow">Security Score</div>
          <div class="value">{safe(posture.get('security_score', scan.security_score))}</div>
        </div>
        <div class="stat-card">
          <div class="eyebrow">Risk Level</div>
          <div class="value" style="font-size:22px;">{safe(posture.get('risk_level', scan.risk_level))}</div>
        </div>
        <div class="stat-card">
          <div class="eyebrow">Findings</div>
          <div class="value">{safe(scan.total_findings)}</div>
        </div>
      </div>
    </section>

    <section class="section section-grid">
      <div class="panel">
        <div class="eyebrow">Scan Summary</div>
        <h2>Operational Overview</h2>
        <div class="summary">
          <p><strong>Analyzed asset:</strong> {safe(metadata.get('analyzed_file', scan.filename))}</p>
          <p><strong>Language:</strong> {safe(metadata.get('language', scan.language))}</p>
          <p><strong>Business risk:</strong> {safe(posture.get('business_risk', scan.business_risk))}</p>
          <p><strong>Generated:</strong> {safe(scan.created_at)}</p>
        </div>
      </div>
      <div class="panel">
        <div class="eyebrow">Posture</div>
        <h2>Severity Distribution</h2>
        <ul class="mini-list">
          <li>Critical: {safe(scan.critical_count)}</li>
          <li>High: {safe(scan.high_count)}</li>
          <li>Medium: {safe(scan.medium_count)}</li>
          <li>Low: {safe(scan.low_count)}</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="panel">
        <div class="eyebrow">Consolidated Findings</div>
        <h2>Prioritized Risk Register</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Severity</th>
              <th>Finding</th>
              <th>CWE</th>
              <th>Line</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {''.join(findings_rows)}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="panel">
        <div class="eyebrow">Detailed Assessment</div>
        <h2>Findings, Remediation and Validation</h2>
        {''.join(findings_sections) if findings_sections else '<p class="summary">No detailed findings were generated for this scan.</p>'}
      </div>
    </section>

    <section class="section section-grid">
      <div class="panel">
        <div class="eyebrow">Repository Context</div>
        <h2>Architecture and Dependencies</h2>
        <ul class="mini-list">
          <li>Languages: {' '.join(['<ul>' + languages_html + '</ul>']) if languages_html else 'Not available'}</li>
          <li>Frameworks: {' '.join(['<ul>' + frameworks_html + '</ul>']) if frameworks_html else 'Not available'}</li>
          <li>Total dependencies: {safe(dependencies.get('total_dependencies', 'N/A'))}</li>
          <li>Dependency complexity: {safe(dependencies.get('dependency_complexity', 'N/A'))}</li>
          <li>Repository files: {safe(repository_context.get('manifest', {}).get('files', 'N/A'))}</li>
        </ul>
      </div>
      <div class="panel">
        <div class="eyebrow">Remediation Roadmap</div>
        <h2>Recommended Next Steps</h2>
        <ul class="mini-list">
          {roadmap_html or '<li>No roadmap data available.</li>'}
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="panel">
        <div class="eyebrow">Execution Trace</div>
        <h2>Agent Orchestration Highlights</h2>
        <ul class="trace-list">
          {trace_html or '<li>No trace entries available.</li>'}
        </ul>
      </div>
    </section>

    <div class="footer-note">
      Generated by SecureCode Reasoning Agent. This HTML report is optimized for browser preview and PDF print export.
    </div>
  </div>
</body>
</html>"""
