import { Router, Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { captchaService } from '../services/CaptchaService';

const router = Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await authService.login(username, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

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

/**
 * POST /api/auth/register
 * Register new user with CAPTCHA verification
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, captchaToken } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Verify CAPTCHA if token provided
    if (captchaToken) {
      const clientIp = req.ip || req.socket.remoteAddress;
      const isValidCaptcha = await captchaService.verify(captchaToken, clientIp);
      
      if (!isValidCaptcha) {
        return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
      }
    }

    const user = await authService.register(username, password, fullName, email);
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

export default router;
