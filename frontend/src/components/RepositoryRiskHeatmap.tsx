import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Finding } from '../types';

interface RepositoryRiskHeatmapProps {
  findings: Finding[];
}

interface DirRisk {
  dir: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  secrets: number;
}

export const RepositoryRiskHeatmap: React.FC<RepositoryRiskHeatmapProps> = ({ findings = [] }) => {
  // Group findings by directory prefix (e.g., "src/auth", "backend/routes")
  const getDirPrefix = (path: string): string => {
    if (!path) return 'root';
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    if (parts.length <= 1) return 'root';
    // Return first two directories if deep, otherwise first directory
    return parts.slice(0, Math.min(parts.length - 1, 2)).join('/');
  };

  const dirRisks: Record<string, DirRisk> = {};

  findings.forEach((f) => {
    const path = f.filepath || f.filename || 'root';
    const prefix = getDirPrefix(path);
    
    if (!dirRisks[prefix]) {
      dirRisks[prefix] = {
        dir: prefix,
        score: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        secrets: 0
      };
    }

    const item = dirRisks[prefix];
    const sev = f.severity?.toUpperCase() || 'LOW';
    if (f.is_secret) {
      item.secrets += 1;
    }

    if (sev === 'CRITICAL') item.critical += 1;
    else if (sev === 'HIGH') item.high += 1;
    else if (sev === 'MEDIUM') item.medium += 1;
    else item.low += 1;
  });

  // Calculate scores for each directory
  const list: DirRisk[] = Object.values(dirRisks).map((item) => {
    // Score calculation
    // Critical/Secrets: 25 points, High: 15 points, Medium: 8 points, Low: 3 points
    let calculated = (item.critical * 25) + (item.high * 15) + (item.medium * 8) + (item.low * 3);
    item.score = Math.min(100, calculated);
    return item;
  });

  // Sort by score descending
  list.sort((a, b) => b.score - a.score);

  const getBarColor = (score: number) => {
    if (score >= 80) return 'var(--critical)';
    if (score >= 50) return 'var(--high)';
    if (score >= 25) return 'var(--medium)';
    return 'var(--low)';
  };

  return (
    <div className="repository-risk-heatmap" style={{
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} style={{ color: 'var(--high)' }} />
        Repository Risk Heatmap
      </h3>

      {list.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
          No risk concentration detected. All directories are fully clean.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {list.map((item) => (
            <div key={item.dir} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={item.dir}
              >
                {item.dir}
              </div>

              <div style={{ position: 'relative', width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{
                    width: `${item.score}%`,
                    height: '100%',
                    background: getBarColor(item.score),
                    borderRadius: '4px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 10px ${getBarColor(item.score)}40`
                  }} 
                />
              </div>

              <div 
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: getBarColor(item.score),
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {item.score}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--critical)' }} /> Critical (&gt;80)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--high)' }} /> High (50-79)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--medium)' }} /> Medium (25-49)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--low)' }} /> Low (&lt;25)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
