import { describe, it, expect } from 'vitest';
import { checkTask } from './checkTask';
import type { Task } from '@/types';

describe('checkTask', () => {
  describe('outputContains requirement', () => {
    it('should pass when output contains the required text', () => {
      const task: Task = {
        id: 'test-1',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains Hello',
            value: 'Hello',
          },
        ],
        hints: [],
      };

      const code = 'print("Hello, World!")';
      const output = 'Hello, World!';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].message).toContain('✓');
    });

    it('should fail when output does not contain the required text', () => {
      const task: Task = {
        id: 'test-2',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains Goodbye',
            value: 'Goodbye',
          },
        ],
        hints: [],
      };

      const code = 'print("Hello")';
      const output = 'Hello';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].message).toContain('✗');
    });

    it('should respect case sensitivity', () => {
      const task: Task = {
        id: 'test-3',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains hello',
            value: 'hello',
            caseSensitive: true,
          },
        ],
        hints: [],
      };

      const code = 'print("Hello")';
      const output = 'Hello';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
    });

    it('should be case-insensitive by default', () => {
      const task: Task = {
        id: 'test-4',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains hello',
            value: 'hello',
          },
        ],
        hints: [],
      };

      const code = 'print("HELLO")';
      const output = 'HELLO';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
    });
  });

  describe('functionExists requirement', () => {
    it('should pass when function is defined', () => {
      const task: Task = {
        id: 'test-5',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'functionExists',
            id: 'req-1',
            description: 'Function greet exists',
            functionName: 'greet',
          },
        ],
        hints: [],
      };

      const code = `def greet(name):
    print(f"Hello, {name}!")`;
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
      expect(result.results[0].message).toContain('greet()');
    });

    it('should fail when function is not defined', () => {
      const task: Task = {
        id: 'test-6',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'functionExists',
            id: 'req-1',
            description: 'Function calculate exists',
            functionName: 'calculate',
          },
        ],
        hints: [],
      };

      const code = 'x = 10';
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
    });

    it('should detect async functions', () => {
      const task: Task = {
        id: 'test-7',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'functionExists',
            id: 'req-1',
            description: 'Function fetch_data exists',
            functionName: 'fetch_data',
          },
        ],
        hints: [],
      };

      const code = `async def fetch_data():
    return "data"`;
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
    });
  });

  describe('variableExists requirement', () => {
    it('should pass when variable is assigned', () => {
      const task: Task = {
        id: 'test-8',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'variableExists',
            id: 'req-1',
            description: 'Variable name exists',
            variableName: 'name',
          },
        ],
        hints: [],
      };

      const code = 'name = "Alice"';
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
    });

    it('should fail when variable is not assigned', () => {
      const task: Task = {
        id: 'test-9',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'variableExists',
            id: 'req-1',
            description: 'Variable age exists',
            variableName: 'age',
          },
        ],
        hints: [],
      };

      const code = 'name = "Alice"';
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
    });
  });

  describe('maxLines requirement', () => {
    it('should pass when code is within line limit', () => {
      const task: Task = {
        id: 'test-10',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'maxLines',
            id: 'req-1',
            description: 'Code has max 5 lines',
            maxLines: 5,
          },
        ],
        hints: [],
      };

      const code = `print("Line 1")
print("Line 2")
print("Line 3")`;
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
    });

    it('should fail when code exceeds line limit', () => {
      const task: Task = {
        id: 'test-11',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'maxLines',
            id: 'req-1',
            description: 'Code has max 2 lines',
            maxLines: 2,
          },
        ],
        hints: [],
      };

      const code = `print("Line 1")
print("Line 2")
print("Line 3")`;
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
    });

    it('should ignore empty lines and comments', () => {
      const task: Task = {
        id: 'test-12',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'maxLines',
            id: 'req-1',
            description: 'Code has max 2 lines',
            maxLines: 2,
          },
        ],
        hints: [],
      };

      const code = `# This is a comment
print("Line 1")

print("Line 2")`;
      const output = '';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
    });
  });

  describe('multiple requirements', () => {
    it('should pass when all requirements are met', () => {
      const task: Task = {
        id: 'test-13',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains Hello',
            value: 'Hello',
          },
          {
            type: 'functionExists',
            id: 'req-2',
            description: 'Function greet exists',
            functionName: 'greet',
          },
          {
            type: 'maxLines',
            id: 'req-3',
            description: 'Code has max 10 lines',
            maxLines: 10,
          },
        ],
        hints: [],
      };

      const code = `def greet():
    print("Hello, World!")
    
greet()`;
      const output = 'Hello, World!';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.passed)).toBe(true);
    });

    it('should fail when any requirement is not met', () => {
      const task: Task = {
        id: 'test-14',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains Hello',
            value: 'Hello',
          },
          {
            type: 'functionExists',
            id: 'req-2',
            description: 'Function greet exists',
            functionName: 'greet',
          },
        ],
        hints: [],
      };

      const code = 'print("Hello")'; // No function defined
      const output = 'Hello';

      const result = checkTask(task, code, output);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[1].passed).toBe(false);
    });
  });

  describe('feedback generation', () => {
    it('should provide encouraging feedback for all passed', () => {
      const task: Task = {
        id: 'test-15',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Output contains Hello',
            value: 'Hello',
          },
        ],
        hints: [],
      };

      const result = checkTask(task, 'print("Hello")', 'Hello');

      expect(result.feedback).toContain('Отлично');
      expect(result.feedback).toContain('🎉');
    });

    it('should provide encouraging feedback for partial completion', () => {
      const task: Task = {
        id: 'test-16',
        title: 'Test',
        description: 'Test task',
        requirements: [
          {
            type: 'outputContains',
            id: 'req-1',
            description: 'Req 1',
            value: 'Hello',
          },
          {
            type: 'outputContains',
            id: 'req-2',
            description: 'Req 2',
            value: 'World',
          },
        ],
        hints: [],
      };

      const result = checkTask(task, 'print("Hello")', 'Hello');

      expect(result.feedback).toBeTruthy();
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });
});
