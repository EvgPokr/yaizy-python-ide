import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
}

class FolderService {
  /**
   * Get all folders for a user
   */
  getUserFolders(userId: string): Folder[] {
    const folders = db.prepare(`
      SELECT id, user_id, name, parent_id, created_at, updated_at
      FROM folders
      WHERE user_id = ?
      ORDER BY name ASC
    `).all(userId) as any[];

    return folders.map(folder => ({
      ...folder,
      parent_id: folder.parent_id || null,
    }));
  }

  /**
   * Get single folder
   */
  getFolder(folderId: string, userId: string): Folder | null {
    const folder = db.prepare(`
      SELECT id, user_id, name, parent_id, created_at, updated_at
      FROM folders
      WHERE id = ? AND user_id = ?
    `).get(folderId, userId) as any;

    if (!folder) return null;

    return {
      ...folder,
      parent_id: folder.parent_id || null,
    };
  }

  /**
   * Create new folder
   */
  createFolder(userId: string, name: string, parentId?: string): Folder {
    const folderId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO folders (id, user_id, name, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(folderId, userId, name, parentId || null, now, now);

    console.log(`✅ Folder "${name}" created by user ${userId}`);

    return this.getFolder(folderId, userId)!;
  }

  /**
   * Update folder
   */
  updateFolder(folderId: string, userId: string, name?: string, parentId?: string): Folder | null {
    const folder = this.getFolder(folderId, userId);
    if (!folder) return null;

    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (parentId !== undefined) {
      updates.push('parent_id = ?');
      params.push(parentId || null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      params.push(now, folderId, userId);

      db.prepare(`
        UPDATE folders
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `).run(...params);
    }

    return this.getFolder(folderId, userId);
  }

  /**
   * Delete folder (and move projects to parent or root)
   */
  deleteFolder(folderId: string, userId: string): boolean {
    const folder = this.getFolder(folderId, userId);
    if (!folder) return false;

    // Move all projects in this folder to parent (or null)
    db.prepare(`
      UPDATE projects
      SET folder_id = ?
      WHERE folder_id = ? AND user_id = ?
    `).run(folder.parent_id, folderId, userId);

    // Move all child folders to parent (or null)
    db.prepare(`
      UPDATE folders
      SET parent_id = ?
      WHERE parent_id = ? AND user_id = ?
    `).run(folder.parent_id, folderId, userId);

    // Delete the folder
    db.prepare(`
      DELETE FROM folders
      WHERE id = ? AND user_id = ?
    `).run(folderId, userId);

    console.log(`✅ Folder ${folderId} deleted by user ${userId}`);

    return true;
  }
}

export const folderService = new FolderService();
