import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { SessionManager } from '../services/SessionManager.js';

interface CanvasClient {
  sessionId: string;
  ws: WebSocket;
}

const canvasClients = new Map<string, Set<WebSocket>>();

export function handleCanvasWebSocket(
  wss: WebSocketServer,
  sessionManager: SessionManager
) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url || '';
    const sessionIdMatch = url.match(/\/api\/sessions\/([^\/]+)\/canvas/);
    
    if (!sessionIdMatch) {
      ws.close(1008, 'Invalid session ID');
      return;
    }

    const sessionId = sessionIdMatch[1];
    console.log(`Canvas WebSocket connection for session ${sessionId}`);

    // Add client to session's canvas clients
    if (!canvasClients.has(sessionId)) {
      canvasClients.set(sessionId, new Set());
    }
    canvasClients.get(sessionId)!.add(ws);

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`Canvas WebSocket closed for session ${sessionId}`);
      const clients = canvasClients.get(sessionId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          canvasClients.delete(sessionId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`Canvas WebSocket error for session ${sessionId}:`, error);
    });

    // Send initial message
    ws.send(JSON.stringify({ type: 'canvas_ready', sessionId }));
  });
}

/**
 * Broadcast canvas update to all clients watching a session
 */
export function broadcastCanvasUpdate(
  sessionId: string,
  type: 'canvas_update' | 'canvas_complete' | 'canvas_clear',
  imageBase64?: string
) {
  const clients = canvasClients.get(sessionId);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({
    type,
    image: imageBase64,
    timestamp: Date.now(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`Broadcasted ${type} to ${clients.size} canvas client(s) for session ${sessionId}`);
}

/**
 * Clear canvas for a session
 */
export function clearCanvas(sessionId: string) {
  broadcastCanvasUpdate(sessionId, 'canvas_clear');
}
