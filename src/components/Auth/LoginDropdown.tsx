import React, { useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import './LoginDropdown.css';

interface LoginDropdownProps {
  onClose: () => void;
}

export const LoginDropdown: React.FC<LoginDropdownProps> = ({ onClose }) => {
  const { startOAuthLogin, error, clearError } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogin = () => {
    clearError();
    onClose();
    startOAuthLogin();
  };

  return (
    <div className="login-dropdown" ref={dropdownRef}>
      <div className="dropdown-tabs">
        <button className="active">Login</button>
      </div>

      <div className="dropdown-form">
        {error && <div className="dropdown-error">{error}</div>}

        <p style={{ margin: '8px 0 16px', fontSize: '14px', opacity: 0.8 }}>
          Sign in with your YaizY account to save projects and sync your work.
        </p>

        <button
          type="button"
          className="dropdown-submit"
          onClick={handleLogin}
        >
          Continue with YaizY
        </button>
      </div>
    </div>
  );
};
