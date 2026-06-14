import os
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent

logger = logging.getLogger("ExecutiveSecurityAgent")

class ExecutiveSecurityAgent(BaseAgent):
    """
    Generates a consolidated Repository Executive Security Assessment.
    Uses GPT-4.1-mini when API keys are available, with a high-quality local rule-based fallback.
    """
    def __init__(self):
        super().__init__("ExecutiveSecurityAgent")
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
                logger.warning(f"Failed to initialize Azure OpenAI client for ExecutiveSecurityAgent: {str(e)}")

    def generate_assessment(self, repo_name: str, manifest: dict, findings: list, posture: dict) -> str:
        self.log(f"Generating Executive Security Assessment for repository '{repo_name}'...")

        files_count = manifest.get("files", 0)
        findings_count = len(findings)
        score = posture.get("security_score", 100)
        risk_level = posture.get("risk_level", "LOW")

        if self.client:
            try:
                findings_details = []
                for f in findings:
                    findings_details.append(f"- {f.get('id')}: {f.get('title')} ({f.get('severity')}) in {f.get('filepath') or f.get('filename')}")

                findings_list_str = "\n".join(findings_details[:15])  # Cap to prevent context bloat

                prompt = (
                    f"Analyze the repository-wide security posture for '{repo_name}':\n"
                    f"Files Indexed: {files_count}\n"
                    f"Total Security Findings: {findings_count}\n"
                    f"Security Score: {score}/100\n"
                    f"Risk Level: {risk_level}\n\n"
                    f"Findings Details:\n{findings_list_str}\n\n"
                    f"Write a 4-sentence Chief Application Security Officer (CASO) executive security assessment. "
                    f"Ensure you address the number of files/findings, key risks (e.g. SQL injection, exposed credentials), "
                    f"overall rating, and urgency of remediation. Max length: 150 words."
                )

                response = self.client.chat.completions.create(
                    model=self.deployment,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a Chief Application Security Officer (CASO) reporting to the CTO.\n"
                                "Write a concise, high-impact executive security summary under 150 words.\n"
                                "Focus on real business risk, developer remediation urgency, and technical vulnerabilities."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=250,
                    temperature=0.3
                )

                summary = response.choices[0].message.content.strip()
                self.log("Successfully generated consolidated Executive Assessment via Azure OpenAI.")
                return summary
            except Exception as e:
                logger.warning(f"Failed to call Azure OpenAI for executive assessment: {str(e)}. Using fallback.")

        return self._get_fallback_assessment(repo_name, files_count, findings, posture)

    def _get_fallback_assessment(self, repo_name: str, files_count: int, findings: list, posture: dict) -> str:
        score = posture.get("security_score", 100)
        risk_level = posture.get("risk_level", "LOW")
        findings_count = len(findings)

        if findings_count == 0:
            return (
                f"Executive Security Assessment: The repository '{repo_name}' contains {files_count} files and "
                f"achieved an outstanding security posture score of {score}/100 ({risk_level} RISK). No code vulnerabilities "
                f"or hardcoded secrets were detected during analysis, representing an excellent risk profile. "
                f"Continuous scanning within CI/CD pipelines is recommended to maintain this posture."
            )

        # Highlight highest risk severity finding
        critical_count = sum(1 for f in findings if f.get("severity", "").upper() == "CRITICAL")
        high_count = sum(1 for f in findings if f.get("severity", "").upper() == "HIGH")

        risk_description = "identified vulnerabilities"
        if critical_count > 0:
            risk_description = "exposed credentials and critical vulnerabilities"
        elif high_count > 0:
            risk_description = "high-severity code vulnerabilities"

        return (
            f"Executive Security Assessment: This repository contains {files_count} files and {findings_count} identified security findings. "
            f"The highest risks include {risk_description} in the application's source modules. "
            f"Overall security posture is rated {risk_level} RISK with a score of {score}/100. "
            f"Immediate remediation is recommended for database security layers and secrets configurations."
        )
