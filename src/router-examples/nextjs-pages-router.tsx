/**
 * Пример интеграции с Next.js Pages Router (Next.js 12 и ранее)
 * 
 * Структура:
 * pages/
 *   python-ide.tsx  <-- этот файл
 */

import { PythonIDEPage } from '@/pages/PythonIDEPage';
import type { NextPage } from 'next';
import Head from 'next/head';

/**
 * Next.js страница для Python IDE
 * URL: /python-ide
 */
const PythonIDE: NextPage = () => {
  return (
    <>
      <Head>
        <title>Python IDE</title>
        <meta name="description" content="Браузерная IDE для обучения Python" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </Head>
      
      <PythonIDEPage />
    </>
  );
};

export default PythonIDE;

/**
 * Пример с серверными пропсами и заданием
 * URL: /python-ide?taskId=123
 */

/*
import { GetServerSideProps } from 'next';

interface Props {
  task?: Task;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { taskId } = context.query;
  
  if (taskId && typeof taskId === 'string') {
    // Загрузить задание из API/базы данных
    const task = await fetchTask(taskId);
    return { props: { task } };
  }
  
  return { props: {} };
};

const PythonIDE: NextPage<Props> = ({ task }) => {
  // Установить задание в конфигурацию
  React.useEffect(() => {
    if (task) {
      window.PYTHON_IDE_CONFIG = { task };
    }
  }, [task]);
  
  return (
    <>
      <Head>
        <title>Python IDE</title>
      </Head>
      <PythonIDEPage />
    </>
  );
};
*/
