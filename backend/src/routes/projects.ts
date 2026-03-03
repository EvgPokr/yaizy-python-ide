import { Router, Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { projectService } from '../services/ProjectService';

const router = Router();

/**
 * GET /api/projects/public/:id
 * Get public project (no auth required)
 */
router.get('/public/:id', (req: Request, res: Response) => {
  try {
    const project = projectService.getPublicProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or not public' });
    }
    res.json(project);
  } catch (error: any) {
    console.error('Get public project error:', error);
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
});

/**
 * GET /api/projects
 * Get all projects for current user
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const projects = projectService.getUserProjects(req.userId!);
    res.json(projects);
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: error.message || 'Failed to get projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get single project
 */
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const project = projectService.getProject(req.params.id, req.userId!);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
});

/**
 * POST /api/projects/fork/:id
 * Fork a project (create copy)
 */
router.post('/fork/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const project = projectService.forkProject(req.params.id, req.userId!, name);
    res.status(201).json(project);
  } catch (error: any) {
    console.error('Fork project error:', error);
    res.status(500).json({ error: error.message || 'Failed to fork project' });
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = projectService.createProject(req.userId!, name, description, isPublic);
    res.status(201).json(project);
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic, folderId } = req.body;
    const project = projectService.updateProject(req.params.id, req.userId!, name, description, isPublic, folderId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const success = projectService.deleteProject(req.params.id, req.userId!);
    
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

/**
 * POST /api/projects/:id/files
 * Add file to project
 */
router.post('/:id/files', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, content } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const file = projectService.addFile(req.params.id, req.userId!, name, content);
    
    if (!file) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(201).json(file);
  } catch (error: any) {
    console.error('Add file error:', error);
    res.status(500).json({ error: error.message || 'Failed to add file' });
  }
});

/**
 * PUT /api/projects/:projectId/files/:fileId
 * Update file content
 */
router.put('/:projectId/files/:fileId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (content === undefined) {
      return res.status(400).json({ error: 'File content is required' });
    }

    const file = projectService.updateFile(req.params.fileId, req.params.projectId, req.userId!, content);
    
    if (!file) {
      return res.status(404).json({ error: 'File or project not found' });
    }
    
    res.json(file);
  } catch (error: any) {
    console.error('Update file error:', error);
    res.status(500).json({ error: error.message || 'Failed to update file' });
  }
});

/**
 * PATCH /api/projects/:projectId/files/:fileId
 * Rename file
 */
router.patch('/:projectId/files/:fileId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'New file name is required' });
    }

    const file = projectService.renameFile(req.params.fileId, req.params.projectId, req.userId!, name);
    
    if (!file) {
      return res.status(404).json({ error: 'File or project not found' });
    }
    
    res.json(file);
  } catch (error: any) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: error.message || 'Failed to rename file' });
  }
});

/**
 * DELETE /api/projects/:projectId/files/:fileId
 * Delete file
 */
router.delete('/:projectId/files/:fileId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const success = projectService.deleteFile(req.params.fileId, req.params.projectId, req.userId!);
    
    if (!success) {
      return res.status(404).json({ error: 'File or project not found' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

export default router;
