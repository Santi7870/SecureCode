class CostService:
    """
    Service for calculating and estimating execution costs for LLM completions
    and vector embeddings based on Azure OpenAI pricing.
    """
    
    # Pricing per 1,000,000 tokens (USD)
    GPT_REASONING_INPUT_PRICE = 0.15      # GPT-4o-mini input
    GPT_REASONING_OUTPUT_PRICE = 0.60     # GPT-4o-mini output
    EMBEDDING_PRICE = 0.02                 # text-embedding-3-small

    @classmethod
    def calculate_llm_cost(cls, input_tokens: int, output_tokens: int) -> float:
        """
        Calculates GPT reasoning cost.
        """
        input_cost = (input_tokens / 1_000_000) * cls.GPT_REASONING_INPUT_PRICE
        output_cost = (output_tokens / 1_000_000) * cls.GPT_REASONING_OUTPUT_PRICE
        return round(input_cost + output_cost, 6)

    @classmethod
    def calculate_embedding_cost(cls, text_tokens: int) -> float:
        """
        Calculates text-embedding-3-small embedding cost.
        """
        return round((text_tokens / 1_000_000) * cls.EMBEDDING_PRICE, 6)

    @classmethod
    def calculate_retrieval_cost(cls, chunk_count: int) -> float:
        """
        Calculates RAG search index costs (often negligible or bundled, but tracked for transparency).
        """
        return 0.0
