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
   * Get single project
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
   * Create project
   */
  async createProject(name: string, description?: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, description }),
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
  async updateProject(id: string, name?: string, description?: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, description }),
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
