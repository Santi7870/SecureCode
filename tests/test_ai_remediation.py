import pytest
from unittest.mock import MagicMock, patch
from agents.ai_remediation_agent import AIRemediationAgent
from agents.critic_verifier_agent import CriticVerifierAgent
from orchestrator.orchestrator import AgentOrchestrator

def test_ai_remediation_agent_fallback():
    agent = AIRemediationAgent()
    finding = {
        "id": "SEC-001",
        "title": "SQL Injection",
        "cwe": "CWE-89",
        "severity": "HIGH",
        "language": "python",
        "evidence": "query = 'SELECT * FROM users WHERE id = ' + user_id"
    }
    
    result = agent.generate_remediation(
        finding=finding,
        vulnerable_code=finding["evidence"],
        file_path="app.py",
        repository_context="",
        retrieved_chunks=[]
    )
    
    assert "explanation" in result
    assert "root_cause" in result
    assert "business_impact" in result
    assert "secure_fix" in result
    assert "option_a" in result["secure_fix"]
    assert "option_b" in result["secure_fix"]
    assert "option_c" in result["secure_fix"]
    assert "validation_test" in result
    assert "implementation_roadmap" in result
    assert result["confidence_score"] == 90

def test_critic_verifier_agent_local_heuristics():
    critic = CriticVerifierAgent()
    finding = {
        "id": "SEC-001",
        "title": "SQL Injection",
        "cwe": "CWE-89",
        "severity": "HIGH",
        "language": "python",
        "evidence": "query = 'SELECT * FROM users WHERE id = ' + user_id",
        "explanation": "Unescaped SQL query construction.",
        "root_cause": "String concatenation in raw execute.",
        "business_impact": "Data leak risk.",
        "secure_fix": {
            "option_a": {"title": "Opt A", "description": "Desc A", "code": "code A"},
            "option_b": {"title": "Opt B", "description": "Desc B", "code": "code B"},
            "option_c": {"title": "Opt C", "description": "Desc C", "code": "code C"}
        },
        "validation_tests": "def test_sql(): pass",
        "grounding_data": {
            "citations": [{"source": "owasp.md", "section": "SQLi", "relevance_score": 0.95}]
        }
    }
    
    verified, all_passed = critic.verify([finding])
    assert all_passed
    assert verified[0]["critic_review"]["status"] == "APPROVED"
