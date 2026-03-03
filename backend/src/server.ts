import express, { Express, Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { SessionManager } from './services/SessionManager';
import { TerminalWebSocketHandler } from './websocket/terminal';
import { handleCanvasWebSocket } from './websocket/canvas.js';
import { createSessionRouter } from './routes/sessions';
import { apiLimiter } from './middleware/rateLimit';
import { initDatabase } from './db/database';
import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';

// Load environment variables
dotenv.config();

// Initialize database
initDatabase();

class Server {
  private app: Express;
  private httpServer: HTTPServer;
  private terminalWSS: WebSocketServer;
  private canvasWSS: WebSocketServer;
  private sessionManager: SessionManager;
  private terminalWSHandler: TerminalWebSocketHandler;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = parseInt(process.env.PORT || '3001', 10);
    
    // Initialize services
    this.sessionManager = new SessionManager();
    
    // Setup WebSocket servers (two separate ones for terminal and canvas)
    this.terminalWSS = new WebSocketServer({
      noServer: true,
    });
    
    this.canvasWSS = new WebSocketServer({
      noServer: true,
    });
    
    // Setup WebSocket handlers
    this.terminalWSHandler = new TerminalWebSocketHandler(
      this.terminalWSS, 
      this.sessionManager, 
      this.sessionManager.getPTYManager()
    );
    
    handleCanvasWebSocket(this.canvasWSS, this.sessionManager);
    
    // Setup HTTP upgrade handler for WebSocket routing
    this.setupWebSocketUpgrade();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandlers();
    this.setupGracefulShutdown();
  }

  private setupWebSocketUpgrade(): void {
    this.httpServer.on('upgrade', (request, socket, head) => {
      const url = request.url || '';
      
      if (url.includes('/terminal')) {
        this.terminalWSS.handleUpgrade(request, socket, head, (ws) => {
          this.terminalWSS.emit('connection', ws, request);
        });
      } else if (url.includes('/canvas')) {
        this.canvasWSS.handleUpgrade(request, socket, head, (ws) => {
          this.canvasWSS.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
  }

  private setupMiddleware(): void {
    // CORS
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.app.use(cors({
      origin: frontendUrl,
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Rate limiting
    this.app.use('/api/', apiLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const health = await this.sessionManager.healthCheck();
        
        if (health.docker) {
          res.json({
            status: 'healthy',
            docker: 'ok',
            sessions: health.sessions,
            wsConnections: this.terminalWSHandler.getConnectionCount(),
          });
        } else {
          res.status(503).json({
            status: 'unhealthy',
            docker: 'not available',
            message: 'Docker is not running or image is missing',
          });
        }
      } catch (error: any) {
        res.status(503).json({
          status: 'error',
          message: error.message,
        });
      }
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectsRoutes);
    this.app.use('/api/sessions', createSessionRouter(this.sessionManager));

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  private setupErrorHandlers(): void {
    // Global error handler
    this.app.use((err: any, req: Request, res: Response, next: any) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Close HTTP server
      this.httpServer.close(() => {
        console.log('HTTP server closed');
      });

      // Close WebSocket servers
      this.terminalWSS.close(() => {
        console.log('Terminal WebSocket server closed');
      });
      
      this.canvasWSS.close(() => {
        console.log('Canvas WebSocket server closed');
      });

      // Cleanup sessions
      await this.sessionManager.shutdown();

      console.log('Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }

  async start(): Promise<void> {
    try {
      // Check Docker availability
      const health = await this.sessionManager.healthCheck();
      if (!health.docker) {
        console.error('❌ Docker is not available or image is missing!');
        console.error('Please ensure Docker is running and build the image:');
        console.error('  docker build -t python-sandbox:latest ./docker/python-sandbox');
        process.exit(1);
      }

      // Start HTTP server
      this.httpServer.listen(this.port, () => {
        console.log('');
        console.log('🚀 YaizY Python Editor Backend');
        console.log('================================');
        console.log(`✓ Server running on http://localhost:${this.port}`);
        console.log(`✓ WebSocket endpoint: ws://localhost:${this.port}/api/sessions/:id/terminal`);
        console.log(`✓ Health check: http://localhost:${this.port}/health`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('================================');
        console.log('');
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();
