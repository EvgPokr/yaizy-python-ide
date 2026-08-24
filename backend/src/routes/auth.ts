import { Router, Response } from 'express';

import { authService } from '../services/AuthService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = authService.getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

export default router;
