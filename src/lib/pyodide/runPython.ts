import type { PyodideInterface, RunResult } from '@/types';
import { parsePythonError } from '@/lib/errors/parsePythonError';

interface RunOptions {
  timeout?: number;
  captureOutput?: boolean;
}

export async function runPython(
  code: string,
  pyodide: PyodideInterface,
  options: RunOptions = {}
): Promise<RunResult> {
  const { timeout = 10000, captureOutput = true } = options;

  const startTime = Date.now();
  const output: string[] = [];
  const errors: string[] = [];

  try {
    // Reset output buffers
    if (captureOutput) {
      await pyodide.runPythonAsync(`
        _output_capture.reset()
        sys.stdout = _output_capture.stdout
        sys.stderr = _output_capture.stderr
      `);
    }

    // Выполнение кода с timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeout);
    });

    const executionPromise = pyodide.runPythonAsync(code);

    await Promise.race([executionPromise, timeoutPromise]);

    // Capture output
    if (captureOutput) {
      const stdoutResult = await pyodide.runPythonAsync(
        '_output_capture.get_stdout()'
      );
      const stderrResult = await pyodide.runPythonAsync(
        '_output_capture.get_stderr()'
      );

      const stdoutStr = String(stdoutResult || '');
      const stderrStr = String(stderrResult || '');

      if (stdoutStr) {
        output.push(...stdoutStr.split('\n').filter((line) => line.length > 0));
      }

      if (stderrStr) {
        errors.push(...stderrStr.split('\n').filter((line) => line.length > 0));
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      output,
      errors,
      executionTime,
    };
  } catch (error) {
    // Capture output даже при ошибке
    if (captureOutput) {
      try {
        const stdoutResult = await pyodide.runPythonAsync(
          '_output_capture.get_stdout()'
        );
        const stderrResult = await pyodide.runPythonAsync(
          '_output_capture.get_stderr()'
        );

        const stdoutStr = String(stdoutResult || '');
        const stderrStr = String(stderrResult || '');

        if (stdoutStr) {
          output.push(...stdoutStr.split('\n').filter((line) => line.length > 0));
        }

        if (stderrStr) {
          errors.push(...stderrStr.split('\n').filter((line) => line.length > 0));
        }
      } catch (captureError) {
        console.error('Failed to capture output after error:', captureError);
      }
    }

    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Parse Python error
    const simplifiedError = parsePythonError(errorMessage);

    return {
      success: false,
      output,
      errors: [...errors, errorMessage],
      executionTime,
      error: simplifiedError,
    };
  }
}
