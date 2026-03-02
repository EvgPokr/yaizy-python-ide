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
