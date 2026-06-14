import React, { useEffect, useState } from 'react';
import { EvaluationReport, EvaluationHistoryEntry } from '../types';
import { apiClient } from '../api/client';
import { 
  Activity, AlertCircle, Play, 
  Database, Code, Award, 
  Sparkles, TrendingUp, Download 
} from 'lucide-react';

export const EvaluationDashboard: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [history, setHistory] = useState<EvaluationHistoryEntry[]>([]);
  const [runnerStatus, setRunnerStatus] = useState<any>({ is_running: false });
  const [runMode, setRunMode] = useState<'offline' | 'live'>('offline');
  const [runLimit, setRunLimit] = useState<number>(20);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const latestReport = await apiClient.getLatestEvaluation();
      const runHistory = await apiClient.getEvaluationHistory();
      setReport(latestReport);
      setHistory(runHistory);
      
      const status = await apiClient.getEvaluationStatus();
      setRunnerStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const status = await apiClient.getEvaluationStatus();
      setRunnerStatus(status);
      if (runnerStatus.is_running && !status.is_running) {
        // Benchmark just completed, reload
        const latestReport = await apiClient.getLatestEvaluation();
        const runHistory = await apiClient.getEvaluationHistory();
        setReport(latestReport);
        setHistory(runHistory);
      }
    } catch (e) {
      // Quiet fail on background polling
    }
  };

  const handleRunEvaluation = async () => {
    setIsTriggering(true);
    setError(null);
    try {
      const res = await apiClient.triggerEvaluationRun(runMode, runLimit);
      if (res.status === 'triggered') {
        setRunnerStatus({
          is_running: true,
          mode: runMode,
          limit: runLimit,
          started_at: res.started_at
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger evaluation benchmark run.');
    } finally {
      setIsTriggering(false);
    }
  };

  // Printable HTML-to-PDF Report Generator Utility
  const handleDownloadPDF = () => {
    if (!report) return;
    
    if (report.dataset_size !== runLimit) {
      const confirmExport = window.confirm(
        `The selected limit (${runLimit} files) is different from the latest benchmark run report (${report.dataset_size} files).\n\n` +
        `Do you want to export the latest run (${report.dataset_size} files) anyway?\n\n` +
        `To get a report for ${runLimit} files, please click "Run Benchmark" first.`
      );
      if (!confirmExport) return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = new Date(report.timestamp).toLocaleString();
    const catRows = report.categories.map(c => `
      <tr>
        <td>${c.category}</td>
        <td>${(c.precision * 100).toFixed(0)}%</td>
        <td>${(c.recall * 100).toFixed(0)}%</td>
        <td>${(c.f1 * 100).toFixed(0)}%</td>
        <td>${(c.coverage * 100).toFixed(0)}%</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
      <head>
        <title>SecureCode evaluation_report_${report.mode}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1F2937;
            line-height: 1.5;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-top: 5px;
          }
          .badge {
            background-color: #EEF2F6;
            color: #1E3A8A;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            border-bottom: 1px solid #F3F4F6;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 15px;
            page-break-after: avoid;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 25px;
          }
          .card {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 16px;
          }
          .card-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #6B7280;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .card-value {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin-top: 4px;
          }
          .card-subtext {
            font-size: 12px;
            color: #9CA3AF;
            margin-top: 2px;
          }
          .summary-box {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            border-radius: 8px;
            padding: 16px;
            font-size: 14px;
            color: #1E40AF;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
            margin-top: 10px;
          }
          th {
            background-color: #F3F4F6;
            border-bottom: 1px solid #E5E7EB;
            padding: 8px;
            font-weight: 600;
            color: #374151;
          }
          td {
            border-bottom: 1px solid #F3F4F6;
            padding: 8px;
            color: #4B5563;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
            font-size: 11px;
            color: #9CA3AF;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SecureCode Multi-Agent Evaluation Report</h1>
            <div class="subtitle">Platform Quality Audit • Run: ${formattedDate}</div>
          </div>
          <span class="badge">${report.mode} mode</span>
        </div>

        <div class="section-title">1. Executive Summary</div>
        <div class="summary-box">
          <strong>CTO Grounded Assessment:</strong><br/>
          ${report.executive_summary}
        </div>

        <div class="section-title">2. Core Classification Quality</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">F1 Score Accuracy</div>
            <div class="card-value">${(report.metrics.f1 * 100).toFixed(0)}%</div>
            <div class="card-subtext">Precision: ${(report.metrics.precision * 100).toFixed(0)}% • Recall: ${(report.metrics.recall * 100).toFixed(0)}%</div>
          </div>
          <div class="card">
            <div class="card-title">Evaluated dataset</div>
            <div class="card-value">${report.dataset_size} files</div>
            <div class="card-subtext">False Positives: ${(report.metrics.false_positive_rate * 100).toFixed(0)}% • Accuracy: ${(report.metrics.accuracy * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div class="section-title">3. RAG & Grounding Quality</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Foundry Grounding Success</div>
            <div class="card-value">${(report.grounding.grounding_success_rate * 100).toFixed(0)}%</div>
            <div class="card-subtext">Citations: ${(report.grounding.citation_coverage * 100).toFixed(0)}% of findings contains sources</div>
          </div>
          <div class="card">
            <div class="card-title">Vector Retrieval metrics</div>
            <div class="card-value">${(report.retrieval.average_similarity * 100).toFixed(0)}%</div>
            <div class="card-subtext">Avg chunks: ${report.retrieval.average_chunks} • Success Rate: ${(report.retrieval.retrieval_success_rate * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div style="page-break-before: always;"></div>

        <div class="section-title">4. Category Breakdown Performance</div>
        <table>
          <thead>
            <tr>
              <th>Vulnerability Category</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Detection Coverage</th>
            </tr>
          </thead>
          <tbody>
            ${catRows}
          </tbody>
        </table>

        <div class="section-title">5. Multi-Agent System Reliability</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Pipeline Completion Rate</div>
            <div class="card-value">${(report.reliability.pipeline_completion_rate * 100).toFixed(1)}%</div>
            <div class="card-subtext">Execution success rate without crashes</div>
          </div>
          <div class="card">
            <div class="card-title">Individual Agent success</div>
            <div class="card-value">${(report.reliability.agent_success_rate * 100).toFixed(1)}%</div>
            <div class="card-subtext">Failure Rate: ${(report.reliability.agent_failure_rate * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div class="footer">
          Generated automatically by SecureCode Evaluation Suite v1.0. 
          Confidential audit report for security board reviewers.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getF1StatusBadge = (f1: number) => {
    if (f1 >= 0.90) return { text: 'PRODUCTION READY', color: 'var(--low)', bg: 'var(--low-bg)', border: 'var(--low-border)' };
    if (f1 >= 0.75) return { text: 'STABLE / DEPLOYABLE', color: 'var(--medium)', bg: 'var(--medium-bg)', border: 'var(--medium-border)' };
    return { text: 'TUNE ENGINE', color: 'var(--critical)', bg: 'var(--critical-bg)', border: 'var(--critical-border)' };
  };

  // Helper to draw the custom interactive SVG Line Chart
  const renderHistoryTrendChart = () => {
    if (history.length === 0) return null;

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Map data points
    const points = history.map((entry, index) => {
      const x = paddingLeft + (index / (history.length - 1 || 1)) * chartWidth;
      const yF1 = paddingTop + (1 - entry.f1) * chartHeight;
      const yPrec = paddingTop + (1 - entry.precision) * chartHeight;
      const yRec = paddingTop + (1 - entry.recall) * chartHeight;
      
      return { x, yF1, yPrec, yRec, date: new Date(entry.timestamp).toLocaleDateString(), entry };
    });

    const f1Line = points.map(p => `${p.x},${p.yF1}`).join(' ');
    const precLine = points.map(p => `${p.x},${p.yPrec}`).join(' ');
    const recLine = points.map(p => `${p.x},${p.yRec}`).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Y Axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
          const y = paddingTop + (1 - val) * chartHeight;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="8" fontWeight="600">
                {`${(val * 100).toFixed(0)}%`}
              </text>
            </g>
          );
        })}

        {/* X Axis ticks */}
        {points.map((p, idx) => (
          <g key={idx}>
            <line x1={p.x} y1={paddingTop} x2={p.x} y2={height - paddingBottom} stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            <text x={p.x} y={height - paddingBottom + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontWeight="600">
              {p.date.split('/')[0] + '/' + p.date.split('/')[1]}
            </text>
          </g>
        ))}

        {/* Precision Line (dashed gray-blue) */}
        <polyline fill="none" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" points={precLine} />
        
        {/* Recall Line (dashed purple) */}
        <polyline fill="none" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" points={recLine} />

        {/* F1 Core Line (solid glow) */}
        <polyline fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" points={f1Line} />

        {/* Nodes and Dots */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.yF1} r="4" fill="var(--primary)" stroke="var(--bg-color)" strokeWidth="1.5" style={{ cursor: 'pointer' }}>
              <title>{`F1: ${(p.entry.f1 * 100).toFixed(1)}%`}</title>
            </circle>
          </g>
        ))}
      </svg>
    );
  };

  const renderGauge = (value: number, title: string, color: string) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value * circumference);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, minWidth: '80px' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
            <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="6" />
            <circle 
              cx="40" 
              cy="40" 
              r={radius} 
              fill="transparent" 
              stroke={color} 
              strokeWidth="6" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '80px', height: '80px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)'
          }}>
            {(value * 100).toFixed(0)}%
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="saas-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="saas-spinner" style={{ margin: '0 auto 1.5rem auto' }} />
        <h3>Loading Evaluation Center...</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Parsing benchmark history files and summarizing grounding quality.
        </p>
      </div>
    );
  }

  const badge = report ? getF1StatusBadge(report.metrics.f1) : null;

  return (
    <div className="evaluation-center" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--primary)' }} />
            <span>Multi-Agent QA Benchmark Center</span>
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Quantitative quality monitoring for detection, retrieval, and grounding.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Mode toggle */}
          <select 
            value={runMode} 
            onChange={(e) => setRunMode(e.target.value as any)}
            disabled={runnerStatus.is_running}
            style={{
              background: 'rgba(11, 15, 25, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="offline">Offline Mode (Fast / Free)</option>
            <option value="live">Live Azure Foundry Mode</option>
          </select>

          {/* Limit choice */}
          <select 
            value={runLimit} 
            onChange={(e) => setRunLimit(parseInt(e.target.value))}
            disabled={runnerStatus.is_running}
            style={{
              background: 'rgba(11, 15, 25, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="10">Limit: 10 files</option>
            <option value="20">Limit: 20 files (Standard)</option>
            <option value="50">Limit: 50 files</option>
            <option value="200">Limit: 200 files (Full)</option>
          </select>

          {/* Trigger button */}
          <button
            onClick={handleRunEvaluation}
            disabled={runnerStatus.is_running || isTriggering}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 750,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Play size={12} fill="currentColor" />
            <span>{runnerStatus.is_running ? 'Benchmark Active...' : 'Run Benchmark'}</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={runnerStatus.is_running || !report}
            className="btn-secondary"
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 750,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: (runnerStatus.is_running || !report) ? 'not-allowed' : 'pointer',
              opacity: (runnerStatus.is_running || !report) ? 0.6 : 1
            }}
          >
            <Download size={12} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {report && report.dataset_size !== runLimit && !runnerStatus.is_running && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.75rem',
          color: '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '-1rem'
        }}>
          <span>⚠️ Selected limit (<strong>{runLimit} files</strong>) differs from the latest generated report (<strong>{report.dataset_size} files</strong>). Click <strong>"Run Benchmark"</strong> to update the figures before exporting.</span>
        </div>
      )}

      {/* Active Run progress status box */}
      {runnerStatus.is_running && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.04)',
          border: '1px solid rgba(99, 102, 241, 0.18)',
          borderRadius: '12px',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="saas-spinner" style={{ width: '16px', height: '16px' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Running active QA Evaluation Benchmark suite...</span>
                  {runnerStatus.total_count > 0 && (
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                      ({runnerStatus.processed_count} / {runnerStatus.total_count} files)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Mode: {runnerStatus.mode?.toUpperCase()} • Limit: {runnerStatus.limit} files • Started at: {new Date(runnerStatus.started_at).toLocaleTimeString()}
                  {runnerStatus.current_file && (
                    <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                      Currently scanning: {runnerStatus.current_file}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.5px' }}>
              ACTIVE RUNNING
            </span>
          </div>

          {/* Progress bar */}
          {runnerStatus.total_count > 0 && (
            <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${(runnerStatus.processed_count / runnerStatus.total_count) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', 
                  borderRadius: '3px',
                  transition: 'width 0.4s ease-out' 
                }} 
              />
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div style={{ display: 'flex', gap: '10px', background: 'var(--critical-bg)', color: 'var(--critical)', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--critical-border)' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main stats layout */}
      {report && (
        <>
          {/* Executive evaluation summary assessment */}
          <div className="saas-card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.03) 0%, rgba(167, 139, 250, 0.03) 100%)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                CTO Evaluation Assessment
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                {report.executive_summary}
              </p>
            </div>
          </div>

          {/* Top KPI Cards section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* Card 1: Leaderboard card */}
            <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Benchmark Suite</span>
                {badge && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                    color: badge.color, backgroundColor: badge.bg, borderColor: badge.border, border: '1px solid'
                  }}>
                    {badge.text}
                  </span>
                )}
              </div>
              <div style={{ margin: '1.5rem 0' }}>
                <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>
                  Benchmark v1.0
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Curated dataset size: <strong style={{ color: 'var(--text-primary)' }}>{report.dataset_size}</strong> test files (50% vuln, 50% safe)
                </p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', color: 'var(--text-secondary)' }}>
                <span>F1-Score: <strong>{(report.metrics.f1 * 100).toFixed(0)}%</strong></span>
                <span>FPR: <strong>{(report.metrics.false_positive_rate * 100).toFixed(0)}%</strong></span>
                <span>Accuracy: <strong>{(report.metrics.accuracy * 100).toFixed(0)}%</strong></span>
              </div>
            </div>

            {/* Card 2: Core Classification gauges */}
            <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Classification accuracy
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flex: 1 }}>
                {renderGauge(report.metrics.precision, 'Precision', 'var(--primary)')}
                {renderGauge(report.metrics.recall, 'Recall', 'var(--secondary)')}
                {renderGauge(report.metrics.f1, 'F1-Score', 'var(--low)')}
              </div>
            </div>

          </div>

          {/* Middle Pane: History Trend + RAG Grounding */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* Trend chart card */}
            <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <span>Benchmark History Trend</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderHistoryTrendChart()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  F1 Score
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', border: '1px dashed rgba(167, 139, 250, 0.7)' }} />
                  Precision
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', border: '1px dashed rgba(129, 140, 248, 0.7)' }} />
                  Recall
                </span>
              </div>
            </div>

            {/* Grounding & Retrieval details */}
            <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-title" style={{ fontSize: '0.9rem', margin: 0 }}>
                <Database size={16} style={{ color: 'var(--low)' }} />
                <span>RAG Retrieval & Grounding Quality</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: 1 }}>
                
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Grounding Success Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(report.grounding.grounding_success_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Findings containing valid citations
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Vector Similarity</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(report.retrieval.average_similarity * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Cosine database query relevance
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Citation Coverage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(report.grounding.citation_coverage * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Findings linking back to sources
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Retrieval Success Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(report.retrieval.retrieval_success_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Queries matching &ge; 1 doc chunk
                  </div>
                </div>

              </div>
            </div>

            {/* AI Remediation Quality */}
            <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-title" style={{ fontSize: '0.9rem', margin: 0 }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                <span>AI Remediation & Fix Quality</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: 1 }}>
                
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fix Success Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {((report.remediation.fix_success_rate ?? report.remediation.remediation_success_rate) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Critic approved secure fixes
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Validation Pass Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {((report.remediation.validation_pass_rate ?? report.remediation.validation_success_rate) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Critic approved validation tests
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Grounding Coverage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {((report.remediation.grounding_coverage ?? report.remediation.citation_success_rate) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Findings with RAG citations
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Average Confidence</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {((report.remediation.average_confidence ?? 0.94) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Average AI confidence score
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Reliability Score card */}
          <div className="saas-card" style={{ padding: '1.5rem' }}>
            <div className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <Activity size={16} style={{ color: 'var(--primary)' }} />
              <span>Multi-Agent System Reliability</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pipeline Completion Rate</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-primary)', margin: '8px 0 2px 0' }}>
                  {(report.reliability.pipeline_completion_rate * 100).toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Runs completing without crash errors</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Individual Agent Success</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--low)', margin: '8px 0 2px 0' }}>
                  {(report.reliability.agent_success_rate * 100).toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Spans finishing as SUCCESS state</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Individual Agent Failure</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--critical)', margin: '8px 0 2px 0' }}>
                  {(report.reliability.agent_failure_rate * 100).toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Spans completing as FAILED state</span>
              </div>
            </div>
          </div>

          {/* Category Performance Breakdown Grid */}
          <div className="saas-card" style={{ padding: '1.5rem' }}>
            <div className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <Code size={16} style={{ color: 'var(--medium)' }} />
              <span>Security Category Performance Breakdown</span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px', fontWeight: 600 }}>CWE Category</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Precision</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Recall</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>F1-Score</th>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Detection Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((c) => (
                    <tr key={c.category} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 750, color: 'var(--text-primary)' }}>{c.category}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>{(c.precision * 100).toFixed(0)}%</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>{(c.recall * 100).toFixed(0)}%</td>
                      <td style={{ padding: '10px 8px', color: 'var(--low)', fontWeight: 700 }}>{(c.f1 * 100).toFixed(0)}%</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${c.coverage * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(c.coverage * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
