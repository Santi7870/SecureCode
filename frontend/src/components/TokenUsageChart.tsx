import React from 'react';

interface TokenUsageChartProps {
  promptTokens: number;
  completionTokens: number;
  embeddingTokens: number;
}

export const TokenUsageChart: React.FC<TokenUsageChartProps> = ({
  promptTokens,
  completionTokens,
  embeddingTokens,
}) => {
  const total = promptTokens + completionTokens + embeddingTokens;

  // Percentage calculations
  const pctPrompt = total > 0 ? (promptTokens / total) * 100 : 0;
  const pctCompletion = total > 0 ? (completionTokens / total) * 100 : 0;
  const pctEmbedding = total > 0 ? (embeddingTokens / total) * 100 : 0;

  // SVG parameters
  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke segments
  const dashPrompt = (circumference * pctPrompt) / 100;
  const dashCompletion = (circumference * pctCompletion) / 100;
  const dashEmbedding = (circumference * pctEmbedding) / 100;

  // Stack offsets
  const offsetPrompt = 0;
  const offsetCompletion = dashPrompt;
  const offsetEmbedding = dashPrompt + dashCompletion;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="token-chart-container" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Doughnut SVG */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
          />
          {total > 0 && (
            <>
              {/* Prompt Tokens */}
              {pctPrompt > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="url(#promptGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashPrompt} ${circumference}`}
                  strokeDashoffset={-offsetPrompt}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
                  }}
                />
              )}

              {/* Completion Tokens */}
              {pctCompletion > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="url(#completionGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashCompletion} ${circumference}`}
                  strokeDashoffset={-offsetCompletion}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
                  }}
                />
              )}

              {/* Embedding Tokens */}
              {pctEmbedding > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="url(#embeddingGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashEmbedding} ${circumference}`}
                  strokeDashoffset={-offsetEmbedding}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out',
                  }}
                />
              )}
            </>
          )}
          
          <defs>
            <linearGradient id="promptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <linearGradient id="embeddingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Overlay Summary */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Tokens
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {formatNumber(total)}
          </span>
        </div>
      </div>

      {/* Legend details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '150px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #818CF8, #6366F1)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prompt / Input</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-primary)' }}>
            {formatNumber(promptTokens)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({pctPrompt.toFixed(1)}%)</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #C084FC, #A78BFA)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completion / Output</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-primary)' }}>
            {formatNumber(completionTokens)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({pctCompletion.toFixed(1)}%)</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #34D399, #059669)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Embedding RAG</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-primary)' }}>
            {formatNumber(embeddingTokens)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({pctEmbedding.toFixed(1)}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
