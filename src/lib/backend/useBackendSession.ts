import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from './apiClient';
import { TerminalWebSocket, WebSocketMessage } from './websocketClient';
import { writeToTerminal } from '../../components/Terminal/Terminal';

export function useBackendSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<TerminalWebSocket | null>(null);
  const isInitializedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const runningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize session
   */
  const initSession = useCallback(async () => {
    try {
      setError(null);
      
      // Check backend health
      const health = await apiClient.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error('Backend is not healthy: ' + health.docker);
      }

      // Create session
      const session = await apiClient.createSession();
      setSessionId(session.sessionId);
      sessionIdRef.current = session.sessionId;

      // Connect WebSocket
      const wsUrl = apiClient.getWebSocketUrl(session.sessionId);
      const ws = new TerminalWebSocket(wsUrl);

      // Setup message handlers
      ws.onMessage((message: WebSocketMessage) => {
        handleWebSocketMessage(message);
      });

      ws.onError((error) => {
        console.error('WebSocket error:', error);
        setError('Terminal connection error');
        setIsConnected(false);
      });

      ws.onClose((event) => {
        console.log('WebSocket closed:', event.code);
        setIsConnected(false);
        
        if (event.code !== 1000) {
          setError('Terminal connection closed unexpectedly');
        }
      });

      // Connect
      await ws.connect();
      wsRef.current = ws;
      setIsConnected(true);

      console.log('Session initialized:', session.sessionId);

    } catch (err: any) {
      console.error('Failed to initialize session:', err);
      setError(err.message || 'Failed to connect to backend');
      setIsConnected(false);
    }
  }, []);

  /**
   * Handle WebSocket messages
   */
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message received:', message.type, message);
    
    switch (message.type) {
      case 'stdout':
      case 'stderr':
        if (message.data) {
          writeToTerminal(message.data);
        }
        break;

      case 'exit':
        console.log('Exit message received, resetting isRunning');
        // Clear running timeout
        if (runningTimeoutRef.current) {
          clearTimeout(runningTimeoutRef.current);
          runningTimeoutRef.current = null;
        }
        setIsRunning(false);
        // Don't show "[Process exited with code 0]" message - it's not needed
        break;

      case 'timeout':
        console.log('Timeout message received, resetting isRunning');
        // Clear running timeout
        if (runningTimeoutRef.current) {
          clearTimeout(runningTimeoutRef.current);
          runningTimeoutRef.current = null;
        }
        setIsRunning(false);
        writeToTerminal('\r\n\x1b[1;31m[Execution timeout - stopped]\x1b[0m\r\n');
        break;

      case 'error':
        writeToTerminal(`\r\n\x1b[1;31mError: ${message.data}\x1b[0m\r\n`);
        break;
    }
  };

  /**
   * Run Python code
   */
  const runCode = useCallback(async (code: string, filename: string = 'main.py') => {
    if (!sessionId) {
      setError('No session available');
      return;
    }

    try {
      setError(null);
      
      // Clear any previous timeout
      if (runningTimeoutRef.current) {
        clearTimeout(runningTimeoutRef.current);
        runningTimeoutRef.current = null;
      }
      
      setIsRunning(true);
      console.log('Starting code execution, isRunning set to true');
      
      // Clear terminal
      writeToTerminal('\x1b[2J\x1b[H'); // Clear screen and move cursor to home
      writeToTerminal(`\x1b[1;36m▶ Running ${filename}...\x1b[0m\r\n\r\n`);

      // Send code to backend
      await apiClient.runCode(sessionId, { code, filename });
      console.log('Code sent to backend successfully');
      
      // Set timeout to reset isRunning
      // Longer timeout to allow slow operations like turtle graphics
      runningTimeoutRef.current = setTimeout(() => {
        console.log('Auto-resetting isRunning after 5 seconds');
        setIsRunning(false);
        runningTimeoutRef.current = null;
      }, 5000); // 5 second timeout

    } catch (err: any) {
      console.error('Failed to run code - full error:', err);
      const errorMessage = err.message || 'Failed to run code';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      
      // Clear timeout on error
      if (runningTimeoutRef.current) {
        clearTimeout(runningTimeoutRef.current);
        runningTimeoutRef.current = null;
      }
      
      console.log('Resetting isRunning due to error');
      setIsRunning(false);
      writeToTerminal(`\r\n\x1b[1;31mError: ${errorMessage}\x1b[0m\r\n`);
    }
  }, [sessionId]);

  /**
   * Stop execution
   */
  const stopExecution = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Clear running timeout
      if (runningTimeoutRef.current) {
        clearTimeout(runningTimeoutRef.current);
        runningTimeoutRef.current = null;
      }
      
      await apiClient.stopExecution(sessionId);
      setIsRunning(false);
      writeToTerminal('\r\n\x1b[1;33m[Execution stopped]\x1b[0m\r\n');
    } catch (err: any) {
      console.error('Failed to stop execution:', err);
      setError(err.message || 'Failed to stop execution');
    }
  }, [sessionId]);

  /**
   * Reset session
   */
  const resetSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Clear running timeout
      if (runningTimeoutRef.current) {
        clearTimeout(runningTimeoutRef.current);
        runningTimeoutRef.current = null;
      }
      
      // Close old WebSocket
      wsRef.current?.close();
      setIsConnected(false);

      // Reset session on backend
      const newSession = await apiClient.resetSession(sessionId);
      setSessionId(newSession.sessionId);
      sessionIdRef.current = newSession.sessionId;

      // Reconnect WebSocket
      const wsUrl = apiClient.getWebSocketUrl(newSession.sessionId);
      const ws = new TerminalWebSocket(wsUrl);
      
      ws.onMessage(handleWebSocketMessage);
      await ws.connect();
      
      wsRef.current = ws;
      setIsConnected(true);

      writeToTerminal('\x1b[2J\x1b[H'); // Clear screen
      writeToTerminal('\x1b[1;32m✓ Session reset\x1b[0m\r\n');

    } catch (err: any) {
      console.error('Failed to reset session:', err);
      setError(err.message || 'Failed to reset session');
    }
  }, [sessionId]);

  /**
   * Send input to terminal
   */
  const sendInput = useCallback((data: string) => {
    wsRef.current?.sendStdin(data);
  }, []);

  /**
   * Send resize event
   */
  const resize = useCallback((cols: number, rows: number) => {
    wsRef.current?.sendResize(cols, rows);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitializedRef.current) {
      return;
    }
    
    isInitializedRef.current = true;
    
    // Initialize session on mount
    initSession();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear running timeout
      if (runningTimeoutRef.current) {
        clearTimeout(runningTimeoutRef.current);
        runningTimeoutRef.current = null;
      }
      // Use ref to get current sessionId for cleanup
      if (sessionIdRef.current) {
        apiClient.deleteSession(sessionIdRef.current).catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return {
    sessionId,
    isConnected,
    isRunning,
    error,
    runCode,
    stopExecution,
    resetSession,
    sendInput,
    resize,
    initSession,
  };
}
