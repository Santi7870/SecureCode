from agents.base_agent import BaseAgent
from detectors.rules import CodeDetector

class SecurityRiskAgent(BaseAgent):
    """
    Coordinates with the rule-based Detection Layer to discover potential
    vulnerabilities in the analyzed code files.
    """
    def __init__(self):
        super().__init__("SecurityRiskAgent")
        self.detector = CodeDetector()

    def scan(self, code_metadata: dict) -> list:
        filepath = code_metadata["filepath"]
        self.log(f"Scanning {filepath} for insecure coding patterns...")
        
        findings = self.detector.scan_file(filepath)
        
        self.log(f"Scan complete. Discovered {len(findings)} security vulnerability findings.")
        for idx, f in enumerate(findings):
            self.log(f"[{f['id']}] Found {f['title']} (Severity: {f['severity']}, Line: {f['line_number']})")

        return findings
