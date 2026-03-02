// Основные типы для Python Editor

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: 'python';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  activeFileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsoleLog {
  id: string;
  type: 'stdout' | 'stderr' | 'system' | 'input-prompt' | 'input-response';
  content: string;
  timestamp: Date;
}

export interface SimplifiedError {
  type: string;
  title: string;
  explanation: string;
  location: {
    file: string;
    line: number;
    column?: number;
    snippet?: string;
  };
  fixSteps: string[];
  confidence: 'high' | 'medium' | 'low';
  originalError: string;
}

export interface RunResult {
  success: boolean;
  output: string[];
  errors: string[];
  executionTime: number;
  error?: SimplifiedError;
}

export interface PanelSizes {
  filePanel: number;
  instructionPanel: number;
  consoleHeight: number;
}

export type PyodideStatus = 'loading' | 'ready' | 'error';

// Типы для заданий
export interface Task {
  id: string;
  title: string;
  description: string;
  requirements: TaskRequirement[];
  hints: string[];
  exampleInput?: string;
  exampleOutput?: string;
}

export type TaskRequirement =
  | OutputContainsRequirement
  | FunctionExistsRequirement
  | VariableExistsRequirement
  | MaxLinesRequirement;

export interface OutputContainsRequirement {
  type: 'outputContains';
  id: string;
  description: string;
  value: string;
  caseSensitive?: boolean;
}

export interface FunctionExistsRequirement {
  type: 'functionExists';
  id: string;
  description: string;
  functionName: string;
}

export interface VariableExistsRequirement {
  type: 'variableExists';
  id: string;
  description: string;
  variableName: string;
}

export interface MaxLinesRequirement {
  type: 'maxLines';
  id: string;
  description: string;
  maxLines: number;
}

export interface RequirementResult {
  requirementId: string;
  passed: boolean;
  message: string;
}

export interface TaskCheckResult {
  passed: boolean;
  results: RequirementResult[];
  feedback: string;
}

// Pyodide интерфейс
export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  runPython: (code: string) => unknown;
  loadPackage: (packages: string | string[]) => Promise<void>;
  globals: {
    get: (name: string) => unknown;
  };
  FS: {
    writeFile: (path: string, data: string) => void;
    readFile: (path: string) => Uint8Array;
  };
}
