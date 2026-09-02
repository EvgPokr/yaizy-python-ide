import { Router, Request, Response } from 'express';

import { authService } from '../services/AuthService';
import { oauthService, isSafeRedirect } from '../services/OAuthService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function frontendUrl(path: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}${path}`;
}

/**
 * GET /api/auth/oauth/yaizy/login
 * Starts the YaizY OAuth flow (Authorization Code + PKCE).
 */
router.get('/yaizy/login', (req: Request, res: Response) => {
  try {
    const redirect = isSafeRedirect(req.query.redirect as string | undefined);
    const { authorizeUrl } = oauthService.createAuthRequest(redirect);
    res.redirect(authorizeUrl);
  } catch (error: any) {
    console.error('OAuth login error:', error);
    res.status(503).json({ error: 'OAuth is not configured' });
  }
});

/**
 * GET /api/auth/oauth/yaizy/callback
 * Handles the redirect back from the YaizY authorization server.
 */
router.get('/yaizy/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query as Record<
      string,
      string | undefined
    >;

    if (error) {
      const message = encodeURIComponent(error_description || error);
      return res.redirect(frontendUrl(`/auth/callback?error=${message}`));
    }

    if (!code || !state) {
      return res.redirect(
        frontendUrl('/auth/callback?error=Missing+code+or+state'),
      );
    }

    const pendingRequest = oauthService.consumeAuthRequest(state);
    if (!pendingRequest) {
      return res.redirect(
        frontendUrl('/auth/callback?error=Invalid+or+expired+state'),
      );
    }

    const { accessToken } = await oauthService.exchangeCode(
      code,
      pendingRequest.codeVerifier,
    );
    const payload = oauthService.verifyAccessToken(accessToken);

    const user = authService.findOrCreateOAuthUser(payload.sub, payload.role);
    const token = authService.issueTokenForUser(user);

    // Token is passed via URL fragment so it never reaches server logs.
    const redirect = encodeURIComponent(pendingRequest.redirect);
    return res.redirect(frontendUrl(`/auth/callback?redirect=${redirect}#token=${token}`));
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return res.redirect(
      frontendUrl('/auth/callback?error=Authentication+failed'),
    );
  }
});

/**
 * GET /api/auth/oauth/status
 * Reports whether OAuth login is available.
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({ enabled: oauthService.isConfigured() });
});

/**
 * GET /api/auth/oauth/me
 * Alias kept for API symmetry — session info comes from the local JWT.
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = authService.getUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

export default router;
