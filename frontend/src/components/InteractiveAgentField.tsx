import React, { useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface InteractiveAgentFieldProps {
  isTransitioning?: boolean;
}

export const InteractiveAgentField: React.FC<InteractiveAgentFieldProps> = ({ isTransitioning = false }) => {
  // Center coordinates
  const centerX = 400;
  const centerY = 220;

  // Track relative mouse position inside the SVG coordinate space (800x500)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const frameRef = React.useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;
    
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(() => {
      setMousePos({ x, y });
    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    setMousePos({ x: -1000, y: -1000 });
  };

  React.useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Base configurations for the 7 agent nodes (scaled up central layout to make the graph larger and clearer)
  const baseAgents = [
    { id: 'cu', name: 'Code Understanding', x: 255, y: 140, short: 'CU' },
    { id: 'sr', name: 'Security Risk', x: 255, y: 300, short: 'SR' },
    { id: 'reasoning', name: 'Reasoning Agent', x: 335, y: 80, short: 'RA' },
    { id: 'remediation', name: 'Remediation Agent', x: 545, y: 140, short: 'RM' },
    { id: 'validation', name: 'Validation Agent', x: 465, y: 80, short: 'VA' },
    { id: 'critic', name: 'Critic Verifier', x: 400, y: 360, short: 'CV' },
    { id: 'report', name: 'Report Agent', x: 545, y: 300, short: 'RP' }
  ];

  // Base configurations for the grounding knowledge sources
  const baseKnowledge = [
    { id: 'owasp', name: 'OWASP Database', x: 260, y: 415 },
    { id: 'standards', name: 'Secure Coding Standards', x: 335, y: 455 },
    { id: 'val_guide', name: 'Validation Guidelines', x: 540, y: 415 },
    { id: 'cwe_db', name: 'CWE Database', x: 465, y: 455 }
  ];

  // Proximity displacement calculation helper
  const getOffset = (nodex: number, nodey: number) => {
    const dist = Math.hypot(nodex - mousePos.x, nodey - mousePos.y);
    if (dist < 150) {
      const factor = (150 - dist) / 150; // 0 (far) to 1 (close)
      // Subtle magnetic draw: shift node 12% of the way towards the cursor
      const dx = (mousePos.x - nodex) * factor * 0.12;
      const dy = (mousePos.y - nodey) * factor * 0.12;
      return { dx, dy, activeGlow: factor };
    }
    return { dx: 0, dy: 0, activeGlow: 0 };
  };

  // Calculate coordinates dynamically with cursor attraction
  const shiftedOrchestrator = (() => {
    const { dx, dy, activeGlow } = getOffset(centerX, centerY);
    return { x: centerX + dx, y: centerY + dy, glow: activeGlow };
  })();

  const shiftedAgents = baseAgents.map((agent) => {
    const { dx, dy, activeGlow } = getOffset(agent.x, agent.y);
    return {
      ...agent,
      currentX: agent.x + dx,
      currentY: agent.y + dy,
      glow: activeGlow
    };
  });

  const shiftedKnowledge = baseKnowledge.map((k) => {
    const { dx, dy, activeGlow } = getOffset(k.x, k.y);
    return {
      ...k,
      currentX: k.x + dx,
      currentY: k.y + dy,
      glow: activeGlow
    };
  });

  return (
    <div 
      className="floating-preview-container" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '540px',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        overflow: isTransitioning ? 'visible' : 'hidden',
        zIndex: isTransitioning ? 9999 : 1
      }}
    >
      {/* ================================================= */}
      {/* LAYER 1: Background Intelligence Grid (SVG pattern) */}
      {/* ================================================= */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 500" 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', overflow: 'visible', cursor: 'default', zIndex: 1 }}
      >
        <defs>
          <pattern id="intelligence-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="1.5" fill="rgba(124, 58, 237, 0.15)" />
          </pattern>

          {/* Glow defs */}
          <radialGradient id="hubRadialGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.45)" />
            <stop offset="60%" stopColor="rgba(37, 99, 235, 0.15)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
          </radialGradient>

          <radialGradient id="agentHoverGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.35)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
          </radialGradient>

          <linearGradient id="centralHubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Grid pattern fill */}
        <rect width="800" height="500" fill="url(#intelligence-grid)" />

        {/* ================================================= */}
        {/* LAYER 2: Agent Network & Connections (Fades out on transition) */}
        {/* ================================================= */}
        <motion.g
          animate={isTransitioning ? { opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } } : {}}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          {/* Knowledge feeds links (Dashed lines connecting bottom sources to hub) */}
          {shiftedKnowledge.map((k) => (
            <g key={`link-know-${k.id}`}>
              <path
                id={`path-know-${k.id}`}
                d={`M ${k.currentX} ${k.currentY} Q ${(k.currentX + shiftedOrchestrator.x)/2} ${(k.currentY + shiftedOrchestrator.y)/2 + 20} ${shiftedOrchestrator.x} ${shiftedOrchestrator.y}`}
                fill="none"
                stroke="rgba(139, 92, 246, 0.2)"
                strokeWidth="1.2"
                strokeDasharray="4,4"
                opacity={0.5 + k.glow * 0.4}
                style={{ transition: 'opacity 0.2s' }}
              />
              {/* Animated data pulses from Knowledge to Orchestrator */}
              <circle r="2.5" fill="#C084FC">
                <animateMotion dur="5s" repeatCount="indefinite">
                  <mpath href={`#path-know-${k.id}`} />
                </animateMotion>
              </circle>
            </g>
          ))}

          {/* Collaborative links between agents */}
          <g opacity="0.6">
            {/* CU <-> SR */}
            <line x1={shiftedAgents[0].currentX} y1={shiftedAgents[0].currentY} x2={shiftedAgents[1].currentX} y2={shiftedAgents[1].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* CU <-> RA */}
            <line x1={shiftedAgents[0].currentX} y1={shiftedAgents[0].currentY} x2={shiftedAgents[2].currentX} y2={shiftedAgents[2].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* SR <-> RA */}
            <line x1={shiftedAgents[1].currentX} y1={shiftedAgents[1].currentY} x2={shiftedAgents[2].currentX} y2={shiftedAgents[2].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* RA <-> VA */}
            <line x1={shiftedAgents[2].currentX} y1={shiftedAgents[2].currentY} x2={shiftedAgents[4].currentX} y2={shiftedAgents[4].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* VA <-> CV */}
            <line x1={shiftedAgents[4].currentX} y1={shiftedAgents[4].currentY} x2={shiftedAgents[5].currentX} y2={shiftedAgents[5].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* CV <-> RM */}
            <line x1={shiftedAgents[5].currentX} y1={shiftedAgents[5].currentY} x2={shiftedAgents[3].currentX} y2={shiftedAgents[3].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
            {/* RM <-> RP */}
            <line x1={shiftedAgents[3].currentX} y1={shiftedAgents[3].currentY} x2={shiftedAgents[6].currentX} y2={shiftedAgents[6].currentY} stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
          </g>

          {/* Star Hub connections: Central Orchestrator -> Agents */}
          {shiftedAgents.map((agent) => (
            <g key={`hub-link-${agent.id}`}>
              <path
                id={`path-hub-${agent.id}`}
                d={`M ${shiftedOrchestrator.x} ${shiftedOrchestrator.y} L ${agent.currentX} ${agent.currentY}`}
                fill="none"
                stroke="rgba(165, 180, 252, 0.3)"
                strokeWidth={1.5 + agent.glow * 1.5}
                className="energy-path"
                opacity={0.5 + agent.glow * 0.5}
                style={{ transition: 'stroke-width 0.2s, opacity 0.2s' }}
              />
              {/* Native animated data packet */}
              <circle r="3.5" fill="url(#centralHubGrad)">
                <animateMotion dur="4.2s" repeatCount="indefinite">
                  <mpath href={`#path-hub-${agent.id}`} />
                </animateMotion>
              </circle>
            </g>
          ))}

          {/* Render Knowledge Feed Nodes */}
          {shiftedKnowledge.map((k) => (
            <g key={`know-node-${k.id}`} transform={`translate(${k.currentX}, ${k.currentY})`}>
              <rect
                x="-60"
                y="-12"
                width="120"
                height="24"
                rx="6"
                fill="#0b0f19"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={1 + k.glow * 1}
                style={{ 
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                  transition: 'stroke-width 0.2s'
                }}
              />
              <text
                textAnchor="middle"
                dy="3"
                fill="#6B7280"
                fontSize="7.5"
                fontWeight="700"
                fontFamily="var(--font-sans)"
              >
                {k.name}
              </text>
            </g>
          ))}

          {/* Render 7 Agent Nodes */}
          {shiftedAgents.map((agent) => (
            <g key={`agent-node-${agent.id}`} transform={`translate(${agent.currentX}, ${agent.currentY})`}>
              {/* Hover active glow circle */}
              <circle
                r={30 + (agent.glow || 0) * 18}
                fill="url(#agentHoverGlow)"
                opacity={0.3 + (agent.glow || 0) * 0.7}
                style={{ transition: 'r 0.2s, opacity 0.2s' }}
              />
              {/* Core node */}
              <circle
                r="18"
                fill="#0b0f19"
                stroke={agent.glow && agent.glow > 0.3 ? "#A5B4FC" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={1.5 + (agent.glow || 0) * 2}
                style={{ 
                  filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.4))',
                  transition: 'stroke-width 0.2s, stroke 0.2s'
                }}
              />
              {/* Label inside node */}
              <text
                textAnchor="middle"
                dy="3"
                fill={agent.glow && agent.glow > 0.3 ? "#A5B4FC" : "#D1D5DB"}
                fontSize="8.5"
                fontWeight="800"
                fontFamily="var(--font-sans)"
              >
                {agent.short}
              </text>
              {/* Label text below */}
              <text
                textAnchor="middle"
                y="32"
                fill="#9CA3AF"
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-sans)"
                letterSpacing="-0.01em"
              >
                {agent.name}
              </text>
            </g>
          ))}
        </motion.g>

        {/* ================================================= */}
        {/* LAYER 3: Central AI Security Core (Scales up on transition) */}
        {/* ================================================= */}
        <motion.g
          animate={isTransitioning ? {
            scale: 1.08,
            opacity: [1, 0.92, 0],
            transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
          } : {}}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          <g transform={`translate(${shiftedOrchestrator.x}, ${shiftedOrchestrator.y})`}>
            {/* Rippling radar waves / reasoning signals — animated via CSS transform (GPU) */}
            <circle className="radar-wave radar-wave-1" cx="0" cy="0" r="34" fill="none" stroke="rgba(165, 180, 252, 0.4)" strokeWidth="1" />
            <circle className="radar-wave radar-wave-2" cx="0" cy="0" r="34" fill="none" stroke="rgba(124, 58, 237, 0.25)" strokeWidth="1" />

            {/* Proximity-driven radial glow */}
            <circle
              r={65 + (shiftedOrchestrator.glow || 0) * 35}
              fill="url(#hubRadialGlow)"
              opacity={0.6 + (shiftedOrchestrator.glow || 0) * 0.4}
              style={{ transition: 'r 0.2s, opacity 0.2s' }}
            />

            {/* Telemetry Ring 1: Rotating Dashed Circle (Clockwise) */}
            <circle
              r="48"
              fill="none"
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth="1"
              strokeDasharray="4, 10"
              className="rotate-clockwise"
              style={{ transformOrigin: 'center' }}
            />

            {/* Telemetry Ring 2: Rotating Dotted Circle (Counter-Clockwise) */}
            <circle
              r="42"
              fill="none"
              stroke="rgba(236, 72, 153, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="2, 6"
              className="rotate-counter-clockwise"
              style={{ transformOrigin: 'center' }}
            />

            {/* Core sphere itself */}
            <circle
              r="34"
              fill="url(#centralHubGrad)"
              style={{ filter: 'drop-shadow(0px 8px 24px rgba(99, 102, 241, 0.5))' }}
            />

            {/* Inner details of the Core */}
            <circle
              r="24"
              fill="rgba(3, 7, 18, 0.4)"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />

            <text
              textAnchor="middle"
              dy="3.5"
              fill="#FFFFFF"
              fontSize="9.5"
              fontWeight="900"
              letterSpacing="0.08em"
              fontFamily="var(--font-sans)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            >
              CORE
            </text>
            
            <text
              textAnchor="middle"
              y="54"
              fill="#F3F4F6"
              fontSize="11"
              fontWeight="850"
              fontFamily="var(--font-sans)"
              letterSpacing="0.05em"
            >
              AI SECURITY CORE
            </text>
          </g>
        </motion.g>
      </svg>

      {/* ================================================= */}
      {/* LAYER 4: Floating Overlay Intelligence Cards (Slide out on transition) */}
      {/* ================================================= */}
      
      {/* Card 1: Security Score */}
      <motion.div 
        animate={isTransitioning ? { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] } } : {}}
        className="floating-preview-card score-preview float-card-1" 
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Security Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--critical-border)', borderTopColor: 'var(--critical)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--critical)' }}>
            42
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F9FAFB' }}>Critical Risk</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>4 CVE vulnerabilities</div>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Active Agents */}
      <motion.div 
        animate={isTransitioning ? { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] } } : {}}
        className="floating-preview-card agent-preview float-card-2" 
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Activity size={14} style={{ color: '#818CF8' }} />
          <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#F9FAFB' }}>Active Agents</span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB', lineHeight: '1.1' }}>
          7
        </div>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>
          Collaborating in real-time
        </div>
      </motion.div>

      {/* Card 3: Grounding Context */}
      <motion.div 
        animate={isTransitioning ? { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] } } : {}}
        className="floating-preview-card float-card-3" 
        style={{ right: '20px', bottom: '40px', width: '220px', pointerEvents: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--low)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#F9FAFB' }}>Grounding Context</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F9FAFB' }}>100% Verified</div>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>OWASP & Standards grounded</div>
      </motion.div>

      {/* Card 4: Validation Ready */}
      <motion.div 
        animate={isTransitioning ? { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] } } : {}}
        className="floating-preview-card vulnerability-preview float-card-1" 
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="badge critical" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>VALIDATION READY</span>
          <code style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>Pytest / Jest</code>
        </div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F9FAFB', marginBottom: '4px' }}>
          Auto-Test Suite Compiled
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', lineHeight: '1.4' }}>
          4 unit test validations generated to verify patch stability.
        </p>
      </motion.div>

    </div>
  );
};
