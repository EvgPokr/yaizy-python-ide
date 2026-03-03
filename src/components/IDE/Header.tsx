import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PyodideStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useProjectMetaStore } from '@/store/projectMetaStore';
import { useIDEStore } from '@/store/ideStore';
import { projectsClient } from '@/lib/api/projectsClient';
import { LoginDropdown } from '../Auth/LoginDropdown';
import { ProfileDropdown } from '../Auth/ProfileDropdown';
import { ShareButton } from '../Share/ShareButton';

interface HeaderProps {
  onRun: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isRunning: boolean;
  pyodideStatus: PyodideStatus;
}

interface RunControlsProps {
  onRun: () => void;
  onClear: () => void;
  isRunning: boolean;
  pyodideStatus: PyodideStatus;
}

// Separate component for Run/Clear controls to be used above terminal
export const RunControls: React.FC<RunControlsProps> = ({ onRun, onClear, isRunning, pyodideStatus }) => {
  return (
    <div className="run-controls">
      <button
        className="run-control-button run-button"
        onClick={onRun}
        disabled={isRunning || pyodideStatus !== 'ready'}
        title="Run code (Ctrl+Enter)"
      >
        <span className="button-icon">▶</span>
        <span className="button-text">Run</span>
      </button>

      <button
        className="run-control-button clear-button"
        onClick={onClear}
        disabled={isRunning}
        title="Clear console (Esc)"
      >
        <span className="button-text">Clear</span>
      </button>
      
      {pyodideStatus === 'loading' && (
        <div className="run-control-status">
          <span className="status-spinner">⚙</span>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onClear,
  onExport,
  onImport,
  isRunning,
  pyodideStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { projectMeta, updateIsPublic } = useProjectMetaStore();
  const { project, updateFileContent } = useIDEStore();
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingName, setEditingName] = useState('');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
      setShowFileMenu(false);
    }
  };

  const handleStartEditName = () => {
    if (project) {
      setEditingName(project.name);
      setIsEditingProjectName(true);
    }
  };

  const handleSaveProjectName = async () => {
    if (!editingName.trim() || !projectMeta) {
      setIsEditingProjectName(false);
      return;
    }

    try {
      await projectsClient.updateProject(projectMeta.id, editingName.trim());
      // Update local project name
      if (project) {
        project.name = editingName.trim();
      }
      setIsEditingProjectName(false);
    } catch (err: any) {
      alert(err.message || 'Failed to rename project');
      setIsEditingProjectName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter для запуска
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isRunning && pyodideStatus === 'ready') {
        onRun();
      }
    }

    // Escape для очистки консоли (только если не выполняется код)
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!isRunning) {
        onClear();
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [isRunning, pyodideStatus]);

  return (
    <header className="ide-header">
      <div className="header-left">
        {/* Logo */}
        <div className="header-logo" onClick={() => navigate('/')} title="Go to home">
          <span className="logo-brand">YaizY</span>
          <span className="logo-divider">|</span>
          <span className="logo-title">Python Editor</span>
        </div>

        {/* File Menu */}
        <div className="file-menu-container">
          <button
            className="file-menu-button"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <span className="file-menu-icon">📄</span>
            File ▾
          </button>
          {showFileMenu && (
            <div className="file-menu-dropdown">
              <button onClick={() => {
                navigate('/projects');
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">📄</span>
                New
              </button>
              <button onClick={() => {
                handleImportClick();
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">📥</span>
                Import
              </button>
              <button onClick={() => {
                onExport();
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">📤</span>
                Export
              </button>
            </div>
          )}
        </div>

        {/* Project Name (editable) */}
        {project && (
          <div className="project-name-container">
            {isEditingProjectName ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleSaveProjectName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveProjectName();
                  if (e.key === 'Escape') setIsEditingProjectName(false);
                }}
                className="project-name-input"
                autoFocus
              />
            ) : (
              <div
                className="project-name-editable"
                onClick={handleStartEditName}
                title="Click to rename"
              >
                {project.name}
              </div>
            )}
          </div>
        )}

        {/* Share Button */}
        {projectMeta && isAuthenticated && (
          <ShareButton
            projectId={projectMeta.id}
            projectName={projectMeta.name}
            isPublic={projectMeta.is_public}
            onUpdate={updateIsPublic}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="header-right">
        {/* Auth button */}
        <div style={{ position: 'relative' }}>
          {!isAuthenticated ? (
            <>
              <button
                className="login-button"
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                title="Login"
              >
                Login
              </button>
              {showLoginDropdown && (
                <LoginDropdown onClose={() => setShowLoginDropdown(false)} />
              )}
            </>
          ) : (
            <>
              <button
                className="profile-button-extended"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title={user?.username || 'Profile'}
              >
                <span className="profile-icon">👤</span>
                <span className="profile-username">{user?.username}</span>
              </button>
              {showProfileDropdown && (
                <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
