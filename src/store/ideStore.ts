import { create } from 'zustand';
import type {
  Project,
  ProjectFile,
  ConsoleLog,
  SimplifiedError,
  PanelSizes,
  PyodideInterface,
} from '@/types';
import { nanoid } from '@/lib/utils/nanoid';
import { runPython } from '@/lib/pyodide/runPython';
import { projectStorage } from '@/lib/storage/projectStorage';

interface IDEStore {
  // Project
  project: Project | null;
  setProject: (project: Project) => void;
  initializeProject: () => void;

  // Files
  activeFile: ProjectFile | null;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (name: string) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;

  // Execution
  pyodide: PyodideInterface | null;
  setPyodide: (pyodide: PyodideInterface) => void;
  isRunning: boolean;
  consoleLogs: ConsoleLog[];
  currentError: SimplifiedError | null;
  runCode: () => Promise<void>;
  clearConsole: () => void;
  addConsoleLog: (
    type: ConsoleLog['type'],
    content: string
  ) => void;

  // Interactive input
  sendInput: (value: string) => void;

  // UI
  panelSizes: PanelSizes;
  setPanelSize: (panel: keyof PanelSizes, size: number) => void;

  // Auto-save
  saveProject: () => Promise<void>;
}

const DEFAULT_PYTHON_CODE = `# 🐍 Python Editor | YaizY
# Full Python with input(), loops, functions, and turtle graphics!

print("=" * 50)
print("🐢 TURTLE GRAPHICS - Рисуем спираль!")
print("=" * 50)

import turtle

# Настройка
turtle.speed(0)  # Максимальная скорость
turtle.bgcolor("white")
turtle.pensize(2)

# Рисуем цветную спираль
colors = ["red", "orange", "yellow", "green", "blue", "purple"]
for i in range(36):
    turtle.color(colors[i % 6])
    turtle.forward(i * 4)
    turtle.right(60)

# Скрыть черепаху
turtle.hideturtle()

# Сохранить рисунок (автоматически сохраняет как PNG)
turtle.done()

print("\\n🎉 Готово! Проверьте терминал.")
`;

export const useIDEStore = create<IDEStore>((set, get) => ({
  // Project
  project: null,

  setProject: (project) => {
    set({ project });
    const activeFile =
      project.files.find((f) => f.id === project.activeFileId) ||
      project.files[0] ||
      null;
    set({ activeFile });
  },

  initializeProject: () => {
    const mainFile: ProjectFile = {
      id: nanoid(),
      name: 'main.py',
      content: DEFAULT_PYTHON_CODE,
      language: 'python',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const project: Project = {
      id: nanoid(),
      name: 'main', // Use file name without extension
      files: [mainFile],
      activeFileId: mainFile.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ project, activeFile: mainFile });
  },

  // Files
  activeFile: null,

  setActiveFile: (fileId) => {
    const { project } = get();
    if (!project) return;

    const file = project.files.find((f) => f.id === fileId);
    if (file) {
      set({
        activeFile: file,
        project: { ...project, activeFileId: fileId },
      });
      get().saveProject();
    }
  },

  updateFileContent: (fileId, content) => {
    const { project } = get();
    if (!project) return;

    const updatedFiles = project.files.map((file) =>
      file.id === fileId
        ? { ...file, content, updatedAt: new Date() }
        : file
    );

    const updatedProject = {
      ...project,
      files: updatedFiles,
      updatedAt: new Date(),
    };

    set({ project: updatedProject });

    // Обновить activeFile если это тот файл
    if (get().activeFile?.id === fileId) {
      const updatedFile = updatedFiles.find((f) => f.id === fileId);
      if (updatedFile) {
        set({ activeFile: updatedFile });
      }
    }

    // Auto-save с debounce (будет вызываться в компоненте)
    get().saveProject();
  },

  createFile: (name) => {
    const { project } = get();
    if (!project) return;

    const newFile: ProjectFile = {
      id: nanoid(),
      name: name.endsWith('.py') ? name : `${name}.py`,
      content: '# New file\n',
      language: 'python',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProject = {
      ...project,
      files: [...project.files, newFile],
      activeFileId: newFile.id,
      updatedAt: new Date(),
    };

    set({ project: updatedProject, activeFile: newFile });
    get().saveProject();
  },

  deleteFile: (fileId) => {
    const { project } = get();
    if (!project || project.files.length <= 1) {
      // Не удаляем последний файл
      return;
    }

    const updatedFiles = project.files.filter((f) => f.id !== fileId);
    const newActiveFileId =
      project.activeFileId === fileId
        ? updatedFiles[0].id
        : project.activeFileId;

    const updatedProject = {
      ...project,
      files: updatedFiles,
      activeFileId: newActiveFileId,
      updatedAt: new Date(),
    };

    const activeFile = updatedFiles.find((f) => f.id === newActiveFileId)!;

    set({ project: updatedProject, activeFile });
    get().saveProject();
  },

  renameFile: (fileId, newName) => {
    const { project } = get();
    if (!project) return;

    const updatedFiles = project.files.map((file) =>
      file.id === fileId
        ? {
            ...file,
            name: newName.endsWith('.py') ? newName : `${newName}.py`,
            updatedAt: new Date(),
          }
        : file
    );

    const updatedProject = {
      ...project,
      files: updatedFiles,
      updatedAt: new Date(),
    };

    set({ project: updatedProject });

    if (get().activeFile?.id === fileId) {
      const updatedFile = updatedFiles.find((f) => f.id === fileId);
      if (updatedFile) {
        set({ activeFile: updatedFile });
      }
    }

    get().saveProject();
  },

  // Execution
  pyodide: null,
  setPyodide: (pyodide) => set({ pyodide }),

  isRunning: false,
  consoleLogs: [],
  currentError: null,

  addConsoleLog: (type, content) => {
    const log: ConsoleLog = {
      id: nanoid(),
      type,
      content,
      timestamp: new Date(),
    };
    set((state) => ({ consoleLogs: [...state.consoleLogs, log] }));
  },

  sendInput: (value: string) => {
    // Просто отправляем event (для совместимости)
    const event = new CustomEvent('python-input-response', {
      detail: { value },
    });
    window.dispatchEvent(event);
  },

  runCode: async () => {
    const { pyodide, activeFile, addConsoleLog } = get();

    if (!pyodide || !activeFile) {
      addConsoleLog('system', 'Error: Pyodide not loaded or no active file');
      return;
    }

    set({ isRunning: true, currentError: null });
    get().clearConsole();

    const startTime = Date.now();
    addConsoleLog('system', `Running ${activeFile.name}...`);

    try {
      const result = await runPython(activeFile.content, pyodide, {
        timeout: 30000,
      });

      const executionTime = Date.now() - startTime;

      // Output stdout
      result.output.forEach((line) => addConsoleLog('stdout', line));

      // Output stderr
      result.errors.forEach((line) => addConsoleLog('stderr', line));

      if (result.success) {
        addConsoleLog(
          'system',
          `Program completed in ${(executionTime / 1000).toFixed(2)}s`
        );
      } else if (result.error) {
        set({ currentError: result.error });
        addConsoleLog('system', 'Program completed with error');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addConsoleLog('stderr', `Execution error: ${errorMessage}`);
    } finally {
      set({ isRunning: false });
    }
  },

  clearConsole: () => {
    set({ consoleLogs: [], currentError: null });
  },

  // UI
  panelSizes: {
    filePanel: 250,
    instructionPanel: 350,
    consoleHeight: 250,
  },

  setPanelSize: (panel, size) => {
    set((state) => ({
      panelSizes: { ...state.panelSizes, [panel]: size },
    }));
    // Сохраняем размеры в localStorage
    const sizes = get().panelSizes;
    localStorage.setItem('ide-panel-sizes', JSON.stringify(sizes));
  },

  // Auto-save
  saveProject: async () => {
    const { project } = get();
    if (!project) return;

    try {
      await projectStorage.save(project);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  },
}));

// Загрузка размеров панелей из localStorage при инициализации
const savedSizes = localStorage.getItem('ide-panel-sizes');
if (savedSizes) {
  try {
    const sizes = JSON.parse(savedSizes);
    useIDEStore.setState({ panelSizes: sizes });
  } catch (e) {
    console.error('Failed to parse saved panel sizes');
  }
}
