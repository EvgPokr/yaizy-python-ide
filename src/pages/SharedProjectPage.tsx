import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsClient, Project } from '@/lib/api/projectsClient';
import { BackendLayout } from '@/components/IDE/BackendLayout';
import { useIDEStore } from '@/store/ideStore';
import { useAuthStore } from '@/store/authStore';
import './SharedProjectPage.css';

export const SharedProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [forkName, setForkName] = useState('');
  const [isForking, setIsForking] = useState(false);
  const { setProject, project } = useIDEStore();

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }

    loadPublicProject();
  }, [projectId]);

  const loadPublicProject = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const publicProject = await projectsClient.getPublicProject(projectId);
      
      // Convert to IDE format
      const ideProject = {
        id: publicProject.id,
        name: publicProject.name + ' (Shared)',
        files: publicProject.files.map(file => ({
          id: file.id,
          name: file.name,
          content: file.content,
          language: 'python' as const,
          createdAt: new Date(file.created_at),
          updatedAt: new Date(file.updated_at),
        })),
        activeFileId: publicProject.files[0]?.id || '',
        createdAt: new Date(publicProject.created_at),
        updatedAt: new Date(publicProject.updated_at),
      };

      setProject(ideProject);
      setForkName(publicProject.name + ' (My Copy)');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load public project:', err);
      setError(err.message || 'Failed to load project');
      setIsLoading(false);
    }
  };

  const handleFork = async () => {
    if (!projectId) return;

    if (!isAuthenticated) {
      // Guest mode - just copy to LocalStorage
      if (project) {
        const forkedProject = {
          ...project,
          id: crypto.randomUUID(),
          name: forkName || project.name,
        };
        setProject(forkedProject);
        setShowForkDialog(false);
        navigate('/');
        alert('Project copied! You can now edit it. Login to save permanently.');
      }
      return;
    }

    // Authenticated - save to backend
    setIsForking(true);
    try {
      const forkedProject = await projectsClient.forkProject(projectId, forkName);
      setShowForkDialog(false);
      navigate(`/editor/${forkedProject.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to fork project');
    } finally {
      setIsForking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="shared-loading">
        Loading shared project...
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-error">
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <>
      <div className="shared-banner">
        <div className="banner-content">
          <span>📖 Viewing shared project (read-only)</span>
          <button
            className="fork-banner-button"
            onClick={() => setShowForkDialog(true)}
          >
            🔀 Fork to Edit
          </button>
        </div>
      </div>

      <BackendLayout />

      {showForkDialog && (
        <div className="fork-dialog-overlay" onClick={() => setShowForkDialog(false)}>
          <div className="fork-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Fork Project</h3>
            <p>Create your own copy to edit</p>
            
            <input
              type="text"
              value={forkName}
              onChange={(e) => setForkName(e.target.value)}
              placeholder="Project name"
              autoFocus
            />

            <div className="fork-dialog-actions">
              <button onClick={handleFork} disabled={isForking || !forkName.trim()}>
                {isForking ? 'Forking...' : 'Fork Project'}
              </button>
              <button onClick={() => setShowForkDialog(false)} className="cancel">
                Cancel
              </button>
            </div>

            {!isAuthenticated && (
              <p className="fork-hint">
                💡 Login to save your forked project permanently
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
