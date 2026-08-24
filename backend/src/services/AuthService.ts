import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  grade?: string;
  age?: number;
  role: string;
  created_at: number;
}

export class AuthService {
  /**
   * Verify local session JWT token
   */
  verifyToken(token: string): { userId: string; username: string; role: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Issue a local session JWT for a user
   */
  issueTokenForUser(user: User): string {
    return jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | null {
    const user = db.prepare(`
      SELECT id, username, email, full_name, grade, age, role, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      grade: user.grade,
      age: user.age,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Find a user by external (YaizY) identifier or create a new one.
   * The external id is an opaque identifier without personal data.
   */
  findOrCreateOAuthUser(externalId: string, role: string): User {
    const existing = db
      .prepare('SELECT id FROM users WHERE external_id = ?')
      .get(externalId) as any;

    if (existing) {
      const user = this.getUserById(existing.id);
      if (user) {
        return user;
      }
    }

    const userId = uuidv4();
    const username = `yaizy_${externalId.slice(0, 16)}`;
    // Local password login is disabled: store a non-bcrypt marker
    const disabledPasswordHash = `oauth-disabled:${crypto
      .randomBytes(24)
      .toString('hex')}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, external_id, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, disabledPasswordHash, externalId, role || 'user', now, now);

    console.log(`✅ New OAuth user provisioned: ${username}`);

    return {
      id: userId,
      username,
      role: role || 'user',
      created_at: now,
    };
  }
}

export const authService = new AuthService();
