import React, { useState } from 'react';
import { ScanResponse, TelemetryData } from '../types';
import { AgentExecutionGraph } from './AgentExecutionGraph';
import { TokenUsageChart } from './TokenUsageChart';
import { 
  Activity, ShieldCheck, AlertCircle, Timer, 
  Coins, Database, Code, FileJson, Search, 
  Cpu, Server 
} from 'lucide-react';

interface TelemetryDashboardProps {
  scan: ScanResponse;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ scan }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Extract telemetry data or compile a mock one if empty (fallback)
  const telemetry: TelemetryData | undefined = scan.telemetry;

  if (!telemetry || !telemetry.spans || !telemetry.health) {
    return (
      <div className="saas-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: 'var(--high)', marginBottom: '1rem' }} />
        <h3>No Telemetry Data Found</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          This scan has no recorded OpenTelemetry trace metadata. Run a new analysis to generate active agent telemetry logs.
        </p>
      </div>
    );
  }

  const { health, performance, tokens, costs, spans, retrieval, trace_id, duration_ms } = telemetry;

  // Filter spans based on query
  const filteredSpans = spans.filter(s => 
    s.agent.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.span_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const handleExportTelemetry = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(telemetry, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `telemetry_${trace_id || scan.scan_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="telemetry-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Action Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            <span>Azure AI Foundry Grounding & Telemetry Center</span>
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time diagnostics, performance profiling, and pipeline observability details.
          </p>
        </div>
        <button 
          onClick={handleExportTelemetry}
          className="btn-secondary"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <FileJson size={14} />
          <span>Export Trace JSON</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Trace ID & Duration */}
        <div className="saas-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Trace ID</span>
            <Code size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ margin: '12px 0 6px 0' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {trace_id || 'N/A'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Timer size={12} />
              <span>Duration: {(duration_ms / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pipeline Health */}
        <div className="saas-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Agent Pipeline Health</span>
            {health.status === 'HEALTHY' ? (
              <ShieldCheck size={14} style={{ color: 'var(--low)' }} />
            ) : (
              <AlertCircle size={14} style={{ color: 'var(--critical)' }} />
            )}
          </div>
          <div style={{ margin: '12px 0 6px 0' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: health.status === 'HEALTHY' ? 'var(--low)' : 'var(--critical)' }}>
              {health.status}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {health.healthy_agents} / {health.total_agents} Agents • {health.success_rate}% Success
            </div>
          </div>
        </div>

        {/* Card 3: Execution Cost */}
        <div className="saas-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Run Cost</span>
            <Coins size={14} style={{ color: 'var(--medium)' }} />
          </div>
          <div style={{ margin: '12px 0 6px 0' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCost(costs.total)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              GPT: {formatCost(costs.gpt_reasoning)} • Embed: {formatCost(costs.embeddings)}
            </div>
          </div>
        </div>

        {/* Card 4: Bottleneck Alert */}
        <div className="saas-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Slowest Node</span>
            <Cpu size={14} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ margin: '12px 0 6px 0' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {performance.slowest_agent.replace('Agent', '')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Took {performance.pipeline_percentage}% ({ (performance.duration_ms / 1000).toFixed(2) }s)
            </div>
          </div>
        </div>

      </div>

      {/* Performance Insight Alert box */}
      <div style={{
        background: 'rgba(129, 140, 248, 0.04)',
        border: '1px solid rgba(129, 140, 248, 0.15)',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        fontSize: '0.8rem',
        lineHeight: '1.45'
      }}>
        <Server size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Performance Profiling Insight: </strong>
          <span style={{ color: 'var(--text-secondary)' }}>{performance.pipeline_insight}</span>
        </div>
      </div>

      {/* Main content grid: Flow timeline + Usage Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left pane: Agent execution vertical graph */}
        <div className="saas-card" style={{ padding: '1.5rem' }}>
          <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            <Activity size={16} style={{ color: 'var(--primary)' }} />
            <span>Agent Execution Spans</span>
          </div>
          <AgentExecutionGraph spans={spans} />
        </div>

        {/* Right pane: Token Doughnut & RAG details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Token usage card */}
          <div className="saas-card" style={{ padding: '1.5rem' }}>
            <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              <Cpu size={16} style={{ color: 'var(--secondary)' }} />
              <span>Token Consumption breakdown</span>
            </div>
            <TokenUsageChart 
              promptTokens={tokens.prompt_tokens} 
              completionTokens={tokens.completion_tokens} 
              embeddingTokens={tokens.embedding_tokens} 
            />
          </div>

          {/* RAG Grounding logs */}
          <div className="saas-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
              <Database size={16} style={{ color: 'var(--low)' }} />
              <span>Azure AI Foundry Grounding Logs ({retrieval.length})</span>
            </div>
            {retrieval.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No database grounding events registered for this run.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {retrieval.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 700 }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                        Query: "{item.query}"
                      </span>
                      <span style={{ color: 'var(--low)' }}>Top Sim: {item.top_similarity.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>Fetched: {item.retrieved_chunks} document chunks</span>
                      <span>Avg Sim: {item.average_similarity.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Trace Explorer detailed Spans table */}
      <div className="saas-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="panel-title" style={{ fontSize: '0.95rem', margin: 0 }}>
            <Search size={16} style={{ color: 'var(--primary)' }} />
            <span>Trace Explorer & Spans Details</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search spans..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px', fontWeight: 600 }}>Span ID</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>Agent Node</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>Duration</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>Tokens</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>Cost</th>
                <th style={{ padding: '8px', fontWeight: 600 }}>RAG Chunks</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No matching spans located.
                  </td>
                </tr>
              ) : (
                filteredSpans.map((s) => (
                  <tr key={s.span_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.span_id}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 750, color: 'var(--text-primary)' }}>{s.agent}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        backgroundColor: s.status === 'SUCCESS' ? 'var(--low-bg)' : s.status === 'FAILED' ? 'var(--critical-bg)' : 'rgba(129, 140, 248, 0.1)',
                        color: s.status === 'SUCCESS' ? 'var(--low)' : s.status === 'FAILED' ? 'var(--critical)' : 'var(--primary)',
                        border: `1px solid ${s.status === 'SUCCESS' ? 'var(--low-border)' : s.status === 'FAILED' ? 'var(--critical-border)' : 'rgba(129, 140, 248, 0.2)'}`
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                      {s.duration_ms >= 1000 ? `${(s.duration_ms / 1000).toFixed(2)}s` : `${s.duration_ms}ms`}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                      {s.input_tokens} / {s.output_tokens}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{formatCost(s.cost)}</td>
                    <td style={{ padding: '10px 8px', color: s.retrieval_chunks > 0 ? 'var(--low)' : 'var(--text-muted)' }}>
                      {s.retrieval_chunks > 0 ? `${s.retrieval_chunks} chunks` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
