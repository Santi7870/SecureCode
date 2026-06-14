import React, { useRef, useState } from 'react';
import { FileArchive, X, AlertCircle } from 'lucide-react';

interface ZipUploaderProps {
  onScan: (file: File) => void;
  isLoading: boolean;
}

export const ZipUploader: React.FC<ZipUploaderProps> = ({ onScan, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndStage = (file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext !== '.zip') {
      setError(`Unsupported file type '${ext}'. Please upload a ZIP archive (.zip)`);
      return;
    }
    const maxMb = 200;
    if (file.size / (1024 * 1024) > maxMb) {
      setError(`Repository archive exceeds maximum size limit of ${maxMb}MB.`);
      return;
    }
    setStagedFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    dragCounter.current++;
    if (!isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndStage(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndStage(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (stagedFile && !isLoading) {
      onScan(stagedFile);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="panel-card" style={{ padding: '0.75rem 0' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
        Upload Repository ZIP Archive (max 200MB):
      </label>

      {!stagedFile ? (
        <div
          className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          style={{
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '2.5rem 1.5rem',
            border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
            backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--border-light)',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".zip"
            disabled={isLoading}
          />
          <FileArchive size={32} className="upload-dropzone-icon" style={{ color: 'var(--secondary)', pointerEvents: 'none' }} />
          <p className="upload-dropzone-text" style={{ marginTop: '8px', fontSize: '0.85rem', pointerEvents: 'none' }}>
            Drag & drop your repository ZIP here, or <span style={{ color: 'var(--secondary)', fontWeight: 600, pointerEvents: 'none' }}>browse files</span>
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', pointerEvents: 'none' }}>
            Supports standard zip packages up to 200MB
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Staged File Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(3, 7, 18, 0.35)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <FileArchive size={28} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {stagedFile.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatSize(stagedFile.size)}
                </span>
              </div>
            </div>

            {!isLoading && (
              <button
                onClick={handleRemove}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Remove archive"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="scan-btn"
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent-gradient)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.75 : 1,
              width: '100%',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
          >
            <span>{isLoading ? 'Analyzing Repository...' : 'Run Repository Security Scan'}</span>
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: '8px', color: 'var(--critical-color)', fontSize: '0.8rem', marginTop: '8px', padding: '0 4px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
