import time
import uuid
import random
import logging
from datetime import datetime
from backend.services.cost_service import CostService
from backend.services.performance_analysis_service import PerformanceAnalysisService

logger = logging.getLogger("TelemetryService")

# =====================================================================
# Exporter Foundations (OpenTelemetry & Azure Monitor preparation)
# =====================================================================
class TelemetryExporter:
    """
    Abstract Base Class for telemetry exporters.
    """
    def export(self, trace_payload: dict):
        raise NotImplementedError("Exporters must implement the export method.")

class ConsoleExporter(TelemetryExporter):
    """
    Default console logger exporter. Prints span details.
    """
    def export(self, trace_payload: dict):
        trace_id = trace_payload.get("trace_id")
        logger.info(f"[TelemetryExporter] Exporting trace {trace_id} to Console:")
        for span in trace_payload.get("spans", []):
            logger.info(
                f"  -> Span: {span['span_id']} | Agent: {span['agent']} | "
                f"Status: {span['status']} | Duration: {span['duration_ms']}ms | Cost: ${span['cost']}"
            )

class AzureMonitorExporter(TelemetryExporter):
    """
    Future implementation for Microsoft Azure Monitor.
    """
    def export(self, trace_payload: dict):
        pass

class ApplicationInsightsExporter(TelemetryExporter):
    """
    Future implementation for Microsoft Azure Application Insights.
    """
    def export(self, trace_payload: dict):
        pass

class OpenTelemetryExporter(TelemetryExporter):
    """
    Future implementation for standard OpenTelemetry collector endpoint.
    """
    def export(self, trace_payload: dict):
        pass


# =====================================================================
# Main Telemetry Tracking Service
# =====================================================================
class TelemetryService:
    """
    OpenTelemetry-inspired Observability and Diagnostics service.
    Tracks trace identifiers, parent/child agent execution spans,
    token distributions, component costs, and retrieval metrics.
    """
    def __init__(self, scan_id: str = None):
        self.scan_id = scan_id or str(uuid.uuid4())
        # Generate unique Trace ID: TRACE-XXXXXX
        self.trace_id = f"TRACE-{uuid.uuid4().hex[:6].upper()}"
        self.started_at = datetime.utcnow().isoformat() + "Z"
        self.completed_at = None
        
        self.spans = []
        self.retrieval_logs = []
        
        # Aggregate stats
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_embedding_tokens = 0
        
        self.exporters = [ConsoleExporter()]

    def register_agent_start(self, agent_name: str) -> str:
        """
        Creates and starts a new span for an agent.
        """
        span_id = f"span_{agent_name.lower()}_{uuid.uuid4().hex[:4]}"
        span = {
            "span_id": span_id,
            "parent_span_id": self.trace_id,
            "agent": agent_name,
            "status": "RUNNING",
            "started_at": datetime.utcnow().isoformat() + "Z",
            "finished_at": None,
            "duration_ms": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "cost": 0.0,
            "confidence": 0,
            "retrieval_chunks": 0,
            "error": None,
            "_start_time": time.time()  # Internal reference
        }
        self.spans.append(span)
        logger.info(f"[{self.trace_id}] Started Span {span_id} for {agent_name}")
        return span_id

    def register_agent_finish(self, agent_name: str, confidence: int = 90, 
                              input_tokens: int = 0, output_tokens: int = 0, 
                              retrieval_chunks: int = 0):
        """
        Marks a running agent span as completed successfully.
        """
        span = self._find_running_span(agent_name)
        if not span:
            return

        end_time = time.time()
        duration_s = end_time - span["_start_time"]
        span["duration_ms"] = int(duration_s * 1000)
        span["finished_at"] = datetime.utcnow().isoformat() + "Z"
        span["status"] = "SUCCESS"
        span["confidence"] = confidence
        span["retrieval_chunks"] = retrieval_chunks
        
        # Calculate tokens and cost
        span["input_tokens"] = input_tokens
        span["output_tokens"] = output_tokens
        
        cost = CostService.calculate_llm_cost(input_tokens, output_tokens)
        span["cost"] = cost
        
        # Accumulate aggregates
        self.total_prompt_tokens += input_tokens
        self.total_completion_tokens += output_tokens
        
        logger.info(
            f"[{self.trace_id}] Finished Span {span['span_id']} for {agent_name} "
            f"({span['duration_ms']}ms) | Cost: ${cost}"
        )

    def register_agent_failure(self, agent_name: str, error_msg: str):
        """
        Marks a running span as failed.
        """
        span = self._find_running_span(agent_name)
        if not span:
            return

        end_time = time.time()
        duration_s = end_time - span["_start_time"]
        span["duration_ms"] = int(duration_s * 1000)
        span["finished_at"] = datetime.utcnow().isoformat() + "Z"
        span["status"] = "FAILED"
        span["error"] = error_msg
        
        logger.error(f"[{self.trace_id}] Failed Span {span['span_id']} for {agent_name}: {error_msg}")

    def register_token_usage(self, prompt: int, completion: int):
        """
        Registers token usage from LLM calls directly.
        """
        self.total_prompt_tokens += prompt
        self.total_completion_tokens += completion

    def register_retrieval_event(self, query: str, chunk_count: int, 
                                 top_similarity: float, avg_similarity: float):
        """
        Logs RAG query execution details.
        """
        log_entry = {
            "query": query,
            "retrieved_chunks": chunk_count,
            "top_similarity": top_similarity,
            "average_similarity": avg_similarity,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        self.retrieval_logs.append(log_entry)
        
        # Calculate query embedding tokens estimate (roughly 1 token per 4 characters)
        query_tokens = len(query) // 4
        self.total_embedding_tokens += query_tokens
        
        logger.info(
            f"[{self.trace_id}] RAG Query: '{query}' | chunks: {chunk_count} | "
            f"top: {top_similarity} | avg: {avg_similarity}"
        )

    def build_execution_summary(self) -> dict:
        """
        Compiles the complete trace database record, including health calculations
        and performance bottleneck detection.
        """
        self.completed_at = datetime.utcnow().isoformat() + "Z"
        
        # 1. Pipeline Health Calculations
        total_agents = len(self.spans)
        successful_agents = sum(1 for s in self.spans if s["status"] == "SUCCESS")
        failed_agents = sum(1 for s in self.spans if s["status"] == "FAILED")
        
        success_rate = int((successful_agents / total_agents) * 100) if total_agents > 0 else 100
        health_status = "HEALTHY" if failed_agents == 0 else "DEGRADED"
        
        total_duration = sum(s.get("duration_ms", 0) for s in self.spans)

        # 2. Performance Bottlenecks Analysis
        bottleneck = PerformanceAnalysisService.analyze_performance(self.spans)

        # 3. Cost Calculations
        gpt_cost = CostService.calculate_llm_cost(self.total_prompt_tokens, self.total_completion_tokens)
        embedding_cost = CostService.calculate_embedding_cost(self.total_embedding_tokens)
        total_cost = round(gpt_cost + embedding_cost, 6)

        # Clean private variables from span lists before exporting
        clean_spans = []
        for s in self.spans:
            s_copy = s.copy()
            if "_start_time" in s_copy:
                del s_copy["_start_time"]
            clean_spans.append(s_copy)

        summary = {
            "trace_id": self.trace_id,
            "scan_id": self.scan_id,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": total_duration,
            
            # Health metrics
            "health": {
                "total_agents": total_agents,
                "healthy_agents": successful_agents,
                "failed_agents": failed_agents,
                "success_rate": success_rate,
                "status": health_status
            },
            
            # Bottleneck detection
            "performance": bottleneck,
            
            # Token distribution
            "tokens": {
                "prompt_tokens": self.total_prompt_tokens,
                "completion_tokens": self.total_completion_tokens,
                "embedding_tokens": self.total_embedding_tokens,
                "total_tokens": self.total_prompt_tokens + self.total_completion_tokens + self.total_embedding_tokens
            },
            
            # Cost distribution
            "costs": {
                "gpt_reasoning": gpt_cost,
                "embeddings": embedding_cost,
                "retrieval": 0.0,
                "total": total_cost
            },
            
            "retrieval": self.retrieval_logs,
            "spans": clean_spans
        }

        # Trigger exporters
        for exp in self.exporters:
            try:
                exp.export(summary)
            except Exception as e:
                logger.error(f"Exporter failed: {str(e)}")

        return summary

    def _find_running_span(self, agent_name: str) -> dict | None:
        for s in reversed(self.spans):
            if s["agent"] == agent_name and s["status"] == "RUNNING":
                return s
        return None
