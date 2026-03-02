import React, { useState } from 'react';
import type { SimplifiedError } from '@/types';

interface ErrorPanelProps {
  error: SimplifiedError | null;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ error }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!error) {
    return (
      <div className="error-panel">
        <div className="error-panel-header">
          <h3 className="error-panel-title">Errors</h3>
        </div>
        <div className="error-panel-content">
          <div className="error-panel-empty">
            <div className="error-success-icon">✓</div>
            <p>No errors</p>
            <p className="error-success-message">Program executed successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  const confidenceColor = {
    high: '#4CAF50',
    medium: '#FF9800',
    low: '#F44336',
  };

  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <h3 className="error-panel-title">Errors</h3>
        <div
          className="error-confidence"
          style={{ color: confidenceColor[error.confidence] }}
          title={`Explanation confidence: ${error.confidence}`}
        >
          {error.confidence === 'high' && '●●●'}
          {error.confidence === 'medium' && '●●○'}
          {error.confidence === 'low' && '●○○'}
        </div>
      </div>

      <div className="error-panel-content">
        <div className="error-card">
          <div className="error-header">
            <span className="error-icon">❌</span>
            <h4 className="error-title">
              {error.title} on line {error.location.line}
            </h4>
          </div>

          <div className="error-section">
            <h5 className="error-section-title">❓ What happened:</h5>
            <p className="error-explanation">{error.explanation}</p>
          </div>

          <div className="error-section">
            <h5 className="error-section-title">📍 Where:</h5>
            <div className="error-location">
              <p>
                {error.location.file}, line {error.location.line}
                {error.location.column && `, column ${error.location.column}`}
              </p>
              {error.location.snippet && (
                <pre className="error-snippet">
                  <code>{error.location.snippet}</code>
                  {error.location.column && (
                    <div
                      className="error-pointer"
                      style={{ paddingLeft: `${error.location.column - 1}ch` }}
                    >
                      ^
                    </div>
                  )}
                </pre>
              )}
            </div>
          </div>

          <div className="error-section">
            <h5 className="error-section-title">🔧 How to fix:</h5>
            <ul className="error-fix-steps">
              {error.fixSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="error-original-toggle">
            <button
              className="error-toggle-button"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? '▲' : '▼'} Show original error
            </button>

            {showOriginal && (
              <pre className="error-original">
                <code>{error.originalError}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
