import os
import json
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent

logger = logging.getLogger("AttackScenarioAgent")

class AttackScenarioAgent(BaseAgent):
    """
    Generates realistic, educational attack scenarios for findings using GPT-4.1-mini.
    Includes: Attack Path, Exploitation Example, and Business Impact.
    Bans offensive instructions, payloads, and exploits.
    """
    def __init__(self):
        super().__init__("AttackScenarioAgent")
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
                logger.warning(f"Failed to initialize Azure OpenAI client for attack scenarios: {str(e)}")

    def generate_scenario(self, finding: dict) -> dict:
        self.log(f"Generating attack scenario for {finding.get('id', 'SEC-000')} - {finding.get('title', 'Untitled Finding')}")
        
        cwe = finding.get("cwe", "")
        title = finding.get("title", "")
        evidence = finding.get("evidence", "")

        if self.client:
            try:
                prompt = (
                    f"Analyze this security vulnerability:\n"
                    f"CWE: {cwe}\n"
                    f"Vulnerability Title: {title}\n"
                    f"Code Evidence: {evidence}\n\n"
                    f"Provide an educational, high-level attack scenario. Do NOT include exploit payloads, "
                    f"offensive commands, or copy-paste instructions."
                )

                response = self.client.chat.completions.create(
                    model=self.deployment,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a Staff Security Engineer.\n"
                                "Analyze the provided finding and generate an educational attack scenario.\n"
                                "The output MUST be a valid JSON object matching the following structure:\n"
                                "{\n"
                                "  \"attack_path\": \"How an attacker would discover and trace this issue.\",\n"
                                "  \"exploitation_example\": \"A conceptual, educational explanation of how the weakness is triggered. NO exploit instructions, payloads, or offensive guidance.\",\n"
                                "  \"business_impact\": \"The risk to the business if this exploit occurs.\"\n"
                                "}"
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )

                result_text = response.choices[0].message.content.strip()
                parsed = json.loads(result_text)
                self.log(f"Successfully generated attack scenario via Azure OpenAI.")
                return parsed

            except Exception as e:
                logger.warning(f"Failed to call Azure OpenAI for attack scenarios: {str(e)}. Using local template.")

        # Fallback to local templates
        return self._get_fallback_scenario(cwe, title, evidence)

    def _get_fallback_scenario(self, cwe: str, title: str, evidence: str) -> dict:
        scenarios = {
            "CWE-798": {
                "attack_path": "An attacker decompiles the package distribution or parses public repository access histories to scan for hardcoded authentication keys.",
                "exploitation_example": "The attacker copies the literal credential string from the source files and authenticates directly to the target web resource.",
                "business_impact": "Unauthorized access to API databases and user information, causing customer trust loss and compliance penalties."
            },
            "CWE-89": {
                "attack_path": "An attacker inputs raw escape syntax strings into form parameters or request query components that feed database query commands.",
                "exploitation_example": "The attacker appends OR statements or query comments to bypass username and password validation procedures.",
                "business_impact": "Unauthorized access to internal application records, enabling attacker reading, altering, or deleting of critical database data."
            },
            "CWE-95": {
                "attack_path": "An attacker targets inputs that feed dynamic language parsing routines, such as configuration files or payload strings.",
                "exploitation_example": "The attacker inputs python expression strings which are parsed directly by eval(), executing arbitrary backend script directives.",
                "business_risk_impact": "Execution of arbitrary instructions on the server, causing a complete system takeover."
            },
            "CWE-328": {
                "attack_path": "An attacker extracts password hash records or intercepting signature validations that rely on deprecated algorithms.",
                "exploitation_example": "The attacker uses lookup tables or precomputed dictionary attacks to quickly find input text collisions.",
                "business_impact": "Compromised customer passwords and forged data integrity checks, leading to data exposure."
            },
            "CWE-330": {
                "attack_path": "An attacker collects historical lists of tokens generated by the application and analyzes key distributions.",
                "exploitation_example": "The attacker predicts the seed of the standard pseudo-random number generator, allowing them to guess active session identifiers.",
                "business_impact": "Session hijacking, CSRF token bypass, and credential reset parameter prediction."
            },
            "CWE-295": {
                "attack_path": "An attacker positions themselves on the network path between this server and external APIs (e.g., public Wi-Fi or compromised DNS).",
                "exploitation_example": "The attacker intercepts connections and presents a fake certificate, which the server accepts without verifying its trust chain.",
                "business_impact": "Data interception, sensitive credential leakage, and potential injection of malicious API payloads."
            },
            "CWE-942": {
                "attack_path": "An attacker hosts a malicious website and tricks authenticated users of the target application to visit it.",
                "exploitation_example": "The malicious page makes requests to the target API, which accepts the credentials and returns sensitive resources because CORS is set to '*'.",
                "business_impact": "Session hijacking, unauthorized data exfiltration from user sessions, and private record exposure."
            },
            "CWE-78": {
                "attack_path": "An attacker submits command line arguments containing shell operators (e.g. ';', '&', or '|') to application interfaces.",
                "exploitation_example": "The application runs the input variables inside an active shell wrapper, executing appended commands on the operating system.",
                "business_impact": "Remote host command execution, server compromise, and potential pivoting into private network segments."
            },
            "CWE-22": {
                "attack_path": "An attacker modifies path parameters in file download inputs, inserting parent directory relative components.",
                "exploitation_example": "The attacker inputs path sequences like '../../../../etc/passwd' to traverse outside the standard target application folder.",
                "business_impact": "Unauthorized exposure of local server configuration settings, encryption keys, and environment variables."
            },
            "CWE-79": {
                "attack_path": "An attacker inputs malicious javascript payloads into form inputs or request parameters that are rendered in other user page views.",
                "exploitation_example": "The application writes the user input directly into element.innerHTML, executing the attacker script in client browsers.",
                "business_impact": "Account hijacking, cookies extraction, web portal defacement, and credential phishing."
            }
        }

        fallback = scenarios.get(cwe, {
            "attack_path": "An attacker targets the weakness in inputs and API paths that lack boundaries and parsing validation.",
            "exploitation_example": "The attacker manipulates input fields to feed unvalidated commands or parameters to target modules.",
            "business_impact": "Data leak, API endpoint abuse, and compromise of core business transactions."
        })
        
        # Ensure 'business_impact' is mapped correctly
        if "business_risk_impact" in fallback:
            fallback["business_impact"] = fallback.pop("business_risk_impact")
            
        return fallback
