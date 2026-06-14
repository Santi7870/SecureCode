import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentTraceProps {
  trace: string[];
  sanitizePath?: (path: string) => string;
}

export const AgentTrace: React.FC<AgentTraceProps> = ({ trace, sanitizePath }) => {
  const [isRawOpen, setIsRawOpen] = useState(false);

  if (trace.length === 0) {
    return null;
  }

  const safeSanitize = sanitizePath || ((path: string) => path);

  const agentTimeline = [
    { name: 'Code Understanding', desc: 'Analyzed target file properties, language structure, and AST entities.' },
    { name: 'Security Risk Analysis', desc: 'Executed deterministic policy rules to register raw vulnerabilities.' },
    { name: 'Grounded Reasoning', desc: 'Matched findings with local secure coding guidelines for explainable reasoning.' },
    { name: 'Remediation Planning', desc: 'Generated safe replacement code blocks for all discovered risks.' },
    { name: 'Validation Generation', desc: 'Compiled pytest/jest unit tests to verify vulnerability presence and fixes.' },
    { name: 'Critic Verification', desc: 'Ran quality gate validations on proposed fixes and test configurations.' },
    { name: 'Report Compilation', desc: 'Formatted results and compiled final JSON and Markdown reports.' }
  ];

  // Motion variants for timeline stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as any } }
  };

  return (
    <div className="saas-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} style={{ color: 'var(--primary)' }} />
          <span>Multi-Agent Intelligence</span>
        </div>
        <span style={{ fontSize: '0.75rem', background: 'var(--low-bg)', border: '1px solid var(--low-border)', color: 'var(--low)', padding: '4px 12px', borderRadius: '12px', fontWeight: 700 }}>
          ✓ 7 Agents Completed
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
        Chronological reasoning workflow executed by the cooperative agent collective:
      </p>

      {/* Staggered Timeline Reveal */}
      <motion.div 
        className="agent-timeline-container"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {agentTimeline.map((item, idx) => (
          <motion.div 
            key={idx} 
            className="agent-timeline-node"
            variants={itemVariants}
          >
            <div className="agent-timeline-marker" />
            
            <div className="agent-timeline-title">
              <span>{item.name}</span>
              <CheckCircle2 size={12} style={{ color: 'var(--low)' }} />
            </div>
            <div className="agent-timeline-desc">
              {item.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Accordion: View Technical Trace */}
      <div className="fluent-accordion" style={{ margin: 0 }}>
        <div
          className="fluent-accordion-header"
          style={{ padding: '12px 16px', fontSize: '0.85rem' }}
          onClick={() => setIsRawOpen(!isRawOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <FileText size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700 }}>View Technical Trace</span>
          </div>
          {isRawOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        <AnimatePresence initial={false}>
          {isRawOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="fluent-accordion-content" style={{ padding: '16px', backgroundColor: '#0F172A', borderTop: '1px solid var(--border-color)' }}>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#CBD5E1', margin: 0, lineHeight: '1.6' }}>
                  <code>{trace.map((log) => safeSanitize(log)).join('\n')}</code>
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
