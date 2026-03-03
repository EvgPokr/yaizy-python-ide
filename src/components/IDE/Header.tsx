import React, { useRef, useState } from 'react';
import type { PyodideStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { LoginDropdown } from '../Auth/LoginDropdown';
import { ProfileDropdown } from '../Auth/ProfileDropdown';

interface HeaderProps {
  onRun: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isRunning: boolean;
  pyodideStatus: PyodideStatus;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onClear,
  onExport,
  onImport,
  isRunning,
  pyodideStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuthStore();
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      // Сброс input для повторного импорта
      e.target.value = '';
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
        <div className="header-logo">
          <span className="logo-brand">YaizY</span>
          <span className="logo-divider">|</span>
          <span className="logo-title">Python Editor</span>
        </div>
      </div>

      <div className="header-center">
        <button
          className="header-button run-button"
          onClick={onRun}
          disabled={isRunning || pyodideStatus !== 'ready'}
          title="Run code (Ctrl+Enter)"
        >
          <span className="button-icon">▶</span>
          <span className="button-text">Run</span>
        </button>

        <button
          className="header-button clear-button"
          onClick={onClear}
          disabled={isRunning}
          title="Clear console (Esc)"
        >
          <span className="button-icon">🗑️</span>
          <span className="button-text">Clear</span>
        </button>
      </div>

      <div className="header-right">
        <button
          className="header-button header-gradient-button"
          onClick={onExport}
          title="Export project"
        >
          Export
        </button>

        <button
          className="header-button header-gradient-button"
          onClick={handleImportClick}
          title="Import project"
        >
          Import
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {pyodideStatus === 'loading' && (
          <div className="header-status">
            <span className="status-spinner">⚙</span>
            <span>Loading...</span>
          </div>
        )}

        <button
          className="header-button header-gradient-button help-button"
          title="Keyboard shortcuts"
          onClick={() => {
            alert(
              'Keyboard Shortcuts:\n\n' +
                'Ctrl+Enter - Run code\n' +
                'Esc - Clear console\n' +
                'Ctrl+/ - Toggle comment'
            );
          }}
        >
          ?
        </button>

        {/* Auth button */}
        <div style={{ position: 'relative' }}>
          {!isAuthenticated ? (
            <>
              <button
                className="header-button login-button"
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
                className="header-button profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title={user?.username || 'Profile'}
              >
                <span className="profile-icon">👤</span>
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
