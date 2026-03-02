import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { SessionManager } from '../services/SessionManager';
import { PTYManager } from '../services/PTYManager';
import { WebSocketMessage } from '../types/session';
import { broadcastCanvasUpdate } from './canvas.js';

export class TerminalWebSocketHandler {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private ptyManager: PTYManager;
  private connections: Map<string, WebSocket> = new Map();

  constructor(wss: WebSocketServer, sessionManager: SessionManager, ptyManager: PTYManager) {
    this.wss = wss;
    this.sessionManager = sessionManager;
    this.ptyManager = ptyManager;
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      try {
        this.handleConnection(ws, request);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(1011, 'Connection setup failed');
      }
    });
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Extract session ID from URL path
    const url = request.url || '';
    const match = url.match(/\/api\/sessions\/([^/]+)\/terminal/);
    
    if (!match) {
      ws.close(1008, 'Invalid URL format');
      return;
    }

    const sessionId = match[1];
    console.log(`WebSocket connection for session ${sessionId}`);

    // Get session
    const session = this.sessionManager.getSession(sessionId);
    if (!session || !session.ptySessionId) {
      ws.close(1008, 'Session not found');
      return;
    }

    // Get PTY stream
    const stream = this.ptyManager.getStream(sessionId);
    if (!stream) {
      ws.close(1008, 'PTY stream not found');
      return;
    }

    // Store connection
    this.connections.set(sessionId, ws);

    // Buffer for accumulating data and detecting canvas markers
    let dataBuffer = '';

    // Setup stream data handler (Docker PTY -> WebSocket)
    const onData = (chunk: Buffer) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      // Accumulate data in buffer
      dataBuffer += chunk.toString('utf-8');

      // Check for canvas markers
      const canvasMarker = '__CANVAS__';
      let startIdx = dataBuffer.indexOf(canvasMarker);

      while (startIdx !== -1) {
        const endIdx = dataBuffer.indexOf(canvasMarker, startIdx + canvasMarker.length);
        
        if (endIdx === -1) break;

        const canvasJson = dataBuffer.substring(
          startIdx + canvasMarker.length,
          endIdx
        );

        const beforeCanvas = dataBuffer.substring(0, startIdx);
        const afterCanvas = dataBuffer.substring(endIdx + canvasMarker.length);
        dataBuffer = beforeCanvas + afterCanvas;

        try {
          const canvasData = JSON.parse(canvasJson);
          if (canvasData.type && canvasData.image) {
            broadcastCanvasUpdate(
              sessionId,
              canvasData.type,
              canvasData.image
            );
          }
        } catch (error) {
          console.error(`Failed to parse canvas data for session ${sessionId}:`, error);
        }

        startIdx = dataBuffer.indexOf(canvasMarker);
      }

      // Check for turtle command markers
      const turtleMarker = '__TURTLE_CMD__';
      let turtleIdx = dataBuffer.indexOf(turtleMarker);

      while (turtleIdx !== -1) {
        const endIdx = dataBuffer.indexOf(turtleMarker, turtleIdx + turtleMarker.length);
        
        if (endIdx === -1) break;

        const turtleJson = dataBuffer.substring(
          turtleIdx + turtleMarker.length,
          endIdx
        );

        const beforeTurtle = dataBuffer.substring(0, turtleIdx);
        const afterTurtle = dataBuffer.substring(endIdx + turtleMarker.length);
        dataBuffer = beforeTurtle + afterTurtle;

        try {
          const turtleCmd = JSON.parse(turtleJson);
          // Send turtle command to canvas via WebSocket
          broadcastCanvasUpdate(
            sessionId,
            'turtle_command',
            JSON.stringify(turtleCmd)
          );
        } catch (error) {
          console.error(`Failed to parse turtle command for session ${sessionId}:`, error);
        }

        turtleIdx = dataBuffer.indexOf(turtleMarker);
      }

      // Check for execution complete marker
      const completeMarker = '__EXECUTION_COMPLETE__:';
      const completeIdx = dataBuffer.indexOf(completeMarker);
      
      if (completeIdx !== -1) {
        // Extract exit code
        const afterMarker = dataBuffer.substring(completeIdx + completeMarker.length);
        const exitCodeMatch = afterMarker.match(/^(\d+)/);
        const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 0;

        // Remove marker from buffer
        const beforeComplete = dataBuffer.substring(0, completeIdx);
        const afterComplete = dataBuffer.substring(completeIdx + completeMarker.length + (exitCodeMatch ? exitCodeMatch[1].length : 0));
        dataBuffer = beforeComplete + afterComplete;

        // Clear execution timeout in PTYManager
        this.ptyManager.clearExecutionTimeout(sessionId);
        
        // Mark execution as complete in SessionManager
        this.sessionManager.markExecutionComplete(sessionId);

        console.log(`Execution completed for session ${sessionId} with exit code ${exitCode}`);

        // Send exit message to frontend
        const exitMessage: WebSocketMessage = {
          type: 'exit',
          code: exitCode,
        };
        ws.send(JSON.stringify(exitMessage));
      }

      // Send remaining buffer data to terminal (without canvas/turtle messages)
      // Only flush if buffer doesn't contain incomplete markers
      const hasIncompleteMarker = 
        dataBuffer.includes('__CANVAS__') || 
        dataBuffer.includes('__TURTLE_CMD__');
      
      if (dataBuffer.length > 0 && !hasIncompleteMarker) {
        // Split by lines and send complete lines
        const lines = dataBuffer.split('\n');
        
        // Keep the last incomplete line in buffer
        const lastLine = lines.pop() || '';
        
        if (lines.length > 0) {
          const toSend = lines.join('\n') + '\n';
          const message: WebSocketMessage = {
            type: 'stdout',
            data: toSend,
          };
          ws.send(JSON.stringify(message));
        }
        
        dataBuffer = lastLine;
      }
      
      // If buffer gets too large (e.g., long line with no newline), flush it anyway
      if (dataBuffer.length > 10000 && !hasIncompleteMarker) {
        const message: WebSocketMessage = {
          type: 'stdout',
          data: dataBuffer,
        };
        ws.send(JSON.stringify(message));
        dataBuffer = '';
      }
    };

    stream.on('data', onData);

    // Setup stream end handler
    const onEnd = () => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: 'exit',
          code: 0,
        };
        ws.send(JSON.stringify(message));
        ws.close(1000, 'Process exited');
      }
      this.connections.delete(sessionId);
    };

    stream.on('end', onEnd);

    // Setup stream error handler
    const onError = (error: Error) => {
      console.error(`Stream error for session ${sessionId}:`, error);
      if (ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: 'error',
          data: error.message,
        };
        ws.send(JSON.stringify(message));
      }
    };

    stream.on('error', onError);

    // Setup WebSocket message handler (WebSocket -> Docker PTY)
    ws.on('message', (data: Buffer) => {
      try {
        const messageStr = data.toString('utf-8');
        const message: WebSocketMessage = JSON.parse(messageStr);

        this.handleWebSocketMessage(sessionId, message);
      } catch (error) {
        console.error(`Error handling WebSocket message for session ${sessionId}:`, error);
        const errorMessage: WebSocketMessage = {
          type: 'error',
          data: 'Invalid message format',
        };
        ws.send(JSON.stringify(errorMessage));
      }
    });

    // Setup WebSocket close handler
    ws.on('close', () => {
      console.log(`WebSocket closed for session ${sessionId}`);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
      this.connections.delete(sessionId);
    });

    // Setup WebSocket error handler
    ws.on('error', (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
      this.connections.delete(sessionId);
    });

    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: 'stdout',
      data: '\x1b[1;32m✓ Terminal connected\x1b[0m\r\n',
    };
    ws.send(JSON.stringify(welcomeMessage));
  }

  private handleWebSocketMessage(sessionId: string, message: WebSocketMessage): void {
    const session = this.sessionManager.getSession(sessionId);
    if (!session || !session.ptySessionId) {
      return;
    }

    switch (message.type) {
      case 'stdin':
        // User input from terminal
        if (message.data) {
          this.ptyManager.write(sessionId, message.data);
        }
        break;

      case 'resize':
        // Terminal resize
        if (message.cols && message.rows) {
          this.ptyManager.resize(sessionId, message.cols, message.rows);
        }
        break;

      default:
        console.warn(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  /**
   * Send message to specific session
   */
  sendToSession(sessionId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Close connection for session
   */
  closeSession(sessionId: string): void {
    const ws = this.connections.get(sessionId);
    if (ws) {
      ws.close(1000, 'Session closed');
      this.connections.delete(sessionId);
    }
  }

  /**
   * Get number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}
