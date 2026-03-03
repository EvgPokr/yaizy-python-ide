import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  role: string;
  created_at: number;
}

export interface LoginResult {
  user: User;
  token: string;
}

export class AuthService {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const user = db.prepare(`
      SELECT id, username, password_hash, email, full_name, role, created_at
      FROM users WHERE username = ?
    `).get(username) as any;

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userInfo: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };

    return { user: userInfo, token };
  }

  /**
   * Verify JWT token
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
   * Get user by ID
   */
  getUserById(userId: string): User | null {
    const user = db.prepare(`
      SELECT id, username, email, full_name, role, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Register new user (for future use)
   */
  async register(username: string, password: string, fullName?: string, email?: string): Promise<User> {
    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, email, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, passwordHash, fullName || null, email || null, 'teacher', now, now);

    return {
      id: userId,
      username,
      email,
      full_name: fullName,
      role: 'teacher',
      created_at: now,
    };
  }
}

export const authService = new AuthService();
