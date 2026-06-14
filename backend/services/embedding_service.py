import os
import json
import hashlib
import random
import logging
from openai import AzureOpenAI
from backend.core.config import settings

logger = logging.getLogger("EmbeddingService")

# Keywords for local hybrid keyword overlap embedding fallback
FALLBACK_KEYWORDS = [
    "cwe-798", "hardcoded", "secret", "credentials", "api_key", "password", "vault",
    "cwe-89", "sql", "injection", "parameterized", "placeholder", "query",
    "cwe-95", "eval", "exec", "dynamic", "json.loads", "Function",
    "cwe-328", "hash", "md5", "sha1", "sha256", "bcrypt",
    "cwe-330", "random", "predictable", "secrets", "entropy", "csprng",
    "cwe-295", "tls", "ssl", "certificate", "verify", "rejectunauthorized",
    "cwe-942", "cors", "origin", "wildcard", "permissive",
    "cwe-78", "subprocess", "shell", "command", "arguments", "execfile",
    "cwe-22", "path", "traversal", "directory", "basename", "containment",
    "cwe-79", "xss", "cross-site", "dom", "innerhtml", "textcontent", "document.write",
    "owasp", "a01", "a02", "a03", "a05", "a07", "microsoft", "foundry", "guidelines"
]

class EmbeddingService:
    """
    Generates text embeddings using text-embedding-3-small via Azure OpenAI,
    falling back to a deterministic semantic keyword vector space model when offline.
    Stores and caches the vector database locally in 'data/vector_store.json'.
    """
    def __init__(self):
        self.deployment = os.getenv("AZURE_EMBEDDING_DEPLOYMENT", "securecode-embeddings")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        self.store_path = settings.VECTOR_STORE_PATH
        self.client = None

        if self.api_key and self.endpoint:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version="2024-02-15-preview"
                )
                logger.info("Successfully initialized Azure OpenAI client for embeddings.")
            except Exception as e:
                logger.warning(f"Failed to initialize Azure OpenAI client: {str(e)}. Using fallback embeddings.")

    def get_embedding(self, text: str) -> list[float]:
        """
        Generates a 1536-dimensional L2-normalized embedding vector.
        Uses Azure OpenAI if keys are present; otherwise, uses keyword-mapped fallback.
        """
        if self.client:
            try:
                response = self.client.embeddings.create(
                    input=text,
                    model=self.deployment
                )
                return response.data[0].embedding
            except Exception as e:
                logger.warning(f"Azure OpenAI embedding generation failed: {str(e)}. Using fallback.")

        return self._get_fallback_embedding(text)

    def _get_fallback_embedding(self, text: str) -> list[float]:
        """
        Generates a deterministic 1536-dimensional L2-normalized vector based on
        hashing and semantic keyword overlap. This ensures search works offline.
        """
        # Seed random number generator with the text hash for determinism
        hasher = hashlib.sha256(text.encode("utf-8"))
        seed = int(hasher.hexdigest()[:8], 16)
        
        # We construct a 1536-dimensional vector
        # Start with small random noise
        random.seed(seed)
        vec = [random.normalvariate(0, 0.05) for _ in range(1536)]

        # Find matching keywords and boost their dimensions
        text_lower = text.lower()
        for idx, kw in enumerate(FALLBACK_KEYWORDS):
            # Boost the keyword dimension
            if kw in text_lower:
                # Map keyword index to vector dimension (e.g. dimensions 100 to 100 + len(FALLBACK_KEYWORDS))
                dimension_idx = 100 + idx
                if dimension_idx < 1536:
                    vec[dimension_idx] = 5.0

        # Enforce L2 normalization: sum(x^2) = 1
        sq_sum = sum(x ** 2 for x in vec)
        norm = sq_sum ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]

        return vec

    def load_vector_store(self) -> list[dict]:
        """
        Loads the vector store from local file. Returns empty list if missing.
        """
        if os.path.exists(self.store_path):
            try:
                with open(self.store_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load vector store from {self.store_path}: {str(e)}")
        return []

    def save_vector_store(self, records: list[dict], signature_hash: str):
        """
        Saves the records to 'data/vector_store.json' along with a hash signature.
        """
        os.makedirs(os.path.dirname(self.store_path), exist_ok=True)
        payload = {
            "signature_hash": signature_hash,
            "records": records
        }
        with open(self.store_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        logger.info(f"Successfully saved {len(records)} embedded records to {self.store_path}")
