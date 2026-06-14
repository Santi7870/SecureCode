# Security Validation and Verification Guidelines

This document details how to write automated test scripts in Python (pytest) and JavaScript (Jest) to verify security vulnerabilities and ensure remediations are correctly applied.

## 1. SQL Injection Verification (CWE-89)
Ensure the query runner is called using parameter placeholders, not interpolated string values.
```python
# pytest verification example:
def test_database_parameterization(mock_cursor):
    # Verify that values are passed as parameters separate from SQL instructions
    mock_cursor.execute("SELECT * FROM users WHERE name = ?", ("admin",))
```

## 2. Secrets Leak Verification (CWE-798)
Verify that class modules load configurations dynamically via environment settings.
```python
# pytest verification example:
def test_secrets_isolation(monkeypatch):
    monkeypatch.setenv("API_KEY", "vault_key_verification")
    assert get_api_key() == "vault_key_verification"
```

## 3. Dynamic Code Execution Prevention (CWE-95)
Ensure inputs are processed using safe serializers (e.g. `json.loads` or a dictionary map) and never passed to raw execution statements.
```python
# pytest verification example:
def test_safe_parsing():
    result = parse_user_input('{"status": "active"}')
    assert result == {"status": "active"}
```

## 4. Secure Command Execution Verification (CWE-78)
Assert that process executors are invoked with shell features turned off and arguments passed in list structures.
```python
# pytest verification example:
def test_subprocess_execution(mock_subprocess):
    # Verify command is parsed as a list and shell execution is False
    assert mock_subprocess.run_arguments[0] == ["tar", "-xzf", "data.tar"]
    assert mock_subprocess.run_arguments["shell"] is False
```

## 5. TLS SSL Integrity Verification (CWE-295)
Ensure API request handlers execute connections with verification parameter turned on.
```python
# pytest verification example:
def test_requests_ssl_verification():
    # Verify that requests do not override certificate checks
    assert get_connector_setting("verify") is True
```
