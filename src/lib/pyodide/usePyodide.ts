import { useState, useEffect } from 'react';
import type { PyodideInterface, PyodideStatus } from '@/types';

declare global {
  interface Window {
    loadPyodide: (config: {
      indexURL: string;
    }) => Promise<PyodideInterface>;
  }
}

interface UsePyodideReturn {
  pyodide: PyodideInterface | null;
  status: PyodideStatus;
  error: Error | null;
}

export function usePyodide(): UsePyodideReturn {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [status, setStatus] = useState<PyodideStatus>('loading');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPyodideInstance() {
      try {
        setStatus('loading');

        // Загружаем Pyodide CDN скрипт если еще не загружен
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide script'));
            document.head.appendChild(script);
          });
        }

        // Инициализируем Pyodide
        const pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        if (!mounted) return;

        // Настраиваем захват stdout/stderr и поддержку input()
        await pyodideInstance.runPythonAsync(`
          import sys
          from io import StringIO
          import builtins
          
          class OutputCapture:
              def __init__(self):
                  self.stdout = StringIO()
                  self.stderr = StringIO()
                  
              def reset(self):
                  self.stdout = StringIO()
                  self.stderr = StringIO()
                  
              def get_stdout(self):
                  return self.stdout.getvalue()
                  
              def get_stderr(self):
                  return self.stderr.getvalue()
          
          _output_capture = OutputCapture()
        `);

        // Setup TWO input methods:
        // 1. Sync input() - uses prompt (for compatibility)
        // 2. async_input() - uses console field (new way!)
        
        // Sync version (старый способ)
        pyodideInstance.globals.set('_browser_input', (prompt: string) => {
          // 1. Flush весь накопленный вывод в консоль ПЕРЕД prompt
          const stdout = pyodideInstance.runPython('_output_capture.get_stdout()');
          const stderr = pyodideInstance.runPython('_output_capture.get_stderr()');
          
          if (stdout) {
            const lines = stdout.trim().split('\n');
            lines.forEach((line: string) => {
              if (line) {
                const event = new CustomEvent('python-stdout', {
                  detail: { data: line }
                });
                window.dispatchEvent(event);
              }
            });
          }
          
          if (stderr) {
            const lines = stderr.trim().split('\n');
            lines.forEach((line: string) => {
              if (line) {
                const event = new CustomEvent('python-stderr', {
                  detail: { data: line }
                });
                window.dispatchEvent(event);
              }
            });
          }
          
          // Очищаем буферы после flush
          pyodideInstance.runPython('_output_capture.reset()');
          
          // 2. Показываем prompt в консоли
          const promptEvent = new CustomEvent('python-input-request', { 
            detail: { prompt: prompt || '' } 
          });
          window.dispatchEvent(promptEvent);
          
          // 3. Получаем ввод через браузерный prompt
          const result = window.prompt(prompt || 'Enter input:');
          
          // 4. Добавляем ответ в консоль
          if (result !== null) {
            const responseEvent = new CustomEvent('python-input-response', { 
              detail: { value: result } 
            });
            window.dispatchEvent(responseEvent);
          }
          
          return result !== null ? result : '';
        });

        // Async version (новый способ - через консоль!)
        (window as any)._inputResolve = null;
        
        pyodideInstance.globals.set('_async_input', (prompt: string) => {
          // 1. Flush вывод в консоль
          const stdout = pyodideInstance.runPython('_output_capture.get_stdout()');
          const stderr = pyodideInstance.runPython('_output_capture.get_stderr()');
          
          if (stdout) {
            const lines = stdout.trim().split('\n');
            lines.forEach((line: string) => {
              if (line) {
                const event = new CustomEvent('python-stdout', {
                  detail: { data: line }
                });
                window.dispatchEvent(event);
              }
            });
          }
          
          if (stderr) {
            const lines = stderr.trim().split('\n');
            lines.forEach((line: string) => {
              if (line) {
                const event = new CustomEvent('python-stderr', {
                  detail: { data: line }
                });
                window.dispatchEvent(event);
              }
            });
          }
          
          pyodideInstance.runPython('_output_capture.reset()');
          
          // 2. Показываем prompt и поле ввода
          const promptEvent = new CustomEvent('python-input-request', { 
            detail: { prompt: prompt || '' } 
          });
          window.dispatchEvent(promptEvent);
          
          // 3. Возвращаем Promise который resolve когда пользователь введёт
          return new Promise<string>((resolve) => {
            (window as any)._inputResolve = resolve;
          });
        });

        await pyodideInstance.runPythonAsync(`
          import builtins
          import sys
          
          # Sync input (старый способ через popup)
          def _custom_input(prompt=""):
              sys.stdout.flush()
              sys.stderr.flush()
              result = _browser_input(str(prompt) if prompt else "")
              return str(result)
          
          # Async input (новый способ через консоль!)
          async def async_input(prompt=""):
              """
              Async version of input() - no popup, uses console field!
              
              Usage:
                  choice = await async_input("What do you do? ")
              """
              sys.stdout.flush()
              sys.stderr.flush()
              result = await _async_input(str(prompt) if prompt else "")
              return str(result)
          
          # Заменяем встроенную функцию input (синхронную версию)
          builtins.input = _custom_input
          
          # Делаем async_input доступной глобально
          builtins.async_input = async_input
        `);

        // Setup turtle graphics
        const { setupTurtle } = await import('./turtleSetup');
        await setupTurtle(pyodideInstance);

        setPyodide(pyodideInstance);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error('Unknown error loading Pyodide');
        setError(error);
        setStatus('error');
        console.error('Failed to load Pyodide:', error);
      }
    }

    loadPyodideInstance();

    return () => {
      mounted = false;
    };
  }, []);

  return { pyodide, status, error };
}
