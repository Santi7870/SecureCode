from agents.base_agent import BaseAgent

class SecurityScoreAgent(BaseAgent):
    """
    Evaluates application security posture based on findings count and severity distribution.
    Computes a normalized security score (0-100), risk level, and business risk.
    """
    def __init__(self):
        super().__init__("SecurityScoreAgent")

    def calculate_posture(self, findings: list) -> dict:
        self.log(f"Evaluating security posture for {len(findings)} findings...")

        critical = sum(1 for f in findings if f.get("severity", "").upper() == "CRITICAL")
        high = sum(1 for f in findings if f.get("severity", "").upper() == "HIGH")
        medium = sum(1 for f in findings if f.get("severity", "").upper() == "MEDIUM")
        low = sum(1 for f in findings if f.get("severity", "").upper() == "LOW")

        # Deduct from 100 based on severity distribution
        score = 100 - (critical * 15 + high * 10 + medium * 5 + low * 2)
        score = max(0, min(100, score))

        # Classify based on the revised enterprise risk scale
        if score >= 90:
            risk_level = "LOW"
            business_risk = "LOW"
        elif score >= 75:
            risk_level = "MEDIUM"
            business_risk = "MEDIUM"
        elif score >= 40:
            risk_level = "HIGH"
            business_risk = "HIGH"
        else:
            risk_level = "CRITICAL"
            business_risk = "CRITICAL"

        posture = {
            "security_score": score,
            "risk_level": risk_level,
            "business_risk": business_risk
        }

        self.log(f"Calculated posture score: {score}/100 ({risk_level} Risk, Business Risk: {business_risk})")
        return posture
