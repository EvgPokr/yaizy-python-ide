import React, { useEffect, useRef, useState } from 'react';
import type { ConsoleLog } from '@/types';
import { TurtleCanvas } from './TurtleCanvas';
import { useIDEStore } from '@/store/ideStore';

interface ConsoleProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
  const [showTurtle, setShowTurtle] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeFile, isRunning } = useIDEStore();

  // Show turtle canvas when code contains "import turtle"
  useEffect(() => {
    if (activeFile?.content) {
      const hasTurtleImport = 
        activeFile.content.includes('import turtle') ||
        activeFile.content.includes('from turtle');
      
      // Also check if there are any logs (meaning code was run)
      const hasRun = logs.length > 0;
      
      const shouldShow = hasTurtleImport && hasRun;
      
      console.log('[Turtle] Import detected:', hasTurtleImport, 'Has run:', hasRun, 'Show:', shouldShow);
      setShowTurtle(shouldShow);
    }
  }, [activeFile?.content, logs]);

  // Handle clear with turtle canvas reset
  const handleClear = () => {
    setShowTurtle(false);
    onClear();
  };

  // Автоскролл к последней строке
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Слушаем события ввода от Python
  useEffect(() => {
    const handleStdout = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail?.data || '';
      if (data) {
        useIDEStore.getState().addConsoleLog('stdout', data);
      }
    };

    const handleStderr = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail?.data || '';
      if (data) {
        useIDEStore.getState().addConsoleLog('stderr', data);
      }
    };

    const handleInputRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      const prompt = customEvent.detail?.prompt || '';
      
      // Добавляем prompt в консоль
      if (prompt) {
        useIDEStore.getState().addConsoleLog('input-prompt', prompt);
      }
      
      // Показываем поле ввода
      setWaitingForInput(true);
      setCurrentPrompt(prompt);
      
      // Фокусируем поле ввода
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleInputResponse = (e: Event) => {
      const customEvent = e as CustomEvent;
      const value = customEvent.detail?.value || '';
      
      // Добавляем ответ в консоль
      useIDEStore.getState().addConsoleLog('input-response', value);
      
      // Скрываем поле ввода
      setWaitingForInput(false);
      setCurrentPrompt('');
    };

    window.addEventListener('python-stdout', handleStdout);
    window.addEventListener('python-stderr', handleStderr);
    window.addEventListener('python-input-request', handleInputRequest);
    window.addEventListener('python-input-response', handleInputResponse);

    return () => {
      window.removeEventListener('python-stdout', handleStdout);
      window.removeEventListener('python-stderr', handleStderr);
      window.removeEventListener('python-input-request', handleInputRequest);
      window.removeEventListener('python-input-response', handleInputResponse);
    };
  }, []);


  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !waitingForInput) return;
    
    // Resolve Promise который ждёт Python
    const resolve = (window as any)._inputResolve;
    if (resolve) {
      resolve(inputValue);
      (window as any)._inputResolve = null;
    }
    
    // Добавляем в консоль
    useIDEStore.getState().addConsoleLog('input-response', inputValue);
    
    // Очищаем поле
    setInputValue('');
    setWaitingForInput(false);
    setCurrentPrompt('');
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="console">
      <div className="console-header">
        <h3 className="console-title">Console</h3>
        <button className="console-clear-button" onClick={handleClear} title="Clear console">
          Clear
        </button>
      </div>

      <div className="console-body">
        {showTurtle && (
          <div className="console-turtle-container">
            <TurtleCanvas width={500} height={500} />
          </div>
        )}

        <div className="console-content">
          {logs.length === 0 ? (
            <div className="console-empty">
              <p>Console is empty. Run code to see output.</p>
            </div>
          ) : (
            <div className="console-logs">
              {logs.map((log) => (
                <div key={log.id} className={`console-log console-log-${log.type}`}>
                  {log.type === 'system' && (
                    <span className="console-timestamp">
                      [{formatTimestamp(log.timestamp)}]
                    </span>
                  )}
                  <span className="console-content-text">{log.content}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>

        {/* Поле ввода для async_input() */}
        {waitingForInput && (
          <div className="console-input-container">
            <form onSubmit={handleInputSubmit} className="console-input-form">
              {currentPrompt && (
                <span className="console-input-prompt-text">{currentPrompt}</span>
              )}
              <div className="console-input-wrapper">
                <span className="console-input-arrow">▶</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="console-input-field"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your answer and press Enter..."
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
