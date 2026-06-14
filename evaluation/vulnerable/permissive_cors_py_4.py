# Benchmark Testcase: Permissive CORS (Python Vuln 4)
from fastapi.middleware.cors import CORSMiddleware
def setup_cors(app):
    # VULNERABLE: Wildcard origin mapping
    app.add_middleware(CORSMiddleware, allow_origins=["*"])
