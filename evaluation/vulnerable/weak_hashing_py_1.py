# Benchmark Testcase: Weak Hashing (Python Vuln 1)
import hashlib
def hash_password(password):
    # VULNERABLE: Obsolete md5 hashing function
    return hashlib.md5(password.encode()).hexdigest()
