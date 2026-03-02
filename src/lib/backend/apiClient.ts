/**
 * REST API client for backend Python execution
 */

// In production, use empty string for relative URLs (proxied by nginx)
// In development, use localhost:3001
const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 
  ((import.meta as any).env?.MODE === 'production' ? '' : 'http://localhost:3001');

export interface SessionCreateResponse {
  sessionId: string;
  wsUrl: string;
}

export interface RunCodeRequest {
  code: string;
  filename?: string;
}

export interface RunCodeResponse {
  success: boolean;
  message: string;
}

export interface StopExecutionResponse {
  success: boolean;
  message: string;
}

export interface SessionInfo {
  sessionId: string;
  isRunning: boolean;
  createdAt: string;
  lastActivityAt: string;
  executionCount: number;
}

export interface HealthCheckResponse {
  status: string;
  docker: string;
  sessions: number;
  wsConnections: number;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<SessionCreateResponse> {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session');
    }

    return response.json();
  }

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<SessionInfo> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get session');
    }

    return response.json();
  }

  /**
   * Execute code in session
   */
  async runCode(sessionId: string, request: RunCodeRequest): Promise<RunCodeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to run code';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('runCode error:', error);
      throw error;
    }
  }

  /**
   * Stop code execution
   */
  async stopExecution(sessionId: string): Promise<StopExecutionResponse> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/stop`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop execution');
    }

    return response.json();
  }

  /**
   * Reset session
   */
  async resetSession(sessionId: string): Promise<SessionCreateResponse> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset session');
    }

    return response.json();
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete session');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  /**
   * Get WebSocket URL
   */
  getWebSocketUrl(sessionId: string): string {
    // In production (baseUrl is empty), use current host
    if (!this.baseUrl) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      return `${wsProtocol}://${host}/api/sessions/${sessionId}/terminal`;
    }
    
    // In development, use configured baseUrl
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = this.baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrl}/api/sessions/${sessionId}/terminal`;
  }
}

export const apiClient = new APIClient();
