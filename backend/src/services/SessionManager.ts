import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PythonSession, SessionStats, RateLimitInfo } from '../types/session';
import { DockerManager } from './DockerManager';
import { PTYManager } from './PTYManager';

export class SessionManager {
  private sessions: Map<string, PythonSession> = new Map();
  private dockerManager: DockerManager;
  private ptyManager: PTYManager;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  
  private readonly SESSION_TIMEOUT_MS: number;
  private readonly MAX_SESSIONS_PER_IP: number;
  private readonly MAX_EXECUTIONS_PER_HOUR: number;
  private readonly WORKSPACE_BASE_DIR: string;

  constructor() {
    this.dockerManager = new DockerManager();
    this.ptyManager = new PTYManager();
    
    // Configuration from environment
    // Set to 24 hours (86400000 ms) - effectively unlimited while browser is open
    this.SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '86400000', 10);
    this.MAX_SESSIONS_PER_IP = parseInt(process.env.MAX_SESSIONS_PER_IP || '999999', 10); // Effectively unlimited
    this.MAX_EXECUTIONS_PER_HOUR = parseInt(process.env.MAX_EXECUTIONS_PER_HOUR || '999999', 10); // Effectively unlimited
    this.WORKSPACE_BASE_DIR = process.env.WORKSPACE_BASE_DIR || '/tmp/python-sessions';

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new Python session
   */
  async createSession(ipAddress: string): Promise<PythonSession> {
    // Check rate limits
    this.checkRateLimits(ipAddress);

    // Generate session ID
    const sessionId = uuidv4();

    // Create workspace directory
    const workspaceDir = path.join(this.WORKSPACE_BASE_DIR, sessionId);
    await fs.ensureDir(workspaceDir);
    
    console.log(`Creating session ${sessionId} for IP ${ipAddress}...`);

    try {
      // Create Docker container
      const containerId = await this.dockerManager.createContainer(sessionId, workspaceDir);

      // Create PTY process inside Docker container
      await this.ptyManager.createPTY(sessionId, containerId, workspaceDir);

      // Create session object
      const session: PythonSession = {
        id: sessionId,
        containerId,
        ptySessionId: sessionId,
        workspaceDir,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        isRunning: false,
        ipAddress,
        executionCount: 0,
      };

      this.sessions.set(sessionId, session);
      
      console.log(`Session ${sessionId} created successfully`);
      return session;

    } catch (error) {
      // Cleanup on failure
      await this.cleanupSessionResources(sessionId, workspaceDir, null);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): PythonSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
    return session;
  }

  /**
   * Execute code in a session
   */
  async executeCode(
    sessionId: string,
    code: string,
    filename: string = 'main.py'
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check execution rate limit (disabled for unlimited executions)
    // this.checkExecutionRateLimit(session.ipAddress);

    // If already running, stop previous execution first
    if (session.isRunning) {
      console.log(`Session ${sessionId} already running, stopping previous execution...`);
      this.stopExecution(sessionId);
      // Small delay to ensure previous execution is stopped
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    session.isRunning = true;
    session.lastActivityAt = new Date();
    session.executionCount++;

    try {
      // Increased timeout to 60 seconds for turtle graphics and long-running code
      const timeoutMs = parseInt(process.env.EXECUTION_TIMEOUT_MS || '60000', 10);
      await this.ptyManager.executeCode(sessionId, code, filename, timeoutMs);
    } catch (error) {
      session.isRunning = false;
      throw error;
    }

    // Note: isRunning will be set to false when execution completes
    // or is stopped manually
  }

  /**
   * Stop execution in a session
   */
  stopExecution(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.ptyManager.stopExecution(sessionId);
    session.isRunning = false;
    session.lastActivityAt = new Date();
  }

  /**
   * Mark execution as complete (called when code finishes naturally)
   */
  markExecutionComplete(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Attempted to mark non-existent session ${sessionId} as complete`);
      return;
    }

    session.isRunning = false;
    session.lastActivityAt = new Date();
    console.log(`Session ${sessionId} execution marked as complete`);
  }

  /**
   * Reset a session (kill and recreate)
   */
  async resetSession(sessionId: string): Promise<PythonSession> {
    const oldSession = this.sessions.get(sessionId);
    if (!oldSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const ipAddress = oldSession.ipAddress;

    // Delete old session
    await this.deleteSession(sessionId);

    // Create new session
    return await this.createSession(ipAddress);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return; // Already deleted
    }

    console.log(`Deleting session ${sessionId}...`);

    await this.cleanupSessionResources(
      sessionId,
      session.workspaceDir,
      session.containerId
    );

    this.sessions.delete(sessionId);
    console.log(`Session ${sessionId} deleted`);
  }

  /**
   * Cleanup session resources
   */
  private async cleanupSessionResources(
    sessionId: string,
    workspaceDir: string,
    containerId: string | null
  ): Promise<void> {
    // Kill PTY
    this.ptyManager.kill(sessionId);

    // Remove Docker container
    if (containerId) {
      await this.dockerManager.removeContainer(containerId);
    }

    // Remove workspace directory
    try {
      await fs.remove(workspaceDir);
    } catch (error) {
      console.error(`Failed to remove workspace ${workspaceDir}:`, error);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): SessionStats {
    const sessionsPerIP = new Map<string, number>();
    
    for (const session of this.sessions.values()) {
      const count = sessionsPerIP.get(session.ipAddress) || 0;
      sessionsPerIP.set(session.ipAddress, count + 1);
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isRunning).length,
      sessionsPerIP,
    };
  }

  /**
   * Check if IP is within rate limits
   */
  private checkRateLimits(ipAddress: string): void {
    // Check sessions per IP
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => s.ipAddress === ipAddress);
    
    if (activeSessions.length >= this.MAX_SESSIONS_PER_IP) {
      throw new Error(`Rate limit exceeded: Maximum ${this.MAX_SESSIONS_PER_IP} sessions per IP`);
    }
  }

  /**
   * Check execution rate limit for IP
   */
  private checkExecutionRateLimit(ipAddress: string): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    let rateLimit = this.rateLimitMap.get(ipAddress);
    
    if (!rateLimit || rateLimit.windowStart < oneHourAgo) {
      // Start new window
      rateLimit = {
        ip: ipAddress,
        executionCount: 0,
        windowStart: now,
      };
      this.rateLimitMap.set(ipAddress, rateLimit);
    }

    if (rateLimit.executionCount >= this.MAX_EXECUTIONS_PER_HOUR) {
      throw new Error(`Rate limit exceeded: Maximum ${this.MAX_EXECUTIONS_PER_HOUR} executions per hour`);
    }

    rateLimit.executionCount++;
  }

  /**
   * Start automatic cleanup of idle sessions
   */
  private startCleanupInterval(): void {
    setInterval(async () => {
      await this.cleanupIdleSessions();
      await this.dockerManager.cleanupOrphanedContainers();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup idle sessions
   */
  private async cleanupIdleSessions(): Promise<void> {
    const now = new Date();
    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const idleTime = now.getTime() - session.lastActivityAt.getTime();
      
      if (idleTime > this.SESSION_TIMEOUT_MS) {
        console.log(`Session ${sessionId} idle for ${idleTime}ms, cleaning up...`);
        sessionsToDelete.push(sessionId);
      }
    }

    for (const sessionId of sessionsToDelete) {
      await this.deleteSession(sessionId);
    }

    if (sessionsToDelete.length > 0) {
      console.log(`Cleaned up ${sessionsToDelete.length} idle sessions`);
    }
  }

  /**
   * Shutdown all sessions
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down SessionManager...');
    
    const sessionIds = Array.from(this.sessions.keys());
    
    for (const sessionId of sessionIds) {
      await this.deleteSession(sessionId);
    }

    this.ptyManager.cleanupAll();
    console.log('SessionManager shutdown complete');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ docker: boolean; sessions: number }> {
    const dockerOk = await this.dockerManager.checkDocker();
    const imageOk = await this.dockerManager.checkImage();
    
    return {
      docker: dockerOk && imageOk,
      sessions: this.sessions.size,
    };
  }

  /**
   * Get PTY Manager instance
   */
  getPTYManager(): PTYManager {
    return this.ptyManager;
  }
}
