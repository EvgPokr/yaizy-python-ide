import React from 'react';
import ReactDOM from 'react-dom/client';
import { PythonIDEPage } from './pages/PythonIDEPage';
import './styles/ide.css';

// Standalone версия - прямой рендеринг страницы
// Для интеграции с роутером см. src/router-examples/

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PythonIDEPage />
  </React.StrictMode>
);
