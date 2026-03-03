import React, { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuthStore } from '@/store/authStore';
import './LoginDropdown.css';

interface LoginDropdownProps {
  onClose: () => void;
}

const RECAPTCHA_SITE_KEY = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

export const LoginDropdown: React.FC<LoginDropdownProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Check CAPTCHA for registration
    if (mode === 'register' && !captchaToken) {
      alert('Please complete the CAPTCHA');
      return;
    }

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, fullName, email, captchaToken || undefined);
      }
      onClose();
    } catch (err) {
      // Error is already set in store
      // Reset CAPTCHA on error
      if (mode === 'register') {
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    }
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
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
        {error && (
          <div className="dropdown-error">
            {error}
          </div>
        )}

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

        <div className="form-field">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
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
            
            {/* reCAPTCHA */}
            <div className="recaptcha-container">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
              />
            </div>
          </>
        )}

        <button type="submit" className="dropdown-submit" disabled={isLoading || (mode === 'register' && !captchaToken)}>
          {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
        </button>

        {mode === 'login' && (
          <div className="dropdown-hint">
            Default: <strong>teacher</strong> / <strong>teacher123</strong>
          </div>
        )}
      </form>
    </div>
  );
};
