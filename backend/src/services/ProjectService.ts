import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

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

export class ProjectService {
  /**
   * Get all projects for a user
   */
  getUserProjects(userId: string, folderId?: string | null): Project[] {
    let query = `
      SELECT id, user_id, name, description, folder_id, is_public, forked_from, created_at, updated_at
      FROM projects
      WHERE user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (folderId !== undefined) {
      if (folderId === null) {
        query += ' AND folder_id IS NULL';
      } else {
        query += ' AND folder_id = ?';
        params.push(folderId);
      }
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const projects = db.prepare(query).all(...params) as any[];

    return projects.map(project => ({
      ...project,
      folder_id: project.folder_id || null,
      is_public: Boolean(project.is_public),
      files: this.getProjectFiles(project.id),
    }));
  }

  /**
   * Get single project by ID (user's own project)
   */
  getProject(projectId: string, userId: string): Project | null {
    const project = db.prepare(`
      SELECT id, user_id, name, description, folder_id, is_public, forked_from, created_at, updated_at
      FROM projects
      WHERE id = ? AND user_id = ?
    `).get(projectId, userId) as any;

    if (!project) return null;

    return {
      ...project,
      folder_id: project.folder_id || null,
      is_public: Boolean(project.is_public),
      files: this.getProjectFiles(projectId),
    };
  }

  /**
   * Get public project by ID (anyone can view)
   */
  getPublicProject(projectId: string): Project | null {
    const project = db.prepare(`
      SELECT id, user_id, name, description, is_public, forked_from, created_at, updated_at
      FROM projects
      WHERE id = ? AND is_public = 1
    `).get(projectId) as any;

    if (!project) return null;

    return {
      ...project,
      is_public: Boolean(project.is_public),
      files: this.getProjectFiles(projectId),
    };
  }

  /**
   * Create new project
   */
  createProject(userId: string, name: string, description?: string, isPublic: boolean = false): Project {
    const projectId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO projects (id, user_id, name, description, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, userId, name, description || null, isPublic ? 1 : 0, now, now);

    // Create default main.py file
    const fileId = uuidv4();
    db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fileId, projectId, 'main.py', '# Write your first Python code\n', now, now);

    return this.getProject(projectId, userId)!;
  }

  /**
   * Update project
   */
  updateProject(projectId: string, userId: string, name?: string, description?: string, isPublic?: boolean, folderId?: string | null): Project | null {
    const project = this.getProject(projectId, userId);
    if (!project) return null;

    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (isPublic !== undefined) {
      updates.push('is_public = ?');
      params.push(isPublic ? 1 : 0);
    }
    if (folderId !== undefined) {
      updates.push('folder_id = ?');
      params.push(folderId || null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      params.push(now, projectId, userId);

      db.prepare(`
        UPDATE projects
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `).run(...params);
    }

    return this.getProject(projectId, userId);
  }

  /**
   * Fork project (create a copy)
   */
  forkProject(sourceProjectId: string, userId: string, newName?: string): Project {
    // Get source project (either own or public)
    let sourceProject = this.getProject(sourceProjectId, userId);
    if (!sourceProject) {
      sourceProject = this.getPublicProject(sourceProjectId);
    }
    
    if (!sourceProject) {
      throw new Error('Project not found or not accessible');
    }

    const projectId = uuidv4();
    const now = Date.now();
    const projectName = newName || `${sourceProject.name} (copy)`;

    // Create forked project
    db.prepare(`
      INSERT INTO projects (id, user_id, name, description, is_public, forked_from, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, userId, projectName, sourceProject.description || null, 0, sourceProjectId, now, now);

    // Copy all files
    for (const file of sourceProject.files) {
      const fileId = uuidv4();
      db.prepare(`
        INSERT INTO project_files (id, project_id, name, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(fileId, projectId, file.name, file.content, now, now);
    }

    console.log(`✅ Project ${sourceProjectId} forked to ${projectId} by user ${userId}`);

    return this.getProject(projectId, userId)!;
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string, userId: string): boolean {
    const result = db.prepare(`
      DELETE FROM projects
      WHERE id = ? AND user_id = ?
    `).run(projectId, userId);

    return result.changes > 0;
  }

  /**
   * Get project files
   */
  getProjectFiles(projectId: string): ProjectFile[] {
    return db.prepare(`
      SELECT id, name, content, created_at, updated_at
      FROM project_files
      WHERE project_id = ?
      ORDER BY created_at ASC
    `).all(projectId) as ProjectFile[];
  }

  /**
   * Add file to project
   */
  addFile(projectId: string, userId: string, name: string, content: string = ''): ProjectFile | null {
    const project = this.getProject(projectId, userId);
    if (!project) return null;

    const fileId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO project_files (id, project_id, name, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fileId, projectId, name, content, now, now);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    return db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId) as ProjectFile;
  }

  /**
   * Update file content
   */
  updateFile(fileId: string, projectId: string, userId: string, content: string): ProjectFile | null {
    const project = this.getProject(projectId, userId);
    if (!project) return null;

    const now = Date.now();

    db.prepare(`
      UPDATE project_files
      SET content = ?, updated_at = ?
      WHERE id = ? AND project_id = ?
    `).run(content, now, fileId, projectId);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    return db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId) as ProjectFile;
  }

  /**
   * Rename file
   */
  renameFile(fileId: string, projectId: string, userId: string, newName: string): ProjectFile | null {
    const project = this.getProject(projectId, userId);
    if (!project) return null;

    const now = Date.now();

    db.prepare(`
      UPDATE project_files
      SET name = ?, updated_at = ?
      WHERE id = ? AND project_id = ?
    `).run(newName, now, fileId, projectId);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    return db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId) as ProjectFile;
  }

  /**
   * Delete file
   */
  deleteFile(fileId: string, projectId: string, userId: string): boolean {
    const project = this.getProject(projectId, userId);
    if (!project) return false;

    const result = db.prepare(`
      DELETE FROM project_files
      WHERE id = ? AND project_id = ?
    `).run(fileId, projectId);

    if (result.changes > 0) {
      // Update project updated_at
      const now = Date.now();
      db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);
    }

    return result.changes > 0;
  }
}

export const projectService = new ProjectService();
