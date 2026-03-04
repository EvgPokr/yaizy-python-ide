import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsClient, Project } from '@/lib/api/projectsClient';
import { BackendLayout } from '@/components/IDE/BackendLayout';
import { useIDEStore } from '@/store/ideStore';
import { useProjectMetaStore } from '@/store/projectMetaStore';
import { useAuthStore } from '@/store/authStore';
import { projectStorage } from '@/lib/storage/projectStorage';
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
  const { setReadOnly } = useProjectMetaStore();

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }

    // Enable read-only mode
    setReadOnly(true);
    loadPublicProject();

    // Cleanup: disable read-only when leaving page
    return () => {
      setReadOnly(false);
    };
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
    console.log('Fork button clicked!', { projectId, isAuthenticated, forkName });
    
    if (!projectId) {
      console.error('No projectId');
      return;
    }

    if (!forkName.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!isAuthenticated) {
      // Guest mode - just copy to LocalStorage
      console.log('Guest mode fork');
      if (project) {
        try {
          // Create forked project with new ID but keep all content
          const forkedProject = {
            ...project,
            id: `guest-${Date.now()}`,
            name: forkName,
            // Keep all files with their content!
            files: project.files.map(file => ({
              ...file,
              id: `file-${Date.now()}-${Math.random()}`,
            })),
          };
          console.log('Forked project (guest):', forkedProject);
          
          // Disable read-only and set the forked project
          setReadOnly(false);
          setProject(forkedProject);
          
          // Save to localStorage
          await projectStorage.save(forkedProject);
          
          // Close dialog and navigate
          setShowForkDialog(false);
          navigate('/');
          // No alert - just navigate!
        } catch (err: any) {
          console.error('Guest fork error:', err);
          alert('Failed to copy project: ' + err.message);
        }
      }
      return;
    }

    // Authenticated - save to backend
    console.log('Authenticated fork');
    setIsForking(true);
    try {
      const forkedProject = await projectsClient.forkProject(projectId, forkName);
      console.log('Forked project (auth):', forkedProject);
      setShowForkDialog(false);
      setReadOnly(false); // Disable read-only
      navigate(`/editor/${forkedProject.id}`);
    } catch (err: any) {
      console.error('Fork error:', err);
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
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982"/>
              <path d="m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353"/>
              <path d="m15 5 4 4"/>
              <path d="m2 2 20 20"/>
            </svg>
            Viewing shared project (read-only)
          </span>
          <button
            className="fork-banner-button"
            onClick={() => setShowForkDialog(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 7a2 2 0 0 0-2 2v11"/>
              <path d="M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21"/>
              <path d="M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10"/>
            </svg>
            Fork to Edit
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
