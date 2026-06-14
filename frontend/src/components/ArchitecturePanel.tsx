import React from 'react';
import { Network, ShieldAlert, Sliders, CheckSquare } from 'lucide-react';

export const ArchitecturePanel: React.FC = () => {
  return (
    <div className="saas-card" style={{ height: 'fit-content', marginBottom: '2rem' }}>
      <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
        <Network size={20} style={{ color: 'var(--primary)' }} />
        <span>Azure AI Foundry Grounding Layer Architecture</span>
      </div>

      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          The multi-agent security orchestration engine maps discovered alerts against real grounding sources via the **Azure AI Foundry Grounding Layer**. Search queries are dynamically embedded and matched using **text-embedding-3-small** hybrid retrieval to ensure maximum grounding and eliminate false positives.
        </p>

        <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Grounding Knowledge Sources:
        </h4>
        
        <div className="grounding-sources-grid">
          
          <div className="grounding-source-card">
            <ShieldAlert size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong className="grounding-source-title">OWASP Top 10 & CWE References</strong>
              <span className="grounding-source-desc">
                Correlates code-level findings against standard CWE mappings and OWASP Top 10 category directives.
              </span>
            </div>
          </div>
          
          <div className="grounding-source-card">
            <Sliders size={18} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong className="grounding-source-title">Microsoft Secure Coding & Language Standards</strong>
              <span className="grounding-source-desc">
                Grounds analysis in Microsoft secure coding guidelines for secrets, SQL parameters, randomness, and CORS settings.
              </span>
            </div>
          </div>

          <div className="grounding-source-card">
            <CheckSquare size={18} style={{ color: 'var(--low)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong className="grounding-source-title">Validation Guidelines</strong>
              <span className="grounding-source-desc">
                Infers optimal unit test frameworks to assert patch stability and vulnerability proof-of-concept testing.
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
