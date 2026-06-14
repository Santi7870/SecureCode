import React, { useEffect, useState } from 'react';
import { ScanResponse } from '../types';
import { motion } from 'framer-motion';
import { Shield, FileCode, CheckCircle, Award } from 'lucide-react';

interface ExecutiveSummaryProps {
  scan: ScanResponse;
  sanitizePath: (path: string) => string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ scan, sanitizePath }) => {
  const score = scan.security_score !== undefined ? scan.security_score : 100;
  const riskLevel = scan.risk_level || 'Excellent';
  const businessRisk = scan.business_risk || 'Low';

  // Animated score counter state
  const [animatedScore, setAnimatedScore] = useState(100);

  useEffect(() => {
    // Reset counter to 100 and count down to the target score
    setAnimatedScore(100);
    if (score === 100) return;

    const duration = 800; // ms
    const diff = 100 - score;
    const stepTime = Math.max(Math.floor(duration / diff), 8);
    let current = 100;

    const timer = setInterval(() => {
      current -= 1;
      setAnimatedScore(current);
      if (current <= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  let badgeClass = 'low';
  if (score < 40) {
    badgeClass = 'critical';
  } else if (score < 60) {
    badgeClass = 'high';
  } else if (score < 75) {
    badgeClass = 'medium';
  } else if (score < 90) {
    badgeClass = 'medium';
  }

  // Circular SVG progress math
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* FIRST: Security Score & SECOND: Executive Summary Card */}
      <div className="score-section" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Circular Score Component */}
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: '260px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Security Posture Score
          </div>
          
          <div className="score-circle-container">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="130" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <circle
                className="score-circle-bg"
                cx="65"
                cy="65"
                r={radius}
                strokeWidth={strokeWidth}
              />
              <motion.circle
                className="score-circle-val"
                cx="65"
                cy="65"
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="score-circle-text">
              <span className="score-circle-number">{animatedScore}</span>
              <span className="score-circle-max">/ 100</span>
            </div>
          </div>

          <div className={`badge ${badgeClass}`} style={{ marginTop: '1.25rem', padding: '6px 16px', borderRadius: '12px', fontWeight: 700 }}>
            {riskLevel} Risk
          </div>
        </div>

        {/* Executive Summary Card directly below/next to Security Score */}
        <div className="saas-card accented" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', minHeight: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Shield size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Azure AI Foundry Grounding Layer CASO Assessment
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', fontStyle: 'italic' }}>
            {scan.executive_summary || `Chief Application Security Officer (CASO) board report: Security audit completed successfully for file ${sanitizePath(scan.filename)}.`}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'var(--border-light)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <FileCode size={12} style={{ color: 'var(--primary)' }} />
              Language: {scan.language.toUpperCase()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'var(--border-light)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Award size={12} style={{ color: 'var(--low)' }} />
              Business Risk: {businessRisk.toUpperCase()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'var(--border-light)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <CheckCircle size={12} style={{ color: 'var(--low)' }} />
              Status: {scan.status}
            </span>
          </div>
        </div>
      </div>

      {scan.report_json?.roadmap && scan.report_json.roadmap.length > 0 && (
        <div className="saas-card" style={{ padding: '1.5rem', background: 'rgba(129, 140, 248, 0.03)', border: '1px solid var(--border-color)', marginTop: '-1rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={14} style={{ color: 'var(--secondary)' }} />
            CISO Executive Remediation Roadmap
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', paddingLeft: '1.2rem', margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            {scan.report_json.roadmap.map((item: string, idx: number) => (
              <li key={idx} style={{ lineHeight: '1.4' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* THIRD: Risk Distribution Statistic Cards */}
      <div className="metrics-row">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-number" style={{ color: 'var(--primary)' }}>{scan.total_findings}</div>
          <div className="metric-name">Total Findings</div>
        </div>
        <div className="metric-card critical">
          <div className="metric-number">{scan.critical_count}</div>
          <div className="metric-name">Critical</div>
        </div>
        <div className="metric-card high">
          <div className="metric-number">{scan.high_count}</div>
          <div className="metric-name">High</div>
        </div>
        <div className="metric-card medium">
          <div className="metric-number">{scan.medium_count}</div>
          <div className="metric-name">Medium</div>
        </div>
        <div className="metric-card low">
          <div className="metric-number">{scan.low_count}</div>
          <div className="metric-name">Low</div>
        </div>
      </div>
    </div>
  );
};
