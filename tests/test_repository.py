import os
import pytest
import io
import zipfile
from backend.services.repository_service import RepositoryService
from backend.services.repository_indexer import RepositoryIndexer
from agents.dependency_intelligence_agent import DependencyIntelligenceAgent
from agents.secret_scanning_agent import SecretScanningAgent
from agents.security_score_agent import SecurityScoreAgent

def test_zip_safety_guards_accepts_clean_zip(tmp_path):
    # Create a clean ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr("index.js", "console.log('hello world');")
        zf.writestr("src/app.py", "print('hello')")
    
    service = RepositoryService(temp_base_dir=str(tmp_path))
    dest_path = service.extract_zip(zip_buffer.getvalue())
    
    assert os.path.exists(dest_path)
    assert os.path.exists(os.path.join(dest_path, "index.js"))
    assert os.path.exists(os.path.join(dest_path, "src/app.py"))
    
    # Cleanup
    service.cleanup(dest_path)

def test_zip_safety_guards_rejects_executables(tmp_path):
    # Create a ZIP containing an exe and a clean file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00") # MZ Header
        zf.writestr("clean.txt", "hello world")
        zf.writestr("fake.txt", b"MZ\x90\x00\x03\x00\x00\x00") # Fake extension but MZ magic header
    
    service = RepositoryService(temp_base_dir=str(tmp_path))
    dest_path = service.extract_zip(zip_buffer.getvalue())
    
    assert os.path.exists(dest_path)
    assert os.path.exists(os.path.join(dest_path, "clean.txt"))
    assert not os.path.exists(os.path.join(dest_path, "malicious.exe"))
    assert not os.path.exists(os.path.join(dest_path, "fake.txt"))
    
    service.cleanup(dest_path)

def test_zip_safety_guards_rejects_nested_archives(tmp_path):
    # Create a ZIP containing a zip file and a clean file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr("nested.zip", b"dummy zip content")
        zf.writestr("clean.txt", "hello world")
    
    service = RepositoryService(temp_base_dir=str(tmp_path))
    dest_path = service.extract_zip(zip_buffer.getvalue())
    
    assert os.path.exists(dest_path)
    assert os.path.exists(os.path.join(dest_path, "clean.txt"))
    assert not os.path.exists(os.path.join(dest_path, "nested.zip"))
    
    service.cleanup(dest_path)

def test_repository_indexer(tmp_path):
    # Set up mock folder
    (tmp_path / "node_modules").mkdir()
    with open(tmp_path / "node_modules" / "express.js", "w") as f:
        f.write("ignore me")
        
    (tmp_path / "src").mkdir()
    with open(tmp_path / "src" / "api.py", "w") as f:
        f.write("import os\nprint('hello')\n")
        
    with open(tmp_path / "index.js", "w") as f:
        f.write("console.log('test');\nconsole.log('test2');")

    indexer = RepositoryIndexer()
    res = indexer.index_repository(str(tmp_path))
    
    manifest = res["manifest"]
    files_list = res["files_list"]
    
    assert manifest["files"] == 2
    assert manifest["python"] == 1
    assert manifest["javascript"] == 1
    
    paths = [f["path"] for f in files_list]
    assert "src/api.py" in paths
    assert "index.js" in paths
    assert "node_modules/express.js" not in paths

def test_dependency_intelligence_agent(tmp_path):
    # Write package.json
    with open(tmp_path / "package.json", "w") as f:
        f.write('{"dependencies": {"react": "18.2.0"}, "devDependencies": {"typescript": "5.0.0"}}')
        
    # Write requirements.txt
    with open(tmp_path / "requirements.txt", "w") as f:
        f.write("fastapi==0.95.0\nuvicorn>=0.20.0\n")
        
    # Write Dockerfile
    with open(tmp_path / "Dockerfile", "w") as f:
        f.write("FROM python:3.9-slim\nRUN pip install fastapi\n")

    agent = DependencyIntelligenceAgent()
    res = agent.analyze_dependencies(str(tmp_path))
    
    assert res["total_dependencies"] == 5 # react, typescript, fastapi, uvicorn, python:3.9-slim
    assert res["runtime_dependencies"] == 3 # react, fastapi, uvicorn
    assert res["development_dependencies"] == 1 # typescript
    assert res["infrastructure_dependencies"] == 1 # python:3.9-slim
    assert res["dependency_complexity"] == "Low"

def test_secret_scanning_agent(tmp_path):
    # Write files containing credentials
    with open(tmp_path / "secrets.js", "w") as f:
        f.write('const OPENAI_KEY = "sk-proj-1234567890123456789012345678901234567890abcdefgh";\n')
        f.write('const DB_PASS = "db_password = \'supersecretpwd\'";\n')

    agent = SecretScanningAgent()
    files_list = [
        {"path": "secrets.js", "language": "javascript", "size": 100, "lines": 2}
    ]
    findings = agent.scan_repository_secrets(str(tmp_path), files_list)
    
    assert len(findings) == 2
    titles = [f["title"] for f in findings]
    assert "Hardcoded OpenAI API Key Exposure" in titles
    assert "Hardcoded Database Password Exposure" in titles
    assert findings[0]["severity"] == "CRITICAL"
    assert findings[0]["cwe"] == "CWE-798"

def test_security_score_agent():
    agent = SecurityScoreAgent()
    # Deductions: Critical: -15, High: -10, Medium: -5, Low: -2
    findings = [
        {"severity": "CRITICAL"},
        {"severity": "HIGH"},
        {"severity": "MEDIUM"},
        {"severity": "LOW"}
    ]
    
    posture = agent.calculate_posture(findings)
    # Deductions = 15 + 10 + 5 + 2 = 32
    # Score = 100 - 32 = 68
    assert posture["security_score"] == 68
    assert posture["risk_level"] == "HIGH"
