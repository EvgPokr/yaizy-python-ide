import { create } from 'zustand';
import { authClient, User } from '@/lib/api/authClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName?: string, email?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authClient.login(username, password);
      set({ 
        user: result.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  register: async (username: string, password: string, fullName?: string, email?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authClient.register(username, password, fullName, email);
      set({ 
        user: result.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Registration failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: () => {
    authClient.logout();
    set({ 
      user: null, 
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    if (!authClient.isAuthenticated()) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    try {
      const user = await authClient.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null,
      });
    } catch (error) {
      authClient.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
