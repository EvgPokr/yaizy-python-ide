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

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, fullName, email, grade, age);
      }
      onClose();
    } catch (err) {
      // Error is already set in store
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
      </form>
    </div>
  );
};
