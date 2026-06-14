# Benchmark Testcase: Insecure Randomness (Python Safe 4)
import secrets
def generate_session_token():
    # SAFE: Cryptographically secure random tokens
    return secrets.token_hex(32)
