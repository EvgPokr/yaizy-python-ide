export interface PythonSession {
  id: string;
  containerId: string | null;
  ptySessionId: string | null;
  workspaceDir: string;
  createdAt: Date;
  lastActivityAt: Date;
  isRunning: boolean;
  ipAddress: string;
  executionCount: number;
}

export interface SessionCreateRequest {
  // Optional: user identifier for tracking
  userId?: string;
}

export interface SessionCreateResponse {
  sessionId: string;
  wsUrl: string;
}

export interface RunCodeRequest {
  code: string;
  filename?: string; // Default: main.py
}

export interface RunCodeResponse {
  success: boolean;
  message: string;
}

export interface StopExecutionResponse {
  success: boolean;
  message: string;
}

export interface WebSocketMessage {
  type: 'stdin' | 'stdout' | 'stderr' | 'exit' | 'timeout' | 'resize' | 'error';
  data?: string;
  code?: number;
  cols?: number;
  rows?: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  sessionsPerIP: Map<string, number>;
}

export interface DockerContainerConfig {
  image: string;
  memory: string;
  cpus: number;
  pidsLimit: number;
  networkMode: string;
  readOnly: boolean;
  user: string;
  workDir: string;
  binds: string[];
}

export interface RateLimitInfo {
  ip: string;
  executionCount: number;
  windowStart: Date;
}
