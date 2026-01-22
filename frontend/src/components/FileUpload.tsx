import React, { useRef, useState } from 'react';
import type { Attachment } from '../services/storageService';

interface FileUploadProps {
  attachments: Attachment[];
  onFilesSelected: (files: File[]) => void;
  onRemoveAttachment: (attachment: Attachment) => void;
  pendingFiles?: File[];
  onRemovePendingFile?: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onFilesSelected,
  onRemoveAttachment,
  pendingFiles = [],
  onRemovePendingFile,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const isImage = (type: string): boolean => type.startsWith('image/');

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <div className="file-upload-content">
          <span className="file-upload-icon">📁</span>
          <p className="file-upload-text">
            {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
          </p>
          <p className="file-upload-hint">Photos, PDFs, or any file type</p>
        </div>
      </div>

      {/* Pending files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="file-list">
          <p className="file-list-label">Files to upload:</p>
          {pendingFiles.map((file, index) => (
            <div key={`pending-${index}`} className="file-item pending">
              <span className="file-icon">{getFileIcon(file.type)}</span>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              {onRemovePendingFile && (
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePendingFile(file);
                  }}
                  disabled={disabled}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="file-list">
          <p className="file-list-label">Attached files:</p>
          {attachments.map((attachment) => (
            <div key={attachment.id} className="file-item">
              {isImage(attachment.type) ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="file-thumbnail"
                />
              ) : (
                <span className="file-icon">{getFileIcon(attachment.type)}</span>
              )}
              <div className="file-info">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-name file-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {attachment.name}
                </a>
                <span className="file-size">{formatFileSize(attachment.size)}</span>
              </div>
              <button
                type="button"
                className="file-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAttachment(attachment);
                }}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
