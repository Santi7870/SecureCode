class PerformanceAnalysisService:
    """
    Analyzes telemetry spans to identify pipeline bottlenecks,
    calculate execution ratios, and generate diagnostic performance insights.
    """
    
    @classmethod
    def analyze_performance(cls, spans: list[dict]) -> dict:
        if not spans:
            return {
                "slowest_agent": "None",
                "duration_ms": 0,
                "pipeline_percentage": 0,
                "pipeline_insight": "No active telemetry spans found to analyze."
            }

        total_duration = sum(s.get("duration_ms", 0) for s in spans)
        
        # Find the span with the maximum duration
        slowest_span = None
        max_duration = -1
        for s in spans:
            dur = s.get("duration_ms", 0)
            if dur > max_duration:
                max_duration = dur
                slowest_span = s

        if not slowest_span or total_duration == 0:
            return {
                "slowest_agent": "None",
                "duration_ms": 0,
                "pipeline_percentage": 0,
                "pipeline_insight": "Telemetry logs are empty or aggregate duration is zero."
            }

        agent_name = slowest_span.get("agent", "UnknownAgent")
        percentage = int((max_duration / total_duration) * 100)

        # Generate action recommendation based on which agent took longest
        if agent_name == "ReasoningAgent":
            insight = (
                f"ReasoningAgent consumed {percentage}% of the total execution time ({max_duration} ms). "
                f"Consider optimizing prompt context sizes or reducing retrieval volumes."
            )
        elif agent_name == "CriticVerifierAgent":
            insight = (
                f"CriticVerifierAgent consumed {percentage}% of total time ({max_duration} ms). "
                f"Optimize the rulesets or verification token validation filters."
            )
        elif agent_name == "RetrieverAgent":
            insight = (
                f"RetrieverAgent consumed {percentage}% of total time ({max_duration} ms). "
                f"Verify hybrid similarity search indexing speeds or database caching."
            )
        else:
            insight = (
                f"{agent_name} was the slowest node, taking {percentage}% of execution time ({max_duration} ms). "
                f"Standard process optimization recommended."
            )

        return {
            "slowest_agent": agent_name,
            "duration_ms": max_duration,
            "pipeline_percentage": percentage,
            "pipeline_insight": insight
        }
