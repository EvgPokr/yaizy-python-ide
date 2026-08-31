# YaizY Python Editor

**Modern browser-based Python IDE with real terminal experience**

---

## ✨ Features

- 🐍 **Full Python 3.11** - Complete Python execution with real CPython
- 💻 **Real Terminal** - True PTY-based console with proper `input()` support
- 🐢 **Turtle Graphics** - Built-in canvas for turtle drawings
- 📁 **Multi-file Projects** - Create, edit, and manage multiple Python files
- 🎨 **Modern UI** - Clean interface with syntax highlighting
- 🔒 **Secure Execution** - Isolated Docker containers for each session

---

## 🏗️ Architecture

### **Frontend** (React + Vite + TypeScript)
- **Monaco Editor** - VSCode-powered code editor
- **xterm.js** - Terminal emulator for real-time output
- **Canvas Renderer** - Custom turtle graphics renderer

### **Backend** (Node.js + Express + Docker)
- **Session Management** - Isolated Python environments per user
- **PTY Manager** - Real pseudo-terminal for Python execution
- **Docker Containers** - Sandboxed CPython 3.11 execution
- **WebSockets** - Real-time bidirectional communication

### **Python Sandbox** (Docker)
- **Base**: `python:3.11-slim`
- **Libraries**: numpy, matplotlib, pillow
- **Security**: Resource limits, network isolation, non-root user
- **Special**: Custom turtle wrapper for browser rendering

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- npm or yarn

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Build Docker Image

```bash
cd docker/python-sandbox
docker build -t python-sandbox:latest .
cd ../..
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 4. Open in Browser

Navigate to: **http://localhost:5173**

---

## 📖 How It Works

### **Python Execution Flow:**

1. **User writes Python code** in Monaco Editor
2. **Frontend sends code** to backend via WebSocket
3. **Backend creates Docker container** with Python 3.11
4. **PTY executes code** in isolated environment
5. **Output streams back** via WebSocket to xterm.js terminal
6. **Turtle commands** rendered on HTML5 canvas

### **input() Support:**

- Real PTY with proper TTY configuration
- `input()` works exactly like CPython console
- No browser prompts or workarounds
- Full support for text-based games and interactive programs

### **Turtle Graphics:**

- Custom Python wrapper intercepts turtle commands
- Commands serialized as JSON and sent to frontend
- JavaScript renderer draws on HTML5 canvas in real-time
- Smooth animations with configurable speed

---

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env`):
```env
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
SESSION_TIMEOUT_MINUTES=30
DOCKER_IMAGE=python-sandbox:latest
DOCKER_MEMORY_LIMIT=256m
DOCKER_CPU_LIMIT=1
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 📁 Project Structure

```
.
├── src/                      # Frontend source
│   ├── components/           # React components
│   │   ├── IDE/             # IDE layout components
│   │   ├── Terminal/        # Terminal component
│   │   └── Canvas/          # Turtle canvas
│   ├── lib/                 # Utilities
│   │   ├── backend/         # Backend API client
│   │   └── turtle/          # Turtle renderer
│   └── store/               # State management
│
├── backend/                  # Backend source
│   └── src/
│       ├── services/        # Core services
│       │   ├── DockerManager.ts    # Docker operations
│       │   ├── PTYManager.ts       # PTY management
│       │   └── SessionManager.ts   # Session lifecycle
│       ├── websocket/       # WebSocket handlers
│       ├── routes/          # REST API routes
│       └── middleware/      # Express middleware
│
├── docker/                   # Docker configuration
│   └── python-sandbox/
│       ├── Dockerfile       # Python sandbox image
│       ├── turtle_wrapper.py  # Custom turtle module
│       └── flush_input.py   # input() flushing wrapper
│
├── public/                   # Static assets
└── *.md                     # Documentation
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# E2E tests with Playwright
npm run test:e2e
```

---

## 🔐 Authentication (YaizY OAuth)

Login is handled exclusively through the YaizY platform via
**OAuth 2.0 Authorization Code + PKCE** (one-way: yaizy → python-ide).
There is no local registration, password login, or password reset.

Flow:

1. User opens the IDE (e.g. via the "Open Python IDE" button in the yaizy
   student dashboard, which points to the `/api/auth2/student/python-ide-launch`
   endpoint of the yaizy auth service) — or opens the IDE directly.
2. Without a session, the IDE redirects to the yaizy authorization endpoint
   (`/oauth/authorize`). An already logged-in yaizy user passes silently;
   an unauthenticated user is sent to the yaizy login page first.
3. Yaizy redirects back to `GET /api/auth/oauth/yaizy/callback` with a
   one-time `code`. The backend exchanges it at the yaizy token endpoint
   (with `code_verifier` and client credentials) and receives a short-lived
   JWT.
4. The JWT carries **no personal data** — only an opaque user identifier
   (`sub`, HMAC-derived from the yaizy user id) and the role. The backend
   provisions/loads a local user by that identifier and issues its own
   session token, which is passed to the frontend via the URL fragment.

Backend environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `YAIZY_OAUTH_AUTHORIZE_URL` | yaizy authorize endpoint, e.g. `https://yaizy.io/api/auth2/oauth/authorize` |
| `YAIZY_OAUTH_TOKEN_URL` | yaizy token endpoint, e.g. `https://yaizy.io/api/auth2/oauth/token` |
| `YAIZY_OAUTH_CLIENT_ID` | OAuth client id issued for this app |
| `YAIZY_OAUTH_CLIENT_SECRET` | OAuth client secret |
| `YAIZY_OAUTH_REDIRECT_URI` | Public callback URL, e.g. `http://localhost:3001/api/auth/oauth/yaizy/callback` |
| `YAIZY_OAUTH_JWT_SECRET` | Shared secret to verify yaizy access tokens (HS256) |
| `YAIZY_OAUTH_ISSUER` | Expected token issuer, e.g. `https://yaizy.io` |
| `FRONTEND_URL` | Where to redirect after the callback (default `http://localhost:5173`) |

---

## 🔒 Security

- **Docker isolation** - Each session runs in separate container
- **Resource limits** - CPU, memory, process count restrictions
- **Network disabled** - No outbound connections from sandbox
- **Non-root user** - Python runs as `student` user
- **Rate limiting** - API and session creation limits
- **Timeout protection** - Automatic session cleanup

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture overview
- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - Backend deep dive
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Setup instructions
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Monaco Editor
- xterm.js
- Zustand

**Backend:**
- Node.js
- Express
- WebSocket (ws)
- Dockerode
- TypeScript

**Infrastructure:**
- Docker
- Python 3.11

---

## 📝 License

Private - YaizY © 2026

---

## 🤝 Support

For questions and support, please contact the YaizY team.
