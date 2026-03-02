/**
 * Пример интеграции с React Router v6
 * 
 * Установка:
 * npm install react-router-dom
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PythonIDEPage } from '@/pages/PythonIDEPage';

// Ваши другие страницы
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Python IDE Route */}
        <Route path="/python-ide" element={<PythonIDEPage />} />
        
        {/* Опционально: динамический роут с заданием */}
        <Route 
          path="/python-ide/:taskId" 
          element={<PythonIDEPageWithTask />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Компонент-обертка для загрузки задания из URL параметра
 */
function PythonIDEPageWithTask() {
  const { taskId } = useParams();
  
  // Здесь можно загрузить задание из API по taskId
  // и передать через конфигурацию
  
  React.useEffect(() => {
    if (taskId) {
      // Загрузить задание и установить в window.PYTHON_IDE_CONFIG
      // fetch(`/api/tasks/${taskId}`)
      //   .then(res => res.json())
      //   .then(task => {
      //     window.PYTHON_IDE_CONFIG = { task };
      //   });
    }
  }, [taskId]);
  
  return <PythonIDEPage />;
}

export default App;
