import re
import os

class CodeDetector:
    """
    Deterministic rule-based detectors for Python and JavaScript source code.
    Finds insecure coding patterns using robust regex matching.
    """
    def __init__(self):
        # Compiled patterns for security findings
        
        # 1. Hardcoded Secrets
        self.secret_patterns = [
            # e.g., api_key = "AIzaSy...", api_secret = '...', password = 'abc'
            # Look for typical secret patterns and exclude empty strings or env variables
            (re.compile(r'(?i)(api_key|secret_key|private_key|auth_token|token|db_password|password)\s*=\s*[\'"]([a-zA-Z0-9_\-\.\@\#]{6,})[\'"]'), "Hardcoded Secret", "CRITICAL", "HIGH", "CWE-798")
        ]

        # 2. SQL Injection
        self.sqli_patterns = [
            # Matches any SQL statement constructed with format string or concatenation
            (re.compile(r'(?i)select\s+.*?(?:from|where|join|insert|update|delete).*?(?:\+|\{)'), "SQL Injection through dynamic construction", "HIGH", "HIGH", "CWE-89"),
            (re.compile(r'(?i)\.execute\(\s*[\'"]\s*select\s+.*?(?:\%|\+).*?[\'"]\s*\)'), "SQL Injection through string formatting", "HIGH", "HIGH", "CWE-89"),
            (re.compile(r'(?i)\.query\(\s*[\'"]\s*select\s+.*?(?:\%|\+).*?[\'"]\s*\)'), "SQL Injection through string formatting", "HIGH", "HIGH", "CWE-89")
        ]


        # 3. Unsafe eval/exec
        self.eval_patterns = [
            (re.compile(r'\beval\(\s*[^\)]+\s*\)'), "Unsafe eval usage", "CRITICAL", "HIGH", "CWE-95"),
            (re.compile(r'\bexec\(\s*[^\)]+\s*\)'), "Unsafe exec usage", "CRITICAL", "HIGH", "CWE-95")
        ]

        # 4. Weak hashing
        self.hashing_patterns = [
            (re.compile(r'hashlib\.(md5|sha1)\('), "Weak hashing algorithm (MD5/SHA-1)", "MEDIUM", "HIGH", "CWE-328"),
            (re.compile(r'createHash\(\s*[\'"](md5|sha1)[\'"]\s*\)'), "Weak hashing algorithm (MD5/SHA-1) in JS", "MEDIUM", "HIGH", "CWE-328")
        ]

        # 5. Insecure random usage for tokens
        self.random_patterns = [
            (re.compile(r'\brandom\.(randint|choice|random|randrange|uniform)\('), "Insecure random generator used for security token", "MEDIUM", "MEDIUM", "CWE-330"),
            (re.compile(r'Math\.random\('), "Insecure random generator used for security token in JS", "MEDIUM", "MEDIUM", "CWE-330")
        ]

        # 6. Disabled TLS verification
        self.tls_patterns = [
            (re.compile(r'verify\s*=\s*False'), "Disabled TLS verification", "HIGH", "HIGH", "CWE-295"),
            (re.compile(r'rejectUnauthorized\s*:\s*false'), "Disabled TLS verification in Node.js", "HIGH", "HIGH", "CWE-295")
        ]

        # 7. Overly permissive CORS
        self.cors_patterns = [
            (re.compile(r'Access-Control-Allow-Origin\s*:\s*[\'"]\*[\'"]'), "Overly Permissive CORS (Wildcard)", "MEDIUM", "HIGH", "CWE-942"),
            (re.compile(r'origin\s*:\s*[\'"]\*[\'"]'), "Overly Permissive CORS (Wildcard)", "MEDIUM", "HIGH", "CWE-942"),
            (re.compile(r'cors\(\s*\{\s*origin\s*:\s*[\'"]\*[\'"]\s*\}\s*\)'), "Overly Permissive CORS (Wildcard)", "MEDIUM", "HIGH", "CWE-942"),
            (re.compile(r'allow_origins\s*=\s*\[\s*[\'"]\*[\'"]\s*\]'), "Overly Permissive CORS (Wildcard)", "MEDIUM", "HIGH", "CWE-942")
        ]

        # 8. Command injection patterns
        self.cmd_patterns = [
            (re.compile(r'subprocess\.(Popen|run|call)\(.*shell\s*=\s*True.*\)'), "Command injection through shell execution", "HIGH", "HIGH", "CWE-78"),
            (re.compile(r'child_process\.exec\('), "Potential command injection in JS child_process.exec", "HIGH", "MEDIUM", "CWE-78"),
            (re.compile(r'os\.system\('), "Command injection through system execution", "HIGH", "HIGH", "CWE-78")
        ]

        # 9. Path traversal patterns
        self.path_patterns = [
            (re.compile(r'os\.path\.join\(.*(request|param|user).*input.*\)'), "Potential Path Traversal", "HIGH", "MEDIUM", "CWE-22"),
            (re.compile(r'fs\.readFile\(.*req\.query.*\)'), "Potential Path Traversal in JS file read", "HIGH", "HIGH", "CWE-22"),
            (re.compile(r'os\.path\.join\(.*?filename\)'), "Potential Path Traversal", "HIGH", "MEDIUM", "CWE-22"),
            (re.compile(r'path\.join\(.*?filename\)'), "Potential Path Traversal in JS", "HIGH", "MEDIUM", "CWE-22")
        ]

        # 10. XSS-like unsafe HTML insertion
        self.xss_patterns = [
            (re.compile(r'\.innerHTML\s*=\s*'), "Unsafe HTML insertion via innerHTML", "HIGH", "HIGH", "CWE-79"),
            (re.compile(r'document\.write\('), "Unsafe HTML insertion via document.write", "HIGH", "HIGH", "CWE-79"),
            (re.compile(r'f?[\'"]<.*\{username\}.*>[\'"]'), "Unsafe HTML formatting XSS", "HIGH", "HIGH", "CWE-79")
        ]

    def scan_file(self, filepath: str) -> list:
        """
        Scans a single file, determines language from extension, and returns security findings.
        """
        if not os.path.exists(filepath):
            return []

        _, ext = os.path.splitext(filepath)
        language = "python" if ext == ".py" else "javascript" if ext == ".js" else "unknown"
        
        findings = []

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception as e:
            return []

        for idx, line in enumerate(lines):
            line_num = idx + 1
            stripped_line = line.strip()
            
            # Skip empty lines or pure comments (simplistic check)
            if not stripped_line or stripped_line.startswith("#") or stripped_line.startswith("//"):
                continue

            # Run all checkers
            self._check_and_add(stripped_line, line_num, language, self.secret_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.sqli_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.eval_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.hashing_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.random_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.tls_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.cors_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.cmd_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.path_patterns, findings)
            self._check_and_add(stripped_line, line_num, language, self.xss_patterns, findings)

        # De-duplicate findings based on (title, line_number)
        seen = set()
        unique_findings = []
        finding_counter = 1

        for f in findings:
            key = (f["title"], f["line_number"])
            if key not in seen:
                seen.add(key)
                f["id"] = f"SEC-{finding_counter:03d}"
                unique_findings.append(f)
                finding_counter += 1

        return unique_findings

    def _check_and_add(self, line: str, line_num: int, language: str, patterns: list, findings: list):
        for pattern, title, severity, confidence, cwe in patterns:
            if pattern.search(line):
                current_title = title
                current_cwe = cwe
                current_severity = severity
                current_confidence = confidence
                
                # Language specific overrides: exec() in JavaScript represents child_process command execution
                if language == "javascript" and cwe == "CWE-95" and "exec(" in line:
                    current_title = "Potential command injection in JS child_process.exec"
                    current_cwe = "CWE-78"
                    current_severity = "HIGH"
                    current_confidence = "MEDIUM"
                
                findings.append({
                    "id": "",  # Filled later
                    "title": current_title,
                    "language": language,
                    "severity": current_severity,
                    "confidence": current_confidence,
                    "evidence": line,
                    "line_number": line_num,
                    "cwe": current_cwe,
                    "explanation": self._get_default_explanation(current_cwe),
                    "impact": self._get_default_impact(current_cwe),
                    "recommendation": "",  # Filled by RemediationAgent
                    "validation_tests": ""  # Filled by ValidationAgent
                })

    def _get_default_explanation(self, cwe: str) -> str:
        explanations = {
            "CWE-798": "The codebase contains a sensitive key, password, or token stored as a string literal. Hardcoding secrets makes them vulnerable to exposure through repository leaks or unauthorized source access.",
            "CWE-89": "User inputs or dynamic string concatenation are directly embedded into SQL queries. This allows attackers to manipulate the structure of the SQL commands.",
            "CWE-95": "The 'eval' or 'exec' function dynamically parses and executes code from a string. If the input contains user data, it can lead to arbitrary code execution.",
            "CWE-328": "The code uses weak hashing algorithms (like MD5 or SHA-1), which are cryptographically broken and susceptible to collision attacks.",
            "CWE-330": "The code uses standard pseudo-random number generators (PRNG) instead of cryptographically secure pseudo-random number generators (CSPRNG) for token generation, making outputs predictable.",
            "CWE-295": "TLS verification is disabled, bypassing the verification of SSL certificates and allowing Man-in-the-Middle (MitM) attacks.",
            "CWE-942": "The Cross-Origin Resource Sharing (CORS) header is set to '*', allowing any external origin to read sensitive response data.",
            "CWE-78": "Operating system commands are constructed with variables. This enables command injection, letting attackers execute arbitrary commands on the host system.",
            "CWE-22": "Constructing file paths from request parameters allows attackers to use relative path components (e.g. '../') to access arbitrary files on the system.",
            "CWE-79": "The code inserts unescaped values directly into web page elements via innerHTML or document.write, which can result in Cross-Site Scripting (XSS)."
        }
        return explanations.get(cwe, "Insecure coding pattern detected.")

    def _get_default_impact(self, cwe: str) -> str:
        impacts = {
            "CWE-798": "Full compromise of the service, cloud resources, database, or API integrations depending on secret privileges.",
            "CWE-89": "Unauthorized database reading, writing, schema modification, or data exfiltration.",
            "CWE-95": "Complete remote code execution (RCE) on the server, resulting in total host takeover.",
            "CWE-328": "Compromised credential database, forged file hashes, or weak signature validations.",
            "CWE-330": "Attackers can guess active session tokens, CSRF tokens, or password recovery URLs.",
            "CWE-295": "Interception and manipulation of sensitive communications between this server and external APIs.",
            "CWE-942": "Session hijacking or sensitive data reading from client-side browsers.",
            "CWE-78": "Arbitrary command execution on the host machine, leading to potential data destruction or pivoting.",
            "CWE-22": "Information disclosure of system files such as /etc/passwd or config.json.",
            "CWE-79": "Account hijacking, phishing, or redirection of web application users."
        }
        return impacts.get(cwe, "Risk of security exposure or compromise.")
