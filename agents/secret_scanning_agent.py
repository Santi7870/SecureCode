import re
import os
from agents.base_agent import BaseAgent

class SecretScanningAgent(BaseAgent):
    """
    Scans files for hardcoded secrets, connection strings, tokens, and credentials.
    Runs before SecurityRiskAgent in the pipeline.
    Tags all findings as CRITICAL severity under CWE-798.
    """
    def __init__(self):
        super().__init__("SecretScanningAgent")
        
        # Compiled patterns for secret detection
        self.secret_rules = [
            # 1. OpenAI API Keys
            (re.compile(r'\bsk-[a-zA-Z0-9]{48}\b|\bsk-proj-[a-zA-Z0-9-]{40,}\b'), "OpenAI API Key", "HIGH"),
            
            # 2. AWS Access Key IDs & Secret Keys
            (re.compile(r'\bAKIA[0-9A-Z]{16}\b'), "AWS Access Key ID", "HIGH"),
            (re.compile(r'(?i)aws_secret_access_key\s*=\s*[\'"]([a-zA-Z0-9/+=]{40})[\'"]'), "AWS Secret Access Key", "HIGH"),
            
            # 3. GitHub Tokens
            (re.compile(r'\bghp_[a-zA-Z0-9]{36}\b|\bgithub_pat_[a-zA-Z0-9_]{82}\b'), "GitHub Personal Access Token", "HIGH"),
            
            # 4. Connection Strings
            (re.compile(r'\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|sqlserver|amqp)://[a-zA-Z0-9_:@.-]+:[a-zA-Z0-9_:@.-]+@[a-zA-Z0-9_:@.-]+/?[a-zA-Z0-9_]*'), "Database Connection String", "HIGH"),
            
            # 5. JWT Secrets
            (re.compile(r'(?i)(jwt_secret|jwt_token_secret|jwt_key)\s*=\s*[\'"]([a-zA-Z0-9_\-]{16,})[\'"]'), "JWT Secret Key", "MEDIUM"),
            
            # 6. Database Passwords
            (re.compile(r"(?i)(db_password|database_password|mysql_password|postgres_password)\s*=\s*['\"]([^'\"]{6,})['\"]"), "Database Password", "HIGH"),
            
            # 7. Azure Storage / OpenAI Keys
            (re.compile(r'(?i)(azure_storage_key|azure_openai_key|azure_api_key)\s*=\s*[\'"]([a-zA-Z0-9+/=]{32,88})[\'"]'), "Azure Service API Key", "HIGH"),

            # 8. Generic credentials
            (re.compile(r'(?i)\b(?:api_key|secret_key|private_key|auth_token|token|password)\s*=\s*[\'"]([a-zA-Z0-9_\-\.\@\#]{10,})[\'"]'), "Hardcoded Credentials", "MEDIUM")
        ]

    def scan_repository_secrets(self, repo_path: str, files_list: list) -> list:
        self.log(f"Starting repository secret scanning across {len(files_list)} indexed files...")
        
        findings = []
        finding_counter = 1

        for file_meta in files_list:
            rel_path = file_meta["path"]
            abs_path = os.path.join(repo_path, rel_path)
            
            if not os.path.exists(abs_path):
                continue

            try:
                with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                continue

            for idx, line in enumerate(lines):
                line_num = idx + 1
                stripped_line = line.strip()
                
                # Skip comments
                if stripped_line.startswith("#") or stripped_line.startswith("//"):
                    continue

                for pattern, secret_type, confidence in self.secret_rules:
                    match = pattern.search(stripped_line)
                    if match:
                        evidence = stripped_line
                        # Mask the match in the log or findings for safety
                        matched_str = match.group(0)
                        masked_str = matched_str[:4] + "*" * (len(matched_str) - 8) + matched_str[-4:] if len(matched_str) > 8 else "****"
                        
                        findings.append({
                            "id": f"SEC-SEC-{finding_counter:03d}",
                            "title": f"Hardcoded {secret_type} Exposure",
                            "language": file_meta["language"],
                            "severity": "CRITICAL",
                            "confidence": confidence,
                            "evidence": evidence.replace(matched_str, f"[MASKED: {masked_str}]"),
                            "line_number": line_num,
                            "cwe": "CWE-798",
                            "explanation": f"A plaintext {secret_type} was identified hardcoded in the source file. Plaintext secrets are highly vulnerable to leakage.",
                            "impact": f"Exposure of this {secret_type} could allow attackers to access external clouds, databases, or API integrations.",
                            "recommendation": "Instantly revoke this credential. Implement environment variable lookups or utilize a secure vault (Azure Key Vault, AWS Secrets Manager, GitHub Secrets).",
                            "validation_tests": f"# Verify that no {secret_type} exists in environment\nassert '{secret_type.upper().replace(' ', '_')}' not in open('{rel_path}').read()",
                            "filepath": rel_path,
                            "is_secret": True,
                            "secret_type": secret_type
                        })
                        finding_counter += 1
                        # Avoid matching multiple rules on the same line if one was already found
                        break

        self.log(f"Secret scan completed. Found {len(findings)} hardcoded secrets.")
        return findings
