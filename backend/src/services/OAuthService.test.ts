import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuthService } from './OAuthService';

const JWT_SECRET = 'test-shared-oauth-jwt-secret-0123456789';

function setOAuthEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.YAIZY_OAUTH_AUTHORIZE_URL = 'https://yaizy.test/api/auth2/oauth/authorize';
  process.env.YAIZY_OAUTH_TOKEN_URL = 'https://yaizy.test/api/auth2/oauth/token';
  process.env.YAIZY_OAUTH_CLIENT_ID = 'python-ide-test';
  process.env.YAIZY_OAUTH_CLIENT_SECRET = 'client-secret-test';
  process.env.YAIZY_OAUTH_REDIRECT_URI = 'http://localhost:3001/api/auth/oauth/yaizy/callback';
  process.env.YAIZY_OAUTH_JWT_SECRET = JWT_SECRET;
  process.env.YAIZY_OAUTH_ISSUER = 'https://yaizy.test';

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearOAuthEnv() {
  delete process.env.YAIZY_OAUTH_AUTHORIZE_URL;
  delete process.env.YAIZY_OAUTH_TOKEN_URL;
  delete process.env.YAIZY_OAUTH_CLIENT_ID;
  delete process.env.YAIZY_OAUTH_CLIENT_SECRET;
  delete process.env.YAIZY_OAUTH_REDIRECT_URI;
  delete process.env.YAIZY_OAUTH_JWT_SECRET;
  delete process.env.YAIZY_OAUTH_ISSUER;
}

describe('OAuthService', () => {
  let service: OAuthService;

  beforeEach(() => {
    service = new OAuthService();
    setOAuthEnv();
  });

  afterEach(() => {
    clearOAuthEnv();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isConfigured / getConfig', () => {
    it('returns true when all env vars are set', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('returns false when a required env var is missing', () => {
      setOAuthEnv({ YAIZY_OAUTH_CLIENT_SECRET: undefined });
      expect(service.isConfigured()).toBe(false);
      expect(() => service.getConfig()).toThrow('YaizY OAuth is not configured');
    });
  });

  describe('createAuthRequest / consumeAuthRequest', () => {
    it('creates authorize URL with PKCE S256 params', () => {
      const { state, authorizeUrl } = service.createAuthRequest();
      const url = new URL(authorizeUrl);

      expect(url.origin + url.pathname).toBe('https://yaizy.test/api/auth2/oauth/authorize');
      expect(url.searchParams.get('client_id')).toBe('python-ide-test');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3001/api/auth/oauth/yaizy/callback'
      );
      expect(url.searchParams.get('state')).toBe(state);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('user_type')).toBe('student');

      const challenge = url.searchParams.get('code_challenge')!;
      expect(challenge).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    });

    it('consumes a pending request only once', () => {
      const { state } = service.createAuthRequest();
      const first = service.consumeAuthRequest(state);
      const second = service.consumeAuthRequest(state);

      expect(first).not.toBeNull();
      expect(first!.state).toBe(state);
      expect(second).toBeNull();
    });

    it('returns null for unknown state', () => {
      expect(service.consumeAuthRequest('unknown-state')).toBeNull();
    });

    it('code verifier matches the challenge sent to authorize', () => {
      const { state, authorizeUrl } = service.createAuthRequest();
      const challenge = new URL(authorizeUrl).searchParams.get('code_challenge')!;
      const pending = service.consumeAuthRequest(state)!;

      const computed = crypto
        .createHash('sha256')
        .update(pending.codeVerifier)
        .digest('base64url');
      expect(computed).toBe(challenge);
    });
  });

  describe('verifyAccessToken', () => {
    function issueToken(overrides: Record<string, unknown> = {}) {
      return jwt.sign(
        { sub: 'external-user-id', role: 'student', aud: 'python-ide-test', jti: 'j1', ...overrides },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: 300, issuer: 'https://yaizy.test' }
      );
    }

    it('verifies a valid token and returns sub and role', () => {
      const payload = service.verifyAccessToken(issueToken());
      expect(payload.sub).toBe('external-user-id');
      expect(payload.role).toBe('student');
    });

    it('rejects a token signed with another secret', () => {
      const token = jwt.sign(
        { sub: 'x', aud: 'python-ide-test' },
        'another-secret-another-secret-12',
        { algorithm: 'HS256', issuer: 'https://yaizy.test' }
      );
      expect(() => service.verifyAccessToken(token)).toThrow();
    });

    it('rejects a token issued for another audience', () => {
      expect(() => service.verifyAccessToken(issueToken({ aud: 'other-client' }))).toThrow();
    });

    it('rejects a token from another issuer', () => {
      expect(() => service.verifyAccessToken(issueToken({ iss: 'https://evil.test' }))).toThrow();
    });

    it('rejects an expired token', () => {
      const token = jwt.sign(
        { sub: 'external-user-id', role: 'student', aud: 'python-ide-test' },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: -10, issuer: 'https://yaizy.test' }
      );
      expect(() => service.verifyAccessToken(token)).toThrow();
    });
  });

  describe('exchangeCode', () => {
    it('posts form-encoded body and returns access token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'access-123', token_type: 'Bearer' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await service.exchangeCode('auth-code', 'verifier-123');
      expect(result.accessToken).toBe('access-123');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://yaizy.test/api/auth2/oauth/token');
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      const params = new URLSearchParams(init.body);
      expect(params.get('grant_type')).toBe('authorization_code');
      expect(params.get('code')).toBe('auth-code');
      expect(params.get('code_verifier')).toBe('verifier-123');
      expect(params.get('client_id')).toBe('python-ide-test');
      expect(params.get('client_secret')).toBe('client-secret-test');
    });

    it('throws when token endpoint returns an error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_grant' }),
        })
      );

      await expect(service.exchangeCode('bad-code', 'verifier')).rejects.toThrow(
        'Token exchange failed: invalid_grant'
      );
    });

    it('throws when response has no access_token', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        })
      );

      await expect(service.exchangeCode('code', 'verifier')).rejects.toThrow(
        'no access_token'
      );
    });
  });
});
