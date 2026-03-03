import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsClient, Project } from '@/lib/api/projectsClient';
import { BackendLayout } from '@/components/IDE/BackendLayout';
import { useIDEStore } from '@/store/ideStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useProjectMetaStore } from '@/store/projectMetaStore';

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setProject } = useIDEStore();
  const { setProjectMeta } = useProjectMetaStore();
  
  // Enable auto-save
  useProjectSync();

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }

    // Disable read-only mode (this is user's own project)
    setProjectMeta(null); // Will be set by loadProject
    
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const project = await projectsClient.getProject(projectId);
      
      // Store backend project metadata (includes is_public, user_id, etc.)
      setProjectMeta(project);
      
      // Convert backend project format to IDE store format
      const ideProject = {
        id: project.id,
        name: project.name,
        files: project.files.map(file => ({
          id: file.id,
          name: file.name,
          content: file.content,
          language: 'python' as const,
          createdAt: new Date(file.created_at),
          updatedAt: new Date(file.updated_at),
        })),
        activeFileId: project.files[0]?.id || '',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
      };

      setProject(ideProject);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.message || 'Failed to load project');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#999',
      }}>
        Loading project...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
      }}>
        <p style={{ color: '#c33', fontSize: '18px' }}>{error}</p>
        <button
          onClick={() => navigate('/projects')}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return <BackendLayout />;
};
