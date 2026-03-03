import React, { useEffect } from 'react';
import { useIDEStore } from '@/store/ideStore';
import { useProjectMetaStore } from '@/store/projectMetaStore';
import { projectStorage } from '@/lib/storage/projectStorage';
import { BackendLayout } from '@/components/IDE/BackendLayout';
import '@/styles/ide.css';

/**
 * Main Python Editor page (Backend version)
 * Uses serverside CPython execution via WebSocket + PTY
 */
export const PythonIDEPage: React.FC = () => {
  const {
    project,
    setProject,
    initializeProject,
  } = useIDEStore();
  const { setProjectMeta, setReadOnly } = useProjectMetaStore();

  // Load project from storage on mount
  useEffect(() => {
    // Clear project metadata and disable read-only mode (guest mode)
    setProjectMeta(null);
    setReadOnly(false);
    let mounted = true;

    async function loadProject() {
      try {
        const savedProject = await projectStorage.load();

        if (!mounted) return;

        if (savedProject) {
          setProject(savedProject);
        } else {
          // Create new project
          initializeProject();
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        // Fallback: create new project
        if (mounted) {
          initializeProject();
        }
      }
    }

    loadProject();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save project with debounce
  useEffect(() => {
    if (!project) return;

    const timeoutId = setTimeout(() => {
      projectStorage.save(project);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [project]);

  // Main UI
  return <BackendLayout />;
};
