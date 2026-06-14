import React from 'react';
import { Shield, FileCode, Key, Layers, Compass, CheckCircle2 } from 'lucide-react';

interface RepositorySecurityPostureProps {
  score: number;
  riskLevel: string;
  criticalCount: number;
  secretCount: number;
  dependencyComplexity: string;
  filesScanned: number;
  loc: number;
  groundingRate: number;
}

export const RepositorySecurityPosture: React.FC<RepositorySecurityPostureProps> = ({
  score,
  riskLevel,
  criticalCount,
  secretCount,
  dependencyComplexity,
  filesScanned,
  loc,
  groundingRate
}) => {
  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'var(--critical)';
      case 'HIGH': return 'var(--high)';
      case 'MEDIUM': return 'var(--medium)';
      case 'LOW': return 'var(--low)';
      default: return 'var(--text-secondary)';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'var(--critical-bg)';
      case 'HIGH': return 'var(--high-bg)';
      case 'MEDIUM': return 'var(--medium-bg)';
      case 'LOW': return 'var(--low-bg)';
      default: return 'rgba(255,255,255,0.03)';
    }
  };

  const getRiskBorder = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'var(--critical-border)';
      case 'HIGH': return 'var(--high-border)';
      case 'MEDIUM': return 'var(--medium-border)';
      case 'LOW': return 'var(--low-border)';
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  return (
    <div className="repository-security-posture" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .posture-stat-card {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }
        .posture-stat-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}} />

      {/* Flagship Security Score Card */}
      <div className="posture-stat-card" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-around', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(11,15,25,0.8) 0%, rgba(20,24,38,0.8) 100%)', border: '1px solid var(--primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Repository Security Posture
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.4', marginBottom: '0.75rem' }}>
            AI-powered enterprise review calculating code health, exposed secrets, architecture, and package risk.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Rating:</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: getRiskBg(riskLevel),
              color: getRiskColor(riskLevel),
              border: `1px solid ${getRiskBorder(riskLevel)}`
            }}>
              {riskLevel} RISK
            </span>
          </div>
        </div>

        <div className="score-circle-container" style={{ width: '130px', height: '130px' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <defs>
              <linearGradient id="postureScoreGrad" x1="0" y1="0" x2="130" y2="130" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--primary)" />
                <stop offset="1" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
            <circle
              className="score-circle-bg"
              cx="65"
              cy="65"
              r="55"
              strokeWidth="8"
            />
            <circle
              className="score-circle-val"
              cx="65"
              cy="65"
              r="55"
              strokeWidth="8"
              stroke="url(#postureScoreGrad)"
              strokeDasharray={2 * Math.PI * 55}
              strokeDashoffset={2 * Math.PI * 55 - (score / 100) * (2 * Math.PI * 55)}
              style={{
                transition: 'stroke-dashoffset 0.8s ease-out'
              }}
            />
          </svg>
          <div className="score-circle-text">
            <span className="score-circle-number" style={{ fontSize: '2.25rem' }}>{score}</span>
            <span className="score-circle-max">/ 100 SCORE</span>
          </div>
        </div>
      </div>

      {/* Grid items */}
      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--critical)' }}>
          <Shield size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Critical Findings</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{criticalCount}</div>
        </div>
      </div>

      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(251, 146, 60, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--high)' }}>
          <Key size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Leaked Secrets</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{secretCount}</div>
        </div>
      </div>

      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(129, 140, 248, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Layers size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Dependency Complexity</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dependencyComplexity}</div>
        </div>
      </div>

      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--low)' }}>
          <FileCode size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Files Audited</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {filesScanned} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({loc.toLocaleString()} LOC)</span>
          </div>
        </div>
      </div>

      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(167, 139, 250, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Grounding Success</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{groundingRate}%</div>
        </div>
      </div>

      <div className="posture-stat-card">
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--medium)' }}>
          <Compass size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Repo Complexity</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {loc > 10000 ? 'High Complexity' : loc > 2000 ? 'Moderate Complexity' : 'Low Complexity'}
          </div>
        </div>
      </div>
    </div>
  );
};
