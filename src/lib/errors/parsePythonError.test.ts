import { describe, it, expect } from 'vitest';
import { parsePythonError } from './parsePythonError';

describe('parsePythonError', () => {
  it('should parse NameError correctly', () => {
    const errorString = `Traceback (most recent call last):
  File "<exec>", line 3, in <module>
NameError: name 'x' is not defined`;

    const result = parsePythonError(errorString);

    expect(result.type).toBe('NameError');
    expect(result.title).toBe('Unknown Name');
    expect(result.location.line).toBe(3);
    expect(result.explanation).toContain('x');
    expect(result.fixSteps.length).toBeGreaterThan(0);
    expect(result.confidence).toBe('high');
  });

  it('should parse SyntaxError with missing colon', () => {
    const errorString = `  File "<exec>", line 2
    if x > 5
            ^
SyntaxError: invalid syntax`;

    const result = parsePythonError(errorString);

    expect(result.type).toBe('SyntaxError');
    expect(result.title).toBe('Syntax Error');
    expect(result.location.line).toBe(2);
    expect(result.explanation).toContain('colon');
    expect(result.confidence).toBe('high');
  });

  it('should parse TypeError correctly', () => {
    const errorString = `Traceback (most recent call last):
  File "<exec>", line 1, in <module>
TypeError: unsupported operand type(s) for +: 'int' and 'str'`;

    const result = parsePythonError(errorString);

    expect(result.type).toBe('TypeError');
    expect(result.title).toBe('Type Error');
    expect(result.explanation).toContain('incompatible data types');
    expect(result.fixSteps.length).toBeGreaterThan(0);
    expect(result.confidence).toBe('high');
  });

  it('should parse IndexError correctly', () => {
    const errorString = `Traceback (most recent call last):
  File "<exec>", line 2, in <module>
IndexError: list index out of range`;

    const result = parsePythonError(errorString);

    expect(result.type).toBe('IndexError');
    expect(result.title).toBe('Index Out of Range');
    expect(result.location.line).toBe(2);
    expect(result.explanation).toContain('list');
    expect(result.confidence).toBe('high');
  });

  it('should handle unknown error types', () => {
    const errorString = `Traceback (most recent call last):
  File "<exec>", line 1, in <module>
UnknownError: something went wrong`;

    const result = parsePythonError(errorString);

    expect(result.type).toBe('UnknownError');
    expect(result.title).toBe('Runtime Error');
    expect(result.confidence).toBe('low');
  });

  it('should extract line number from traceback', () => {
    const errorString = `Traceback (most recent call last):
  File "<exec>", line 42, in <module>
ValueError: invalid value`;

    const result = parsePythonError(errorString);

    expect(result.location.line).toBe(42);
  });

  it('should extract code snippet when available', () => {
    const errorString = `  File "<exec>", line 5
    print("test"
          ^
SyntaxError: unexpected EOF while parsing`;

    const result = parsePythonError(errorString);

    expect(result.location.snippet).toBe('print("test"');
  });

  it('should provide original error in result', () => {
    const errorString = 'Some error message';
    const result = parsePythonError(errorString);

    expect(result.originalError).toBe(errorString);
  });
});
