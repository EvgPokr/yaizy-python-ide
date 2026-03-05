import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PyodideStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useProjectMetaStore } from '@/store/projectMetaStore';
import { useIDEStore } from '@/store/ideStore';
import { projectsClient } from '@/lib/api/projectsClient';
import { projectStorage } from '@/lib/storage/projectStorage';
import { LoginDropdown } from '../Auth/LoginDropdown';
import { ProfileDropdown } from '../Auth/ProfileDropdown';
import { ShareButton } from '../Share/ShareButton';
import { ForgotPasswordDialog } from '../Auth/ForgotPasswordDialog';

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
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);

  useEffect(() => {
    const handleOpenForgotPassword = () => {
      setShowForgotPasswordDialog(true);
    };

    window.addEventListener('openForgotPassword', handleOpenForgotPassword);
    return () => window.removeEventListener('openForgotPassword', handleOpenForgotPassword);
  }, []);

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

  const getUniqueUntitledName = async () => {
    try {
      // Get all existing projects
      const projects = await projectsClient.getProjects();
      const existingNames = projects.map(p => p.name.toLowerCase());
      
      // If no "untitled" exists, return "Untitled"
      if (!existingNames.includes('untitled')) {
        return 'Untitled';
      }
      
      // Find the next available number
      let number = 1;
      while (existingNames.includes(`untitled-${number}`)) {
        number++;
      }
      
      return `Untitled-${number}`;
    } catch (error) {
      // If error fetching projects, just return "Untitled"
      console.error('Failed to fetch projects for unique name:', error);
      return 'Untitled';
    }
  };

  const handleNewProject = async () => {
    if (!isAuthenticated) {
      // Guest mode: confirm before creating new project
      const confirmed = window.confirm(
        'Creating a new project will replace your current work. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        return;
      }
      
      // Create new empty project in localStorage and reload
      const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const newProject = {
        id: generateId(),
        name: 'Untitled Project',
        files: [
          {
            id: generateId(),
            name: 'main.py',
            content: '# Write your first Python code\n',
            language: 'python' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        activeFileId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      newProject.activeFileId = newProject.files[0].id;
      
      await projectStorage.save(newProject);
      
      // Reload the page to show new project
      window.location.href = '/';
      return;
    }

    try {
      // Authenticated: Create new project with unique "Untitled" name
      const projectName = await getUniqueUntitledName();
      const newProject = await projectsClient.createProject(projectName, '', false);
      
      // Navigate to the new project's editor
      navigate(`/editor/${newProject.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
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
          <img src="/yaizy-logo-new.png" alt="YaizY" className="logo-image" />
          <span className="logo-divider">|</span>
          <span className="logo-title">Python Editor</span>
        </div>

        {/* File Menu */}
        <div className="file-menu-container">
          <button
            className="file-menu-button"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <span className="file-menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
              </svg>
            </span>
            File ▾
          </button>
          {showFileMenu && (
            <div className="file-menu-dropdown">
              <button onClick={() => {
                handleNewProject();
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                    <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                  </svg>
                </span>
                New
              </button>
              <button onClick={() => {
                handleImportClick();
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                    <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                    <path d="M12 12v6"/>
                    <path d="m15 15-3-3-3 3"/>
                  </svg>
                </span>
                Load from your computer
              </button>
              <button onClick={() => {
                onExport();
                setShowFileMenu(false);
              }}>
                <span className="menu-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                    <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                    <path d="M12 18v-6"/>
                    <path d="m9 15 3 3 3-3"/>
                  </svg>
                </span>
                Save to your computer
              </button>
            </div>
          )}
        </div>

        {/* Project Name (editable) - only show when authenticated */}
        {project && isAuthenticated && (
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
                className={`project-name-editable ${project.name.startsWith('Untitled') ? 'untitled' : ''}`}
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
                <span className="profile-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 0 0-16 0"/>
                  </svg>
                </span>
                <span className="profile-username">{user?.username} ▾</span>
              </button>
              {showProfileDropdown && (
                <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
              )}
            </>
          )}
        </div>
      </div>

      {showForgotPasswordDialog && (
        <ForgotPasswordDialog onClose={() => setShowForgotPasswordDialog(false)} />
      )}
    </header>
  );
};
