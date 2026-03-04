/**
 * Projects API client
 */

import { authClient } from './authClient';

const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 
  ((import.meta as any).env?.MODE === 'production' ? '' : 'http://localhost:3001');

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  folder_id?: string | null;
  is_public: boolean;
  forked_from?: string;
  files: ProjectFile[];
  created_at: number;
  updated_at: number;
}

class ProjectsClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): HeadersInit {
    const token = authClient.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get projects');
    }

    return response.json();
  }

  /**
   * Get single project (user's own)
   */
  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get project');
    }

    return response.json();
  }

  /**
   * Get public project (no auth required)
   */
  async getPublicProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/public/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Project not found or not public');
    }

    return response.json();
  }

  /**
   * Fork project (create copy)
   */
  async forkProject(id: string, newName?: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/fork/${id}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fork project');
    }

    return response.json();
  }

  /**
   * Create project
   */
  async createProject(name: string, description?: string, isPublic: boolean = false, folderId?: string | null): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, description, isPublic, folderId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }

    return response.json();
  }

  /**
   * Update project
   */
  async updateProject(id: string, name?: string, description?: string, isPublic?: boolean, folderId?: string | null): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, description, isPublic, folderId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }

    return response.json();
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }

  /**
   * Add file to project
   */
  async addFile(projectId: string, name: string, content: string = ''): Promise<ProjectFile> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add file');
    }

    return response.json();
  }

  /**
   * Update file content
   */
  async updateFile(projectId: string, fileId: string, content: string): Promise<ProjectFile> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${fileId}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update file');
    }

    return response.json();
  }

  /**
   * Rename file
   */
  async renameFile(projectId: string, fileId: string, name: string): Promise<ProjectFile> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${fileId}`, {
      method: 'PATCH',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to rename file');
    }

    return response.json();
  }

  /**
   * Delete file
   */
  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }
  }
}

export const projectsClient = new ProjectsClient();
