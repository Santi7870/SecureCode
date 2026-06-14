from agents.base_agent import BaseAgent

class RemediationAgent(BaseAgent):
    """
    Generates secure coding remedies and code replacements to mitigate
    identified security risks.
    """
    def __init__(self):
        super().__init__("RemediationAgent")

    def remediate(self, findings: list) -> list:
        self.log(f"Generating remediation recommendations for {len(findings)} findings...")
        
        remediated_findings = []
        for f in findings:
            self.log(f"Generating remedy for {f['id']} ({f['cwe']})")
            
            remedy = self._get_remedy(f["cwe"], f["evidence"], f["language"])
            f_copy = f.copy()
            f_copy["recommendation"] = remedy
            remediated_findings.append(f_copy)
            
            self.log(f"[{f['id']}] Remedy code snippet generated successfully.")

        return remediated_findings

    def _get_remedy(self, cwe: str, evidence: str, language: str) -> str:
        if language == "python":
            if cwe == "CWE-798":
                return (
                    "# Safe Remediation:\n"
                    "import os\n"
                    "# Fetch secret key from environment variables or vault instead of hardcoding\n"
                    "api_key = os.environ.get(\"API_KEY\")"
                )
            elif cwe == "CWE-89":
                return (
                    "# Safe Remediation:\n"
                    "# Use parameterized query parameters to separate SQL instructions from input values\n"
                    "cursor.execute(\"SELECT * FROM users WHERE username = %s\", (username_val,))"
                )
            elif cwe == "CWE-95":
                return (
                    "# Safe Remediation:\n"
                    "import json\n"
                    "# Replace unsafe eval/exec with safe json loading or lookup dictionary\n"
                    "data = json.loads(payload_str)"
                )
            elif cwe == "CWE-328":
                return (
                    "# Safe Remediation:\n"
                    "import hashlib\n"
                    "# Replace weak MD5/SHA1 with secure SHA256\n"
                    "hasher = hashlib.sha256(data_bytes)"
                )
            elif cwe == "CWE-330":
                return (
                    "# Safe Remediation:\n"
                    "import secrets\n"
                    "# Use secrets module (CSPRNG) for password reset or session tokens\n"
                    "secure_token = secrets.token_hex(32)"
                )
            elif cwe == "CWE-295":
                return (
                    "# Safe Remediation:\n"
                    "import requests\n"
                    "# Set verify=True to enable proper SSL certificate validation\n"
                    "response = requests.get(url, verify=True)"
                )
            elif cwe == "CWE-78":
                return (
                    "# Safe Remediation:\n"
                    "import subprocess\n"
                    "# Avoid shell=True. Pass command arguments as a structured array\n"
                    "subprocess.run([\"tar\", \"-xzf\", filename], shell=False)"
                )
            elif cwe == "CWE-22":
                return (
                    "# Safe Remediation:\n"
                    "import os\n"
                    "# Sanitize path using basename and verify containment inside target directory\n"
                    "safe_filename = os.path.basename(user_input_path)\n"
                    "target_path = os.path.join(base_dir, safe_filename)\n"
                    "if not os.path.abspath(target_path).startswith(os.path.abspath(base_dir)):\n"
                    "    raise ValueError(\"Traversal attempt detected\")"
                )
        elif language == "javascript":
            if cwe == "CWE-798":
                return (
                    "// Safe Remediation:\n"
                    "// Fetch secrets from process environment variables\n"
                    "const apiKey = process.env.API_KEY;"
                )
            elif cwe == "CWE-89":
                return (
                    "// Safe Remediation:\n"
                    "// Use parameterized queries with pg/mysql libraries\n"
                    "db.query('SELECT * FROM users WHERE username = ?', [usernameVal]);"
                )
            elif cwe == "CWE-95":
                return (
                    "// Safe Remediation:\n"
                    "// Parse objects safely using JSON.parse\n"
                    "const data = JSON.parse(payloadStr);"
                )
            elif cwe == "CWE-328":
                return (
                    "// Safe Remediation:\n"
                    "const crypto = require('crypto');\n"
                    "// Replace weak MD5/SHA1 with secure sha256\n"
                    "const hash = crypto.createHash('sha256').update(data).digest('hex');"
                )
            elif cwe == "CWE-295":
                return (
                    "// Safe Remediation:\n"
                    "// Ensure TLS agent rejects unauthorized certificates (default behavior)\n"
                    "const agent = new https.Agent({ rejectUnauthorized: true });"
                )
            elif cwe == "CWE-942":
                return (
                    "// Safe Remediation:\n"
                    "// Restrict CORS middleware to verified domains instead of using wildcards\n"
                    "app.use(cors({ origin: 'https://trusted-portal.microsoft.com' }));"
                )
            elif cwe == "CWE-78":
                return (
                    "// Safe Remediation:\n"
                    "const { execFile } = require('child_process');\n"
                    "// Avoid generic exec shells, use execFile with argument arrays\n"
                    "execFile('tar', ['-xzf', filename], (err, stdout, stderr) => { ... });"
                )
            elif cwe == "CWE-22":
                return (
                    "// Safe Remediation:\n"
                    "const path = require('path');\n"
                    "// Sanitize input path and verify against base directories\n"
                    "const safePath = path.basename(req.query.file);\n"
                    "const target = path.join(baseDir, safePath);"
                )
            elif cwe == "CWE-79":
                return (
                    "// Safe Remediation:\n"
                    "// Set text content to escape special symbols, avoiding innerHTML/document.write\n"
                    "element.textContent = userControlledInput;"
                )

        return f"# Remediation Action Required:\n# Review and refactor: {evidence}"
