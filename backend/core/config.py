import os
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_STORAGE_PATH = os.getenv("APP_STORAGE_PATH", BASE_DIR)

class Settings(BaseModel):
    """
    Application settings for the FastAPI Backend.
    """
    APP_NAME: str = "SecureCode Reasoning Agent"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "local")
    
    # CORS Origin
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sqlite.db")
    APP_STORAGE_PATH: str = DEFAULT_STORAGE_PATH
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", os.path.join(DEFAULT_STORAGE_PATH, "reports"))
    TEMP_REPOS_DIR: str = os.getenv("TEMP_REPOS_DIR", os.path.join(DEFAULT_STORAGE_PATH, "temp_repos"))
    TEMP_SCANS_DIR: str = os.getenv("TEMP_SCANS_DIR", os.path.join(DEFAULT_STORAGE_PATH, "tmp_scans"))
    VECTOR_STORE_PATH: str = os.getenv("VECTOR_STORE_PATH", os.path.join(DEFAULT_STORAGE_PATH, "data", "vector_store.json"))
    
    # File rules
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
    ALLOWED_EXTENSIONS: list[str] = [".py", ".js", ".ts", ".jsx", ".tsx"]
    
    # AI Provider Settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local") # local | azure_openai | openai_compatible
    
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
    AZURE_EMBEDDING_DEPLOYMENT: str = os.getenv("AZURE_EMBEDDING_DEPLOYMENT", "securecode-embeddings")
    
    OPENAI_COMPATIBLE_BASE_URL: str = os.getenv("OPENAI_COMPATIBLE_BASE_URL", "")
    OPENAI_COMPATIBLE_API_KEY: str = os.getenv("OPENAI_COMPATIBLE_API_KEY", "")
    OPENAI_COMPATIBLE_MODEL: str = os.getenv("OPENAI_COMPATIBLE_MODEL", "gpt-4")

settings = Settings()
