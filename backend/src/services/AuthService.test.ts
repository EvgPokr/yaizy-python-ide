import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'python-ide-test-'));

process.env.DB_DIR = tmpDir;
process.env.JWT_SECRET = 'test-local-jwt-secret-0123456789abcdef';

describe('AuthService (OAuth users)', () => {
  let authService: typeof import('./AuthService').authService;

  beforeAll(async () => {
    const { initDatabase } = await import('../db/database');
    initDatabase();
    ({ authService } = await import('./AuthService'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('findOrCreateOAuthUser', () => {
    it('creates a user keyed by opaque external id without personal data', () => {
      const user = authService.findOrCreateOAuthUser('external-id-1', 'student');

      expect(user.id).toBeTruthy();
      expect(user.username).toBe('yaizy_external-id-1');
      expect(user.role).toBe('student');
      expect(user.email).toBeUndefined();
      expect(user.full_name).toBeUndefined();
    });

    it('returns the same user for the same external id', () => {
      const first = authService.findOrCreateOAuthUser('external-id-2', 'student');
      const second = authService.findOrCreateOAuthUser('external-id-2', 'student');

      expect(second.id).toBe(first.id);
      expect(second.username).toBe(first.username);
    });

    it('creates distinct users for different external ids', () => {
      const userA = authService.findOrCreateOAuthUser('external-id-3', 'student');
      const userB = authService.findOrCreateOAuthUser('external-id-4', 'student');

      expect(userA.id).not.toBe(userB.id);
    });
  });

  describe('issueTokenForUser / verifyToken', () => {
    it('issues a local session token that verifies back to the user', () => {
      const user = authService.findOrCreateOAuthUser('external-id-5', 'student');
      const token = authService.issueTokenForUser(user);

      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.role).toBe('student');
    });

    it('rejects invalid tokens', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('getUserById', () => {
    it('returns user without password data', () => {
      const user = authService.findOrCreateOAuthUser('external-id-6', 'student');
      const found = authService.getUserById(user.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
      expect((found as any).password_hash).toBeUndefined();
    });

    it('returns null for unknown id', () => {
      expect(authService.getUserById('missing-id')).toBeNull();
    });
  });
});
