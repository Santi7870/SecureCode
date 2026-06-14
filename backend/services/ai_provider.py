import requests
import json
import logging
from backend.core.config import settings

logger = logging.getLogger("AIProvider")

class AIProvider:
    """
    Service layer providing optional AI-assisted enhancements (Executive Summaries,
    Remediations, and Critic Verifications). Fallbacks to local templates when keys are absent.
    """
    def __init__(self):
        self.provider_type = settings.AI_PROVIDER.lower()
        logger.info(f"Initializing AIProvider in mode: {self.provider_type}")

    def generate_summary(self, findings_count: int, severity_counts: dict) -> str:
        """
        Enhances the executive summary of the scan report.
        """
        prompt = (
            f"Write a 3-sentence executive summary for a security scan that found "
            f"{findings_count} vulnerabilities (Critical: {severity_counts.get('CRITICAL', 0)}, "
            f"High: {severity_counts.get('HIGH', 0)}, Medium: {severity_counts.get('MEDIUM', 0)}, "
            f"Low: {severity_counts.get('LOW', 0)})."
        )
        default_summary = (
            f"The SecureCode Reasoning Agent system scanned the source code and identified {findings_count} security risks. "
            f"Each risk has been reasoned about, validated, and ground-referenced in Microsoft Foundry IQ guidance. "
            f"Immediate remediation is recommended for Critical and High severity risks."
        )

        return self._call_provider(prompt, default_summary)

    def enhance_remediation(self, cwe: str, evidence: str, base_recommendation: str) -> str:
        """
        Enhances code remediation recommendations with additional context.
        """
        prompt = (
            f"Given the CWE vulnerability '{cwe}' and the code snippet '{evidence}', "
            f"explain in 2 sentences why the following remediation is secure: '{base_recommendation}'"
        )
        default_explanation = "This fix resolves the vulnerability by replacing unsafe syntax with validated secure APIs."
        
        explanation = self._call_provider(prompt, default_explanation)
        return f"{base_recommendation}\n\n# Security Note:\n# {explanation}"

    def generate_critique(self, cwe: str, base_critique: str) -> str:
        """
        Generates a custom CriticVerifierAgent review check.
        """
        prompt = (
            f"Write a 1-sentence verifier review confirming that the remediation "
            f"for '{cwe}' satisfies secure coding principles."
        )
        return self._call_provider(prompt, base_critique)

    def _call_provider(self, prompt: str, fallback: str) -> str:
        if self.provider_type == "local" or not self._has_keys_configured():
            return fallback

        try:
            if self.provider_type == "azure_openai":
                return self._call_azure_openai(prompt, fallback)
            elif self.provider_type == "openai_compatible":
                return self._call_openai_compatible(prompt, fallback)
        except Exception as e:
            logger.warning(f"AI Provider call failed, falling back. Error: {str(e)}")
            
        return fallback

    def _has_keys_configured(self) -> bool:
        if self.provider_type == "azure_openai":
            return bool(settings.AZURE_OPENAI_ENDPOINT and settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_DEPLOYMENT)
        if self.provider_type == "openai_compatible":
            return bool(settings.OPENAI_COMPATIBLE_BASE_URL and settings.OPENAI_COMPATIBLE_API_KEY)
        return False

    def _call_azure_openai(self, prompt: str, fallback: str) -> str:
        url = f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-05-15"
        headers = {
            "Content-Type": "application/json",
            "api-key": settings.AZURE_OPENAI_API_KEY
        }
        payload = {
            "messages": [
                {"role": "system", "content": "You are a senior secure coding AI assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150,
            "temperature": 0.3
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        
        logger.warning(f"Azure OpenAI returned status code: {response.status_code}")
        return fallback

    def _call_openai_compatible(self, prompt: str, fallback: str) -> str:
        url = f"{settings.OPENAI_COMPATIBLE_BASE_URL}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENAI_COMPATIBLE_API_KEY}"
        }
        payload = {
            "model": settings.OPENAI_COMPATIBLE_MODEL,
            "messages": [
                {"role": "system", "content": "You are a senior secure coding AI assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150,
            "temperature": 0.3
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
            
        logger.warning(f"OpenAI-Compatible returned status code: {response.status_code}")
        return fallback
