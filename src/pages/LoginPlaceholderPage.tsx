import React from 'react';
import { useAuthStore } from '@/store/authStore';
import '@/styles/ide.css';

export const LoginPlaceholderPage: React.FC = () => {
  const { startOAuthLogin, error, clearError } = useAuthStore();

  const handleLogin = () => {
    clearError();
    startOAuthLogin();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#000000',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: '#000000' }}>
          YaizY | Python IDE
        </h1>
        <div style={{ fontSize: 60, marginTop: 8 }}>🐍</div>

        <p style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 8px', color: '#000000' }}>
          Sign in to start coding
        </p>
        <p style={{ fontSize: 14, margin: '8px 0', color: '#000000' }}>
          The editor requires a YaizY account
        </p>

        {error && (
          <p style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>{error}</p>
        )}

        <button
          type="button"
          onClick={handleLogin}
          style={{
            marginTop: 24,
            padding: '8px 24px',
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: '#00A8FF',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Continue with YaizY
        </button>
      </div>
    </div>
  );
};
