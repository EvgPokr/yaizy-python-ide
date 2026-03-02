import * as path from 'path';
import * as fs from 'fs-extra';
import Docker from 'dockerode';
import { Stream } from 'stream';

export interface PTYOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: { [key: string]: string };
}

interface PTYSession {
  exec: Docker.Exec;
  stream: Stream;
  containerId: string;
  workspaceDir: string;
}

export class PTYManager {
  private docker: Docker;
  private ptySessions: Map<string, PTYSession> = new Map();
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.docker = new Docker();
  }

  /**
   * Create a new PTY process for Python execution inside Docker
   */
  async createPTY(
    sessionId: string,
    containerId: string,
    workspaceDir: string,
    options: PTYOptions = {}
  ): Promise<PTYSession> {
    try {
      console.log(`Creating PTY for session ${sessionId} in container ${containerId}...`);

      const container = this.docker.getContainer(containerId);

      // Create exec instance with bash - simplest approach
      const exec = await container.exec({
        Cmd: ['/bin/bash'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Env: [
          'PYTHONUNBUFFERED=1',
          'PYTHONDONTWRITEBYTECODE=1',
          'TERM=xterm-256color',
          'PS1=',
        ],
        WorkingDir: '/workspace',
        User: 'student',
      });

      // Start exec and get stream
      const stream = await exec.start({
        Tty: true,
        stdin: true,
        hijack: true,
      });

      const session: PTYSession = {
        exec,
        stream,
        containerId,
        workspaceDir,
      };

      this.ptySessions.set(sessionId, session);

      console.log(`PTY created for session ${sessionId}`);
      return session;

    } catch (error) {
      console.error(`Failed to create PTY for session ${sessionId}:`, error);
      throw new Error(`PTY creation failed: ${error}`);
    }
  }

  /**
   * Get existing PTY for a session
   */
  getPTY(sessionId: string): PTYSession | undefined {
    return this.ptySessions.get(sessionId);
  }

  /**
   * Get stream for a session
   */
  getStream(sessionId: string): Stream | undefined {
    return this.ptySessions.get(sessionId)?.stream;
  }

  /**
   * Write data to PTY stdin
   */
  write(sessionId: string, data: string): void {
    const session = this.ptySessions.get(sessionId);
    if (session && session.stream) {
      session.stream.write(data);
    } else {
      throw new Error(`No PTY found for session ${sessionId}`);
    }
  }

  /**
   * Resize PTY terminal
   */
  async resize(sessionId: string, cols: number, rows: number): Promise<void> {
    const session = this.ptySessions.get(sessionId);
    if (session) {
      try {
        await session.exec.resize({ h: rows, w: cols });
        console.log(`PTY resized for session ${sessionId}: ${cols}x${rows}`);
      } catch (error) {
        console.error(`Failed to resize PTY for session ${sessionId}:`, error);
      }
    }
  }

  /**
   * Execute Python code in the PTY
   */
  async executeCode(
    sessionId: string,
    code: string,
    filename: string = 'main.py',
    timeoutMs: number = 10000
  ): Promise<void> {
    const session = this.ptySessions.get(sessionId);
    if (!session) {
      throw new Error(`No PTY found for session ${sessionId}`);
    }

    try {
      // Clear any existing timeout
      this.clearExecutionTimeout(sessionId);

      // Write code to file in workspace directory (mounted in Docker)
      const filePath = path.join(session.workspaceDir, filename);
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`Code written to ${filePath} for session ${sessionId}`);

      // Mark execution start with special marker
      this.write(sessionId, `echo "__RUN_START__"\n`);
      
      // Run Python command
      this.write(sessionId, `/usr/local/bin/run_python.sh /workspace/${filename}\n`);
      
      // Mark execution end with special marker (done in run_python.sh via __EXECUTION_COMPLETE__)

      // Set execution timeout
      const timeout = setTimeout(() => {
        console.log(`Execution timeout for session ${sessionId}`);
        this.stopExecution(sessionId);
      }, timeoutMs);

      this.executionTimeouts.set(sessionId, timeout);

    } catch (error) {
      console.error(`Failed to execute code for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Stop current execution (send SIGINT)
   */
  stopExecution(sessionId: string): void {
    const session = this.ptySessions.get(sessionId);
    if (session) {
      // Send Ctrl+C (SIGINT)
      this.write(sessionId, '\x03');
      console.log(`Sent SIGINT to session ${sessionId}`);
      
      this.clearExecutionTimeout(sessionId);
      
      // Send a newline after a short delay to ensure bash returns to prompt
      // This helps recover from interrupted commands
      setTimeout(() => {
        this.write(sessionId, '\n');
        console.log(`Sent newline to session ${sessionId} to recover bash prompt`);
      }, 100);
    }
  }

  /**
   * Kill PTY process forcefully
   */
  async kill(sessionId: string): Promise<void> {
    const session = this.ptySessions.get(sessionId);
    if (session) {
      try {
        // Destroy stream
        if (session.stream) {
          session.stream.destroy();
        }
        console.log(`Killed PTY for session ${sessionId}`);
      } catch (error) {
        console.error(`Failed to kill PTY for session ${sessionId}:`, error);
      }
      this.cleanup(sessionId);
    }
  }

  /**
   * Cleanup PTY resources
   */
  private cleanup(sessionId: string): void {
    this.ptySessions.delete(sessionId);
    this.clearExecutionTimeout(sessionId);
  }

  /**
   * Clear execution timeout (public for WebSocket handler)
   */
  clearExecutionTimeout(sessionId: string): void {
    const timeout = this.executionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionTimeouts.delete(sessionId);
      console.log(`Cleared execution timeout for session ${sessionId}`);
    }
  }

  /**
   * Cleanup all PTY processes
   */
  async cleanupAll(): Promise<void> {
    console.log(`Cleaning up ${this.ptySessions.size} PTY processes...`);
    
    const cleanupPromises = [];
    for (const [sessionId, session] of this.ptySessions.entries()) {
      try {
        if (session.stream) {
          session.stream.destroy();
        }
      } catch (error) {
        console.error(`Error killing PTY for session ${sessionId}:`, error);
      }
      cleanupPromises.push(Promise.resolve());
    }

    await Promise.all(cleanupPromises);

    this.ptySessions.clear();
    
    for (const timeout of this.executionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.executionTimeouts.clear();
  }

  /**
   * Get number of active PTY processes
   */
  getActiveCount(): number {
    return this.ptySessions.size;
  }
}
