import os
import pytest
from detectors.rules import CodeDetector
from orchestrator.orchestrator import AgentOrchestrator

def test_detector_finds_hardcoded_secret():
    detector = CodeDetector()
    vulnerable_py_path = "samples/vulnerable_python.py"
    
    assert os.path.exists(vulnerable_py_path), "vulnerable_python.py sample file is missing"
    
    findings = detector.scan_file(vulnerable_py_path)
    
    # Assert we found the hardcoded secret
    secret_findings = [f for f in findings if f["cwe"] == "CWE-798"]
    assert len(secret_findings) > 0, "Failed to detect hardcoded secret (CWE-798)"
    assert "API_KEY" in secret_findings[0]["evidence"]
    assert secret_findings[0]["severity"] == "CRITICAL"

def test_detector_finds_sql_injection():
    detector = CodeDetector()
    vulnerable_py_path = "samples/vulnerable_python.py"
    
    findings = detector.scan_file(vulnerable_py_path)
    
    # Assert we found the SQL injection
    sqli_findings = [f for f in findings if f["cwe"] == "CWE-89"]
    assert len(sqli_findings) > 0, "Failed to detect SQL injection (CWE-89)"
    assert "SELECT * FROM users WHERE username = " in sqli_findings[0]["evidence"]

def test_detector_finds_eval():
    detector = CodeDetector()
    vulnerable_py_path = "samples/vulnerable_python.py"
    
    findings = detector.scan_file(vulnerable_py_path)
    
    # Assert we found eval
    eval_findings = [f for f in findings if f["cwe"] == "CWE-95"]
    assert len(eval_findings) > 0, "Failed to detect unsafe eval usage (CWE-95)"
    assert "eval(" in eval_findings[0]["evidence"]

def test_report_file_is_generated(tmp_path):
    # Setup orchestrator with custom temporary reports directory
    temp_reports_dir = str(tmp_path / "reports")
    orchestrator = AgentOrchestrator(reports_dir=temp_reports_dir)
    
    vulnerable_py_path = "samples/vulnerable_python.py"
    result = orchestrator.run_analysis(vulnerable_py_path)
    
    assert result["status"] == "success"
    assert result["findings_count"] > 0
    
    # Assert report files were generated
    markdown_path = result["report_results"]["markdown_path"]
    json_path = result["report_results"]["json_path"]
    
    assert os.path.exists(markdown_path)
    assert os.path.exists(json_path)
    
    with open(json_path, "r", encoding="utf-8") as f:
        import json
        data = json.load(f)
        assert "findings" in data
        assert len(data["findings"]) == result["findings_count"]
