import { authClient } from './authClient';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
}

class FoldersClient {
  private baseUrl: string;

  constructor() {
    const env = (import.meta as any).env;
    this.baseUrl = env?.VITE_BACKEND_URL || '';
  }

  private getAuthHeader() {
    const token = authClient.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get all folders
   */
  async getFolders(): Promise<Folder[]> {
    const response = await fetch(`${this.baseUrl}/api/folders`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get folders');
    }

    return response.json();
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    const response = await fetch(`${this.baseUrl}/api/folders`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create folder');
    }

    return response.json();
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, name?: string, parentId?: string): Promise<Folder> {
    const response = await fetch(`${this.baseUrl}/api/folders/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ name, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update folder');
    }

    return response.json();
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/folders/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete folder');
    }
  }
}

export const foldersClient = new FoldersClient();
