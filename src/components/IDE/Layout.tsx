import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './Header';
import { FilePanel } from './FilePanel';
import { Editor } from './Editor';
import { Console } from './Console';
import { ErrorPanel } from './ErrorPanel';
import { useIDEStore } from '@/store/ideStore';
import { projectStorage } from '@/lib/storage/projectStorage';
import type { PyodideStatus } from '@/types';

interface LayoutProps {
  pyodideStatus: PyodideStatus;
}

export const Layout: React.FC<LayoutProps> = ({ pyodideStatus }) => {
  const {
    project,
    activeFile,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    renameFile,
    isRunning,
    consoleLogs,
    currentError,
    runCode,
    clearConsole,
  } = useIDEStore();

  const [consoleTab, setConsoleTab] = useState<'console' | 'errors'>('console');
  const [showFilePanel, setShowFilePanel] = useState(true);

  // Auto-switch to errors tab on error
  React.useEffect(() => {
    if (currentError) {
      setConsoleTab('errors');
    }
  }, [currentError]);


  const handleExport = () => {
    if (!project) {
      alert('No project to export');
      return;
    }

    // Use active file name (without extension) as export file name
    let exportFileName = project.name;
    if (activeFile) {
      // Remove .py extension if present
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

    if (
      confirm('This will replace the current project. Continue?')
    ) {
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
        onRun={runCode}
        onClear={clearConsole}
        onExport={handleExport}
        onImport={handleImport}
        isRunning={isRunning}
        pyodideStatus={pyodideStatus}
      />

      <div className="ide-main">
        <PanelGroup direction="horizontal">
          {/* File Panel */}
          {showFilePanel && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={25}>
                <FilePanel
                  files={project.files}
                  activeFileId={activeFile.id}
                  onFileSelect={setActiveFile}
                  onFileCreate={createFile}
                  onFileRename={renameFile}
                  onFileDelete={deleteFile}
                />
              </Panel>
              <PanelResizeHandle className="resize-handle resize-handle-vertical" />
            </>
          )}

          {/* Center: Editor */}
          <Panel defaultSize={showFilePanel ? 55 : 70} minSize={30}>
            <div className="editor-container">
              <div className="editor-tabs">
                <div className="editor-tab active">
                  <span className="tab-name">{activeFile.name}</span>
                </div>
              </div>
              <Editor
                content={activeFile.content}
                onChange={(value) => updateFileContent(activeFile.id, value)}
                errorLine={currentError?.location.line}
                errorColumn={currentError?.location.column}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle-vertical" />

          {/* Right: Console + Errors */}
          <Panel defaultSize={30} minSize={20} maxSize={50}>
            <div className="console-container">
              <div className="console-tabs">
                <button
                  className={`console-tab ${consoleTab === 'console' ? 'active' : ''}`}
                  onClick={() => setConsoleTab('console')}
                >
                  Console
                  {consoleLogs.length > 0 && (
                    <span className="tab-badge">{consoleLogs.length}</span>
                  )}
                </button>
                <button
                  className={`console-tab ${consoleTab === 'errors' ? 'active' : ''} ${currentError ? 'has-error' : ''}`}
                  onClick={() => setConsoleTab('errors')}
                >
                  Errors
                  {currentError && <span className="tab-badge error">!</span>}
                </button>
              </div>

              <div className="console-tab-content">
                {consoleTab === 'console' && (
                  <Console 
                    logs={consoleLogs} 
                    onClear={clearConsole}
                    onRun={runCode}
                    isRunning={isRunning}
                  />
                )}
                {consoleTab === 'errors' && <ErrorPanel error={currentError} />}
              </div>
            </div>
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
    </div>
  );
};
