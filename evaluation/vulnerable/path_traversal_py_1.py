# Benchmark Testcase: Path Traversal (Python Vuln 1)
import os
def read_user_file(filename):
    # VULNERABLE: Arbitrary file path concatenation traversal
    filepath = os.path.join("/var/www/uploads", filename)
    with open(filepath, "r") as f:
        return f.read()
