import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { InteractiveAgentField } from './InteractiveAgentField';
import { IntelligenceBackground } from './IntelligenceBackground';
import { 
  ArrowRight, Shield, ShieldCheck, Cpu, Code, Database, CheckSquare, Layers, FileText, ChevronRight, Activity, Terminal 
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  // Simulated scan index for Section 3 (Live Agent Intelligence)
  const [simulatedStep, setSimulatedStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLaunch = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onLaunch();
    }, 220);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedStep((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const simulatedStatusMessages = [
    'CodeUnderstandingAgent: Mapping syntax AST tree scopes...',
    'SecurityRiskAgent: Applying policy rules to pinpoint vulnerabilities...',
    'ReasoningAgent: Validating alert types against local guidelines...',
    'RemediationAgent: Engineering secure replacement patches...',
    'ValidationAgent: Generating target automated unit test suites...',
    'CriticVerifierAgent: Running quality verifications on proposed fix...',
    'ReportAgent: Compiling Markdown audit report logs...'
  ];

  const agentDetails = [
    { name: 'Code Understanding', short: 'CU' },
    { name: 'Security Risk', short: 'SR' },
    { name: 'Reasoning Agent', short: 'RA' },
    { name: 'Remediation Agent', short: 'RM' },
    { name: 'Validation Agent', short: 'VA' },
    { name: 'Critic Verifier', short: 'CV' },
    { name: 'Report Agent', short: 'RP' }
  ];

  const handleWatchNetworkClick = () => {
    document.getElementById('live-intelligence')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="reveal-landing" style={{ backgroundColor: '#030712', color: '#F9FAFB', overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>
      
      {/* Three.js Living AI Background */}
      <IntelligenceBackground />
      
      {/* ================================================= */}
      {/* Ambient Lighting Background Glows */}
      {/* ================================================= */}
      <div className="reveal-ambient-glow" style={{ top: '2%', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="reveal-ambient-glow" style={{ top: '35%', left: '-100px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)' }} />
      <div className="reveal-ambient-glow" style={{ top: '70%', right: '-100px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)' }} />

      {/* ================================================= */}
      {/* SECTION 1: Hero Launch Experience */}
      {/* ================================================= */}
      <section className="hero-section" style={{ minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isTransitioning ? { opacity: 0, y: -18, scale: 0.985, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="hero-headline" style={{ background: 'linear-gradient(135deg, #FFFFFF 30%, #C7D2FE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
              SecureCode <br />
              <span>Reasoning Agent</span>
            </h1>
            <p className="hero-subtitle" style={{ color: '#9CA3AF' }}>
              Enterprise-grade AI security analysis powered by collaborative reasoning agents.
            </p>
            
            {/* Supporting bullets row */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem', fontSize: '0.9rem', color: '#D1D5DB', fontWeight: 650 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>✓ Detect vulnerabilities</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>✓ Understand risks</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>✓ Generate remediations</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>✓ Validate fixes</span>
            </div>

            <div className="hero-ctas">
              <button className="btn-primary launch-btn" onClick={handleLaunch} disabled={isTransitioning} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                <span>Launch Platform</span>
                <ArrowRight size={16} />
              </button>
              <button className="btn-secondary" onClick={handleWatchNetworkClick} style={{ padding: '14px 28px', fontSize: '0.95rem', background: 'rgba(255,255,255,0.03)', color: '#E5E7EB', borderColor: 'rgba(255,255,255,0.1)' }}>
                <Activity size={16} style={{ color: '#818CF8' }} />
                <span>Watch Agent Network</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Large Centered Interactive Canvas visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isTransitioning ? { opacity: 0, y: 12, scale: 0.992 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: isTransitioning ? 0.18 : 0.8, delay: isTransitioning ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}
        >
          <InteractiveAgentField isTransitioning={isTransitioning} />
        </motion.div>
      </section>

      {/* ================================================= */}
      {/* SECTION 2: Why SecureCode Capabilities */}
      {/* ================================================= */}
      <motion.section 
        className="scroll-section"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <div className="scroll-section-title-wrapper">
          <h3 className="scroll-section-title" style={{ color: '#FFFFFF' }}>Why SecureCode</h3>
          <p className="scroll-section-subtitle" style={{ color: '#9CA3AF' }}>Collaborating security reasoning models instead of generic search filters</p>
        </div>

        <div className="highlights-grid" style={{ marginTop: '1.5rem' }}>
          <div className="highlight-card interactive-glow-card">
            <div className="highlight-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
              <Code size={20} />
            </div>
            <h3 style={{ color: '#FFFFFF' }}>Understand Code</h3>
            <p style={{ color: '#9CA3AF' }}>Maps code properties and references functional scopes to construct syntax AST trees automatically.</p>
          </div>

          <div className="highlight-card interactive-glow-card">
            <div className="highlight-icon-wrapper" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ color: '#FFFFFF' }}>Analyze Risks</h3>
            <p style={{ color: '#9CA3AF' }}>Scans patterns against standards, correlates issues to CWE indexes, and reports impact.</p>
          </div>

          <div className="highlight-card interactive-glow-card">
            <div className="highlight-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ color: '#FFFFFF' }}>Generate Remediation</h3>
            <p style={{ color: '#9CA3AF' }}>Produces explainable secure patch strategies and safe replacement blocks instantly.</p>
          </div>

          <div className="highlight-card interactive-glow-card">
            <div className="highlight-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
              <CheckSquare size={20} />
            </div>
            <h3 style={{ color: '#FFFFFF' }}>Validate Security</h3>
            <p style={{ color: '#9CA3AF' }}>Constructs unit validation tests to assert remediation stability and verify vulnerabilities.</p>
          </div>
        </div>
      </motion.section>

      {/* ================================================= */}
      {/* SECTION 3: Live Agent Intelligence Loop */}
      {/* ================================================= */}
      <motion.section 
        id="live-intelligence"
        className="scroll-section"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <div className="scroll-section-title-wrapper">
          <h3 className="scroll-section-title" style={{ color: '#FFFFFF' }}>Live Agent Intelligence</h3>
          <p className="scroll-section-subtitle" style={{ color: '#9CA3AF' }}>Real-time mock scan playing out sequentially to demonstrate agent activity</p>
        </div>

        <div className="saas-card" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', padding: '3rem', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Left panel: simulated logs progress */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div 
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#A5B4FC',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                width: 'fit-content',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818CF8', animation: 'pulse 1.5s infinite' }} />
              ACTIVE SIMULATION
            </div>
            
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Multi-Agent Collaboration
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#9CA3AF', lineHeight: '1.6', marginBottom: '2rem' }}>
              Specialized agents operate in sequence. The orchestrator coordinates results and verifies that propose secure patches align to code constraints before finalizing.
            </p>

            {/* Diagnostic message strip */}
            <div style={{ background: '#0b0f19', color: '#cbd5e1', padding: '16px', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', borderLeft: '4px solid #6366F1', border: '1px solid rgba(255, 255, 255, 0.06)', borderLeftColor: '#6366F1', minHeight: '74px' }}>
              <span style={{ color: '#818CF8', marginRight: '8px' }}>$</span>
              {simulatedStatusMessages[simulatedStep]}
            </div>
          </div>

          {/* Right panel: dynamic nodes circle loop */}
          <div style={{ position: 'relative', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 400 320" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Orchestrator node center */}
              <circle cx="200" cy="160" r="30" fill="url(#centralHubGrad)" style={{ filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))' }} />
              <text textAnchor="middle" x="200" y="160" dy="3.5" fill="#FFFFFF" fontSize="8" fontWeight="bold">CORE</text>
              
              {/* Connecting rays and surrounding nodes */}
              {agentDetails.map((node, idx) => {
                const angle = (idx * 2 * Math.PI) / agentDetails.length - Math.PI / 2;
                const nodeX = 200 + 110 * Math.cos(angle);
                const nodeY = 160 + 110 * Math.sin(angle);
                
                const isCompleted = idx < simulatedStep;
                const isActive = idx === simulatedStep;
                
                return (
                  <g key={`loop-${node.short}`}>
                    {/* Connecting line */}
                    <line 
                      x1="200" y1="160" x2={nodeX} y2={nodeY} 
                      stroke={isCompleted ? '#10B981' : isActive ? '#6366F1' : 'rgba(255, 255, 255, 0.1)'} 
                      strokeWidth={isActive ? '2.5' : '1.2'}
                      opacity={isActive || isCompleted ? 0.9 : 0.4}
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s' }}
                    />
                    
                    {/* Glowing active ring */}
                    {isActive && (
                      <circle cx={nodeX} cy={nodeY} r="22" fill="rgba(99, 102, 241, 0.18)" />
                    )}

                    {/* completed checkmark glow */}
                    {isCompleted && (
                      <circle cx={nodeX} cy={nodeY} r="18" fill="rgba(16, 185, 129, 0.15)" />
                    )}

                    {/* Agent node circle */}
                    <circle 
                      cx={nodeX} cy={nodeY} r="14" 
                      fill="#0b0f19" 
                      stroke={isCompleted ? '#10B981' : isActive ? '#6366F1' : 'rgba(255, 255, 255, 0.15)'}
                      strokeWidth="1.5"
                    />

                    {/* Node text */}
                    <text 
                      x={nodeX} y={nodeY} dy="3" 
                      textAnchor="middle" 
                      fontSize="7.5" fontWeight="bold" 
                      fill={isCompleted ? '#10B981' : isActive ? '#A5B4FC' : '#D1D5DB'}
                    >
                      {isCompleted ? '✓' : node.short}
                    </text>

                    {/* Outer label */}
                    <text
                      x={nodeX} y={nodeY + (nodeY > 160 ? 25 : -18)}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill={isActive ? '#A5B4FC' : '#9CA3AF'}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.section>

      {/* ================================================= */}
      {/* SECTION 4: Foundry IQ Grounding Visualization */}
      {/* ================================================= */}
      <motion.section 
        className="scroll-section"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <div className="scroll-section-title-wrapper">
          <h3 className="scroll-section-title" style={{ color: '#FFFFFF' }}>Foundry IQ Grounding Architecture</h3>
          <p className="scroll-section-subtitle" style={{ color: '#9CA3AF' }}>Visual mapping representing local guideline grounding layers</p>
        </div>

        <div className="saas-card" style={{ padding: '3.5rem', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', textAlign: 'center' }}>
            
            {/* Flow visual layout grid columns */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              
              {/* Box 1: Grounding Database */}
              <div style={{ background: 'rgba(11, 15, 25, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <Database size={24} style={{ color: '#818CF8', marginBottom: '8px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF' }}>Knowledge Sources</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>OWASP Top 10, CWE Directory Rules</span>
              </div>

              <ChevronRight className="chevron-divider" size={20} style={{ color: '#4B5563' }} />

              {/* Box 2: Central Hub */}
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '16px', padding: '1.5rem', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <ShieldCheck size={24} style={{ color: '#F472B6', marginBottom: '8px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF' }}>AI Orchestrator</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>Foundry IQ-inspired local grounding</span>
              </div>

              <ChevronRight className="chevron-divider" size={20} style={{ color: '#4B5563' }} />

              {/* Box 3: Agent verifiers */}
              <div style={{ background: 'rgba(11, 15, 25, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <Layers size={24} style={{ color: '#34D399', marginBottom: '8px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF' }}>Reasoning Agents</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>Validation tests + patch verifications</span>
              </div>

              <ChevronRight className="chevron-divider" size={20} style={{ color: '#4B5563' }} />

              {/* Box 4: Insights */}
              <div style={{ background: 'rgba(11, 15, 25, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <Shield size={24} style={{ color: '#F87171', marginBottom: '8px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF' }}>Security Insights</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>Verified repairs and vulnerability reports</span>
              </div>

            </div>

            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', maxWidth: '750px', margin: '2rem auto 0 auto', lineHeight: '1.6' }}>
              The **Foundry IQ Grounding Layer** guarantees that security decisions are resolved locally. Vulnerabilities undergo checking gates to assert patch reliability, delivering reliable insights without committing secrets or sending proprietary code to unverified external databases.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ================================================= */}
      {/* SECTION 5: Platform Preview (3D Perspective cards) */}
      {/* ================================================= */}
      <motion.section 
        className="scroll-section"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <div className="scroll-section-title-wrapper">
          <h3 className="scroll-section-title" style={{ color: '#FFFFFF' }}>Platform Preview</h3>
          <p className="scroll-section-subtitle" style={{ color: '#9CA3AF' }}>Inspect the high-fidelity elements inside the interactive workspace</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', padding: '1rem 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
            
            {/* Perspective card 1: Security Score */}
            <div className="perspective-card" style={{ background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', width: '280px', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div>
                <Shield size={22} style={{ color: '#818CF8', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>Security Score</h4>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>Circular rating system tracking vulnerability severities.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF' }}>42</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>/ 100 Rating</span>
              </div>
            </div>

            {/* Perspective card 2: Agent Trace */}
            <div className="perspective-card" style={{ background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', width: '280px', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div>
                <Layers size={22} style={{ color: '#A78BFA', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>Agent Trace</h4>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>Trace lines outlining orchestrator timeline steps.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--low)', fontWeight: 'bold' }}>✓ Code Understanding</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--low)', fontWeight: 'bold' }}>✓ Security Risk Analysis</span>
                <span style={{ fontSize: '0.7rem', color: '#818CF8', fontWeight: 'bold' }}>● Grounded Reasoning...</span>
              </div>
            </div>

            {/* Perspective card 3: Executive Summary */}
            <div className="perspective-card" style={{ background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', width: '280px', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div>
                <FileText size={22} style={{ color: '#34D399', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>Executive Summary</h4>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>Structured dashboard metrics showing risk findings.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.25)' }}>CRITICAL</span>
                <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#FB923C', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid rgba(249, 115, 22, 0.25)' }}>HIGH</span>
              </div>
            </div>

            {/* Perspective card 4: Architecture */}
            <div className="perspective-card" style={{ background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', width: '280px', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div>
                <Terminal size={22} style={{ color: '#22D3EE', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>System Architecture</h4>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '6px' }}>Connected diagram plotting links and components.</p>
              </div>
              <div style={{ borderLeft: '2px dashed rgba(255, 255, 255, 0.12)', paddingLeft: '8px', fontSize: '0.7rem', color: '#6B7280' }}>
                <span>local_grounding.db</span>
                <br />
                <span>orchestration_rules.json</span>
              </div>
            </div>

          </div>

        </div>
      </motion.section>

      {/* ================================================= */}
      {/* SECTION 6: Final Launch CTA */}
      {/* ================================================= */}
      <motion.section 
        className="scroll-section"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        style={{ paddingBottom: '8rem', position: 'relative', zIndex: 5 }}
      >
        <div className="saas-card accented" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, rgba(3, 7, 18, 0.6) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <ShieldCheck size={48} style={{ color: '#818CF8', marginBottom: '1.5rem', alignSelf: 'center' }} />
          <h3 style={{ fontSize: '2.25rem', fontWeight: 850, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Ready to analyze your code?
          </h3>
          <p style={{ fontSize: '1.05rem', color: '#9CA3AF', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>
            Deploy the SecureCode multi-agent reasoning scanner locally on your laptop and discover vulnerabilities with parameterized tests and patch generations.
          </p>
          <button className="btn-primary launch-btn" onClick={handleLaunch} disabled={isTransitioning} style={{ padding: '14px 32px', fontSize: '0.95rem' }}>
            <span>Launch Platform</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.section>

    </div>
  );
};
