/**
 * Auth API client
 */

const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 
  ((import.meta as any).env?.MODE === 'production' ? '' : 'http://localhost:3001');

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

class AuthClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Login
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result: LoginResult = await response.json();
    this.setToken(result.token);
    return result;
  }

  /**
   * Logout
   */
  logout() {
    this.setToken(null);
  }

  /**
   * Register new user
   */
  async register(username: string, password: string, fullName?: string, email?: string): Promise<LoginResult> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, fullName, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const user: User = await response.json();
    
    // Auto-login after registration
    return this.login(username, password);
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }

    return response.json();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authClient = new AuthClient();
