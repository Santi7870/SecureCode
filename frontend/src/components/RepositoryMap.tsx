import React, { useState, useEffect } from 'react';
import { Play, Cpu, Database, Server, GitPullRequest, Settings, Terminal, X } from 'lucide-react';
import { Finding } from '../types';

interface RepositoryMapProps {
  frameworks: string[];
  findings: Finding[];
  repoName: string;
  onSelectFinding?: (finding: Finding) => void;
  selectedFinding?: Finding | null;
}

interface NodeItem {
  id: string;
  label: string;
  layer: 'cicd' | 'frontend' | 'backend' | 'infra' | 'data';
  icon: React.ComponentType<any>;
  x: number;
  y: number;
  active: boolean;
  maxSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

export const RepositoryMap: React.FC<RepositoryMapProps> = ({ 
  frameworks = [], 
  findings = [], 
  repoName,
  onSelectFinding,
  selectedFinding
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Reset selected node when files/findings change
  useEffect(() => {
    setSelectedNodeId(null);
  }, [frameworks, findings]);

  // Determine if a framework node contains vulnerabilities and its maximum severity
  const getSeverityState = (type: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' => {
    let maxSev: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
    const severityWeights = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'NONE': 0 };

    findings.forEach((f) => {
      const path = (f.filepath || f.filename || '').toLowerCase();
      let matched = false;

      if (type === 'React' && (path.endsWith('.jsx') || path.endsWith('.tsx') || path.includes('react'))) matched = true;
      if (type === 'Vue' && (path.endsWith('.vue') || path.includes('vue'))) matched = true;
      if (type === 'Angular' && (path.includes('angular'))) matched = true;
      if (type === 'FastAPI' && (path.includes('fastapi') || path.includes('main.py') || path.includes('app.py'))) matched = true;
      if (type === 'Flask' && (path.includes('flask') || path.includes('app.py'))) matched = true;
      if (type === 'Django' && (path.includes('django') || path.includes('settings.py'))) matched = true;
      if (type === 'Express' && (path.includes('express') || path.includes('index.js') || path.includes('server.js'))) matched = true;
      if (type === 'Node' && (path.includes('package.json') || path.endsWith('.js') || path.endsWith('.ts'))) matched = true;
      if (type === 'Docker' && (path.includes('dockerfile') || path.includes('docker-compose'))) matched = true;
      if (type === 'Terraform' && path.endsWith('.tf')) matched = true;
      if (type === 'GitHub Actions' && path.includes('.github/workflows')) matched = true;

      if (matched) {
        const sev = f.severity?.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        if (severityWeights[sev] > severityWeights[maxSev]) {
          maxSev = sev;
        }
      }
    });

    return maxSev;
  };

  // Resolve findings that belong to a specific node
  const getNodeFindings = (nodeId: string): Finding[] => {
    const nodeWeights = {
      'react': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.endsWith('.jsx') || path.endsWith('.tsx') || path.includes('react');
      },
      'vue': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.endsWith('.vue') || path.includes('vue');
      },
      'angular': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('angular');
      },
      'fastapi': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('fastapi') || path.includes('main.py') || path.includes('app.py');
      },
      'flask': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('flask') || path.includes('app.py');
      },
      'django': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('django') || path.includes('settings.py');
      },
      'express': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('express') || path.includes('index.js') || path.includes('server.js');
      },
      'node': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('package.json') || path.endsWith('.js') || path.endsWith('.ts');
      },
      'database': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        const expl = (f.explanation || '').toLowerCase();
        const cwe = (f.cwe || '');
        return cwe === 'CWE-89' || path.includes('db') || path.includes('database') || path.includes('sql') || expl.includes('sql injection') || expl.includes('database');
      },
      'docker': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('dockerfile') || path.includes('docker-compose');
      },
      'terraform': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.endsWith('.tf');
      },
      'github_actions': (f: Finding) => {
        const path = (f.filepath || f.filename || '').toLowerCase();
        return path.includes('.github/workflows');
      }
    };

    const matcher = nodeWeights[nodeId as keyof typeof nodeWeights];
    if (!matcher) return [];
    return findings.filter(matcher);
  };

  // Define potential architecture nodes
  const allNodes: NodeItem[] = [
    { id: 'github_actions', label: 'GitHub Actions', layer: 'cicd', icon: GitPullRequest, x: 100, y: 150, active: frameworks.includes('GitHub Actions'), maxSeverity: getSeverityState('GitHub Actions') },
    
    { id: 'react', label: 'React', layer: 'frontend', icon: Cpu, x: 260, y: 80, active: frameworks.includes('React'), maxSeverity: getSeverityState('React') },
    { id: 'vue', label: 'Vue.js', layer: 'frontend', icon: Cpu, x: 260, y: 160, active: frameworks.includes('Vue'), maxSeverity: getSeverityState('Vue') },
    { id: 'angular', label: 'Angular', layer: 'frontend', icon: Cpu, x: 260, y: 240, active: frameworks.includes('Angular'), maxSeverity: getSeverityState('Angular') },
    
    { id: 'fastapi', label: 'FastAPI', layer: 'backend', icon: Server, x: 440, y: 60, active: frameworks.includes('FastAPI'), maxSeverity: getSeverityState('FastAPI') },
    { id: 'flask', label: 'Flask', layer: 'backend', icon: Server, x: 440, y: 120, active: frameworks.includes('Flask'), maxSeverity: getSeverityState('Flask') },
    { id: 'django', label: 'Django', layer: 'backend', icon: Server, x: 440, y: 180, active: frameworks.includes('Django'), maxSeverity: getSeverityState('Django') },
    { id: 'express', label: 'Express', layer: 'backend', icon: Server, x: 440, y: 240, active: frameworks.includes('Express'), maxSeverity: getSeverityState('Express') },
    { id: 'node', label: 'Node.js', layer: 'backend', icon: Server, x: 440, y: 300, active: frameworks.includes('Node') && !frameworks.includes('Express'), maxSeverity: getSeverityState('Node') },
    
    { id: 'database', label: 'Database / SQL', layer: 'data', icon: Database, x: 580, y: 180, active: true, maxSeverity: findings.some(f => f.cwe === 'CWE-89') ? 'HIGH' : 'NONE' },
    
    { id: 'docker', label: 'Docker', layer: 'infra', icon: Terminal, x: 720, y: 120, active: frameworks.includes('Docker'), maxSeverity: getSeverityState('Docker') },
    { id: 'terraform', label: 'Terraform', layer: 'infra', icon: Settings, x: 720, y: 220, active: frameworks.includes('Terraform'), maxSeverity: getSeverityState('Terraform') }
  ];

  // Filter out inactive nodes (except Database node which we always keep as default)
  const activeNodes = allNodes.filter(n => n.active);

  // Connect active nodes recursively from layer to layer
  const connections: Array<{ from: NodeItem; to: NodeItem }> = [];
  
  const cicdNodes = activeNodes.filter(n => n.layer === 'cicd');
  const frontendNodes = activeNodes.filter(n => n.layer === 'frontend');
  const backendNodes = activeNodes.filter(n => n.layer === 'backend');
  const dataNodes = activeNodes.filter(n => n.layer === 'data');
  const infraNodes = activeNodes.filter(n => n.layer === 'infra');

  // CI/CD -> Frontend / Backend
  cicdNodes.forEach(c => {
    frontendNodes.forEach(f => connections.push({ from: c, to: f }));
    if (frontendNodes.length === 0) {
      backendNodes.forEach(b => connections.push({ from: c, to: b }));
    }
  });

  // Frontend -> Backend
  frontendNodes.forEach(f => {
    backendNodes.forEach(b => connections.push({ from: f, to: b }));
  });

  // Backend -> Database
  backendNodes.forEach(b => {
    dataNodes.forEach(d => connections.push({ from: b, to: d }));
  });

  // Database / Backend -> Infra
  dataNodes.forEach(d => {
    infraNodes.forEach(i => connections.push({ from: d, to: i }));
  });

  const getGlowColor = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE') => {
    switch (severity) {
      case 'CRITICAL': return 'var(--critical)';
      case 'HIGH': return 'var(--high)';
      case 'MEDIUM': return 'var(--medium)';
      case 'LOW': return 'var(--low)';
      default: return 'var(--primary)';
    }
  };

  const getGlowFilter = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE') => {
    if (severity === 'NONE') return 'none';
    const color = getGlowColor(severity);
    return `drop-shadow(0 0 10px ${color})`;
  };

  // Find the selected node object
  const selectedNode = activeNodes.find(n => n.id === selectedNodeId);

  return (
    <div className="repository-map-card" style={{
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      position: 'relative'
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Play size={16} style={{ color: 'var(--secondary)' }} />
        Discovered Repository Architecture Map
      </h3>
      
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Automatically discovered software model for `{repoName}`. Glowing nodes highlight active security risks. Click any node to open its interactive findings bubble.
      </p>

      <div
        className="repository-map-viewport"
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          overflowX: 'auto',
          overflowY: 'hidden',
          background: 'rgba(3, 7, 18, 0.4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <svg
          className="repository-map-canvas"
          width="820"
          height="360"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="mapConnectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--low)" stopOpacity="0.4" />
            </linearGradient>
            
            <linearGradient id="packetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Draw Connection Links */}
          {connections.map((c, idx) => {
            const pathId = `link-path-${idx}`;
            // Draw a beautiful curved path from node to node
            const dx = c.to.x - c.from.x;
            const controlX1 = c.from.x + dx * 0.4;
            const controlX2 = c.from.x + dx * 0.6;
            const pathD = `M ${c.from.x} ${c.from.y} C ${controlX1} ${c.from.y}, ${controlX2} ${c.to.y}, ${c.to.x} ${c.to.y}`;

            return (
              <g key={pathId}>
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke="url(#mapConnectionGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                
                {/* Animated data packet flowing between frameworks */}
                <circle r="3" fill="url(#packetGrad)">
                  <animateMotion dur="4.5s" repeatCount="indefinite">
                    <mpath href={`#${pathId}`} />
                  </animateMotion>
                </circle>
              </g>
            );
          })}

          {/* Draw Nodes */}
          {activeNodes.map((node) => {
            const Icon = node.icon;
            const color = getGlowColor(node.maxSeverity);
            const isVulnerable = node.maxSeverity !== 'NONE';
            const isSelected = selectedNodeId === node.id;

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                style={{ 
                  cursor: 'pointer', 
                  filter: getGlowFilter(node.maxSeverity),
                  opacity: selectedNodeId && !isSelected ? 0.55 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Outer halo for vulnerable nodes */}
                {isVulnerable && (
                  <circle
                    r={isSelected ? "26" : "24"}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    opacity="0.8"
                    style={{
                      animation: 'pulse 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite'
                    }}
                  />
                )}
                
                {/* Core Node circle */}
                <circle
                  r="18"
                  fill="#0b0f19"
                  stroke={isSelected ? 'var(--primary)' : (isVulnerable ? color : 'var(--border-color)')}
                  strokeWidth={isSelected ? '3' : (isVulnerable ? '2' : '1.5')}
                />

                <g transform="translate(-9, -9)" color={isSelected ? 'var(--primary)' : (isVulnerable ? color : 'var(--text-secondary)')}>
                  <Icon size={18} />
                </g>

                {/* Text Labels */}
                <text
                  textAnchor="middle"
                  y="32"
                  fill={isSelected ? 'var(--primary)' : (isVulnerable ? color : 'var(--text-primary)')}
                  fontSize="9.5"
                  fontWeight="800"
                  fontFamily="var(--font-sans)"
                >
                  {node.label}
                </text>
                
                {/* Subtitle vulnerability tag */}
                {isVulnerable && (
                  <text
                    textAnchor="middle"
                    y="42"
                    fill={color}
                    fontSize="7"
                    fontWeight="800"
                    fontFamily="var(--font-sans)"
                    letterSpacing="0.5px"
                  >
                    {node.maxSeverity} RISK
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Bubble Popover */}
        {selectedNode && (() => {
          const nodeFindings = getNodeFindings(selectedNode.id);
          const Icon = selectedNode.icon;
          
          // Auto position popover relative to the selected node
          const popoverWidth = 330;
          const isRightSide = selectedNode.x > 450;
          const popoverLeft = isRightSide ? (selectedNode.x - popoverWidth - 25) : (selectedNode.x + 25);
          // Keep it bounded inside the scroll height (380px)
          const popoverTop = Math.max(12, Math.min(130, selectedNode.y - 120));
          const glowColor = getGlowColor(selectedNode.maxSeverity);

          return (
            <div style={{
              position: 'absolute',
              left: `${popoverLeft}px`,
              top: `${popoverTop}px`,
              width: `${popoverWidth}px`,
              zIndex: 100,
              background: 'rgba(11, 15, 25, 0.96)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 25px ${glowColor}25`,
              padding: '1.25rem',
              animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
              {/* Popover Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: glowColor
                  }}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{selectedNode.label}</h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {selectedNode.layer} layer
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`badge ${selectedNode.maxSeverity.toLowerCase()}`} style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
                    {selectedNode.maxSeverity === 'NONE' ? 'SECURE' : `${selectedNode.maxSeverity}`}
                  </span>
                  <button 
                    onClick={() => setSelectedNodeId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      borderRadius: '4px'
                    }}
                    title="Close"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Popover Body (Findings List) */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {nodeFindings.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    No vulnerabilities detected in this component.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {nodeFindings.map((finding, index) => {
                      const isSelected = selectedFinding && selectedFinding.id === finding.id;
                      return (
                        <div 
                          key={finding.id || index}
                          onClick={() => {
                            if (onSelectFinding) {
                              onSelectFinding(finding);
                              setTimeout(() => {
                                const el = document.getElementById(`finding-card-${finding.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 180);
                            }
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {finding.cwe || 'CWE'} - {finding.title}
                            </span>
                            <span className={`badge ${finding.severity.toLowerCase()}`} style={{ fontSize: '0.5rem', padding: '1px 4px', flexShrink: 0 }}>
                              {finding.severity}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {finding.filepath || finding.filename || 'unknown'}{finding.line_number ? `:${finding.line_number}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
