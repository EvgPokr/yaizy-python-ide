# YaizY Python Editor - Backend

Backend server for YaizY Python Editor with serverside CPython execution via PTY + WebSocket.

## 🚀 Features

- **Real CPython execution** - No more Pyodide/WASM limitations
- **PTY-based terminal** - Natural `input()` support
- **WebSocket streaming** - Real-time stdin/stdout/stderr
- **Docker isolation** - Each session runs in isolated container
- **Security first** - Resource limits, sandboxing, rate limiting
- **Session management** - Automatic cleanup of idle sessions

## 📋 Prerequisites

- Node.js 18+ 
- Docker
- TypeScript

## 🔧 Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Build Python sandbox image

```bash
cd ../docker/python-sandbox
docker build -t python-sandbox:latest .
```

### 3. Configure environment

```bash
cp env.example .env
# Edit .env if needed
```

### 4. Start development server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 🐳 Docker Setup (Production)

```bash
# From project root
cd docker
docker-compose up -d
```

## 📡 API Endpoints

### Create Session

```http
POST /api/sessions
```

Response:
```json
{
  "sessionId": "uuid",
  "wsUrl": "/api/sessions/uuid/terminal"
}
```

### WebSocket Terminal

```
WS /api/sessions/:id/terminal
```

Messages (Client → Server):
```json
{"type": "stdin", "data": "user input\n"}
{"type": "resize", "cols": 80, "rows": 24}
```

Messages (Server → Client):
```json
{"type": "stdout", "data": "program output"}
{"type": "stderr", "data": "error output"}
{"type": "exit", "code": 0}
```

### Execute Code

```http
POST /api/sessions/:id/run
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "filename": "main.py"
}
```

### Stop Execution

```http
POST /api/sessions/:id/stop
```

### Reset Session

```http
POST /api/sessions/:id/reset
```

### Delete Session

```http
DELETE /api/sessions/:id
```

### Health Check

```http
GET /health
```

## 🔒 Security Features

### Container Isolation

- Read-only filesystem (except /workspace)
- Non-root user (uid 1000)
- No network access
- Dropped capabilities
- Resource limits (CPU, memory, PIDs)

### Rate Limiting

- 10 sessions per IP
- 100 executions per hour
- 1 execution per 2 seconds

### Resource Limits

- Memory: 256MB per session
- CPU: 0.5 core per session
- Execution timeout: 10 seconds
- Max PIDs: 64 (prevent fork bombs)

## 🛠️ Development

### Run in watch mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## 📊 Monitoring

### Check health

```bash
curl http://localhost:3001/health
```

### Session stats

```bash
curl http://localhost:3001/api/sessions/stats
```

## 🧪 Testing

Test with a simple script:

```python
name = input("What's your name? ")
print(f"Hello, {name}!")
```

This should work naturally in the terminal (no popup windows!).

## 🐛 Troubleshooting

### Docker not available

```
Error: Docker is not available
```

Solution: Make sure Docker daemon is running

### Python sandbox image missing

```
Error: Docker image python-sandbox:latest not found
```

Solution: Build the image:
```bash
cd docker/python-sandbox
docker build -t python-sandbox:latest .
```

### Port already in use

```
Error: listen EADDRINUSE :::3001
```

Solution: Change PORT in `.env` or kill process using port 3001

### PTY errors on Mac

```
Error: Cannot create PTY
```

Solution: Ensure you have Xcode Command Line Tools installed:
```bash
xcode-select --install
```

## 📚 Architecture

See `../BACKEND_ARCHITECTURE.md` for detailed architecture documentation.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - See LICENSE file for details
