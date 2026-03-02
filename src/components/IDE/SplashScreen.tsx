import React from 'react';

interface SplashScreenProps {
  status: 'loading' | 'error';
  error?: Error | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ status, error }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <h1>
            <span className="splash-brand">YaizY</span>
            <span className="splash-divider"> | </span>
            <span className="splash-title">Python Editor</span>
          </h1>
          <div className="python-logo">🐍</div>
        </div>

        {status === 'loading' && (
          <>
            <div className="splash-spinner">
              <div className="spinner"></div>
            </div>
            <p className="splash-message">Loading Python...</p>
            <p className="splash-hint">
              First load may take a few seconds
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="splash-error">❌</div>
            <p className="splash-message error">Loading Error</p>
            <p className="splash-hint">
              {error?.message || 'Failed to load Python runtime'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="splash-retry-button"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};
