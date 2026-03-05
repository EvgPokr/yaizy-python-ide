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
  grade?: string;
  age?: number;
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
    console.log('Login attempt for username:', username);
    
    const user = db.prepare(`
      SELECT id, username, password_hash, email, full_name, grade, age, role, created_at
      FROM users WHERE username = ?
    `).get(username) as any;

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('Available users:', db.prepare('SELECT username FROM users').all());
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
      grade: user.grade,
      age: user.age,
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
   * Register new user
   */
  async register(username: string, password: string, fullName?: string, email?: string, grade?: string, age?: number): Promise<User> {
    // Validate username
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers and underscore');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if username exists
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email exists (if provided)
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, email, grade, age, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, passwordHash, fullName || null, email || null, grade || null, age || null, 'user', now, now);

    console.log(`✅ New user registered: ${username}`);

    return {
      id: userId,
      username,
      email,
      full_name: fullName,
      grade,
      age,
      role: 'user',
      created_at: now,
    };
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email: string): Promise<string> {
    const user = db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).get(email) as any;

    if (!user) {
      throw new Error('No account found with this email');
    }

    const token = uuidv4();
    const tokenId = uuidv4();
    const now = Date.now();
    const expiresAt = now + (60 * 60 * 1000); // 1 hour

    db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(tokenId, user.id, token, expiresAt, now);

    return token;
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<string> {
    const resetToken = db.prepare(`
      SELECT user_id, expires_at, used FROM password_reset_tokens 
      WHERE token = ?
    `).get(token) as any;

    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    if (resetToken.used) {
      throw new Error('Reset token already used');
    }

    if (Date.now() > resetToken.expires_at) {
      throw new Error('Reset token expired');
    }

    return resetToken.user_id;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.verifyResetToken(token);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = Date.now();

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, userId);

    // Mark token as used
    db.prepare(`
      UPDATE password_reset_tokens 
      SET used = 1
      WHERE token = ?
    `).run(token);

    console.log(`✅ Password reset for user: ${userId}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = db.prepare(`
      SELECT id, username, email, full_name, grade, age, role, created_at
      FROM users WHERE email = ?
    `).get(email) as any;

    return user || null;
  }
}

export const authService = new AuthService();
