import os
import json
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from evaluation.generate_dataset import setup_evaluation_dirs, generate_dataset
from evaluation.benchmark_runner import run_benchmark, map_finding_to_category

client = TestClient(app)

def test_map_finding_to_category():
    # Test SQL Injection mappings
    assert map_finding_to_category({"title": "SQL Injection through dynamic construction", "cwe": "CWE-89"}) == "SQL Injection"
    assert map_finding_to_category({"title": "SQL Injection", "cwe": ""}) == "SQL Injection"
    assert map_finding_to_category({"title": "Raw Query", "cwe": "CWE-89"}) == "SQL Injection"
    
    # Test Hardcoded Secrets mappings
    assert map_finding_to_category({"title": "Hardcoded Slack Token", "cwe": "CWE-798"}) == "Hardcoded Secrets"
    
    # Test XSS mappings
    assert map_finding_to_category({"title": "Stored XSS", "cwe": "CWE-79"}) == "XSS"
    
    # Unknown
    assert map_finding_to_category({"title": "Unknown issue", "cwe": "CWE-999"}) is None

def test_generate_dataset_structure(tmp_path):
    # Temporarily patch setup_evaluation_dirs to use tmp_path
    import evaluation.generate_dataset as gd
    original_dirs_setup = gd.setup_evaluation_dirs
    
    # Mock gd.setup_evaluation_dirs to return target temp path and create directories
    temp_eval_dir = str(tmp_path / "evaluation")
    def mock_setup_dirs():
        dirs = [
            os.path.join(temp_eval_dir, "templates", "vulnerable"),
            os.path.join(temp_eval_dir, "templates", "safe"),
            os.path.join(temp_eval_dir, "vulnerable"),
            os.path.join(temp_eval_dir, "safe"),
            os.path.join(temp_eval_dir, "expected_results"),
            os.path.join(temp_eval_dir, "reports"),
            os.path.join(temp_eval_dir, "benchmark_history"),
        ]
        for d in dirs:
            os.makedirs(d, exist_ok=True)
        return temp_eval_dir
    gd.setup_evaluation_dirs = mock_setup_dirs
    
    try:
        # Run generator
        gd.generate_dataset()
        
        # Verify templates
        assert os.path.exists(os.path.join(temp_eval_dir, "templates", "vulnerable", "sql_injection_python_tpl.txt"))
        assert os.path.exists(os.path.join(temp_eval_dir, "templates", "safe", "sql_injection_python_tpl.txt"))
        
        # Verify vulnerable and safe files
        assert len(os.listdir(os.path.join(temp_eval_dir, "vulnerable"))) == 100
        assert len(os.listdir(os.path.join(temp_eval_dir, "safe"))) == 100
        assert len(os.listdir(os.path.join(temp_eval_dir, "expected_results"))) == 200
        
        # Check an expected json result file content
        expected_json_path = os.path.join(temp_eval_dir, "expected_results", "sql_injection_py_1.json")
        with open(expected_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data["expected_findings"] == ["SQL Injection"]
            
    finally:
        gd.setup_evaluation_dirs = original_dirs_setup

def test_benchmark_runner_dry_run():
    # Run a quick 2-file benchmark scan in offline mode
    report = run_benchmark(mode="offline", limit=2)
    
    assert report["dataset_size"] == 2
    assert "metrics" in report
    assert "precision" in report["metrics"]
    assert "recall" in report["metrics"]
    assert "f1" in report["metrics"]
    assert "grounding" in report
    assert "retrieval" in report
    assert "reliability" in report
    assert len(report["categories"]) == 10
    assert "executive_summary" in report

def test_evaluation_api_endpoints():
    # 1. Test get latest report
    response = client.get("/api/evaluation/latest")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "categories" in data
    assert "executive_summary" in data
    
    # 2. Test get history
    response = client.get("/api/evaluation/history")
    assert response.status_code == 200
    history_list = response.json()
    assert isinstance(history_list, list)
    assert len(history_list) > 0
    assert "precision" in history_list[0]
    
    # 3. Test trigger run
    response = client.post("/api/evaluation/run", json={"mode": "offline", "limit": 2})
    assert response.status_code == 200
    trigger_data = response.json()
    assert trigger_data["status"] == "triggered"
    
    # 4. Test status
    response = client.get("/api/evaluation/status")
    assert response.status_code == 200
    status_data = response.json()
    assert "is_running" in status_data
