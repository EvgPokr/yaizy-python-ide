import React, { useState } from 'react';
import './ForgotPasswordDialog.css';

interface ForgotPasswordDialogProps {
  onClose: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-overlay" onClick={onClose}>
      <div className="forgot-password-dialog" onClick={(e) => e.stopPropagation()}>
        {!success ? (
          <>
            <h3>Reset Password</h3>
            <p>Enter your email address and we'll send you a link to reset your password.</p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-field">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoFocus
                />
              </div>

              <div className="dialog-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={onClose} className="cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3>Check Your Email</h3>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
            <p>Click the link in the email to reset your password.</p>
            <button onClick={onClose} className="submit-button">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};
