# Benchmark Testcase: Insecure Randomness (Python Vuln 2)
import random
def generate_session_token():
    # VULNERABLE: Weak pseudo-random number generator
    return str(random.random())
