import React, { useMemo } from 'react';

interface RemediationDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  originalLineNum?: number;
  newLineNum?: number;
}

export const RemediationDiffViewer: React.FC<RemediationDiffViewerProps> = ({
  originalCode,
  modifiedCode,
  language = 'typescript'
}) => {
  const diffLines = useMemo(() => {
    const one = (originalCode || '').split('\n');
    const two = (modifiedCode || '').split('\n');
    
    // DP LCS alignment on trimmed lines to ignore white-space differences in core logic matching
    const dp: number[][] = Array(one.length + 1)
      .fill(null)
      .map(() => Array(two.length + 1).fill(0));
      
    for (let i = 1; i <= one.length; i++) {
      for (let j = 1; j <= two.length; j++) {
        if (one[i - 1].trim() === two[j - 1].trim()) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    const diff: DiffLine[] = [];
    let i = one.length;
    let j = two.length;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && one[i - 1].trim() === two[j - 1].trim()) {
        diff.unshift({
          type: 'unchanged',
          value: two[j - 1], // Preserve spacing from new file
          originalLineNum: i,
          newLineNum: j
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({
          type: 'added',
          value: two[j - 1],
          newLineNum: j
        });
        j--;
      } else {
        diff.unshift({
          type: 'removed',
          value: one[i - 1],
          originalLineNum: i
        });
        i--;
      }
    }
    
    return diff;
  }, [originalCode, modifiedCode]);

  return (
    <div className="remediation-diff-container">
      <div className="diff-header">
        <div className="diff-title-tag">Code Compare ({language})</div>
        <button 
          className="copy-diff-btn" 
          onClick={() => navigator.clipboard.writeText(modifiedCode)}
          title="Copy secure code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Fix Code
        </button>
      </div>
      <div className="diff-content-wrapper">
        <table className="diff-table">
          <tbody>
            {diffLines.map((line, idx) => {
              let rowClass = 'diff-row-unchanged';
              let sign = ' ';
              if (line.type === 'added') {
                rowClass = 'diff-row-added';
                sign = '+';
              } else if (line.type === 'removed') {
                rowClass = 'diff-row-removed';
                sign = '-';
              }

              return (
                <tr key={idx} className={rowClass}>
                  <td className="diff-ln diff-ln-original">
                    {line.originalLineNum || ''}
                  </td>
                  <td className="diff-ln diff-ln-new">
                    {line.newLineNum || ''}
                  </td>
                  <td className="diff-sign-cell">{sign}</td>
                  <td className="diff-code-cell">
                    <pre><code>{line.value || ' '}</code></pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
