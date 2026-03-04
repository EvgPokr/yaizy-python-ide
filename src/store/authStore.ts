import { create } from 'zustand';
import { authClient, User } from '@/lib/api/authClient';
import { projectStorage } from '@/lib/storage/projectStorage';
import { projectsClient } from '@/lib/api/projectsClient';

/**
 * Migrate guest project to server after login/registration
 * Returns the created project ID if successful
 */
async function migrateGuestProject(): Promise<string | null> {
  try {
    // Load current guest project from localStorage
    const guestProject = await projectStorage.load();
    
    if (!guestProject) {
      console.log('No guest project to migrate');
      return null;
    }

    console.log('Migrating guest project to server:', guestProject.name);

    // Create project on server
    const createdProject = await projectsClient.createProject(
      guestProject.name,
      '', // description
      false // isPublic
    );

    // Update all files from guest project
    for (const file of guestProject.files) {
      await projectsClient.updateFile(
        createdProject.id,
        file.id,
        file.content
      );
    }

    // Clear guest project from localStorage
    await projectStorage.clear();

    console.log('Guest project migrated successfully:', createdProject.id);
    return createdProject.id;
  } catch (error) {
    console.error('Failed to migrate guest project:', error);
    // Don't throw - migration failure shouldn't break login
    return null;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    fullName?: string,
    email?: string,
    grade?: string,
    age?: string
  ) => Promise<void>;
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

      // Migrate guest project to server after successful login
      await migrateGuestProject();
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

  register: async (
    username: string,
    password: string,
    fullName?: string,
    email?: string,
    grade?: string,
    age?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authClient.register(
        username,
        password,
        fullName,
        email,
        grade,
        age
      );
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Migrate guest project to server after successful registration
      await migrateGuestProject();
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
