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

  const handleCopyLink = () => {
    if (!localIsPublic) {
      alert('Please make project public first to share it');
      return;
    }

    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <>
      <button
        className="share-button"
        onClick={() => setShowDialog(true)}
        title="Share project"
      >
        🔗 Share
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
                  <button onClick={handleCopyLink}>
                    Copy
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
