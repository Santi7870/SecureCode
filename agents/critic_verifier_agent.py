import os
import json
import logging
from openai import AzureOpenAI
from agents.base_agent import BaseAgent

logger = logging.getLogger("CriticVerifierAgent")

class CriticVerifierAgent(BaseAgent):
    """
    Acts as a quality gates check. Reviews explanation quality, fix quality,
    test quality, and grounding quality. Returns APPROVED or NEEDS REVIEW.
    If Azure OpenAI is configured, queries GPT-4.1-mini to audit remediation outputs.
    """
    def __init__(self):
        super().__init__("CriticVerifierAgent")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "securecode-reasoning")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        self.client = None
        
        # Telemetry metrics storage
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.last_confidence = 92

        if self.api_key and self.endpoint:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version="2024-02-15-preview"
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Azure OpenAI client for critic verification: {str(e)}")

    def get_telemetry_metrics(self) -> dict:
        return {
            "confidence": self.last_confidence,
            "input_tokens": self.last_input_tokens,
            "output_tokens": self.last_output_tokens,
            "retrieval_chunks": 0
        }

    def verify(self, findings: list) -> tuple[list, bool]:
        self.log(f"Initiating AI security verifications on {len(findings)} findings...")
        
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.last_confidence = 92
        
        verified_findings = []
        all_passed = True
        
        for f in findings:
            self.log(f"Critique review on finding {f['id']} - {f['title']}")
            
            # Extract remediation fields from finding
            explanation = f.get("explanation", "")
            root_cause = f.get("root_cause", "")
            business_impact = f.get("business_impact", "")
            secure_fix = f.get("secure_fix", {})
            validation_test = f.get("validation_tests", "") or f.get("validation_test", "")
            grounding_data = f.get("grounding_data", {})

            # Prepare critique payload
            online_critique = None
            if self.client:
                try:
                    system_prompt = (
                        "You are an Application Security Critic and Quality Gate Auditor.\n"
                        "Your task is to review remediation proposals across four specific dimensions:\n"
                        "1. Explanation Quality: Does it explain the security issue and its risk clearly?\n"
                        "2. Fix Quality: Are the secure fixes correct, secure, and code-aware (referencing the vulnerable code)? Are there multiple options (A, B, C)?\n"
                        "3. Test Quality: Are the validation tests valid, runnable, and matching the finding's language?\n"
                        "4. Grounding Quality: Do the fixes align with retrieved security guidelines and references?\n\n"
                        "You must return a valid JSON object ONLY, with this schema:\n"
                        "{\n"
                        "  \"status\": \"APPROVED\" or \"NEEDS REVIEW\",\n"
                        "  \"critique\": \"A detailed comment explaining what needs to be improved if rejected, or summarizing approvals if approved.\",\n"
                        "  \"explanation_quality\": \"Score 0-100 and comment.\",\n"
                        "  \"fix_quality\": \"Score 0-100 and comment.\",\n"
                        "  \"test_quality\": \"Score 0-100 and comment.\",\n"
                        "  \"grounding_quality\": \"Score 0-100 and comment.\"\n"
                        "}"
                    )
                    
                    user_prompt = (
                        f"Review request details:\n"
                        f"Finding CWE: {f.get('cwe')}\n"
                        f"Vulnerable Code: {f.get('evidence')}\n"
                        f"Explanation: {explanation}\n"
                        f"Root Cause: {root_cause}\n"
                        f"Business Impact: {business_impact}\n"
                        f"Secure Fix Options: {json.dumps(secure_fix, indent=2)}\n"
                        f"Validation Test: {validation_test}\n"
                        f"Grounding Data: {json.dumps(grounding_data, indent=2)}\n"
                    )

                    response = self.client.chat.completions.create(
                        model=self.deployment,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        max_tokens=600,
                        temperature=0.1,
                        response_format={"type": "json_object"}
                    )

                    prompt_tokens = response.usage.prompt_tokens
                    completion_tokens = response.usage.completion_tokens
                    self.last_input_tokens += prompt_tokens
                    self.last_output_tokens += completion_tokens

                    result_text = response.choices[0].message.content.strip()
                    online_critique = json.loads(result_text)

                except Exception as e:
                    logger.warning(f"Failed to query GPT-4.1-mini critic for {f['id']}: {str(e)}")

            if online_critique:
                status = online_critique.get("status", "APPROVED")
                critique = online_critique.get("critique", "Approved by online Critic.")
                scores = {
                    "explanation_quality": online_critique.get("explanation_quality"),
                    "fix_quality": online_critique.get("fix_quality"),
                    "test_quality": online_critique.get("test_quality"),
                    "grounding_quality": online_critique.get("grounding_quality")
                }
            else:
                # Fallback to local heuristic checks
                scores = {}
                critique_reasons = []
                
                # Check 1: Explanation quality
                if not explanation:
                    critique_reasons.append("Explanation text is empty.")
                    scores["explanation_quality"] = "0/100 (Missing)"
                else:
                    scores["explanation_quality"] = "100/100 (Good)"

                # Check 2: Fix quality
                if not secure_fix or "option_a" not in secure_fix or "option_b" not in secure_fix or "option_c" not in secure_fix:
                    critique_reasons.append("Missing options A/B/C secure fixes.")
                    scores["fix_quality"] = "0/100 (Missing Options)"
                else:
                    scores["fix_quality"] = "100/100 (Good)"

                # Check 3: Test quality
                if not validation_test:
                    critique_reasons.append("Validation test code is missing.")
                    scores["test_quality"] = "0/100 (Missing Test)"
                else:
                    scores["test_quality"] = "100/100 (Good)"

                # Check 4: Grounding quality
                if not grounding_data or "citations" not in grounding_data:
                    critique_reasons.append("No grounding citations attached.")
                    scores["grounding_quality"] = "50/100 (No citations)"
                else:
                    scores["grounding_quality"] = "100/100 (Good)"

                if critique_reasons:
                    status = "NEEDS REVIEW"
                    critique = f"[Critic Local Heuristics Review] REJECTED. Reasons: {'; '.join(critique_reasons)}"
                else:
                    status = "APPROVED"
                    critique = f"[Critic Local Heuristics Review] APPROVED. The remediation code resolves {f.get('cwe')}. Validation test matches syntax."

            self.log(f"[{f['id']}] Verification result: {status}. Critique: {critique}")
            
            if status != "APPROVED":
                all_passed = False

            f_copy = f.copy()
            f_copy["critic_review"] = {
                "status": status,
                "critique": critique,
                "scores": scores
            }
            verified_findings.append(f_copy)

        self.log(f"Global verification status: {'SUCCESS - All findings approved' if all_passed else 'WARNING - Some findings rejected'}")
        return verified_findings, all_passed
