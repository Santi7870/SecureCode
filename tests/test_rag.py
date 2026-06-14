import os
import pytest
from backend.services.document_chunker import DocumentChunker
from backend.services.embedding_service import EmbeddingService
from backend.services.foundry_knowledge_service import FoundryKnowledgeService
from agents.security_score_agent import SecurityScoreAgent
from agents.risk_prioritization_agent import RiskPrioritizationAgent
from agents.attack_scenario_agent import AttackScenarioAgent

def test_document_chunker():
    chunker = DocumentChunker(min_size=100, max_size=500)
    # Create temp markdown file
    temp_md = "temp_test_doc.md"
    try:
        with open(temp_md, "w", encoding="utf-8") as f:
            f.write("# Title\n## Section A\nThis is paragraph one. It is long enough.\n\nThis is paragraph two. It is also long.")
        
        chunks = chunker.chunk_file(temp_md)
        assert len(chunks) > 0
        assert chunks[0]["source"] == "temp_test_doc.md"
        assert chunks[0]["section"] == "Section A"
        assert "paragraph one" in chunks[0]["content"]
    finally:
        if os.path.exists(temp_md):
            os.remove(temp_md)

def test_embedding_service_fallback():
    service = EmbeddingService()
    vec = service.get_embedding("SQL Injection query testing")
    assert len(vec) == 1536
    # Assert vector is L2 normalized: sum(x^2) close to 1.0
    norm_sq = sum(x**2 for x in vec)
    assert abs(norm_sq - 1.0) < 1e-4

def test_hybrid_search():
    # Verify that hybrid search is initialized and searches correctly
    service = FoundryKnowledgeService()
    results = service.hybrid_search("SQL Injection", cwe_id="CWE-89", owasp_cat="A03")
    assert len(results) > 0
    # Top result should be related to SQL Injection / CWE-89
    assert results[0]["relevance_score"] > 0.35

def test_security_score_agent():
    agent = SecurityScoreAgent()
    findings = [
        {"severity": "CRITICAL"},
        {"severity": "HIGH"},
        {"severity": "LOW"}
    ]
    posture = agent.calculate_posture(findings)
    # 100 - (1*15 + 1*10 + 1*2) = 100 - 27 = 73
    assert posture["security_score"] == 73
    assert posture["risk_level"] == "HIGH"
    assert posture["business_risk"] == "HIGH"

def test_risk_prioritization_agent():
    agent = RiskPrioritizationAgent()
    findings = [
        {"id": "SEC-001", "severity": "HIGH", "confidence": 80},
        {"id": "SEC-002", "severity": "CRITICAL", "confidence": 95},
        {"id": "SEC-003", "severity": "HIGH", "confidence": 90}
    ]
    prioritized = agent.prioritize(findings)
    assert prioritized[0]["id"] == "SEC-002" # Critical first
    assert prioritized[1]["id"] == "SEC-003" # High with 90 confidence second
    assert prioritized[2]["id"] == "SEC-001" # High with 80 confidence third

def test_attack_scenario_fallback():
    agent = AttackScenarioAgent()
    scenario = agent.generate_scenario({"cwe": "CWE-89", "title": "SQL Injection", "evidence": "SELECT * FROM users"})
    assert "attack_path" in scenario
    assert "exploitation_example" in scenario
    assert "business_impact" in scenario
    assert "OR" in scenario["exploitation_example"] or "parameter" in scenario["exploitation_example"]
