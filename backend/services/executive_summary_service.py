import os
import logging
from openai import AzureOpenAI

logger = logging.getLogger("ExecutiveSummaryService")

class ExecutiveSummaryService:
    """
    Service that uses GPT-4.1-mini to generate a Chief Application Security Officer (CASO)
    executive assessment of the code scan, mapping findings to business risk.
    """
    def __init__(self):
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
                logger.warning(f"Failed to initialize Azure OpenAI client for executive summaries: {str(e)}")

    def generate_caso_summary(self, findings: list, posture: dict, filename: str) -> str:
        logger.info("Generating Chief Application Security Officer (CASO) executive board summary...")

        critical = sum(1 for f in findings if f.get("severity", "").upper() == "CRITICAL")
        high = sum(1 for f in findings if f.get("severity", "").upper() == "HIGH")
        medium = sum(1 for f in findings if f.get("severity", "").upper() == "MEDIUM")
        low = sum(1 for f in findings if f.get("severity", "").upper() == "LOW")

        if self.client:
            try:
                findings_details = []
                for f in findings:
                    findings_details.append(f"- {f.get('id')}: {f.get('title')} ({f.get('severity')}) in {f.get('evidence')}")

                findings_list_str = "\n".join(findings_details)

                prompt = (
                    f"Analyze these security findings for the file '{filename}':\n"
                    f"{findings_list_str}\n\n"
                    f"Security Posture Score: {posture.get('security_score')}/100\n"
                    f"Risk Level: {posture.get('risk_level')}\n"
                    f"Business Risk: {posture.get('business_risk')}\n\n"
                    f"Write a Chief Application Security Officer (CASO) assessment summary. "
                    f"It must address: Executive overview, Business impact, Highest risk area, "
                    f"Recommended priority, and Remediation urgency. Maximum length: 150 words."
                )

                response = self.client.chat.completions.create(
                    model=self.deployment,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a Chief Application Security Officer (CASO) reporting to the CTO.\n"
                                "Your summary must be concise, strategic, and highly professional.\n"
                                "Ensure you outline business risk impacts and keep it under 150 words."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=250,
                    temperature=0.3
                )

                summary = response.choices[0].message.content.strip()
                logger.info("Successfully generated CASO summary via Azure OpenAI.")
                return summary

            except Exception as e:
                logger.warning(f"Failed to call Azure OpenAI for executive summary: {str(e)}. Using fallback.")

        # Fallback to high-quality template
        return self._get_fallback_summary(findings, posture, filename)

    def _get_fallback_summary(self, findings: list, posture: dict, filename: str) -> str:
        score = posture.get("security_score", 100)
        risk = posture.get("risk_level", "Low")
        business_risk = posture.get("business_risk", "Low")
        total = len(findings)

        if total == 0:
            return (
                f"Executive Security Assessment: The code module '{filename}' has achieved an excellent security posture "
                f"score of 100/100, indicating low overall risk. No security issues matching rule-based policies were detected, "
                f"meeting our standard Microsoft Secure Coding guidelines. Continuous monitoring in subsequent builds is recommended."
            )

        # Describe the highest risk finding
        critical_count = sum(1 for f in findings if f.get("severity", "").upper() == "CRITICAL")
        high_count = sum(1 for f in findings if f.get("severity", "").upper() == "HIGH")
        
        highest_risk_name = "Injection/Authorization vulnerability"
        if critical_count > 0:
            highest_risk_name = next((f.get("title") for f in findings if f.get("severity", "").upper() == "CRITICAL"), "Critical Vulnerabilities")
        elif high_count > 0:
            highest_risk_name = next((f.get("title") for f in findings if f.get("severity", "").upper() == "HIGH"), "High Vulnerabilities")

        return (
            f"Executive Overview: The security scan of '{filename}' identified {total} vulnerabilities, resulting in a "
            f"posture score of {score}/100 ({risk} Risk). Business Impact: Exposure could lead to potential credential leakage, "
            f"data compromise, or unauthorized system execution. Highest Risk Area: {highest_risk_name}. "
            f"Recommended Priority: Remediate Critical/High items immediately. Remediation Urgency: Urgent. "
            f"Apply parameterized database queries and environment secret storage keys to secure the codebase."
        )
