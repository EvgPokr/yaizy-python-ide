import { create } from 'zustand';
import { authClient, User } from '@/lib/api/authClient';
import { projectStorage } from '@/lib/storage/projectStorage';
import { projectsClient } from '@/lib/api/projectsClient';
import { useIDEStore } from './ideStore';
import { useProjectMetaStore } from './projectMetaStore';

/**
 * Migrate guest project to server after login/registration
 * Returns the created project with all files if successful
 */
async function migrateGuestProject() {
  try {
    // Load current guest project from localStorage
    const guestProject = await projectStorage.load();
    
    if (!guestProject) {
      console.log('No guest project to migrate');
      return null;
    }

    console.log('Migrating guest project to server:', guestProject.name);

    // Create project on server with name "Untitled"
    const createdProject = await projectsClient.createProject(
      'Untitled',
      '', // description
      false // isPublic
    );

    // Update the default main.py file with content from guest project
    // The server creates a project with one file (main.py), we update its content
    if (createdProject.files.length > 0 && guestProject.files.length > 0) {
      const serverFileId = createdProject.files[0].id;
      const guestFileContent = guestProject.files[0].content;
      
      await projectsClient.updateFile(
        createdProject.id,
        serverFileId, // Use server's file ID, not guest's
        guestFileContent
      );
    }

    // Fetch the complete updated project
    const completeProject = await projectsClient.getProject(createdProject.id);

    // Clear guest project from localStorage
    await projectStorage.clear();

    console.log('Guest project migrated successfully:', createdProject.id);
    return completeProject;
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
      const migratedProject = await migrateGuestProject();
      
      // Load migrated project into IDE
      if (migratedProject) {
        const { setProject } = useIDEStore.getState();
        const { setProjectMeta } = useProjectMetaStore.getState();
        
        // Convert server project to local project format
        const localProject = {
          id: migratedProject.id,
          name: migratedProject.name,
          files: migratedProject.files.map(f => ({
            id: f.id,
            name: f.name,
            content: f.content,
            language: 'python' as const,
            createdAt: new Date(f.created_at),
            updatedAt: new Date(f.updated_at),
          })),
          activeFileId: migratedProject.files[0]?.id || '',
          createdAt: new Date(migratedProject.created_at),
          updatedAt: new Date(migratedProject.updated_at),
        };
        
        setProject(localProject);
        setProjectMeta(migratedProject);
        
        console.log('Migrated project loaded into IDE:', migratedProject.name);
      }
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
      const migratedProject = await migrateGuestProject();
      
      // Load migrated project into IDE
      if (migratedProject) {
        const { setProject } = useIDEStore.getState();
        const { setProjectMeta } = useProjectMetaStore.getState();
        
        // Convert server project to local project format
        const localProject = {
          id: migratedProject.id,
          name: migratedProject.name,
          files: migratedProject.files.map(f => ({
            id: f.id,
            name: f.name,
            content: f.content,
            language: 'python' as const,
            createdAt: new Date(f.created_at),
            updatedAt: new Date(f.updated_at),
          })),
          activeFileId: migratedProject.files[0]?.id || '',
          createdAt: new Date(migratedProject.created_at),
          updatedAt: new Date(migratedProject.updated_at),
        };
        
        setProject(localProject);
        setProjectMeta(migratedProject);
        
        console.log('Migrated project loaded into IDE:', migratedProject.name);
      }
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
