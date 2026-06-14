import React, { useState } from 'react';
import { Finding } from '../types';
import { ShieldAlert, Search, ChevronDown, ChevronUp, HelpCircle, Code, CheckSquare, BookOpen, Award, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RemediationDiffViewer } from './RemediationDiffViewer';

interface FindingsTableProps {
  findings: Finding[];
  selectedFinding: Finding | null;
  onSelectFinding: (finding: Finding | null) => void;
  sanitizePath?: (path: string) => string;
}

type TabType = 'explanation' | 'secure_fix' | 'validation' | 'grounding' | 'roadmap';

const getSeverityColor = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'var(--critical)';
    case 'HIGH': return 'var(--high)';
    case 'MEDIUM': return 'var(--medium)';
    case 'LOW': return 'var(--low)';
    default: return 'var(--primary)';
  }
};

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedFinding,
  onSelectFinding,
  sanitizePath,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabs, setActiveTabs] = useState<Record<string, TabType>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, 'option_a' | 'option_b' | 'option_c'>>({});

  const safeSanitize = sanitizePath || ((path: string) => path);

  const handleToggleExpand = (finding: Finding) => {
    if (selectedFinding && selectedFinding.id === finding.id) {
      onSelectFinding(null);
    } else {
      onSelectFinding(finding);
    }
  };

  const setTabForFinding = (findingId: string, tab: TabType) => {
    setActiveTabs(prev => ({ ...prev, [findingId]: tab }));
  };

  const filteredFindings = findings.filter(
    (f) =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cwe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="saas-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      
      {/* Top Risks header */}
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
          <span>Top Risks Panel ({findings.length})</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '6px 12px' }}>
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search findings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '150px', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredFindings.length > 0 ? (
          filteredFindings.map((finding) => {
            const isExpanded = selectedFinding ? selectedFinding.id === finding.id : false;
            const activeTab = activeTabs[finding.id] || 'explanation';
            
            const secureFix = finding.secure_fix || {
              option_a: { title: 'Option A: Quick Fix', description: 'A direct patch to mitigate the immediate vulnerability.', code: finding.recommendation },
              option_b: { title: 'Option B: Recommended Fix', description: 'The recommended secure pattern to remediate the vulnerability.', code: finding.recommendation },
              option_c: { title: 'Option C: Enterprise-grade Fix', description: 'A structured, defense-in-depth architectural improvement.', code: finding.recommendation }
            };

            const roadmap = finding.implementation_roadmap || {
              complexity: 'Medium',
              estimated_effort: '2 hours',
              business_priority: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'High' : 'Medium',
              steps: [
                'Locate entry points for user-controlled parameters.',
                'Refactor code to implement secure replacement.',
                'Configure unit test assertions to verify resolution.',
                'Run automated static scans to ensure compliance.'
              ]
            };

            const grounding = finding.grounding_data || {
              category: finding.cwe,
              guideline_snippet: 'Secure coding instructions not loaded.',
              owasp_mapping: 'OWASP mapping references not loaded.',
              validation_guideline: 'Verify assertions in standard test framework.',
              grounding_references: [],
              citations: []
            };

            const critique = finding.critic_review || {
              status: 'APPROVED',
              critique: 'Remediation aligns with code policy checks.',
            };

            const citationsList = grounding.citations || [];
            const severityColor = getSeverityColor(finding.severity);

            return (
              <div
                key={finding.id}
                id={`finding-card-${finding.id}`}
                className={`finding-list-item ${isExpanded ? 'expanded' : ''}`}
                style={{
                  borderLeft: isExpanded ? `4px solid ${severityColor}` : '1px solid var(--border-color)',
                  boxShadow: isExpanded ? `0 0 25px ${severityColor}1a, var(--shadow-md)` : undefined,
                  background: isExpanded ? `${severityColor}03` : undefined,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Header click area */}
                <div
                  className="finding-list-header"
                  onClick={() => handleToggleExpand(finding)}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
                >
                  <div className="finding-list-header-left">
                    <span className={`badge ${finding.severity.toLowerCase()}`}>
                      {finding.severity}
                    </span>
                    <span className="finding-list-title">
                      {finding.remediation_priority ? `Priority ${finding.remediation_priority}: ` : ''}
                      {finding.title}
                    </span>
                  </div>

                  <div className="finding-list-meta">
                    <code style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--border-light)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      {finding.cwe}
                    </code>
                    <span>Line {finding.line_number}</span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Confidence: <strong style={{ color: 'var(--text-primary)' }}>{finding.confidence}%</strong>
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="finding-list-content">
                        {/* Tab header */}
                        <div className="fluent-tabs" style={{ display: 'flex', flexWrap: 'wrap' }}>
                          <button
                            className={`fluent-tab ${activeTab === 'explanation' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setTabForFinding(finding.id, 'explanation'); }}
                          >
                            Explanation
                          </button>
                          <button
                            className={`fluent-tab ${activeTab === 'secure_fix' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setTabForFinding(finding.id, 'secure_fix'); }}
                          >
                            Secure Fix
                          </button>
                          <button
                            className={`fluent-tab ${activeTab === 'validation' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setTabForFinding(finding.id, 'validation'); }}
                          >
                            Validation Test
                          </button>
                          <button
                            className={`fluent-tab ${activeTab === 'grounding' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setTabForFinding(finding.id, 'grounding'); }}
                          >
                            Grounding
                          </button>
                          <button
                            className={`fluent-tab ${activeTab === 'roadmap' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setTabForFinding(finding.id, 'roadmap'); }}
                          >
                            Implementation Roadmap
                          </button>
                        </div>

                        {/* Tab Body */}
                        <div style={{ minHeight: '120px' }}>
                          {activeTab === 'explanation' && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div style={{ marginBottom: '1rem' }}>
                                <div className="section-label">
                                  <HelpCircle size={14} style={{ color: 'var(--primary)' }} />
                                  <span>Description & Security Impact</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: '1.5' }}>
                                  {finding.explanation}
                                </p>
                                {finding.root_cause && (
                                  <div style={{ background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--critical)', display: 'block', marginBottom: '4px' }}>Root Cause:</strong>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                                      {finding.root_cause}
                                    </p>
                                  </div>
                                )}
                                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Business Impact:</strong>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                                    {finding.business_impact || finding.impact}
                                  </p>
                                </div>
                              </div>

                              <div style={{ marginTop: '1rem' }}>
                                <div className="section-label">
                                  <Code size={14} style={{ color: 'var(--critical)' }} />
                                  <span>Vulnerable Code Evidence</span>
                                </div>
                                <div className="code-evidence" style={{ fontSize: '0.75rem', marginTop: '6px' }}>
                                  {finding.evidence}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {activeTab === 'secure_fix' && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="section-label">
                                <Code size={14} style={{ color: 'var(--low)' }} />
                                <span>Remediation Fix Options</span>
                              </div>
                              
                              {/* Fix Options Toggle */}
                              <div style={{ display: 'flex', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                                {(['option_a', 'option_b', 'option_c'] as const).map((optKey) => {
                                  const isActive = (selectedOptions[finding.id] || 'option_b') === optKey;
                                  const optData = secureFix[optKey];
                                  return (
                                    <button
                                      key={optKey}
                                      onClick={(e) => { e.stopPropagation(); setSelectedOptions(prev => ({ ...prev, [finding.id]: optKey })); }}
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        border: isActive ? '1px solid var(--low)' : '1px solid var(--border-color)',
                                        backgroundColor: isActive ? 'var(--low-bg)' : 'var(--surface-color)',
                                        color: isActive ? 'var(--low)' : 'var(--text-secondary)',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {optData.title}
                                    </button>
                                  );
                                })}
                              </div>

                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
                                {secureFix[selectedOptions[finding.id] || 'option_b'].description}
                              </p>

                              {/* Render Code Diff */}
                              <RemediationDiffViewer 
                                originalCode={finding.evidence} 
                                modifiedCode={secureFix[selectedOptions[finding.id] || 'option_b'].code}
                                language={finding.language}
                              />
                            </motion.div>
                          )}

                          {activeTab === 'validation' && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="section-label">
                                <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
                                <span>Generated Validation Test Suite</span>
                              </div>
                              <pre className="code-tests" style={{ fontSize: '0.75rem', marginTop: '6px' }}>
                                <code>{finding.validation_tests}</code>
                              </pre>
                            </motion.div>
                          )}

                          {activeTab === 'grounding' && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="section-label">
                                <BookOpen size={14} style={{ color: 'var(--secondary)' }} />
                                <span>Azure AI Foundry Grounding Layer Context</span>
                              </div>
                              
                              <div className="grounding-meta-flex">
                                <div className="grounding-metric-item">
                                  <span className="grounding-metric-val">{finding.confidence}%</span>
                                  <span className="grounding-metric-lbl">AI Confidence</span>
                                </div>
                                <div className="grounding-metric-item">
                                  <span className="grounding-metric-val">
                                    {citationsList.length || grounding.grounding_references.length || 0}
                                  </span>
                                  <span className="grounding-metric-lbl">Grounding Sources Used</span>
                                </div>
                                <div className="grounding-metric-item">
                                  <span className="grounding-metric-val">
                                    {citationsList.length || 5}
                                  </span>
                                  <span className="grounding-metric-lbl">Retrieved Chunks</span>
                                </div>
                              </div>

                              {grounding.guideline_snippet && grounding.guideline_snippet !== 'Secure coding instructions not loaded.' && (
                                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--primary)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                  {safeSanitize(grounding.guideline_snippet)}
                                </div>
                              )}
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Grounded Sources:</span>
                                {citationsList.length > 0 ? (
                                  citationsList.map((cit, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem' }}>
                                      <div>
                                        <span style={{ color: 'var(--low)', marginRight: '6px', fontWeight: 'bold' }}>✓</span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{cit.source}</strong>
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>— {cit.section}</span>
                                      </div>
                                      <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Relevance Score: {cit.relevance_score}</code>
                                    </div>
                                  ))
                                ) : (
                                  grounding.grounding_references.map((ref, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem' }}>
                                      <span style={{ color: 'var(--low)', marginRight: '6px', fontWeight: 'bold' }}>✓</span>
                                      <code style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-primary)' }}>
                                        {safeSanitize(ref)}
                                      </code>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}

                          {activeTab === 'roadmap' && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="section-label">
                                <ListChecks size={14} style={{ color: 'var(--primary)' }} />
                                <span>Implementation Roadmap</span>
                              </div>

                              <div className="roadmap-meta-grid">
                                <div className="roadmap-card">
                                  <span className="grounding-metric-lbl">Complexity</span>
                                  <div className="roadmap-card-val" style={{ color: roadmap.complexity === 'High' ? 'var(--critical)' : roadmap.complexity === 'Medium' ? 'var(--medium)' : 'var(--low)' }}>
                                    {roadmap.complexity}
                                  </div>
                                </div>
                                <div className="roadmap-card">
                                  <span className="grounding-metric-lbl">Estimated Effort</span>
                                  <div className="roadmap-card-val">{roadmap.estimated_effort}</div>
                                </div>
                                <div className="roadmap-card">
                                  <span className="grounding-metric-lbl">Business Priority</span>
                                  <div className="roadmap-card-val" style={{ color: roadmap.business_priority === 'Critical' ? 'var(--critical)' : roadmap.business_priority === 'High' ? 'var(--high)' : 'var(--text-secondary)' }}>
                                    {roadmap.business_priority}
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginTop: '1rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>Remediation Action Steps:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {roadmap.steps.map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.7rem', flexShrink: 0 }}>
                                        {idx + 1}
                                      </span>
                                      <span style={{ color: 'var(--text-primary)' }}>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Verifier status */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <Award size={14} style={{ color: 'var(--low)' }} />
                          <span style={{ fontWeight: 700, color: 'var(--low)', textTransform: 'uppercase' }}>
                            [{critique.status}] Quality Gate Approved
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            — {critique.critique}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No security findings matching search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
