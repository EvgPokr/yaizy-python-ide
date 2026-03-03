import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProjectsPage } from './pages/ProjectsPage';
import { EditorPage } from './pages/EditorPage';
import { PythonIDEPage } from './pages/PythonIDEPage';
import { SharedProjectPage } from './pages/SharedProjectPage';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#999',
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home with message
    alert('Please login to access projects');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  // Check auth on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Main editor - no auth required (guest mode) */}
        <Route path="/" element={<PythonIDEPage />} />
        
        {/* Shared project view - no auth required */}
        <Route path="/share/:projectId" element={<SharedProjectPage />} />
        
        {/* Projects - requires auth */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Editor with saved project - requires auth */}
        <Route 
          path="/editor/:projectId" 
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
