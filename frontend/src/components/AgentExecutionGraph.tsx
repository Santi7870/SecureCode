import React, { useState } from 'react';
import { Span } from '../types';
import { 
  Cpu, ShieldAlert, Database, Zap, Award, 
  Play, CheckCircle2, ArrowRight, FileText, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

interface AgentExecutionGraphProps {
  spans: Span[];
}

interface AgentMeta {
  name: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
}

const AGENT_PIPELINE: AgentMeta[] = [
  { name: 'CodeUnderstandingAgent', label: 'Code Understanding Agent', desc: 'Parses syntax structures and abstracts symbols', icon: Cpu },
  { name: 'SecurityRiskAgent', label: 'Security Risk Agent', desc: 'Executes static security check expressions', icon: ShieldAlert },
  { name: 'ReasoningAgent', label: 'Azure Grounded Reasoning Agent', desc: 'Retrieves security guidelines and validates alerts', icon: Database },
  { name: 'AttackScenarioAgent', label: 'Attack Scenario Agent', desc: 'Synthesizes potential attack vectors and business impact', icon: Zap },
  { name: 'RemediationAgent', label: 'Remediation Synthesis Agent', desc: 'Generates secure, syntax-correct replacements', icon: Award },
  { name: 'ValidationAgent', label: 'Validation Generator Agent', desc: 'Builds target functional unit test scripts', icon: Play },
  { name: 'CriticVerifierAgent', label: 'Critic Verifier Agent', desc: 'Verifies findings quality and reviews fixes', icon: CheckCircle2 },
  { name: 'RiskPrioritizationAgent', label: 'Risk Prioritization Agent', desc: 'Filters and rank-orders code findings', icon: ArrowRight },
  { name: 'SecurityScoreAgent', label: 'Security Posture Engine', desc: 'Computes overall security score and posture', icon: Award },
  { name: 'ReportAgent', label: 'Report Compiler Agent', desc: 'Compiles final Markdown and JSON summaries', icon: FileText }
];

export const AgentExecutionGraph: React.FC<AgentExecutionGraphProps> = ({ spans = [] }) => {
  const [expandedSpan, setExpandedSpan] = useState<string | null>(null);

  // Find active span details in scan execution
  const getSpanForAgent = (agentName: string) => {
    return spans.find(s => s.agent.toLowerCase() === agentName.toLowerCase());
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return 'var(--low)';
      case 'FAILED': return 'var(--critical)';
      case 'RUNNING': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="agent-execution-graph" style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes telemetry-pulse {
          0% {
            r: 8px;
            stroke-opacity: 0.8;
            stroke-width: 1px;
          }
          100% {
            r: 22px;
            stroke-opacity: 0;
            stroke-width: 5px;
          }
        }
        @keyframes telemetry-dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .agent-node-card {
          background: rgba(11, 15, 25, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .agent-node-card:hover {
          border-color: var(--border-hover);
          background: rgba(11, 15, 25, 0.85);
          box-shadow: var(--shadow-sm);
        }
        .agent-node-card.active {
          border-color: var(--primary);
          box-shadow: 0 0 15px rgba(129, 140, 248, 0.15);
        }
      `}} />

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Left Column: SVG vertical connector timeline */}
        <div style={{ width: '60px', flexShrink: 0, position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <svg 
            width="60" 
            height={AGENT_PIPELINE.length * 96} 
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          >
            {/* Background line */}
            <line
              x1="30"
              y1="30"
              x2="30"
              y2={AGENT_PIPELINE.length * 96 - 60}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Animated progress flow line */}
            <line
              x1="30"
              y1="30"
              x2="30"
              y2={AGENT_PIPELINE.length * 96 - 60}
              stroke="url(#lineGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="15 10"
              style={{ animation: 'telemetry-dash 4s linear infinite' }}
            />

            {/* Nodes */}
            {AGENT_PIPELINE.map((agent, idx) => {
              const span = getSpanForAgent(agent.name);
              const cy = idx * 96 + 30;
              const isRunning = span?.status === 'RUNNING';
              const isSuccess = span?.status === 'SUCCESS';
              const isFailed = span?.status === 'FAILED';
              
              let color = 'rgba(255, 255, 255, 0.1)';
              if (isSuccess) color = 'var(--low)';
              else if (isFailed) color = 'var(--critical)';
              else if (isRunning) color = 'var(--primary)';

              return (
                <g key={agent.name}>
                  {/* Pulse ring for running nodes */}
                  {isRunning && (
                    <circle
                      cx="30"
                      cy={cy}
                      r="12"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      style={{ animation: 'telemetry-pulse 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite' }}
                    />
                  )}
                  {/* Inner node circle */}
                  <circle
                    cx="30"
                    cy={cy}
                    r={isRunning ? 8 : 6}
                    fill={color}
                    stroke="var(--bg-color)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                </g>
              );
            })}

            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="50%" stopColor="var(--secondary)" />
                <stop offset="100%" stopColor="var(--low)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right Column: HTML Step Cards */}
        <div style={{ flex: 1, paddingBottom: '2rem' }}>
          {AGENT_PIPELINE.map((agent) => {
            const span = getSpanForAgent(agent.name);
            const isExpanded = expandedSpan === agent.name;
            const Icon = agent.icon;
            
            // Derive fallback state if spans are not fully populated
            const status = span?.status || 'IDLE';
            const duration = span?.duration_ms;
            const cost = span?.cost;
            const confidence = span?.confidence;
            
            return (
              <div 
                key={agent.name}
                className={`agent-node-card ${status === 'RUNNING' ? 'active' : ''}`}
                onClick={() => setExpandedSpan(isExpanded ? null : agent.name)}
                style={{ minHeight: '80px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: getStatusColor(status)
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                        {agent.label}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {agent.desc}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Status badge */}
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: status === 'SUCCESS' ? 'var(--low-bg)' : status === 'FAILED' ? 'var(--critical-bg)' : status === 'RUNNING' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.03)',
                      color: getStatusColor(status),
                      border: `1px solid ${status === 'SUCCESS' ? 'var(--low-border)' : status === 'FAILED' ? 'var(--critical-border)' : status === 'RUNNING' ? 'rgba(129, 140, 248, 0.25)' : 'rgba(255,255,255,0.05)'}`,
                      letterSpacing: '0.5px'
                    }}>
                      {status}
                    </span>

                    {/* Quick stats */}
                    {status === 'SUCCESS' && duration !== undefined && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`}
                      </span>
                    )}

                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {/* Expanded Trace Details */}
                {isExpanded && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }} onClick={(e) => e.stopPropagation()}>
                    {span ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Span Identifier</div>
                          <div 
                            style={{ 
                              fontFamily: 'var(--font-mono)', 
                              color: 'var(--text-primary)', 
                              marginTop: '2px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                            title={span.span_id}
                          >
                            {span.span_id}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Confidence Rating</div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 700 }}>{confidence}%</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Cost Generated</div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 700 }}>${cost?.toFixed(6) || '0.000000'}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>Token Load</div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                            {span.input_tokens} <span style={{ color: 'var(--text-muted)' }}>in</span> / {span.output_tokens} <span style={{ color: 'var(--text-muted)' }}>out</span>
                          </div>
                        </div>
                        {span.retrieval_chunks > 0 && (
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>RAG Chunks Fetched</div>
                            <div style={{ color: 'var(--low)', marginTop: '2px', fontWeight: 700 }}>{span.retrieval_chunks} chunks</div>
                          </div>
                        )}
                        {span.error && (
                          <div style={{ gridColumn: '1 / -1', background: 'var(--critical-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--critical-border)', color: 'var(--critical)' }}>
                            <strong>Failure Rationale:</strong> {span.error}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        This agent has not started or was bypassed during analysis.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
