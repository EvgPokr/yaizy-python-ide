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
  
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Folders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      folder_id TEXT,
      is_public INTEGER DEFAULT 0,
      forked_from TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);

  // Migrate existing projects table
  try {
    const columns = db.pragma('table_info(projects)');
    const columnNames = columns.map((col: any) => col.name);
    
    if (!columnNames.includes('is_public')) {
      console.log('Adding is_public column to projects table...');
      db.exec('ALTER TABLE projects ADD COLUMN is_public INTEGER DEFAULT 0');
    }
    
    if (!columnNames.includes('forked_from')) {
      console.log('Adding forked_from column to projects table...');
      db.exec('ALTER TABLE projects ADD COLUMN forked_from TEXT');
    }
    
    if (!columnNames.includes('folder_id')) {
      console.log('Adding folder_id column to projects table...');
      db.exec('ALTER TABLE projects ADD COLUMN folder_id TEXT');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

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

  // Create default demo account if not exists
  const defaultUser = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');
  if (!defaultUser) {
    const bcrypt = require('bcrypt');
    const defaultPassword = bcrypt.hashSync('demo123', 10);
    const userId = require('uuid').v4();
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'demo', defaultPassword, 'Demo User', 'user', now, now);
    
    console.log('✅ Default demo account created (username: demo, password: demo123)');
  }

  console.log('✅ Database initialized');
}
