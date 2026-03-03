import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projectsClient } from '@/lib/api/projectsClient';
import { useIDEStore } from '@/store/ideStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook for auto-saving project changes to backend
 */
export function useProjectSync() {
  const { projectId } = useParams<{ projectId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { project, activeFile } = useIDEStore();
  const lastSavedContentRef = useRef<Map<string, string>>(new Map());
  const saveTimeoutRef = useRef<any>(null);
  const isSavingRef = useRef(false);

  /**
   * Save file content to backend
   */
  const saveFileToBackend = useCallback(async (fileId: string, content: string) => {
    if (!projectId || !isAuthenticated || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await projectsClient.updateFile(projectId, fileId, content);
      lastSavedContentRef.current.set(fileId, content);
      console.log(`✅ File ${fileId} saved to backend`);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId, isAuthenticated]);

  /**
   * Auto-save with debounce
   */
  useEffect(() => {
    if (!activeFile || !projectId || !isAuthenticated) return;

    const lastContent = lastSavedContentRef.current.get(activeFile.id);
    
    // Check if content changed
    if (lastContent === activeFile.content) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveFileToBackend(activeFile.id, activeFile.content);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeFile?.content, activeFile?.id, projectId, isAuthenticated, saveFileToBackend]);

  /**
   * Save on unmount (when leaving page)
   */
  useEffect(() => {
    return () => {
      // Save all unsaved files before unmounting
      if (project && projectId && isAuthenticated) {
        project.files.forEach(file => {
          const lastContent = lastSavedContentRef.current.get(file.id);
          if (lastContent !== file.content) {
            // Fire and forget - don't wait for response
            projectsClient.updateFile(projectId, file.id, file.content).catch(console.error);
          }
        });
      }
    };
  }, [project, projectId, isAuthenticated]);

  return {
    isSaving: isSavingRef.current,
  };
}
