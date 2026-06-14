# Benchmark Testcase: Weak Hashing (Python Safe 4)
import hashlib
def hash_password(password):
    # SAFE: Strong cryptographically secure hashing
    return hashlib.sha256(password.encode()).hexdigest()
