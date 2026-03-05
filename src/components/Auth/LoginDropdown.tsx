import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import './LoginDropdown.css';

interface LoginDropdownProps {
  onClose: () => void;
}

export const LoginDropdown: React.FC<LoginDropdownProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [age, setAge] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuthStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setShowForgotPassword(false);

    try {
      if (mode === 'login') {
        await login(username, password);
        onClose();
      } else {
        await register(username, password, fullName, email, grade, age);
        onClose();
      }
    } catch (err) {
      if (mode === 'login') {
        setShowForgotPassword(true);
      }
    }
  };

  return (
    <div className="login-dropdown" ref={dropdownRef}>
      <div className="dropdown-tabs">
        <button
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dropdown-form">
        {error && <div className="dropdown-error">{error}</div>}

        <div className="form-field">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            autoFocus
          />
        </div>

        <div className="form-field password-field">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                <path d="m2 2 20 20"/>
              </svg>
            )}
          </button>
        </div>

        {mode === 'register' && (
          <>
            <div className="form-field">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div className="form-field">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div className="form-field">
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Grade (optional)"
              />
            </div>
            <div className="form-field">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age (optional)"
                min="1"
                max="120"
              />
            </div>
          </>
        )}

        <button type="submit" className="dropdown-submit" disabled={isLoading}>
          {isLoading
            ? 'Processing...'
            : mode === 'login'
              ? 'Login'
              : 'Register'}
        </button>

        {mode === 'login' && showForgotPassword && (
          <div className="forgot-password-link">
            <button 
              type="button"
              onClick={() => {
                onClose();
                // Will open forgot password dialog
                const event = new CustomEvent('openForgotPassword');
                window.dispatchEvent(event);
              }}
            >
              Forgot password?
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
