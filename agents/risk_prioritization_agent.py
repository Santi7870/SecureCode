from agents.base_agent import BaseAgent

class RiskPrioritizationAgent(BaseAgent):
    """
    Ranks findings by severity and confidence.
    Determines optimal remediation priority order and generates business impact summaries.
    """
    def __init__(self):
        super().__init__("RiskPrioritizationAgent")

    def prioritize(self, findings: list) -> list:
        self.log(f"Prioritizing and ranking {len(findings)} findings...")

        # Severity score mappings for sorting
        severity_values = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1
        }

        # Helper sorting function: primary key is severity score, secondary is confidence value
        def get_sort_key(f):
            sev = f.get("severity", "LOW").upper()
            sev_val = severity_values.get(sev, 1)
            
            # Confidence can be integer or string, normalize to integer
            conf = f.get("confidence", 50)
            try:
                conf_val = int(conf)
            except Exception:
                conf_val = 50
            return (sev_val, conf_val)

        # Sort descending (highest severity and confidence first)
        sorted_findings = sorted(findings, key=get_sort_key, reverse=True)

        # Annotate with remediation priority
        prioritized_list = []
        for index, f in enumerate(sorted_findings):
            f_copy = f.copy()
            f_copy["remediation_priority"] = index + 1
            prioritized_list.append(f_copy)
            self.log(f"Ranked {f.get('id', 'SEC-000')} - {f.get('title', 'Untitled Finding')} as Priority {index + 1}")

        return prioritized_list
