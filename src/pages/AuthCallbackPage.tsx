import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { parseOAuthCallback } from '@/lib/auth/oauthCallback';

/**
 * Handles the redirect back from the OAuth flow.
 * The local session token arrives in the URL fragment (#token=...),
 * errors arrive as a query parameter (?error=...).
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOAuthLogin } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const result = parseOAuthCallback(location.hash, location.search);

    if (result.error) {
      setError(result.error);
      setProcessing(false);
      return;
    }

    completeOAuthLogin(result.token!)
      .then(() => {
        // Clean the token from the URL, then continue to projects
        navigate('/projects', { replace: true });
      })
      .catch((e) => {
        setError(e.message || 'Login failed');
        setProcessing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {processing ? (
        <div style={{ fontSize: '18px', color: '#999' }}>Signing you in...</div>
      ) : (
        <>
          <div style={{ fontSize: '18px', color: '#d33' }}>
            Login failed: {error}
          </div>
          <button
            onClick={() => useAuthStore.getState().startOAuthLogin()}
            style={{
              padding: '10px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
};
