import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  jwtSecret: string;
  issuer?: string;
}

export interface PendingAuthRequest {
  state: string;
  codeVerifier: string;
  createdAt: number;
}

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

const STATE_TTL_MS = 10 * 60 * 1000;

export class OAuthService {
  private pendingRequests = new Map<string, PendingAuthRequest>();

  getConfig(): OAuthConfig {
    const authorizeUrl = process.env.YAIZY_OAUTH_AUTHORIZE_URL;
    const tokenUrl = process.env.YAIZY_OAUTH_TOKEN_URL;
    const clientId = process.env.YAIZY_OAUTH_CLIENT_ID;
    const clientSecret = process.env.YAIZY_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.YAIZY_OAUTH_REDIRECT_URI;
    const jwtSecret = process.env.YAIZY_OAUTH_JWT_SECRET;

    if (
      !authorizeUrl ||
      !tokenUrl ||
      !clientId ||
      !clientSecret ||
      !redirectUri ||
      !jwtSecret
    ) {
      throw new Error('YaizY OAuth is not configured');
    }

    return {
      authorizeUrl,
      tokenUrl,
      clientId,
      clientSecret,
      redirectUri,
      jwtSecret,
      issuer: process.env.YAIZY_OAUTH_ISSUER || undefined,
    };
  }

  isConfigured(): boolean {
    try {
      this.getConfig();
      return true;
    } catch {
      return false;
    }
  }

  createAuthRequest(): { state: string; authorizeUrl: string } {
    this.cleanupExpired();

    const state = crypto.randomBytes(32).toString('base64url');
    const codeVerifier = crypto.randomBytes(48).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    this.pendingRequests.set(state, {
      state,
      codeVerifier,
      createdAt: Date.now(),
    });

    const config = this.getConfig();
    const url = new URL(config.authorizeUrl);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return { state, authorizeUrl: url.toString() };
  }

  consumeAuthRequest(state: string): PendingAuthRequest | null {
    this.cleanupExpired();
    const request = this.pendingRequests.get(state);
    if (!request) {
      return null;
    }
    this.pendingRequests.delete(state);
    return request;
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<{ accessToken: string }> {
    const config = this.getConfig();

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = (await response
        .json()
        .catch(() => ({}))) as Record<string, string>;
      throw new Error(
        `Token exchange failed: ${errorBody.error || response.status}`,
      );
    }

    const data = (await response.json()) as {
      access_token?: string;
      token_type?: string;
    };
    if (!data.access_token) {
      throw new Error('Token exchange failed: no access_token in response');
    }

    return { accessToken: data.access_token };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const config = this.getConfig();

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.issuer,
      audience: config.clientId,
    }) as jwt.JwtPayload;

    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new Error('Access token has no subject');
    }

    return {
      sub: decoded.sub,
      role: typeof decoded.role === 'string' ? decoded.role : 'user',
    };
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [state, request] of this.pendingRequests) {
      if (now - request.createdAt > STATE_TTL_MS) {
        this.pendingRequests.delete(state);
      }
    }
  }
}

export const oauthService = new OAuthService();
