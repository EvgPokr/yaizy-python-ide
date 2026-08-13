import { Router, Request, Response } from 'express';
import { SessionManager } from '../services/SessionManager';
import {
  SessionCreateResponse,
  RunCodeRequest,
  RunCodeResponse,
  StopExecutionResponse,
} from '../types/session';
import { sessionCreationLimiter, executionLimiter } from '../middleware/rateLimit';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export function createSessionRouter(sessionManager: SessionManager): Router {
  const router = Router();
  router.use(authMiddleware);

  /**
   * POST /api/sessions
   * Create a new Python session
   */
  router.post('/', sessionCreationLimiter, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      console.log(`Creating session for IP: ${ipAddress}`);

      const session = await sessionManager.createSession(ipAddress, req.userId);

      const response: SessionCreateResponse = {
        sessionId: session.id,
        wsUrl: `/api/sessions/${session.id}/terminal`,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Failed to create session:', error);
      res.status(500).json({
        error: 'Failed to create session',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/sessions/:id
   * Get session info
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const stats = sessionManager.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Failed to get stats:', error);
      res.status(500).json({
        error: 'Failed to get stats',
        message: error.message,
      });
    }
  });

  router.get('/:id', (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sessionId = req.params.id;
      const session = sessionManager.getOwnedSession(sessionId, req.userId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        sessionId: session.id,
        isRunning: session.isRunning,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        executionCount: session.executionCount,
      });
    } catch (error: any) {
      console.error('Failed to get session:', error);
      res.status(500).json({
        error: 'Failed to get session',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/sessions/:id/run
   * Execute Python code in session
   */
  router.post('/:id/run', executionLimiter, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sessionId = req.params.id;
      const body: RunCodeRequest = req.body;

      if (!body.code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const session = sessionManager.getOwnedSession(sessionId, req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.isRunning) {
        return res.status(409).json({ error: 'Code is already running' });
      }

      const filename = body.filename || 'main.py';

      await sessionManager.executeCode(sessionId, body.code, filename);

      const response: RunCodeResponse = {
        success: true,
        message: 'Code execution started',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Failed to run code:', error);
      if (error?.message === 'Invalid filename' || error?.message === 'Invalid filename format') {
        return res.status(400).json({
          error: 'Invalid request',
          message: error.message,
        });
      }
      res.status(500).json({
        error: 'Failed to run code',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/sessions/:id/stop
   * Stop current execution
   */
  router.post('/:id/stop', (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sessionId = req.params.id;

      const session = sessionManager.getOwnedSession(sessionId, req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      sessionManager.stopExecution(sessionId);

      const response: StopExecutionResponse = {
        success: true,
        message: 'Execution stopped',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Failed to stop execution:', error);
      res.status(500).json({
        error: 'Failed to stop execution',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/sessions/:id/reset
   * Reset session (kill and recreate)
   */
  router.post('/:id/reset', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sessionId = req.params.id;

      const oldSession = sessionManager.getOwnedSession(sessionId, req.userId);
      if (!oldSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const newSession = await sessionManager.resetSession(sessionId);

      res.json({
        success: true,
        message: 'Session reset',
        sessionId: newSession.id,
      });
    } catch (error: any) {
      console.error('Failed to reset session:', error);
      res.status(500).json({
        error: 'Failed to reset session',
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/sessions/:id
   * Delete a session
   */
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const sessionId = req.params.id;
      const session = sessionManager.getOwnedSession(sessionId, req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await sessionManager.deleteSession(sessionId);

      res.json({
        success: true,
        message: 'Session deleted',
      });
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      res.status(500).json({
        error: 'Failed to delete session',
        message: error.message,
      });
    }
  });

  return router;
}
