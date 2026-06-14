import os
import re
import json
import hashlib
import logging
from backend.services.document_chunker import DocumentChunker
from backend.services.embedding_service import EmbeddingService

logger = logging.getLogger("FoundryKnowledgeService")

class FoundryKnowledgeService:
    """
    Azure AI Foundry Grounding Layer.
    Centralizes grounding knowledge retrieval, automates vector database cache generation on startup,
    and performs hybrid similarity matching (semantic search + keyword overlap + CWE/OWASP identifiers).
    """
    def __init__(self, knowledge_dir: str = None):
        if not knowledge_dir:
            self.knowledge_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "knowledge"
            )
        else:
            self.knowledge_dir = knowledge_dir

        self.chunker = DocumentChunker()
        self.embedding_service = EmbeddingService()
        self.vector_records = []
        self.initialize_grounding_layer()

    def initialize_grounding_layer(self):
        """
        Runs on startup. Loads knowledge documents, checks for updates,
        generates embeddings if necessary, and caches the vector store.
        """
        logger.info("Initializing Azure AI Foundry Grounding Layer...")

        # 1. Scan for documents and compute combined hash signature
        if not os.path.exists(self.knowledge_dir):
            logger.error(f"Knowledge directory not found: {self.knowledge_dir}")
            return

        md_files = [f for f in os.listdir(self.knowledge_dir) if f.endswith(".md")]
        md_files.sort()

        hasher = hashlib.sha256()
        for filename in md_files:
            filepath = os.path.join(self.knowledge_dir, filename)
            with open(filepath, "rb") as f:
                hasher.update(f.read())
        current_hash = hasher.hexdigest()

        # 2. Try to load cached vector store
        cached_data = {}
        if os.path.exists(self.embedding_service.store_path):
            try:
                with open(self.embedding_service.store_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read cached vector store: {str(e)}")

        # 3. Use cache if signature matches
        if cached_data.get("signature_hash") == current_hash:
            self.vector_records = cached_data.get("records", [])
            logger.info(f"Loaded {len(self.vector_records)} cached grounding vectors from vector store.")
            return

        # 4. Otherwise, chunk and embed documents (runs once on startup/change)
        logger.info("Grounding documents changed or missing cache. Generating embeddings...")
        all_chunks = []
        for filename in md_files:
            filepath = os.path.join(self.knowledge_dir, filename)
            file_chunks = self.chunker.chunk_file(filepath)
            all_chunks.extend(file_chunks)

        logger.info(f"Generated {len(all_chunks)} text chunks from knowledge documents.")

        records = []
        for idx, chunk in enumerate(all_chunks):
            embedding = self.embedding_service.get_embedding(chunk["content"])
            records.append({
                "id": f"chunk_{idx:03d}",
                "content": chunk["content"],
                "embedding": embedding,
                "source": chunk["source"],
                "section": chunk["section"]
            })

        self.vector_records = records
        self.embedding_service.save_vector_store(records, current_hash)

    def hybrid_search(self, query: str, cwe_id: str = None, owasp_cat: str = None, top_k: int = 5) -> list[dict]:
        """
        Executes hybrid retrieval combining:
        1. Cosine similarity of text-embedding-3-small vectors (50% weight)
        2. Keyword overlap Jaccard coefficient (20% weight)
        3. CWE identifier match (20% weight)
        4. OWASP category match (10% weight)
        """
        if not self.vector_records:
            return []

        # Generate query embedding
        query_embedding = self.embedding_service.get_embedding(query)
        query_words = set(re.findall(r"\w+", query.lower()))

        results = []
        for record in self.vector_records:
            record_embedding = record["embedding"]
            content = record["content"]
            section = record["section"]
            source = record["source"]

            # 1. Cosine similarity (dot product of L2 normalized vectors)
            dot_product = sum(q * r for q, r in zip(query_embedding, record_embedding))
            semantic_score = max(0.0, min(1.0, dot_product))

            # 2. Keyword overlap (Jaccard similarity)
            record_words = set(re.findall(r"\w+", content.lower()))
            intersection = query_words.intersection(record_words)
            union = query_words.union(record_words)
            keyword_score = len(intersection) / len(union) if union else 0.0

            # 3. CWE identifier match
            cwe_score = 0.0
            if cwe_id:
                cwe_clean = cwe_id.lower().strip()
                if cwe_clean in content.lower() or cwe_clean in section.lower():
                    cwe_score = 1.0

            # 4. OWASP category match
            owasp_score = 0.0
            if owasp_cat:
                owasp_clean = owasp_cat.lower().strip()
                # matches things like 'A03', 'Injection'
                if owasp_clean in content.lower() or owasp_clean in section.lower():
                    owasp_score = 1.0

            # Compute hybrid score
            hybrid_score = (
                0.5 * semantic_score +
                0.2 * keyword_score +
                0.2 * cwe_score +
                0.1 * owasp_score
            )

            results.append({
                "id": record["id"],
                "content": content,
                "source": source,
                "section": section,
                "relevance_score": round(hybrid_score, 2)
            })

        # Sort by score descending and return top K
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:top_k]
