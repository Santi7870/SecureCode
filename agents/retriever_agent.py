from agents.base_agent import BaseAgent
from backend.services.foundry_knowledge_service import FoundryKnowledgeService

class RetrieverAgent(BaseAgent):
    """
    Formulates search queries based on finding vulnerabilities and retrieves
    matching context chunks from the Azure AI Foundry Grounding Layer.
    Registers retrieval metrics and spans in the telemetry layer.
    """
    def __init__(self, knowledge_service: FoundryKnowledgeService = None):
        super().__init__("RetrieverAgent")
        self.kb_service = knowledge_service or FoundryKnowledgeService()

    def retrieve_context(self, finding: dict, telemetry = None) -> list[dict]:
        cwe = finding.get("cwe", "")
        title = finding.get("title", "")
        evidence = finding.get("evidence", "")
        
        # Extract potential OWASP keywords for hybrid indexing
        owasp_cat = None
        title_lower = title.lower()
        if "sql" in title_lower or "injection" in title_lower or "command" in title_lower or "path" in title_lower or "traversal" in title_lower:
            owasp_cat = "A03"
        elif "secret" in title_lower or "key" in title_lower or "password" in title_lower:
            owasp_cat = "A07"
        elif "hash" in title_lower or "random" in title_lower or "tls" in title_lower or "ssl" in title_lower:
            owasp_cat = "A02"
        elif "cors" in title_lower or "eval" in title_lower or "exec" in title_lower:
            owasp_cat = "A05"

        # Build semantic query
        query_parts = [title, cwe]
        if "sql" in title_lower:
            query_parts.append("parameterized query database query placeholder")
        elif "secret" in title_lower:
            query_parts.append("environment variable vault api key")
        elif "random" in title_lower:
            query_parts.append("secrets token csprng cryptographically secure entropy")
        elif "tls" in title_lower or "ssl" in title_lower:
            query_parts.append("verify certificate rejectunauthorized ssl connection")
        elif "cors" in title_lower:
            query_parts.append("access control allow origin credentials domains")
        elif "eval" in title_lower or "exec" in title_lower:
            query_parts.append("json parsing dictionary dynamic code execution")
        elif "command" in title_lower:
            query_parts.append("subprocess arguments list shell false")
        elif "path" in title_lower:
            query_parts.append("basename directory traversal validation containment")
        elif "innerHTML" in evidence or "document.write" in evidence:
            query_parts.append("xss escape textcontent html sanitization")

        query = " ".join(query_parts)
        self.log(f"Querying Azure AI Foundry Grounding Layer with: '{query}'")

        # Telemetry span registration
        if telemetry:
            telemetry.register_agent_start("RetrieverAgent")

        chunks = self.kb_service.hybrid_search(query, cwe_id=cwe, owasp_cat=owasp_cat, top_k=5)
        self.log(f"Matched {len(chunks)} grounding references from vector store.")

        # Telemetry metrics calculation
        if telemetry:
            if chunks:
                top_sim = chunks[0]["relevance_score"]
                avg_sim = sum(c["relevance_score"] for c in chunks) / len(chunks)
            else:
                top_sim = 0.0
                avg_sim = 0.0
            
            telemetry.register_retrieval_event(query, len(chunks), top_sim, round(avg_sim, 2))
            # Average retriever confidence is derived from similarity scores
            retriever_confidence = int(top_sim * 100)
            telemetry.register_agent_finish("RetrieverAgent", confidence=retriever_confidence, retrieval_chunks=len(chunks))

        return chunks
