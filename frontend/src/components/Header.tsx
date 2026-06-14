import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  isLanding?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showBack, onBack, isLanding }) => {
  return (
    <header className={`header ${isLanding ? 'dark-header' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && (
          <button 
            onClick={onBack}
            className="btn-secondary"
            style={{ 
              padding: '6px 10px', 
              borderRadius: '8px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>Landing</span>
          </button>
        )}
        
        <div className="header-logo">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#brandGrad)" />
            <path d="M16 8L22 11V16C22 20.31 19.44 24.3 16 25C12.56 24.3 10 20.31 10 16V11L16 8Z" fill="#FFFFFF"/>
            <path d="M16 11L13 14L14.4 15.4L16 13.8L17.6 15.4L19 14L16 11Z" fill="#2563EB"/>
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              SecureCode
            </h1>
          </div>
        </div>
      </div>
      
      <div className="header-badges">
        <span className="header-badge primary">Reasoning Agents Track</span>
        <span className="header-badge">Foundry IQ-inspired grounding</span>
        <span className="header-badge">v2.0.0</span>
      </div>
    </header>
  );
};
