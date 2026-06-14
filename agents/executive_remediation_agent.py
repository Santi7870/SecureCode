import os
import json
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent

logger = logging.getLogger("ExecutiveRemediationAgent")

class ExecutiveRemediationAgent(BaseAgent):
    """
    Generates a prioritized, action-oriented Executive Remediation Roadmap.
    Taps GPT-4.1-mini when API keys are available, and falls back to a deterministic rule-based prioritizer.
    """
    def __init__(self):
        super().__init__("ExecutiveRemediationAgent")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "securecode-reasoning")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        self.client = None

        if self.api_key and self.endpoint:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version="2024-02-15-preview"
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Azure OpenAI client for ExecutiveRemediationAgent: {str(e)}")

    def generate_roadmap(self, findings: list, posture: dict) -> list:
        self.log(f"Synthesizing remediation roadmap for {len(findings)} findings...")

        if self.client:
            try:
                findings_details = []
                for f in findings:
                    findings_details.append(f"- {f.get('id')}: {f.get('title')} ({f.get('severity')}) in file {f.get('filepath') or f.get('filename')}")

                findings_list_str = "\n".join(findings_details)

                prompt = (
                    f"Given the following security findings in the project:\n"
                    f"{findings_list_str}\n\n"
                    f"Current Security Score: {posture.get('security_score')}/100\n"
                    f"Risk Level: {posture.get('risk_level')}\n"
                    f"Business Risk: {posture.get('business_risk')}\n\n"
                    f"Generate a prioritized, step-by-step security remediation roadmap for executives. "
                    f"Provide exactly 3 to 5 clear, action-oriented bullet points (each 1 sentence). "
                    f"Format the output strictly as a JSON array of strings, e.g., [\"1. Action item...\", \"2. Action item...\"]."
                )

                response = self.client.chat.completions.create(
                    model=self.deployment,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert Chief Information Security Officer (CISO).\n"
                                "Your task is to build a prioritized remediation roadmap.\n"
                                "Ensure you format your response strictly as a JSON array of strings containing numbered items, and do not include markdown blocks or extra commentary."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=250,
                    temperature=0.2
                )

                content = response.choices[0].message.content.strip()
                # Clean markdown blocks if LLM output contains them
                if content.startswith("```"):
                    content = content.replace("```json", "").replace("```", "").strip()
                
                roadmap = json.loads(content)
                if isinstance(roadmap, list):
                    self.log("Successfully generated CISO Remediation Roadmap via Azure OpenAI.")
                    return roadmap
            except Exception as e:
                logger.warning(f"Failed to call Azure OpenAI for CISO roadmap: {str(e)}. Using fallback.")

        return self._get_fallback_roadmap(findings, posture)

    def _get_fallback_roadmap(self, findings: list, posture: dict) -> list:
        score = posture.get("security_score", 100)
        
        if not findings:
            return [
                "1. Maintain continuous integration security scanning for subsequent code developments.",
                "2. Conduct regular security training sessions on secure coding guidelines for development teams."
            ]

        # Prioritize actions based on categories present
        priorities = []
        cwes = {f.get("cwe") for f in findings}
        has_secrets = any(f.get("is_secret") or f.get("cwe") == "CWE-798" for f in findings)
        
        step = 1
        if has_secrets:
            priorities.append(f"{step}. Remove exposed credentials from repository files immediately and rotate all leaked API keys.")
            step += 1
            
        if "CWE-89" in cwes:
            priorities.append(f"{step}. Fix SQL Injection vulnerabilities by replacing dynamic string concatenations with parameterized queries.")
            step += 1

        if "CWE-78" in cwes:
            priorities.append(f"{step}. Remediate potential command injections by sanitizing process inputs or avoiding shell=True runs.")
            step += 1

        if "CWE-95" in cwes:
            priorities.append(f"{step}. Eliminate unsafe dynamic execution by replacing eval/exec calls with secure data parsing libraries.")
            step += 1

        if "CWE-22" in cwes:
            priorities.append(f"{step}. Restrict path traversal vulnerabilities using robust directory validation and path resolution APIs.")
            step += 1

        if "CWE-295" in cwes:
            priorities.append(f"{step}. Re-enable TLS certificate validation across connection endpoints to prevent interception.")
            step += 1

        if "CWE-942" in cwes:
            priorities.append(f"{step}. Restrict overly permissive CORS rules by replacing wildcard '*' origins with explicit lists of domains.")
            step += 1

        if "CWE-328" in cwes or "CWE-330" in cwes:
            priorities.append(f"{step}. Replace weak hashing (MD5/SHA-1) and predictable random generators with cryptographically secure alternatives.")
            step += 1

        if has_secrets:
            priorities.append(f"{step}. Implement secure environment configuration or a key vault manager (Azure Key Vault, AWS Secrets Manager).")
            step += 1

        # Truncate to max 5 items
        return priorities[:5]
