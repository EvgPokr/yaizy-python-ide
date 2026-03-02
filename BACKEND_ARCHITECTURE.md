# 🏗️ Backend Architecture - Serverside Python Execution

## 📐 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Code Editor  │  │   Terminal   │  │  File Panel  │      │
│  │   Monaco     │  │   xterm.js   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                                 │
│         │                  │ WebSocket                       │
│         ├──────────────────┼─────────────────────────────┐  │
│         │ HTTP             │                             │  │
└─────────┼──────────────────┼─────────────────────────────┼──┘
          │                  │                             │
          ▼                  ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Express REST API + WebSocket              │ │
│  │  POST /api/sessions     - Create session              │ │
│  │  WS   /api/sessions/:id - Terminal WebSocket          │ │
│  │  POST /api/sessions/:id/run - Execute code            │ │
│  │  POST /api/sessions/:id/stop - Stop execution         │ │
│  │  DELETE /api/sessions/:id - Cleanup                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Session Manager                              │ │
│  │  - Track active sessions                              │ │
│  │  - Session lifecycle (create/run/stop/cleanup)        │ │
│  │  - Idle timeout (5 minutes)                           │ │
│  │  - Rate limiting per user                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           PTY Manager (node-pty)                      │ │
│  │  - Create pseudo-terminal                             │ │
│  │  - Spawn Python process                               │ │
│  │  - Bidirectional I/O streaming                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Docker Container│  │  Docker Container│  │  Docker Container│
│   Session #1     │  │   Session #2     │  │   Session #3     │
│  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │
│  │  Python    │  │  │  │  Python    │  │  │  │  Python    │  │
│  │  Process   │  │  │  │  Process   │  │  │  │  Process   │  │
│  │  (PTY)     │  │  │  │  (PTY)     │  │  │  │  (PTY)     │  │
│  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │
│  Limits:         │  │  Limits:         │  │  Limits:         │
│  - 256MB RAM     │  │  - 256MB RAM     │  │  - 256MB RAM     │
│  - 0.5 CPU       │  │  - 0.5 CPU       │  │  - 0.5 CPU       │
│  - 10s timeout   │  │  - 10s timeout   │  │  - 10s timeout   │
│  - No network    │  │  - No network    │  │  - No network    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔒 Security Model

### Container Isolation (per session)

```yaml
Docker Security:
  - Read-only filesystem (except /workspace)
  - No privileged mode
  - Drop all capabilities
  - User: non-root (uid 1000)
  - No access to host network
  - Limited PIDs (max 64)
  - AppArmor/SELinux profile

Resource Limits:
  - Memory: 256MB hard limit
  - CPU: 0.5 core
  - Disk: 10MB workspace
  - Time: 10 seconds per execution
  - Network: Disabled

Rate Limiting:
  - Max 10 sessions per IP
  - Max 100 executions per hour
  - Max 1 execution per 2 seconds
```

## 📁 Backend Structure

```
backend/
├── src/
│   ├── server.ts              # Express app setup
│   ├── routes/
│   │   └── sessions.ts        # Session REST endpoints
│   ├── websocket/
│   │   └── terminal.ts        # WebSocket terminal handler
│   ├── services/
│   │   ├── SessionManager.ts  # Session lifecycle
│   │   ├── DockerManager.ts   # Docker container ops
│   │   └── PTYManager.ts      # PTY process management
│   ├── middleware/
│   │   ├── rateLimit.ts       # Rate limiting
│   │   └── auth.ts            # Optional auth
│   └── types/
│       └── session.ts         # TypeScript types
├── docker/
│   ├── python-sandbox/
│   │   ├── Dockerfile         # Python environment
│   │   └── requirements.txt   # Python packages
│   └── docker-compose.yml     # Dev environment
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔄 Session Lifecycle

### 1. Create Session

```typescript
POST /api/sessions
→ Create temp directory
→ Launch Docker container
→ Spawn PTY with Python
→ Return session_id + ws_url
```

### 2. Connect Terminal

```typescript
WS /api/sessions/:id/terminal
→ Verify session exists
→ Pipe PTY stdout → WebSocket
→ Pipe WebSocket → PTY stdin
```

### 3. Run Code

```typescript
POST /api/sessions/:id/run
Body: { code: string }
→ Write code to /workspace/main.py
→ Execute: python main.py (in PTY)
→ Stream output to terminal
→ Timeout after 10 seconds
```

### 4. Stop Execution

```typescript
POST /api/sessions/:id/stop
→ Send SIGINT to Python process
→ If still running after 1s: SIGKILL
```

### 5. Cleanup

```typescript
DELETE /api/sessions/:id
→ Kill Python process
→ Stop Docker container
→ Remove temp directory
→ Free resources
```

### 6. Auto-cleanup

```typescript
Background job (every 1 minute):
→ Check idle sessions (> 5 min)
→ Check timeout sessions (> 10s running)
→ Cleanup orphaned containers
```

## 🌐 WebSocket Protocol

### Client → Server

```json
{
  "type": "stdin",
  "data": "user typed text\n"
}

{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

### Server → Client

```json
{
  "type": "stdout",
  "data": "program output"
}

{
  "type": "stderr",
  "data": "error message"
}

{
  "type": "exit",
  "code": 0
}

{
  "type": "timeout"
}
```

## 🐳 Docker Image

```dockerfile
FROM python:3.11-slim

# Security: Run as non-root
RUN useradd -m -u 1000 student
USER student

# Working directory
WORKDIR /workspace

# Install common packages
RUN pip install --no-cache-dir numpy matplotlib

# No network access (set in docker-compose)
# No write access except /workspace

CMD ["/bin/bash"]
```

## 🔐 Security Checklist

- [x] Container per session (isolation)
- [x] Non-root user in container
- [x] Read-only filesystem
- [x] Memory limit (256MB)
- [x] CPU limit (0.5 core)
- [x] Execution timeout (10s)
- [x] No network access
- [x] PID limit (prevent fork bombs)
- [x] Rate limiting
- [x] Auto-cleanup idle sessions
- [x] Input sanitization
- [x] WebSocket authentication
- [ ] Optional: IP allowlist
- [ ] Optional: User authentication

## 📊 Performance Considerations

### Resource Usage

```
Per session:
- Docker overhead: ~10MB
- Python process: ~50MB
- Container resources: 256MB limit
- Total per session: ~310MB

Max concurrent sessions: 100
Total memory: ~31GB (plan for 32GB server)
```

### Scaling

```
Single server: 50-100 concurrent sessions
Multiple servers: Use Redis for session state
Load balancer: Sticky sessions for WebSocket
```

## 🧪 Testing Strategy

### Test Cases

1. **Basic execution**
   ```python
   print("Hello, World!")
   ```

2. **Interactive input**
   ```python
   name = input("Name: ")
   print(f"Hello, {name}!")
   ```

3. **Loop with input**
   ```python
   while True:
       cmd = input("> ")
       if cmd == "quit":
           break
       print(f"You typed: {cmd}")
   ```

4. **Resource limits**
   ```python
   # Should timeout
   while True:
       pass
   
   # Should hit memory limit
   data = [0] * (10**9)
   ```

5. **Security**
   ```python
   # Should fail (no network)
   import urllib.request
   urllib.request.urlopen("http://google.com")
   
   # Should fail (no file access)
   open("/etc/passwd").read()
   ```

## 🚀 Deployment

### Development

```bash
docker-compose up
npm run dev
```

### Production

```bash
# Build images
docker build -t python-sandbox ./docker/python-sandbox

# Start backend
npm run build
npm start

# Environment variables
PORT=3001
MAX_SESSIONS=100
SESSION_TIMEOUT=300000
EXECUTION_TIMEOUT=10000
```

## 📝 API Documentation

See `API.md` for full REST API documentation.

## 🔄 Migration from Pyodide

### What changes

**Before:**
- Client-side Python (Pyodide)
- No backend needed
- `input()` → `window.prompt()`

**After:**
- Server-side Python (CPython)
- Backend required
- `input()` → real stdin (terminal)

### Frontend changes

1. Remove Pyodide hooks
2. Add xterm.js
3. Replace execution logic
4. Add WebSocket client

### Code compatibility

✅ All standard Python code works
✅ `input()` works naturally
✅ Better performance
✅ Full stdlib available

## 📋 Next Steps

1. ✅ Create architecture doc (this file)
2. [ ] Setup backend project
3. [ ] Create Docker sandbox
4. [ ] Implement session manager
5. [ ] Add WebSocket handlers
6. [ ] Update frontend
7. [ ] Testing
8. [ ] Deployment

---

**Status:** Architecture Complete ✅  
**Next:** Backend Implementation 🚀
