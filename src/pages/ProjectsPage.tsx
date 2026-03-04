import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { projectsClient, Project } from '@/lib/api/projectsClient';
import { foldersClient, Folder } from '@/lib/api/foldersClient';
import { ProfileDropdown } from '@/components/Auth/ProfileDropdown';
import './ProjectsPage.css';

export const ProjectsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'project' | 'folder'>('project');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsData, foldersData] = await Promise.all([
        projectsClient.getProjects(),
        foldersClient.getFolders(),
      ]);
      console.log('📦 Loaded projects:', projectsData.length, 'projects');
      console.log('Projects by folder:', projectsData.map(p => ({ name: p.name, folder_id: p.folder_id })));
      setProjects(projectsData);
      setFolders(foldersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      console.log(`Creating project via form in folder:`, selectedFolder || 'root');
      await projectsClient.createProject(newProjectName.trim(), '', false, selectedFolder);
      setNewProjectName('');
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await foldersClient.createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create folder');
    }
  };

  const handleOpenProject = (project: Project) => {
    // Store current project in IDE store and navigate
    navigate(`/editor/${project.id}`);
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      if (editingType === 'project') {
        await projectsClient.updateProject(id, editingName.trim());
      } else {
        await foldersClient.updateFolder(id, editingName.trim());
      }
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || `Failed to rename ${editingType}`);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;

    try {
      await projectsClient.deleteProject(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Projects inside will be moved to root.`)) return;

    try {
      await foldersClient.deleteFolder(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete folder');
    }
  };

  const handleMoveProject = async (projectId: string, folderId: string | null) => {
    try {
      await projectsClient.updateProject(projectId, undefined, undefined, undefined, folderId);
      setMovingProjectId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to move project');
    }
  };

  // Get projects in selected folder
  // "All Projects" shows ALL projects, other folders show only their projects
  const visibleProjects = selectedFolder
    ? projects.filter(p => p.folder_id === selectedFolder)
    : projects; // Show all projects when no folder selected

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUniqueUntitledName = () => {
    // Get all existing project names
    const existingNames = projects.map(p => p.name.toLowerCase());
    
    // If no "untitled" exists, return "Untitled"
    if (!existingNames.includes('untitled')) {
      return 'Untitled';
    }
    
    // Find the next available number
    let number = 1;
    while (existingNames.includes(`untitled-${number}`)) {
      number++;
    }
    
    return `Untitled-${number}`;
  };

  const handleNewProject = async () => {
    try {
      const projectName = getUniqueUntitledName();
      console.log(`🔵 Creating project "${projectName}" in folder:`, selectedFolder || 'root');
      
      // Create project in currently selected folder (or root if All Projects selected)
      const newProject = await projectsClient.createProject(projectName, '', false, selectedFolder);
      console.log('🟢 Project created with folder_id:', newProject.folder_id, 'Expected:', selectedFolder);
      console.log('Full project:', newProject);
      
      // Reload data to show the new project in the current view
      await loadData();
      console.log('🔄 Data reloaded. Total projects:', projects.length);
      
      // Navigate to editor after a short delay to ensure UI updates
      setTimeout(() => {
        navigate(`/editor/${newProject.id}`);
      }, 100);
    } catch (err: any) {
      console.error('❌ Failed to create project:', err);
      alert(err.message || 'Failed to create project');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div className="header-left">
          <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Go to home">
            <span className="logo-brand">YaizY</span>
            <span className="logo-divider">|</span>
            <span className="logo-title">Python Editor</span>
          </div>
          <button className="new-project-button" onClick={handleNewProject}>
            <span className="button-icon">+</span>
            <span className="button-text">New Project</span>
          </button>
        </div>
        <div className="header-right">
          <div style={{ position: 'relative' }}>
            <button
              className="profile-button-extended"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              title={user?.username || 'Profile'}
            >
              <span className="profile-icon">👤</span>
              <span className="profile-username">{user?.username} ▾</span>
            </button>
            {showProfileDropdown && (
              <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
            )}
          </div>
        </div>
      </header>

      <div className="projects-container">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        <div className="projects-layout">
          {/* Sidebar with folders */}
          <div className="folders-sidebar">
            <div className="sidebar-header">
              <h3>Folders</h3>
              {!isCreatingFolder ? (
                <button onClick={() => setIsCreatingFolder(true)} className="add-folder-button" title="New folder">
                  +
                </button>
              ) : null}
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="folder-form">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  autoFocus
                />
                <div className="folder-form-actions">
                  <button type="submit" title="Create">✓</button>
                  <button type="button" onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }} title="Cancel">✕</button>
                </div>
              </form>
            )}

            <div className="folders-list">
              <div
                className={`folder-item folder-item-root ${selectedFolder === null ? 'active' : ''}`}
                onClick={() => setSelectedFolder(null)}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">All Projects</span>
                <span className="folder-count">({projects.length})</span>
              </div>

              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`folder-item folder-item-sub ${selectedFolder === folder.id ? 'active' : ''}`}
                >
                  {editingId === folder.id && editingType === 'folder' ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(folder.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="folder-edit-input"
                    />
                  ) : (
                    <>
                      <div className="folder-main" onClick={() => setSelectedFolder(folder.id)}>
                        <span className="folder-icon">📂</span>
                        <span className="folder-name">{folder.name}</span>
                        <span className="folder-count">({projects.filter(p => p.folder_id === folder.id).length})</span>
                      </div>
                      <div className="folder-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(folder.id);
                            setEditingName(folder.name);
                            setEditingType('folder');
                          }}
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id, folder.name);
                          }}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="projects-main">
            <div className="projects-actions">
              <div className="breadcrumb">
                {selectedFolder ? (
                  <>
                    <span onClick={() => setSelectedFolder(null)} className="breadcrumb-link">All Projects</span>
                    <span className="breadcrumb-separator">/</span>
                    <span>{folders.find(f => f.id === selectedFolder)?.name}</span>
                  </>
                ) : (
                  <span>All Projects</span>
                )}
              </div>

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
            ) : visibleProjects.length === 0 ? (
              <div className="empty-state">
                <p>No projects in this folder</p>
                <p className="empty-hint">Create a project or move one here</p>
              </div>
            ) : (
              <div className="projects-grid">
                {visibleProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    {editingId === project.id && editingType === 'project' ? (
                      <div className="project-edit">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleRename(project.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(project.id);
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
                            {project.is_public && <span className="public-badge">🌐</span>}
                          </h3>
                          <div className="project-actions">
                            <button
                              onClick={() => setMovingProjectId(project.id)}
                              title="Move to folder"
                            >
                              📁
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(project.id);
                                setEditingName(project.name);
                                setEditingType('project');
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

                        {/* Move to folder dialog */}
                        {movingProjectId === project.id && (
                          <>
                            <div 
                              className="move-dialog-overlay" 
                              onClick={() => setMovingProjectId(null)}
                            />
                            <div className="move-dialog" onClick={(e) => e.stopPropagation()}>
                              <p>Move to folder:</p>
                              {folders.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#666', margin: '8px 0' }}>
                                  No folders yet. Create one first.
                                </p>
                              ) : (
                                folders.map(folder => (
                                  <button
                                    key={folder.id}
                                    onClick={() => handleMoveProject(project.id, folder.id)}
                                    disabled={folder.id === project.folder_id}
                                  >
                                    📂 {folder.name}
                                  </button>
                                ))
                              )}
                              <button 
                                className="add-folder-inline"
                                onClick={() => {
                                  setMovingProjectId(null);
                                  setIsCreatingFolder(true);
                                }}
                              >
                                ➕ Add New Folder
                              </button>
                              <button onClick={() => setMovingProjectId(null)} className="cancel">
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
