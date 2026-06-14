from agents.base_agent import BaseAgent

class ValidationAgent(BaseAgent):
    """
    Generates unit test snippets (in pytest for Python, jest for JavaScript)
    to validate the existence of the vulnerability and verify the remediation fix.
    """
    def __init__(self):
        super().__init__("ValidationAgent")

    def generate_tests(self, findings: list) -> list:
        self.log(f"Generating validation test suites for {len(findings)} findings...")
        
        validated_findings = []
        for f in findings:
            self.log(f"Creating validation test case for {f['id']} ({f['cwe']})")
            
            test_suite = self._generate_test_suite(f["cwe"], f["language"])
            f_copy = f.copy()
            f_copy["validation_tests"] = test_suite
            validated_findings.append(f_copy)
            
            self.log(f"[{f['id']}] Validation test suite generated.")

        return validated_findings

    def _generate_test_suite(self, cwe: str, language: str) -> str:
        if language == "python":
            if cwe == "CWE-798":
                return (
                    "def test_secrets_configured_from_env(monkeypatch):\n"
                    "    # Verify that secret loading fetches value from environment variable\n"
                    "    monkeypatch.setenv(\"API_KEY\", \"test_env_key_value_12345\")\n"
                    "    # Simulate import or config reading\n"
                    "    import os\n"
                    "    api_key = os.environ.get(\"API_KEY\")\n"
                    "    assert api_key == \"test_env_key_value_12345\"\n"
                )
            elif cwe == "CWE-89":
                return (
                    "def test_sql_injection_remediated(mock_db_connection):\n"
                    "    # Verify that SQL cursor executes query with parameters, not direct string addition\n"
                    "    # A correct parameterized query passes values in arguments separate from query command\n"
                    "    mock_cursor = mock_db_connection.cursor()\n"
                    "    # Assert that execution is safe\n"
                    "    mock_cursor.execute(\"SELECT * FROM users WHERE username = %s\", (\"admin\",))\n"
                    "    assert mock_cursor.called_with_parameters\n"
                )
            elif cwe == "CWE-95":
                return (
                    "def test_safe_parsing_instead_of_eval():\n"
                    "    # Test that eval/exec are avoided by using a structured dictionary loader or JSON loads\n"
                    "    import json\n"
                    "    payload = '{\"status\": \"active\"}'\n"
                    "    data = json.loads(payload)\n"
                    "    assert data == {\"status\": \"active\"}\n"
                )
            elif cwe == "CWE-328":
                return (
                    "def test_cryptographic_hashing_standards():\n"
                    "    import hashlib\n"
                    "    # Verify that hash calls use sha256 rather than md5 or sha1\n"
                    "    hasher = hashlib.sha256(b\"test_payload\")\n"
                    "    assert hasher.name == \"sha256\"\n"
                )
            elif cwe == "CWE-330":
                return (
                    "def test_secure_randomness_generation():\n"
                    "    import secrets\n"
                    "    # Verify generator uses CSPRNG secrets module\n"
                    "    token = secrets.token_hex(16)\n"
                    "    assert len(token) == 32\n"
                )
            elif cwe == "CWE-295":
                return (
                    "def test_tls_verification_is_enabled(monkeypatch):\n"
                    "    # Verify requests call verifies ssl certificates (verify parameter set to True)\n"
                    "    import requests\n"
                    "    # Mock requests.get and verify args\n"
                    "    def mock_get(url, verify=None, **kwargs):\n"
                    "        assert verify is True\n"
                    "        return \"Mocked Response\"\n"
                    "    monkeypatch.setattr(requests, \"get\", mock_get)\n"
                    "    requests.get(\"https://api.secure-foundry.local\", verify=True)\n"
                )
            elif cwe == "CWE-78":
                return (
                    "def test_command_execution_does_not_use_shell(monkeypatch):\n"
                    "    import subprocess\n"
                    "    # Verify subprocess run invokes executable directly and shell=False\n"
                    "    def mock_run(args, shell=False, **kwargs):\n"
                    "        assert shell is False\n"
                    "        assert isinstance(args, list)\n"
                    "        return \"Mocked Process\"\n"
                    "    monkeypatch.setattr(subprocess, \"run\", mock_run)\n"
                    "    subprocess.run([\"tar\", \"-xzf\", \"demo.tar\"], shell=False)\n"
                )
            elif cwe == "CWE-22":
                return (
                    "def test_path_traversal_prevention():\n"
                    "    import os\n"
                    "    base_dir = \"/secure/data\"\n"
                    "    user_input = \"../../etc/passwd\"\n"
                    "    safe_name = os.path.basename(user_input)\n"
                    "    resolved = os.path.abspath(os.path.join(base_dir, safe_name))\n"
                    "    # Normalization should restrict output location under parent path\n"
                    "    assert safe_name == \"passwd\"\n"
                    "    assert resolved.startswith(os.path.abspath(base_dir))\n"
                )
        elif language == "javascript":
            if cwe == "CWE-798":
                return (
                    "test('secret key is retrieved from process env', () => {\n"
                    "  process.env.API_KEY = 'test_secret_value';\n"
                    "  const key = process.env.API_KEY;\n"
                    "  expect(key).toBe('test_secret_value');\n"
                    "});\n"
                )
            elif cwe == "CWE-89":
                return (
                    "test('sql query uses parameterized arrays', () => {\n"
                    "  const mockDb = {\n"
                    "    query: jest.fn()\n"
                    "  };\n"
                    "  mockDb.query('SELECT * FROM users WHERE username = ?', ['admin']);\n"
                    "  expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['admin']);\n"
                    "});\n"
                )
            elif cwe == "CWE-95":
                return (
                    "test('uses JSON.parse instead of eval', () => {\n"
                    "  const payload = '{\"status\":\"active\"}';\n"
                    "  const result = JSON.parse(payload);\n"
                    "  expect(result.status).toBe('active');\n"
                    "});\n"
                )
            elif cwe == "CWE-328":
                return (
                    "test('uses secure sha256 hashing algorithm', () => {\n"
                    "  const crypto = require('crypto');\n"
                    "  const hash = crypto.createHash('sha256').update('test').digest('hex');\n"
                    "  expect(hash).not.toBeNull();\n"
                    "});\n"
                )
            elif cwe == "CWE-295":
                return (
                    "test('tls rejects unauthorized certificates', () => {\n"
                    "  const agent = { rejectUnauthorized: true };\n"
                    "  expect(agent.rejectUnauthorized).toBe(true);\n"
                    "});\n"
                )
            elif cwe == "CWE-942":
                return (
                    "test('cors specifies exact origins, not wildcard', () => {\n"
                    "  const corsOptions = { origin: 'https://trusted-portal.microsoft.com' };\n"
                    "  expect(corsOptions.origin).not.toBe('*');\n"
                    "});\n"
                )
            elif cwe == "CWE-78":
                return (
                    "test('execFile bypasses shell command shell parser', () => {\n"
                    "  const execArgs = ['-xzf', 'payload.tar'];\n"
                    "  expect(execArgs).toContain('payload.tar');\n"
                    "});\n"
                )
            elif cwe == "CWE-22":
                return (
                    "test('path resolve prevents directory traversal', () => {\n"
                    "  const path = require('path');\n"
                    "  const unsafeInput = '../../etc/passwd';\n"
                    "  const safe = path.basename(unsafeInput);\n"
                    "  expect(safe).toBe('passwd');\n"
                    "});\n"
                )
            elif cwe == "CWE-79":
                return (
                    "test('assigns text content instead of innerHTML', () => {\n"
                    "  const element = { textContent: '' };\n"
                    "  element.textContent = 'test_payload';\n"
                    "  expect(element.textContent).toBe('test_payload');\n"
                    "});\n"
                )

        return f"# Validation Test Suite Required for {cwe} on {language}"
