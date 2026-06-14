# Secure Coding Standards for Python

This guide defines Python secure programming patterns to mitigate vulnerabilities, grounded in Microsoft Secure Coding directives.

## Python Secrets Storage (CWE-798)
Never hardcode passwords or API keys. Read configs dynamically from standard environment systems:
```python
import os
# Secure: Load credentials from system environment variables
api_key = os.environ.get("API_KEY")
```

## Python Database Parameterization (CWE-89)
Avoid concatenating strings inside database query statements. Use parameter syntax provided by execution engines:
```python
# Insecure:
cursor.execute(f"SELECT * FROM users WHERE name = '{username}'")

# Secure:
cursor.execute("SELECT * FROM users WHERE name = ?", (username,))
```

## Python Safe Parsing (CWE-95)
Avoid using `eval()` or `exec()` on dynamic arguments. Parse input structures using standard dictionary routing or JSON decoding:
```python
import json
# Secure: Parse input variables into JSON dictionaries safely
parsed_data = json.loads(user_input_string)
```

## Python Cryptographic Randomness (CWE-330)
Standard `random` libraries use predictable algorithms. Use CSPRNG utilities for security tokens:
```python
import secrets
# Secure: Generate session identifiers with high entropy
token = secrets.token_hex(32)
```

## Python Secure Command Execution (CWE-78)
Do not configure `shell=True` in subprocess calls. Pass execute commands as list components:
```python
import subprocess
# Secure: Execute command arguments without shell parsing
subprocess.run(["tar", "-xzf", filename], shell=False)
```

## Python Path Resolution (CWE-22)
Normalize input paths and confirm absolute containment within target folder domains:
```python
import os
# Secure: Ensure requested path is contained within target base directory
base_dir = "/app/safe_folder"
resolved_path = os.path.abspath(os.path.join(base_dir, user_input_path))
if not resolved_path.startswith(os.path.abspath(base_dir)):
    raise ValueError("Access Denied: Path Traversal Attempted")
```

## Python Cryptographic Hash Selection (CWE-328)
Deprecated hashes like MD5 and SHA-1 are insecure. Implement secure SHA-256 standard hashing:
```python
import hashlib
# Secure: Use SHA-256 algorithm for verification checks
checksum = hashlib.sha256(data_bytes).hexdigest()
```

## Python Secure TLS Verification (CWE-295)
Enforce SSL verification check boundaries:
```python
import requests
# Secure: Keep verification active to check certificate chains
res = requests.get("https://api.service.local", verify=True)
```
