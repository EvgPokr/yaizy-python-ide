import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project } from '@/types';

interface PythonIDEDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
}

const DB_NAME = 'python-ide-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const CURRENT_PROJECT_KEY = 'current-project';

let dbInstance: IDBPDatabase<PythonIDEDB> | null = null;

/**
 * Инициализация базы данных
 */
async function getDB(): Promise<IDBPDatabase<PythonIDEDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<PythonIDEDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    return dbInstance;
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    throw error;
  }
}

/**
 * Сохранение проекта в IndexedDB
 */
async function saveToIndexedDB(project: Project): Promise<void> {
  try {
    const db = await getDB();
    
    // Сериализуем даты
    const serializedProject = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      files: project.files.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
    };

    await db.put(STORE_NAME, serializedProject as unknown as Project, CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
    throw error;
  }
}

/**
 * Загрузка проекта из IndexedDB
 */
async function loadFromIndexedDB(): Promise<Project | null> {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, CURRENT_PROJECT_KEY);

    if (!data) {
      return null;
    }

    // Десериализуем даты
    const project: Project = {
      ...data,
      createdAt: new Date(data.createdAt as unknown as string),
      updatedAt: new Date(data.updatedAt as unknown as string),
      files: data.files.map((file) => ({
        ...file,
        createdAt: new Date(file.createdAt as unknown as string),
        updatedAt: new Date(file.updatedAt as unknown as string),
      })),
    };

    return project;
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    return null;
  }
}

/**
 * Fallback: сохранение в localStorage
 */
function saveToLocalStorage(project: Project): void {
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(CURRENT_PROJECT_KEY, serialized);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    throw error;
  }
}

/**
 * Fallback: загрузка из localStorage
 */
function loadFromLocalStorage(): Project | null {
  try {
    const data = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    
    // Восстанавливаем даты
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      files: parsed.files.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
        updatedAt: new Date(file.updatedAt),
      })),
    };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Сохранение проекта
 */
async function save(project: Project): Promise<void> {
  try {
    // Пытаемся сохранить в IndexedDB
    await saveToIndexedDB(project);
  } catch (error) {
    // Fallback на localStorage
    console.warn('Falling back to localStorage');
    saveToLocalStorage(project);
  }
}

/**
 * Загрузка проекта
 */
async function load(): Promise<Project | null> {
  try {
    // Пытаемся загрузить из IndexedDB
    const project = await loadFromIndexedDB();
    if (project) {
      return project;
    }
  } catch (error) {
    console.warn('IndexedDB not available, trying localStorage');
  }

  // Fallback на localStorage
  return loadFromLocalStorage();
}

/**
 * Экспорт проекта в JSON
 */
function exportProject(project: Project): Blob {
  const json = JSON.stringify(project, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Импорт проекта из JSON файла
 */
async function importProject(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Валидация структуры
        if (!parsed.id || !parsed.name || !Array.isArray(parsed.files)) {
          throw new Error('Invalid project structure');
        }

        // Восстанавливаем даты
        const project: Project = {
          ...parsed,
          createdAt: new Date(parsed.createdAt || Date.now()),
          updatedAt: new Date(parsed.updatedAt || Date.now()),
          files: parsed.files.map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt || Date.now()),
            updatedAt: new Date(file.updatedAt || Date.now()),
          })),
        };

        resolve(project);
      } catch (error) {
        reject(
          new Error(
            'Failed to parse project file: ' +
              (error instanceof Error ? error.message : 'Unknown error')
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Очистка хранилища (для тестирования)
 */
async function clear(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Failed to clear IndexedDB');
  }

  try {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage');
  }
}

export const projectStorage = {
  save,
  load,
  exportProject,
  importProject,
  clear,
};
