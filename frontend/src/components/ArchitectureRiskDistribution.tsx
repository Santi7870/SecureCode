import React from 'react';
import { Layers } from 'lucide-react';
import { Finding } from '../types';

interface ArchitectureRiskDistributionProps {
  findings: Finding[];
}

interface LayerMetric {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

export const ArchitectureRiskDistribution: React.FC<ArchitectureRiskDistributionProps> = ({ findings = [] }) => {
  // Layer classification logic
  const classifyLayer = (f: Finding): string => {
    const path = (f.filepath || f.filename || '').toLowerCase();
    
    // 1. CI/CD
    if (path.includes('.github/workflows') || path.includes('.gitlab-ci') || path.includes('jenkins') || path.includes('ci-cd')) {
      return 'CI/CD';
    }
    
    // 2. Infrastructure
    if (path.includes('dockerfile') || path.includes('docker-compose') || path.endsWith('.tf') || path.includes('terraform') || path.includes('k8s') || path.includes('kubernetes')) {
      return 'Infrastructure';
    }
    
    // 3. Dependencies
    if (path.includes('package.json') || path.includes('requirements.txt') || path.includes('poetry.lock') || path.includes('pipfile')) {
      return 'Dependencies';
    }
    
    // 4. Frontend
    if (path.includes('frontend') || path.includes('public') || path.includes('static') || path.includes('components') || path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.jsx') || path.endsWith('.tsx')) {
      return 'Frontend';
    }
    
    // 5. Backend
    return 'Backend';
  };

  const layers: Record<string, { count: number; color: string }> = {
    'Backend': { count: 0, color: 'var(--primary)' },
    'Frontend': { count: 0, color: 'var(--secondary)' },
    'Infrastructure': { count: 0, color: 'var(--high)' },
    'CI/CD': { count: 0, color: 'var(--critical)' },
    'Dependencies': { count: 0, color: 'var(--low)' }
  };

  findings.forEach((f) => {
    const layer = classifyLayer(f);
    if (layers[layer]) {
      layers[layer].count += 1;
    } else {
      layers[layer] = { count: 1, color: 'var(--text-muted)' };
    }
  });

  const total = findings.length;

  const data: LayerMetric[] = Object.entries(layers).map(([name, item]) => ({
    name,
    count: item.count,
    color: item.color,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
  }));

  // SVG Donut calculations
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercentage = 0;

  return (
    <div className="architecture-risk-distribution" style={{
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers size={16} style={{ color: 'var(--primary)' }} />
        Architecture Risk Distribution
      </h3>

      {total === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
          No architectural vulnerability distribution.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '2rem' }}>
          {/* Donut Chart SVG */}
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle 
                cx="60" 
                cy="60" 
                r={radius} 
                fill="transparent" 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth={strokeWidth} 
              />
              {data.map((item) => {
                if (item.count === 0) return null;
                const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
                const strokeDasharray = `${circumference} ${circumference}`;
                const rotation = (accumulatedPercentage / 100) * 360;
                accumulatedPercentage += item.percentage;

                return (
                  <circle
                    key={item.name}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: '60px 60px',
                      transition: 'stroke-dashoffset 0.8s ease-in-out',
                      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                    }}
                  />
                );
              })}
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Risks</span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.map((item) => {
              if (item.count === 0) return null;
              return (
                <div 
                  key={item.name} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {item.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.count}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
