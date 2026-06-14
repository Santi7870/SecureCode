import React from 'react';
import { FileText, Code } from 'lucide-react';
import { ScanResponse } from '../types';

interface ReportActionsProps {
  scan: ScanResponse;
}

export const ReportActions: React.FC<ReportActionsProps> = ({ scan }) => {
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  };

  const handleDownloadMarkdown = () => {
    downloadFile(scan.report_markdown, `security_report_${scan.scan_id}.md`, 'text/markdown');
  };

  const handleDownloadJSON = () => {
    downloadFile(JSON.stringify(scan.report_json, null, 2), `security_report_${scan.scan_id}.json`, 'application/json');
  };

  return (
    <div className="actions-container">
      <button className="btn-secondary" onClick={handleDownloadMarkdown} disabled={!scan.report_markdown} style={{ flex: 1 }}>
        <FileText size={16} style={{ color: 'var(--primary-color)' }} />
        <span style={{ fontWeight: 600 }}>Download Markdown Report</span>
      </button>
      <button className="btn-secondary" onClick={handleDownloadJSON} disabled={!scan.report_json} style={{ flex: 1 }}>
        <Code size={16} style={{ color: 'var(--primary-color)' }} />
        <span style={{ fontWeight: 600 }}>Download JSON Report</span>
      </button>
    </div>
  );
};
