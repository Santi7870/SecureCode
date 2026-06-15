import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ScanHistory } from './components/ScanHistory';
import { CodeScanner } from './components/CodeScanner';
import { FileUploader } from './components/FileUploader';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { FindingsTable } from './components/FindingsTable';
import { FindingDetails } from './components/FindingDetails';
import { AgentTrace } from './components/AgentTrace';
import { ReportActions } from './components/ReportActions';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { AgentNetworkBackground } from './components/AgentNetworkBackground';
import { LandingPage } from './components/LandingPage';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { RepositorySecurityPosture } from './components/RepositorySecurityPosture';
import { RepositoryRiskHeatmap } from './components/RepositoryRiskHeatmap';
import { ArchitectureRiskDistribution } from './components/ArchitectureRiskDistribution';
import { RepositoryMap } from './components/RepositoryMap';
import { ZipUploader } from './components/ZipUploader';


import { apiClient } from './api/client';
import { ScanSummary, ScanResponse, Finding } from './types';
import { Shield, Server, AlertCircle, Terminal, Activity, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  // Routing View state
  const [view, setView] = useState<'landing' | 'platform'>('landing');

  // Scanner Core states
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanResponse | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scanTab, setScanTab] = useState<'paste' | 'upload' | 'zip' | 'github'>('paste');
  const [githubUrl, setGithubUrl] = useState('');
  const [resultsTab, setResultsTab] = useState<'findings' | 'telemetry' | 'evaluation'>('findings');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);

  const loaderSteps = [
    'CodeUnderstandingAgent: Parsing code structure and dependencies...',
    'SecurityRiskAgent: Applying rule policies to discover exposures...',
    'ReasoningAgent: Grounding alerts against Foundry IQ guidelines...',
    'RemediationAgent: Compiling secure code replacements...',
    'ValidationAgent: Constructing target unit test suites...',
    'CriticVerifierAgent: Running quality check gates verification...',
    'ReportAgent: Compilation and writing reports...'
  ];

  // Path sanitizer utility to hide absolute Windows paths in frontend display
  const sanitizePath = (path: string): string => {
    if (!path) return '';
    
    // Replace absolute workspace structures with clean relative paths
    let sanitized = path
      .replace(/[a-zA-Z]:\\[^\\]+\\[^\\]+\\[^\\]+\\samples\\(temp_[a-f0-9\-]+|custom_temp_code)\.(py|js)/gi, 'samples/temp_scan.$2')
      .replace(/[a-zA-Z]:\\[^\\]+\\[^\\]+\\[^\\]+\\samples\\(temp_upload_[a-f0-9\-]+)\.(py|js|ts|jsx|tsx)/gi, 'uploaded/demo_scan.$2')
      .replace(/[a-zA-Z]:\\[^\\]+\\[^\\]+\\[^\\]+\\SecureCode-Reasoning-Agent\\(samples|knowledge|reports|backend|frontend)\\([^\s\n\r"'\)]+)/gi, '$1/$2')
      .replace(/[a-zA-Z]:\\[^\\]+\\[^\\]+\\[^\\]+\\SecureCode-Reasoning-Agent\\/gi, '')
      .replace(/C:\\Users\\[^\\]+\\SecureCode-Reasoning-Agent\\/gi, '')
      .replace(/C:\/Users\/[^\/]+\/SecureCode-Reasoning-Agent\//gi, '');
      
    // Replace slash types for uniform web representation
    return sanitized.replace(/\\/g, '/');
  };

  // Fetch health check and recent scan histories on mount
  useEffect(() => {
    async function initData() {
      try {
        const health = await apiClient.getHealth();
        setHealthStatus(health.engine_ready);
      } catch (err) {
        setHealthStatus(false);
      }
      loadHistory();
    }
    initData();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await apiClient.getRecentScans();
      setScans(history);
      if (history.length > 0 && !selectedScanId) {
        handleSelectScan(history[0].scan_id);
      }
    } catch (err) {
      setError('Could not connect to the local FastAPI backend. Please ensure uvicorn is running.');
    }
  };

  const handleSelectScan = async (scanId: string) => {
    setError(null);
    setSelectedScanId(scanId);
    try {
      const detail = await apiClient.getScanDetails(scanId);
      
      // Sanitize fields before feeding state
      const sanitizedFindings = detail.findings.map(f => ({
        ...f,
        evidence: sanitizePath(f.evidence),
        recommendation: sanitizePath(f.recommendation),
        explanation: sanitizePath(f.explanation),
        grounding_data: f.grounding_data ? {
          ...f.grounding_data,
          guideline_snippet: sanitizePath(f.grounding_data.guideline_snippet),
          grounding_references: f.grounding_data.grounding_references.map(ref => sanitizePath(ref))
        } : undefined
      }));

      const sanitizedResponse: ScanResponse = {
        ...detail,
        filename: sanitizePath(detail.filename),
        report_markdown: sanitizePath(detail.report_markdown),
        findings: sanitizedFindings,
        agent_trace: detail.agent_trace.map(t => sanitizePath(t))
      };

      setSelectedScan(sanitizedResponse);
      setSelectedFinding(sanitizedResponse.findings.length > 0 ? sanitizedResponse.findings[0] : null);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scan run details.');
    }
  };

  const runScanWorkflow = async (scanPromise: Promise<ScanResponse>) => {
    setError(null);
    setIsLoading(true);
    setLoadingStep(0);
    
    let apiResponse: ScanResponse | null = null;
    let apiError: any = null;
    
    // Run API call in parallel
    scanPromise.then(
      (res) => {
        apiResponse = res;
      },
      (err) => {
        apiError = err;
      }
    );
    
    // Play through the loading steps dynamically.
    // If the API call completes quickly (cached or fast), we speed up transitions to 250ms per step.
    // Otherwise, we distribute the steps at a pace of 2200ms per step to balance the visual timeline.
    for (let step = 0; step < loaderSteps.length; step++) {
      setLoadingStep(step);
      if (apiResponse || apiError) {
        // Fast-forward remaining steps since the result is ready
        await new Promise((resolve) => setTimeout(resolve, 250));
      } else {
        // Pace step at ~2200ms, checking every 100ms for early completion
        for (let timePassed = 0; timePassed < 22; timePassed++) {
          if (apiResponse || apiError) break;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
    
    // If the API hasn't resolved yet, wait for it
    while (!apiResponse && !apiError) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    setIsLoading(false);
    
    if (apiError) {
      setError(apiError.message || 'An error occurred during code analysis.');
      return;
    }
    
    if (apiResponse) {
      const response: ScanResponse = apiResponse;
      setSelectedScan(response);
      setSelectedScanId(response.scan_id);
      setSelectedFinding(response.findings.length > 0 ? response.findings[0] : null);
      await loadHistory();
    }
  };

  const sanitizeScanResponse = (response: ScanResponse): ScanResponse => {
    const sanitizedFindings = response.findings.map(f => ({
      ...f,
      evidence: sanitizePath(f.evidence),
      recommendation: sanitizePath(f.recommendation),
      explanation: sanitizePath(f.explanation),
      grounding_data: f.grounding_data ? {
        ...f.grounding_data,
        guideline_snippet: sanitizePath(f.grounding_data.guideline_snippet),
        grounding_references: f.grounding_data.grounding_references.map(ref => sanitizePath(ref))
      } : undefined
    }));

    return {
      ...response,
      filename: sanitizePath(response.filename),
      report_markdown: sanitizePath(response.report_markdown),
      findings: sanitizedFindings,
      agent_trace: response.agent_trace.map(t => sanitizePath(t))
    };
  };

  const handleScanCode = async (code: string, filename: string, language: string) => {
    const scanPromise = apiClient.scanCode(code, filename, language).then(sanitizeScanResponse);
    await runScanWorkflow(scanPromise);
  };

  const handleScanFile = async (file: File) => {
    const scanPromise = apiClient.scanFile(file).then(sanitizeScanResponse);
    await runScanWorkflow(scanPromise);
  };

  const handleScanZip = async (file: File) => {
    const scanPromise = apiClient.scanRepository(file).then(sanitizeScanResponse);
    await runScanWorkflow(scanPromise);
  };

  const handleScanGithub = async (url: string) => {
    const scanPromise = apiClient.scanGithub(url).then(sanitizeScanResponse);
    await runScanWorkflow(scanPromise);
  };


  return (
    <div className="app-container">
      {/* Sticky Glassmorphic Header */}
      <Header 
        showBack={view === 'platform'} 
        onBack={() => setView('landing')} 
        isLanding={view === 'landing'}
      />

      {/* Router Content Transitions */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <LandingPage onLaunch={() => setView('platform')} />
          </motion.div>
        ) : (
          <motion.div
            key="platform-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ width: '100%' }}
          >
            {/* ================================================= */}
            {/* WORKSPACE SCANNER CONSOLE */}
            {/* ================================================= */}
            <section className="workspace-container">
              <div className="workspace-inner">
                
                <div className="workspace-title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="btn-secondary"
                      title={sidebarCollapsed ? "Expand Console Panel" : "Collapse Console Panel"}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                      }}
                    >
                      {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <div>
                      <h3 className="workspace-title">Analysis Console</h3>
                      <p className="workspace-subtitle">Coordinate local security agents to audit target code modules</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="header-badge primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={12} />
                      Engine: Azure AI Foundry
                    </span>
                  </div>
                </div>

                <div className={`workspace-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                  
                  {/* Left Column: inputs paste/file + history */}
                  <div className="workspace-left-panel">
                    <div className="saas-card" style={{ padding: '2rem' }}>
                      <div className="tabs-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem' }}>
                        <button
                          className={`tab-btn ${scanTab === 'paste' ? 'active' : ''}`}
                          onClick={() => setScanTab('paste')}
                        >
                          Paste Code
                        </button>
                        <button
                          className={`tab-btn ${scanTab === 'upload' ? 'active' : ''}`}
                          onClick={() => setScanTab('upload')}
                        >
                          Upload File
                        </button>
                        <button
                          className={`tab-btn ${scanTab === 'zip' ? 'active' : ''}`}
                          onClick={() => setScanTab('zip')}
                        >
                          Upload ZIP
                        </button>
                        <button
                          className={`tab-btn ${scanTab === 'github' ? 'active' : ''}`}
                          onClick={() => setScanTab('github')}
                        >
                          GitHub URL
                        </button>
                      </div>

                      {scanTab === 'paste' ? (
                        <CodeScanner onScan={handleScanCode} isLoading={isLoading} />
                      ) : scanTab === 'upload' ? (
                        <FileUploader onUpload={handleScanFile} isLoading={isLoading} />
                      ) : scanTab === 'zip' ? (
                        <ZipUploader onScan={handleScanZip} isLoading={isLoading} />
                      ) : (
                        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Enter GitHub Repository URL:
                          </label>
                          <input
                            type="text"
                            placeholder="https://github.com/user/project"
                            value={githubUrl}
                            disabled={isLoading}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Public repositories work directly. Private repositories can work on your local machine if GitHub is already authenticated there, but usually fail in the deployed app. For private code, use <strong>Upload ZIP</strong>.
                          </div>
                          <button
                            onClick={() => {
                              if (githubUrl.trim()) handleScanGithub(githubUrl.trim());
                            }}
                            disabled={isLoading || !githubUrl.trim()}
                            className="scan-btn"
                            style={{ padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Run Repository Scan
                          </button>
                        </div>
                      )}

                    </div>

                    <ScanHistory
                      scans={scans}
                      selectedScanId={selectedScanId}
                      onSelectScan={handleSelectScan}
                      sanitizePath={sanitizePath}
                    />
                  </div>

                  {/* Right Column: Dynamic Results Area */}
                  <div className="results-area">
                    
                    {/* Error Alerts */}
                    {healthStatus === false && (
                      <div style={{ display: 'flex', gap: '10px', background: 'var(--critical-bg)', color: 'var(--critical)', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--critical-border)' }}>
                        <Server size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>Backend Offline: Connect FastAPI server at http://localhost:8000.</span>
                      </div>
                    )}

                    {error && (
                      <div style={{ display: 'flex', gap: '10px', background: 'var(--critical-bg)', color: 'var(--critical)', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--critical-border)' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Active Loading Animation Playback */}
                    {isLoading ? (
                      <div className="saas-card pipeline-loader">
                        {/* Dynamic GPU routing visualizer */}
                        <div style={{ width: '100%', height: '460px', marginBottom: '1rem' }}>
                          <AgentNetworkBackground 
                            isLoading={isLoading} 
                            loadingStep={loadingStep} 
                            hasScanResult={false}
                          />
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Orchestrating Security Agents...</h3>
                        
                        <div className="pipeline-steps">
                          {loaderSteps.map((step, idx) => {
                            let stepClass = 'pipeline-step';
                            if (idx === loadingStep) stepClass += ' active';
                            else if (idx < loadingStep) stepClass += ' completed';
                            
                            return (
                              <div className={stepClass} key={idx}>
                                <span style={{ display: 'inline-block', width: '20px', fontWeight: 'bold' }}>
                                  {idx < loadingStep ? '✓' : idx === loadingStep ? '●' : '○'}
                                </span>
                                <span style={{ fontSize: '0.8rem' }}>{step}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : selectedScan ? (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                      >
                        {/* Flagship Repository Security Posture Dashboards */}
                        {selectedScan.report_json?.profile && (
                          <>
                            <RepositorySecurityPosture
                              score={selectedScan.security_score}
                              riskLevel={selectedScan.risk_level}
                              criticalCount={selectedScan.critical_count}
                              secretCount={selectedScan.report_json?.findings?.filter((f: any) => f.is_secret).length || selectedScan.findings.filter(f => f.is_secret).length}
                              dependencyComplexity={selectedScan.report_json?.dependencies?.dependency_complexity || 'Low'}
                              filesScanned={selectedScan.report_json?.manifest?.files || 1}
                              loc={selectedScan.report_json?.profile?.loc || 0}
                              groundingRate={100}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                              <div>
                                <RepositoryRiskHeatmap findings={selectedScan.findings} />
                                <ArchitectureRiskDistribution findings={selectedScan.findings} />
                              </div>
                              <RepositoryMap
                                frameworks={selectedScan.report_json?.profile?.frameworks || []}
                                findings={selectedScan.findings}
                                repoName={selectedScan.filename}
                                onSelectFinding={setSelectedFinding}
                                selectedFinding={selectedFinding}
                              />
                            </div>
                          </>
                        )}

                        {/* Score Gauge & Statistics */}
                        <ExecutiveSummary scan={selectedScan} sanitizePath={sanitizePath} />

                        
                        {/* Tab Switcher for Findings vs Telemetry vs Evaluation */}
                        <div className="tabs-header" style={{ marginBottom: '0.5rem', width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <button
                            className={`tab-btn ${resultsTab === 'findings' ? 'active' : ''}`}
                            onClick={() => setResultsTab('findings')}
                          >
                            Findings & Remediation
                          </button>
                          <button
                            className={`tab-btn ${resultsTab === 'telemetry' ? 'active' : ''}`}
                            onClick={() => setResultsTab('telemetry')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Activity size={14} />
                            Telemetry & Observability
                          </button>
                          <button
                            className={`tab-btn ${resultsTab === 'evaluation' ? 'active' : ''}`}
                            onClick={() => setResultsTab('evaluation')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Award size={14} />
                            Evaluation Center
                          </button>
                        </div>

                        {resultsTab === 'findings' ? (
                          <>
                            {/* Download buttons */}
                            <div className="saas-card" style={{ padding: '1.5rem' }}>
                              <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
                                <Terminal size={16} style={{ color: 'var(--primary)' }} />
                                <span>Export Reports</span>
                              </div>
                              <ReportActions scan={selectedScan} />
                            </div>

                            <div id="findings-section">
                              {/* Expandable findings cards */}
                              <FindingsTable
                                findings={selectedScan.findings}
                                selectedFinding={selectedFinding}
                                onSelectFinding={setSelectedFinding}
                                sanitizePath={sanitizePath}
                              />
                            </div>

                            {/* Multi agent progress timeline trace */}
                            <AgentTrace trace={selectedScan.agent_trace} sanitizePath={sanitizePath} />

                            {/* Grounding sources mapping */}
                            <ArchitecturePanel />
                          </>
                        ) : resultsTab === 'telemetry' ? (
                          <TelemetryDashboard scan={selectedScan} />
                        ) : (
                          <EvaluationDashboard />
                        )}

                      </motion.div>
                    ) : (
                      /* Empty state */
                      <div className="saas-card empty-workspace">
                        <Shield size={40} className="empty-workspace-icon" style={{ color: 'var(--primary)' }} />
                        <h3>Console Idle</h3>
                        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          Paste a code block or upload a file on the left to activate the multi-agent orchestration reasoning pipeline.
                        </p>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden placeholder element to prevent import failure for FindingDetails */}
      <div style={{ display: 'none' }}>
        <FindingDetails finding={selectedFinding} sanitizePath={sanitizePath} />
      </div>
    </div>
  );
};
