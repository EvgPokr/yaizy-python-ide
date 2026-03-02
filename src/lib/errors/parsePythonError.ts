import type { SimplifiedError } from '@/types';
import { getErrorTemplate } from './errorMessages';

/**
 * Парсит Python ошибку и возвращает упрощенное, дружелюбное описание
 */
export function parsePythonError(errorString: string): SimplifiedError {
  // Пример формата ошибки Pyodide:
  // Traceback (most recent call last):
  //   File "<exec>", line 3, in <module>
  // NameError: name 'x' is not defined

  const lines = errorString.split('\n');
  
  // Найти тип ошибки (последняя непустая строка обычно содержит тип)
  let errorType = 'Error';
  let errorMessage = errorString;
  let line = 1;
  let column: number | undefined;
  let snippet: string | undefined;

  // Ищем строку с типом ошибки (например, "NameError: name 'x' is not defined")
  for (let i = lines.length - 1; i >= 0; i--) {
    const currentLine = lines[i].trim();
    if (currentLine && currentLine.includes(':')) {
      const match = currentLine.match(/^(\w+Error):\s*(.+)$/);
      if (match) {
        errorType = match[1];
        errorMessage = match[2];
        break;
      }
    }
  }

  // Ищем номер строки в traceback
  // Формат: File "<exec>", line 3, in <module>
  for (const traceLine of lines) {
    const lineMatch = traceLine.match(/line (\d+)/);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }

    // Try to find code snippet (line after File "...", line ...)
    const fileMatch = traceLine.match(/File .+, line \d+/);
    if (fileMatch) {
      const index = lines.indexOf(traceLine);
      if (index < lines.length - 1) {
        snippet = lines[index + 1].trim();
      }
    }
  }

  // Извлечение дополнительных деталей для конкретных ошибок
  const details: Record<string, string> = {
    message: errorMessage,
    snippet: snippet || '',
  };

  // NameError: извлечь имя переменной
  if (errorType === 'NameError') {
    const nameMatch = errorMessage.match(/name ['"](.+?)['"]/);
    if (nameMatch) {
      details.name = nameMatch[1];
    }
  }

  // KeyError: извлечь ключ
  if (errorType === 'KeyError') {
    const keyMatch = errorMessage.match(/['"](.+?)['"]/);
    if (keyMatch) {
      details.key = keyMatch[1];
    }
  }

  // ImportError: извлечь модуль
  if (errorType === 'ImportError' || errorType === 'ModuleNotFoundError') {
    const moduleMatch = errorMessage.match(/No module named ['"](.+?)['"]/);
    if (moduleMatch) {
      details.module = moduleMatch[1];
    }
  }

  // Get template for this error type
  const template = getErrorTemplate(errorType);

  // Определение уровня уверенности
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  
  if (
    ['NameError', 'SyntaxError', 'TypeError', 'IndexError', 'ZeroDivisionError'].includes(errorType)
  ) {
    confidence = 'high';
  } else if (['ValueError', 'AttributeError', 'KeyError'].includes(errorType)) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const simplifiedError: SimplifiedError = {
    type: errorType,
    title: template.title,
    explanation: template.explanation(details),
    location: {
      file: 'main.py',
      line,
      column,
      snippet,
    },
    fixSteps: template.fixSteps(details),
    confidence,
    originalError: errorString,
  };

  return simplifiedError;
}
