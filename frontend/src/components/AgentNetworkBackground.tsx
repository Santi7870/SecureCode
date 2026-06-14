import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Cpu, Database, CheckSquare, Layers, FileCode, Search, FileText } from 'lucide-react';

interface AgentNetworkBackgroundProps {
  isLoading: boolean;
  loadingStep: number;
  hasScanResult: boolean;
}

export const AgentNetworkBackground: React.FC<AgentNetworkBackgroundProps> = ({
  isLoading,
  loadingStep,
  hasScanResult,
}) => {
  // Center coordinates
  const centerX = 400;
  const centerY = 230;

  // Agent Nodes definition
  const agents = [
    {
      id: 'cu',
      name: 'Code Understanding',
      x: 180,
      y: 130,
      icon: <FileCode size={16} />,
      statusText: 'Understanding source code structure...',
      short: 'CU'
    },
    {
      id: 'sr',
      name: 'Security Risk',
      x: 180,
      y: 330,
      icon: <Search size={16} />,
      statusText: 'Analyzing code security risks...',
      short: 'SR'
    },
    {
      id: 'reasoning',
      name: 'Reasoning Agent',
      x: 320,
      y: 70,
      icon: <Brain size={16} />,
      statusText: 'Performing grounded reasoning...',
      short: 'RA'
    },
    {
      id: 'remediation',
      name: 'Remediation Agent',
      x: 620,
      y: 130,
      icon: <Cpu size={16} />,
      statusText: 'Generating remediation patches...',
      short: 'RM'
    },
    {
      id: 'validation',
      name: 'Validation Agent',
      x: 480,
      y: 70,
      icon: <CheckSquare size={16} />,
      statusText: 'Compiling validation unit tests...',
      short: 'VA'
    },
    {
      id: 'critic',
      name: 'Critic Verifier',
      x: 400,
      y: 390,
      icon: <Shield size={16} />,
      statusText: 'Running critic gate reviews...',
      short: 'CV'
    },
    {
      id: 'report',
      name: 'Report Agent',
      x: 620,
      y: 330,
      icon: <FileText size={16} />,
      statusText: 'Formatting final reports...',
      short: 'RP'
    }
  ];

  // Grounding knowledge knowledge nodes feeding the orchestrator
  const groundingNodes = [
    { id: 'owasp', name: 'OWASP Database', x: 130, y: 450, width: 120, icon: <Database size={12} /> },
    { id: 'standards', name: 'Secure Coding Standards', x: 295, y: 450, width: 165, icon: <Layers size={12} /> },
    { id: 'val_guide', name: 'Validation Guidelines', x: 670, y: 450, width: 155, icon: <CheckSquare size={12} /> }
  ];

  // Determine node active states
  const getNodeState = (index: number) => {
    if (hasScanResult) return 'completed';
    if (!isLoading) return 'idle';
    if (loadingStep === index) return 'active';
    if (loadingStep > index) return 'completed';
    return 'pending';
  };

  const getStatusMessage = () => {
    if (hasScanResult) return 'Scan complete. Grounded checks finalized.';
    if (!isLoading) return 'Orchestrator ready. Awaiting scan run...';
    if (loadingStep >= 0 && loadingStep < agents.length) {
      return agents[loadingStep].statusText;
    }
    return 'Running collaborative security reasoning...';
  };

  // Speed of data packets
  const packetSpeed = isLoading ? '0.8s' : '3s';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Real-time Status Card overlay */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: isLoading ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}
      >
        <span 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isLoading ? 'var(--primary)' : 'var(--text-muted)',
            display: 'inline-block',
            animation: isLoading ? 'pulse 1.5s infinite' : 'none'
          }}
        />
        <span>{getStatusMessage()}</span>
      </div>

      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 500" 
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="orchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          
          <radialGradient id="orchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.4)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0)" />
          </radialGradient>

          <radialGradient id="nodeActiveGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.35)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0)" />
          </radialGradient>
          
          <radialGradient id="nodeCompletedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </radialGradient>

          <linearGradient id="packetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          <linearGradient id="packetGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        <g transform="translate(0, 35)">
        {/* ================================================= */}
        {/* 1. Grounding Lines feeding Orchestrator */}
        {/* ================================================= */}
        {groundingNodes.map((n) => (
          <g key={`grounding-link-${n.id}`}>
            {/* Dashed line */}
            <path
              id={`path-ground-${n.id}`}
              d={`M ${n.x} ${n.y} L ${centerX} ${centerY}`}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Grounding data flows */}
            <circle r="3" fill="var(--text-muted)">
              <animateMotion dur="4s" repeatCount="indefinite">
                <mpath href={`#path-ground-${n.id}`} />
              </animateMotion>
            </circle>
          </g>
        ))}

        {/* ================================================= */}
        {/* 2. Collaborative Peer Links */}
        {/* ================================================= */}
        {/* Sequence links */}
        <g>
          {/* CU -> SR */}
          <path id="link-cu-sr" d="M 180 130 L 180 330" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* CU -> Reasoning */}
          <path id="link-cu-reason" d="M 180 130 L 320 70" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* SR -> Reasoning */}
          <path id="link-sr-reason" d="M 180 330 L 320 70" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* Reasoning -> Validation */}
          <path id="link-reason-val" d="M 320 70 L 480 70" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* SR -> Validation */}
          <path id="link-sr-val" d="M 180 330 L 480 70" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* Validation -> Critic */}
          <path id="link-val-critic" d="M 480 70 L 400 390" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* Critic -> Remediation */}
          <path id="link-critic-rem" d="M 400 390 L 620 130" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* Validation -> Remediation */}
          <path id="link-val-rem" d="M 480 70 L 620 130" fill="none" stroke="var(--border-light)" strokeWidth="2" />
          {/* Remediation -> Report */}
          <path id="link-rem-rep" d="M 620 130 L 620 330" fill="none" stroke="var(--border-light)" strokeWidth="2" />

          {/* GPU Animated Packets along Peer links */}
          <circle r="2.5" fill="var(--text-muted)" opacity="0.4">
            <animateMotion dur="3.5s" repeatCount="indefinite">
              <mpath href="#link-cu-reason" />
            </animateMotion>
          </circle>
          <circle r="2.5" fill="var(--text-muted)" opacity="0.4">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath href="#link-reason-val" />
            </animateMotion>
          </circle>
          <circle r="2.5" fill="var(--text-muted)" opacity="0.4">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href="#link-val-rem" />
            </animateMotion>
          </circle>
        </g>

        {/* ================================================= */}
        {/* 3. Star Hub Lines: Orchestrator <-> Agents */}
        {/* ================================================= */}
        {agents.map((agent, index) => {
          const nodeState = getNodeState(index);
          const isLineActive = nodeState === 'active' || nodeState === 'completed';
          
          return (
            <g key={`hub-link-${agent.id}`}>
              {/* Main solid connection path */}
              <path
                id={`path-hub-${agent.id}`}
                d={`M ${centerX} ${centerY} L ${agent.x} ${agent.y}`}
                fill="none"
                stroke={nodeState === 'completed' ? 'var(--low)' : nodeState === 'active' ? 'var(--primary)' : 'var(--border-color)'}
                strokeWidth={nodeState === 'active' ? '3.5' : '2'}
                opacity={isLineActive ? 0.8 : 0.4}
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s' }}
              />
              
              {/* GPU data packet flow */}
              <circle 
                r={nodeState === 'active' ? 4.5 : 3} 
                fill={nodeState === 'completed' ? 'url(#packetGradGreen)' : 'url(#packetGrad)'}
              >
                <animateMotion dur={packetSpeed} repeatCount="indefinite">
                  <mpath href={`#path-hub-${agent.id}`} />
                </animateMotion>
              </circle>
            </g>
          );
        })}

        {/* ================================================= */}
        {/* 4. Central Hub: AI Orchestrator Node */}
        {/* ================================================= */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Dynamic pulsing background glow */}
          <motion.circle
            r={85}
            fill="url(#hubRadialGlow)"
            animate={{
              scale: isLoading ? [0.94, 1.29, 0.94] : [0.88, 1.12, 0.88],
              opacity: isLoading ? [0.6, 0.9, 0.6] : [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: isLoading ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          {/* Outer Ring */}
          <circle
            r="48"
            fill="none"
            stroke="url(#orchGrad)"
            strokeWidth="3.5"
            opacity="0.8"
          />
          {/* Inner solid node */}
          <circle
            r="38"
            fill="url(#orchGrad)"
            style={{ filter: 'drop-shadow(0px 6px 15px rgba(99, 102, 241, 0.5))' }}
          />
          {/* Label inside central orchestrator */}
          <text
            textAnchor="middle"
            dy="4.5"
            fill="#FFFFFF"
            fontSize="13"
            fontWeight="950"
            letterSpacing="0.06em"
            fontFamily="var(--font-sans)"
          >
            CORE
          </text>
          {/* Masking rect for label */}
          <rect
            x="-70"
            y="56"
            width="140"
            height="18"
            rx="4"
            fill="var(--surface-color)"
          />
          {/* Floating outer title */}
          <text
            textAnchor="middle"
            y="68"
            fill="var(--text-primary)"
            fontSize="12"
            fontWeight="850"
            fontFamily="var(--font-sans)"
            letterSpacing="-0.01em"
          >
            AI ORCHESTRATOR
          </text>
        </g>

        {/* ================================================= */}
        {/* 5. Grounding Knowledge Source Nodes */}
        {/* ================================================= */}
        {groundingNodes.map((n) => (
          <g key={`ground-node-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
            {/* Border card */}
            <rect
              x={-n.width / 2}
              y="-15"
              width={n.width}
              height="30"
              rx="8"
              fill="var(--surface-color)"
              stroke="var(--border-color)"
              strokeWidth="1.2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))' }}
            />
            {/* Label text */}
            <text
              textAnchor="middle"
              dy="3.5"
              fill="var(--text-secondary)"
              fontSize="10"
              fontWeight="700"
              fontFamily="var(--font-sans)"
            >
              {n.name}
            </text>
          </g>
        ))}

        {/* ================================================= */}
        {/* 6. Agent Nodes Layout */}
        {/* ================================================= */}
        {agents.map((agent, index) => {
          const nodeState = getNodeState(index);
          const isCompleted = nodeState === 'completed';
          const isActive = nodeState === 'active';
          
          return (
            <g key={`agent-node-${agent.id}`} transform={`translate(${agent.x}, ${agent.y})`}>
              {/* Active pulsing glow */}
              {isActive && (
                <motion.circle
                  r={46}
                  fill="url(#nodeActiveGlow)"
                  animate={{ scale: [0.65, 1.05, 0.65], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Completed static glow */}
              {isCompleted && (
                <circle
                  r={34}
                  fill="url(#nodeCompletedGlow)"
                  opacity={0.8}
                />
              )}

              {/* Node Border container */}
              <motion.circle
                r={isActive ? 28 : 22}
                fill="var(--surface-color)"
                stroke={isCompleted ? "var(--low)" : isActive ? "var(--primary)" : "var(--border-color)"}
                strokeWidth={isActive ? 4 : 2}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ 
                  filter: isCompleted 
                    ? 'drop-shadow(0px 2px 8px rgba(16,185,129,0.15))' 
                    : isActive 
                    ? 'drop-shadow(0px 4px 12px rgba(37,99,235,0.2))' 
                    : 'drop-shadow(0px 1px 3px rgba(0,0,0,0.02))',
                  transition: 'stroke 0.3s, stroke-width 0.3s, r 0.3s'
                }}
              />

              {/* Text label details */}
              <text
                textAnchor="middle"
                y={isActive ? "42" : "36"}
                fill={isActive ? "var(--primary)" : isCompleted ? "var(--text-primary)" : "var(--text-secondary)"}
                fontSize="11"
                fontWeight={isActive ? "800" : isCompleted ? "700" : "600"}
                fontFamily="var(--font-sans)"
                letterSpacing="-0.01em"
              >
                {agent.name}
              </text>

              {/* Icon or Status Text inside node */}
              <g transform="translate(0, 0)" style={{ color: isCompleted ? 'var(--low)' : isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                {isCompleted ? (
                  <text textAnchor="middle" dy="3.5" fill="var(--low)" fontSize="12" fontWeight="bold">✓</text>
                ) : (
                  <text textAnchor="middle" dy="3.5" fill={isActive ? 'var(--primary)' : 'var(--text-muted)'} fontSize="11" fontWeight="bold">
                    {agent.short}
                  </text>
                )}
              </g>
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
};
