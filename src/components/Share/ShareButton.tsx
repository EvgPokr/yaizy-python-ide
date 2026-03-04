import React, { useState } from 'react';
import { projectsClient } from '@/lib/api/projectsClient';
import './ShareButton.css';

interface ShareButtonProps {
  projectId: string;
  projectName: string;
  isPublic: boolean;
  onUpdate: (isPublic: boolean) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  projectId,
  projectName,
  isPublic,
  onUpdate,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localIsPublic, setLocalIsPublic] = useState(isPublic);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/${projectId}`;

  const handleTogglePublic = async () => {
    setIsUpdating(true);
    try {
      await projectsClient.updateProject(projectId, undefined, undefined, !localIsPublic);
      setLocalIsPublic(!localIsPublic);
      onUpdate(!localIsPublic);
    } catch (err: any) {
      alert(err.message || 'Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!localIsPublic) {
      alert('Please make project public first to share it');
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('execCommand failed');
        }
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  return (
    <>
      <button
        className="share-button"
        onClick={() => setShowDialog(true)}
        title="Share project"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Share
      </button>

      {showDialog && (
        <div className="share-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Share "{projectName}"</h3>

            <div className="share-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={localIsPublic}
                  onChange={handleTogglePublic}
                  disabled={isUpdating}
                />
                <span>Make project public</span>
              </label>
              <p className="share-toggle-hint">
                {localIsPublic
                  ? '✅ Anyone with link can view and fork this project'
                  : '🔒 Only you can access this project'}
              </p>
            </div>

            {localIsPublic && (
              <div className="share-link-section">
                <label>Share Link:</label>
                <div className="share-link-input">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={copied ? 'copied' : ''}
                    disabled={copied}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <div className="share-dialog-actions">
              <button onClick={() => setShowDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
