import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx'];

  const validateAndUpload = (file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file extension '${ext}'. Allowed types: ${allowedExtensions.join(', ')}`);
      return;
    }
    const maxMb = 5;
    if (file.size / (1024 * 1024) > maxMb) {
      setError(`File exceeds maximum size limit of ${maxMb}MB.`);
      return;
    }
    onUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-title">
        <Upload size={20} />
        <span>Upload File to Scan</span>
      </div>

      <div
        className="upload-dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".py,.js,.ts,.jsx,.tsx"
          disabled={isLoading}
        />
        <FileText size={32} className="upload-dropzone-icon" />
        <p className="upload-dropzone-text" style={{ marginTop: '8px' }}>
          Drag & drop a file here, or <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>browse files</span>
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Supports Python (.py) and JavaScript/TypeScript (.js, .jsx, .ts, .tsx) up to 5MB
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '8px', color: 'var(--critical-color)', fontSize: '0.8rem', marginTop: '8px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
