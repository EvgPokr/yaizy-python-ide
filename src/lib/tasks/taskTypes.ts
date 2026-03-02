// Типы для системы заданий
// Реэкспорт из основных типов для удобства

export type {
  Task,
  TaskRequirement,
  OutputContainsRequirement,
  FunctionExistsRequirement,
  VariableExistsRequirement,
  MaxLinesRequirement,
  RequirementResult,
  TaskCheckResult,
} from '@/types';

// Example task for demonstration
export const EXAMPLE_TASK: Task = {
  id: 'example-1',
  title: 'Hello, World!',
  description:
    'Write a program that prints "Hello, World!" to the screen.',
  requirements: [
    {
      type: 'outputContains',
      id: 'req-1',
      description: 'Output contains "Hello, World!"',
      value: 'Hello, World!',
      caseSensitive: false,
    },
    {
      type: 'maxLines',
      id: 'req-2',
      description: 'Code does not exceed 5 lines',
      maxLines: 5,
    },
  ],
  hints: [
    'Use the print() function to output text',
    'Put the text in quotes: "Hello, World!"',
  ],
  exampleOutput: 'Hello, World!',
};

import type { Task } from '@/types';
