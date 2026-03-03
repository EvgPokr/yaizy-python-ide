import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { folderService } from '../services/FolderService';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/folders
 * Get all folders for current user
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const folders = folderService.getUserFolders(req.userId!);
    res.json(folders);
  } catch (error: any) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: error.message || 'Failed to get folders' });
  }
});

/**
 * GET /api/folders/:id
 * Get single folder
 */
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const folder = folderService.getFolder(req.params.id, req.userId!);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  } catch (error: any) {
    console.error('Get folder error:', error);
    res.status(500).json({ error: error.message || 'Failed to get folder' });
  }
});

/**
 * POST /api/folders
 * Create new folder
 */
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = folderService.createFolder(req.userId!, name, parentId);
    res.status(201).json(folder);
  } catch (error: any) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: error.message || 'Failed to create folder' });
  }
});

/**
 * PUT /api/folders/:id
 * Update folder
 */
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId } = req.body;
    const folder = folderService.updateFolder(req.params.id, req.userId!, name, parentId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error: any) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: error.message || 'Failed to update folder' });
  }
});

/**
 * DELETE /api/folders/:id
 * Delete folder
 */
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const success = folderService.deleteFolder(req.params.id, req.userId!);
    if (!success) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json({ message: 'Folder deleted successfully' });
  } catch (error: any) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete folder' });
  }
});

export default router;
