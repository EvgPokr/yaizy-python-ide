import { create } from 'zustand';
import { Project as BackendProject } from '@/lib/api/projectsClient';

interface ProjectMetaStore {
  projectMeta: BackendProject | null;
  isReadOnly: boolean;
  setProjectMeta: (project: BackendProject | null) => void;
  setReadOnly: (readOnly: boolean) => void;
  updateIsPublic: (isPublic: boolean) => void;
}

export const useProjectMetaStore = create<ProjectMetaStore>((set) => ({
  projectMeta: null,
  isReadOnly: false,
  
  setProjectMeta: (project) => set({ projectMeta: project }),
  
  setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
  
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
