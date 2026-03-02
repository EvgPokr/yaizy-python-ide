import React, { useState } from 'react';
import type { ProjectFile } from '@/types';

interface FilePanelProps {
  files: ProjectFile[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onFileCreate: (name: string) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileDelete: (id: string) => void;
}

export const FilePanel: React.FC<FilePanelProps> = ({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');

  const handleCreateSubmit = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleCreateCancel = () => {
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameStart = (file: ProjectFile) => {
    setEditingFileId(file.id);
    setEditFileName(file.name.replace('.py', ''));
  };

  const handleRenameSubmit = (fileId: string) => {
    if (editFileName.trim()) {
      onFileRename(fileId, editFileName.trim());
    }
    setEditingFileId(null);
    setEditFileName('');
  };

  const handleRenameCancel = () => {
    setEditingFileId(null);
    setEditFileName('');
  };

  const handleDeleteClick = (file: ProjectFile) => {
    if (files.length <= 1) {
      alert('Cannot delete the last file');
      return;
    }

    if (confirm(`Delete file "${file.name}"?`)) {
      onFileDelete(file.id);
    }
  };

  return (
    <div className="file-panel">
      <div className="file-panel-header">
        <h3 className="file-panel-title">Files</h3>
        <button
          className="file-create-button"
          onClick={() => setIsCreating(true)}
          title="Create new file"
        >
          +
        </button>
      </div>

      <div className="file-list">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-item ${file.id === activeFileId ? 'active' : ''}`}
          >
            {editingFileId === file.id ? (
              <div className="file-edit">
                <input
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(file.id);
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  onBlur={() => handleRenameSubmit(file.id)}
                  autoFocus
                  className="file-edit-input"
                />
              </div>
            ) : (
              <>
                <div
                  className="file-name"
                  onClick={() => onFileSelect(file.id)}
                  onDoubleClick={() => handleRenameStart(file)}
                >
                  <span className="file-icon">📄</span>
                  <span className="file-name-text">{file.name}</span>
                </div>
                <div className="file-actions">
                  <button
                    className="file-action-button"
                    onClick={() => handleRenameStart(file)}
                    title="Rename"
                  >
                    ✎
                  </button>
                  {files.length > 1 && (
                    <button
                      className="file-action-button delete"
                      onClick={() => handleDeleteClick(file)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {isCreating && (
          <div className="file-item creating">
            <div className="file-edit">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubmit();
                  if (e.key === 'Escape') handleCreateCancel();
                }}
                onBlur={handleCreateSubmit}
                placeholder="filename.py"
                autoFocus
                className="file-edit-input"
              />
            </div>
          </div>
        )}
      </div>

      {files.length === 0 && !isCreating && (
        <div className="file-panel-empty">
          <p>No files</p>
          <button onClick={() => setIsCreating(true)}>Create file</button>
        </div>
      )}
    </div>
  );
};
