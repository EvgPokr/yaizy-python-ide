import { create } from 'zustand';
import { Project as BackendProject } from '@/lib/api/projectsClient';

interface ProjectMetaStore {
  projectMeta: BackendProject | null;
  setProjectMeta: (project: BackendProject | null) => void;
  updateIsPublic: (isPublic: boolean) => void;
}

export const useProjectMetaStore = create<ProjectMetaStore>((set) => ({
  projectMeta: null,
  
  setProjectMeta: (project) => set({ projectMeta: project }),
  
  updateIsPublic: (isPublic) => set((state) => {
    if (!state.projectMeta) return state;
    return {
      projectMeta: {
        ...state.projectMeta,
        is_public: isPublic,
      },
    };
  }),
}));
