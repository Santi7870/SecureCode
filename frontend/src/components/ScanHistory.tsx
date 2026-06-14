import React from 'react';
import { ScanSummary } from '../types';
import { History, FileCode, ChevronRight } from 'lucide-react';

interface ScanHistoryProps {
  scans: ScanSummary[];
  selectedScanId: string | null;
  onSelectScan: (scanId: string) => void;
  sanitizePath: (path: string) => string;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  scans,
  selectedScanId,
  onSelectScan,
  sanitizePath,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getRiskDetails = (scan: ScanSummary) => {
    let score = 100 - (scan.critical_count * 25 + scan.high_count * 15 + scan.medium_count * 8 + scan.low_count * 3);
    if (score < 0) score = 0;
    
    if (score < 40) return { label: 'Critical', class: 'critical' };
    if (score < 60) return { label: 'High', class: 'high' };
    if (score < 80) return { label: 'Moderate', class: 'medium' };
    return { label: 'Low', class: 'low' };
  };

  return (
    <div className="saas-card" style={{ padding: '1.5rem', marginBottom: 0, height: 'fit-content' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Audit History</span>
        </div>
        <span style={{ fontSize: '0.75rem', background: 'var(--border-color-light)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {scans.length} runs
        </span>
      </div>
      
      <ul className="history-list" style={{ listStyle: 'none', padding: 0 }}>
        {scans.length > 0 ? (
          scans.map((scan) => {
            const risk = getRiskDetails(scan);
            const isActive = selectedScanId === scan.scan_id;
            return (
              <li
                key={scan.scan_id}
                className={`history-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectScan(scan.scan_id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  border: isActive ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'rgba(129, 140, 248, 0.08)' : 'var(--surface-color)',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="history-filename" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <FileCode size={12} style={{ color: 'var(--primary)' }} />
                    <span>{sanitizePath(scan.filename)}</span>
                  </div>
                  <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
                
                <div className="history-meta" style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>{formatDate(scan.created_at)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${risk.class}`} style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px' }}>
                      {risk.label}
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {scan.total_findings} v.
                    </span>
                  </div>
                </div>
              </li>
            );
          })
        ) : (
          <div className="history-empty" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No scan history recorded yet.
          </div>
        )}
      </ul>
    </div>
  );
};
