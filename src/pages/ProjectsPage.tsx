import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { projectsClient, Project } from '@/lib/api/projectsClient';
import './ProjectsPage.css';

export const ProjectsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsClient.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await projectsClient.createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
      await loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleOpenProject = (project: Project) => {
    // Store current project in IDE store and navigate
    navigate(`/editor/${project.id}`);
  };

  const handleRenameProject = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await projectsClient.updateProject(id, editingName.trim());
      setEditingId(null);
      await loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to rename project');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;

    try {
      await projectsClient.deleteProject(id);
      await loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div className="header-left">
          <h1>My Projects</h1>
          {user && <p className="user-info">Welcome, {user.full_name || user.username}!</p>}
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="projects-container">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadProjects}>Retry</button>
          </div>
        )}

        <div className="projects-actions">
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)} 
              className="create-project-button"
            >
              + New Project
            </button>
          ) : (
            <form onSubmit={handleCreateProject} className="create-project-form">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
              />
              <button type="submit">Create</button>
              <button type="button" onClick={() => {
                setIsCreating(false);
                setNewProjectName('');
              }}>
                Cancel
              </button>
            </form>
          )}
        </div>

        {isLoading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet</p>
            <p className="empty-hint">Create your first project to get started</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                {editingId === project.id ? (
                  <div className="project-edit">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRenameProject(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameProject(project.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <div className="project-header">
                      <h3 onClick={() => handleOpenProject(project)}>
                        {project.name}
                      </h3>
                      <div className="project-actions">
                        <button
                          onClick={() => {
                            setEditingId(project.id);
                            setEditingName(project.name);
                          }}
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="delete-button"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="project-meta">
                      <span>{project.files.length} file(s)</span>
                      <span>Updated {formatDate(project.updated_at)}</span>
                    </div>
                    <button
                      onClick={() => handleOpenProject(project)}
                      className="open-button"
                    >
                      Open
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
