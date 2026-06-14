# Benchmark Testcase: Permissive CORS (Python Safe 1)
from fastapi.middleware.cors import CORSMiddleware
def setup_cors(app):
    # SAFE: Restricting CORS origin to verified hosts
    app.add_middleware(CORSMiddleware, allow_origins=["https://secure.example.com"])
