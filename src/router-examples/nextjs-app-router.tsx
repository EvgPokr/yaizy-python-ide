/**
 * Пример интеграции с Next.js App Router (Next.js 13+)
 * 
 * Структура:
 * app/
 *   python-ide/
 *     page.tsx  <-- этот файл
 */

'use client';

import { PythonIDEPage } from '@/pages/PythonIDEPage';

/**
 * Next.js страница для Python IDE
 * URL: /python-ide
 */
export default function PythonIDERoute() {
  return <PythonIDEPage />;
}

/**
 * Опционально: метаданные страницы
 * (в отдельном серверном компоненте или layout)
 */
export const metadata = {
  title: 'Python IDE',
  description: 'Браузерная IDE для обучения Python',
};

/**
 * Пример с динамическим роутом и заданием
 * 
 * app/
 *   python-ide/
 *     [taskId]/
 *       page.tsx
 */

// app/python-ide/[taskId]/page.tsx
/*
'use client';

import { PythonIDEPage } from '@/pages/PythonIDEPage';
import { useEffect } from 'react';

export default function PythonIDEWithTask({ 
  params 
}: { 
  params: { taskId: string } 
}) {
  useEffect(() => {
    // Загрузить задание из API
    fetch(`/api/tasks/${params.taskId}`)
      .then(res => res.json())
      .then(task => {
        window.PYTHON_IDE_CONFIG = { task };
      });
  }, [params.taskId]);

  return <PythonIDEPage />;
}
*/
