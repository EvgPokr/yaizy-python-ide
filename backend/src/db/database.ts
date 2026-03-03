import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'python-ide.db');

// Ensure data directory exists
fs.ensureDirSync(DB_DIR);

// Initialize database
export const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
export function initDatabase() {
  console.log('Initializing database...');
  
  // Users table (teachers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'teacher',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create default teacher account if not exists
  const defaultUser = db.prepare('SELECT id FROM users WHERE username = ?').get('teacher');
  if (!defaultUser) {
    const bcrypt = require('bcrypt');
    const defaultPassword = bcrypt.hashSync('teacher123', 10);
    const userId = require('uuid').v4();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'teacher', defaultPassword, 'Default Teacher', 'teacher', now, now);
    
    console.log('✅ Default teacher account created (username: teacher, password: teacher123)');
  }

  console.log('✅ Database initialized');
}
