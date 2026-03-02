import React, { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './Header';
import { FilePanel } from './FilePanel';
import { Editor } from './Editor';
import { Terminal, clearTerminal } from '../Terminal/Terminal';
import { CanvasPanel, CanvasPanelRef } from '../Canvas/CanvasPanel';
import { useIDEStore } from '@/store/ideStore';
import { projectStorage } from '@/lib/storage/projectStorage';
import { useBackendSession } from '@/lib/backend/useBackendSession';

export const BackendLayout: React.FC = () => {
  const {
    project,
    activeFile,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    renameFile,
  } = useIDEStore();

  const [showFilePanel, setShowFilePanel] = useState(true);
  const [canvasCollapsed, setCanvasCollapsed] = useState(false);
  const canvasPanelRef = useRef<CanvasPanelRef>(null);
  
  const {
    sessionId,
    isConnected,
    isRunning,
    error,
    runCode,
    stopExecution,
    resetSession,
    sendInput,
    resize,
  } = useBackendSession();

  const handleRun = () => {
    if (!activeFile || !isConnected) return;
    runCode(activeFile.content, activeFile.name);
  };

  const handleClear = () => {
    // Clear Turtle Graphics canvas
    canvasPanelRef.current?.clearCanvas();
    
    // Clear terminal
    clearTerminal();
    
    // Note: We don't call resetSession() because it creates a new Docker container
    // We just clear the visual output
  };

  const handleExport = () => {
    if (!project) {
      alert('No project to export');
      return;
    }

    // Use active file name (without extension) as export file name
    let exportFileName = project.name;
    if (activeFile) {
      exportFileName = activeFile.name.replace(/\.py$/, '');
    }

    try {
      const blob = projectStorage.exportProject(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Project exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export project: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImport = async (file: File) => {
    try {
      const importedProject = await projectStorage.importProject(file);

      if (confirm('This will replace the current project. Continue?')) {
        const { setProject } = useIDEStore.getState();
        setProject(importedProject);
        await projectStorage.save(importedProject);
      }
    } catch (error) {
      alert('Import error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!project || !activeFile) {
    return (
      <div className="ide-loading">
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="ide-layout">
      <Header
        onRun={handleRun}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        isRunning={isRunning}
        pyodideStatus={isConnected ? 'ready' : 'loading'}
      />

      {error && (
        <div className="backend-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      <div className="ide-main">
        <PanelGroup direction="horizontal">
          {showFilePanel && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <FilePanel
                  files={project.files}
                  activeFileId={activeFile.id}
                  onFileSelect={setActiveFile}
                  onFileCreate={createFile}
                  onFileDelete={deleteFile}
                  onFileRename={renameFile}
                />
              </Panel>
              <PanelResizeHandle className="resize-handle" />
            </>
          )}

          <Panel defaultSize={50} minSize={30}>
            <div className="editor-container">
              <div className="editor-header">
                <span className="file-name">{activeFile.name}</span>
              </div>
              <Editor
                content={activeFile.content}
                onChange={(value) => updateFileContent(activeFile.id, value)}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel defaultSize={30} minSize={20}>
            <PanelGroup direction="vertical">
              <Panel 
                defaultSize={canvasCollapsed ? 5 : 50} 
                minSize={canvasCollapsed ? 5 : 20}
                maxSize={canvasCollapsed ? 5 : 70}
              >
                <CanvasPanel 
                  ref={canvasPanelRef}
                  sessionId={sessionId} 
                  onCollapsedChange={setCanvasCollapsed}
                />
              </Panel>

              {!canvasCollapsed && <PanelResizeHandle className="resize-handle" />}

              <Panel 
                defaultSize={canvasCollapsed ? 95 : 50} 
                minSize={30}
              >
                <Terminal
                  onData={sendInput}
                  onResize={resize}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Toggle button for file panel */}
      <button
        className="panel-toggle panel-toggle-left"
        onClick={() => setShowFilePanel(!showFilePanel)}
        title={showFilePanel ? 'Hide file panel' : 'Show file panel'}
      >
        {showFilePanel ? '◀' : '▶'}
      </button>

      {!isConnected && !error && (
        <div className="connection-status">
          <div className="loading-spinner"></div>
          <span>Connecting to backend...</span>
        </div>
      )}
    </div>
  );
};
