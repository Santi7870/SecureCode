export interface Finding {
  id: string;
  title: string;
  language: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // Modified to number type
  evidence: string;
  line_number: number;
  cwe: string;
  explanation: string;
  impact: string;
  recommendation: string;
  validation_tests: string;
  remediation_priority?: number; // Priority index
  is_secret?: boolean;
  filepath?: string;
  filename?: string;
  secret_type?: string;
  attack_scenario?: {
    attack_path: string;
    exploitation_example: string;
    business_impact: string;
  };
  reasoning?: {
    observed_evidence: string;
    security_principle_violated: string;
    potential_impact: string;
    severity_justification: string;
    fix_strategy: string;
  };
  grounding_data?: {
    category: string;
    guideline_snippet: string;
    owasp_mapping: string;
    validation_guideline: string;
    grounding_references: string[];
    citations?: Array<{
      source: string;
      section: string;
      relevance_score: number;
    }>;
  };
  critic_review?: {
    status: string;
    critique: string;
  };
  root_cause?: string;
  business_impact?: string;
  secure_fix?: {
    option_a: { title: string; description: string; code: string };
    option_b: { title: string; description: string; code: string };
    option_c: { title: string; description: string; code: string };
  };
  implementation_roadmap?: {
    complexity: string;
    estimated_effort: string;
    business_priority: string;
    steps: string[];
  };
}

export interface Span {
  span_id: string;
  parent_span_id: string;
  agent: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  started_at: string;
  finished_at: string | null;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  confidence: number;
  retrieval_chunks: number;
  error: string | null;
}

export interface TelemetryData {
  trace_id: string;
  scan_id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number;
  health: {
    total_agents: number;
    healthy_agents: number;
    failed_agents: number;
    success_rate: number;
    status: 'HEALTHY' | 'DEGRADED';
  };
  performance: {
    slowest_agent: string;
    duration_ms: number;
    pipeline_percentage: number;
    pipeline_insight: string;
  };
  tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    embedding_tokens: number;
    total_tokens: number;
  };
  costs: {
    gpt_reasoning: number;
    embeddings: number;
    retrieval: number;
    total: number;
  };
  retrieval: Array<{
    query: string;
    retrieved_chunks: number;
    top_similarity: number;
    average_similarity: number;
    timestamp: string;
  }>;
  spans: Span[];
}

export interface ScanSummary {
  scan_id: string;
  trace_id?: string;
  filename: string;
  language: string;
  created_at: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  
  security_score: number;
  risk_level: string;
  business_risk: string;
  status: string;
}

export interface ScanResponse {
  scan_id: string;
  trace_id?: string;
  filename: string;
  language: string;
  created_at: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  
  security_score: number;
  risk_level: string;
  business_risk: string;
  executive_summary: string;

  status: string;
  findings: Finding[];
  agent_trace: string[];
  report_markdown: string;
  report_json: any;
  telemetry?: TelemetryData;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  engine_ready: boolean;
}

export interface CategoryPerformance {
  category: string;
  precision: number;
  recall: number;
  f1: number;
  coverage: number;
}

export interface EvaluationReport {
  timestamp: string;
  mode: 'offline' | 'live';
  dataset_size: number;
  duration_seconds: number;
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    accuracy: number;
    false_positive_rate: number;
    false_negative_rate: number;
    detection_coverage: number;
  };
  grounding: {
    grounding_success_rate: number;
    citation_coverage: number;
  };
  retrieval: {
    average_similarity: number;
    average_chunks: number;
    retrieval_success_rate: number;
    citation_coverage: number;
  };
  remediation: {
    remediation_success_rate: number;
    validation_success_rate: number;
    citation_success_rate: number;
    fix_success_rate?: number;
    validation_pass_rate?: number;
    grounding_coverage?: number;
    average_confidence?: number;
  };
  reliability: {
    agent_success_rate: number;
    agent_failure_rate: number;
    pipeline_completion_rate: number;
  };
  categories: CategoryPerformance[];
  executive_summary: string;
}

export interface EvaluationHistoryEntry {
  timestamp: string;
  mode: 'offline' | 'live';
  dataset_size: number;
  duration_seconds: number;
  precision: number;
  recall: number;
  f1: number;
  grounding_score: number;
  retrieval_score: number;
  fix_success_rate?: number;
  validation_pass_rate?: number;
  grounding_coverage?: number;
  average_confidence?: number;
}
