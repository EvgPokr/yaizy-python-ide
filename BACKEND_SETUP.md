# 🚀 Backend Setup Guide

This guide will help you set up and run the YaizY Python Editor with serverside Python execution.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** (for backend)
- ✅ **Docker** (for Python sandboxes)
- ✅ **npm** or **yarn**

## 🔧 Installation

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Build Python Sandbox Docker Image

This image will be used to run student code in isolated containers:

```bash
cd docker/python-sandbox
docker build -t python-sandbox:latest .
```

Verify the image was built:

```bash
docker images | grep python-sandbox
```

### 3. Configure Environment

Backend:

```bash
cd backend
cp env.example .env
# Edit .env if needed (default values should work for development)
```

Frontend:

```bash
cd ../
cp env.example .env
# Make sure VITE_BACKEND_URL=http://localhost:3001
```

## ▶️ Running the Application

### Development Mode

You need to run both backend and frontend:

**Terminal 1: Start Backend**

```bash
cd backend
npm run dev
```

You should see:

```
🚀 YaizY Python Editor Backend
================================
✓ Server running on http://localhost:3001
✓ WebSocket endpoint: ws://localhost:3001/api/sessions/:id/terminal
✓ Health check: http://localhost:3001/health
✓ Environment: development
================================
```

**Terminal 2: Start Frontend**

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Verify Everything Works

1. **Check backend health:**

```bash
curl http://localhost:3001/health
```

Should return:

```json
{
  "status": "healthy",
  "docker": "ok",
  "sessions": 0,
  "wsConnections": 0
}
```

2. **Open frontend:**

Navigate to `http://localhost:5173` in your browser

3. **Test interactive input:**

Try this code:

```python
name = input("What's your name? ")
print(f"Hello, {name}!")
```

You should be able to type directly in the terminal - NO popup windows! 🎉

## 🐳 Production Deployment

### Using Docker Compose

```bash
cd docker
docker-compose up -d
```

This will start:

- Backend server on port 3001
- Automatic Python sandbox management

### Manual Deployment

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
npm run build
# Deploy the `dist/` folder to your hosting service
```

## 🔍 Troubleshooting

### "Docker is not available"

**Problem:** Backend can't connect to Docker

**Solution:**

- Make sure Docker Desktop is running
- On Linux, ensure your user is in the `docker` group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### "Python sandbox image not found"

**Problem:** Docker image `python-sandbox:latest` doesn't exist

**Solution:**

```bash
cd docker/python-sandbox
docker build -t python-sandbox:latest .
```

### "Connection refused" or "WebSocket failed"

**Problem:** Frontend can't connect to backend

**Solution:**

- Check backend is running on port 3001
- Verify VITE_BACKEND_URL in .env
- Check firewall/CORS settings

### "Cannot create PTY" (macOS)

**Problem:** node-pty fails to compile

**Solution:**

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

### Port 3001 already in use

**Problem:** Another process is using port 3001

**Solution:**

Either:

1. Kill the process: `lsof -ti:3001 | xargs kill -9`
2. Or change PORT in backend/.env

## 🧪 Testing

### Test Script 1: Basic I/O

```python
print("Hello from serverside Python!")
x = 5 + 3
print(f"5 + 3 = {x}")
```

### Test Script 2: Interactive Loop

```python
while True:
    cmd = input("> ")
    if cmd == "quit":
        break
    print(f"You said: {cmd}")
```

### Test Script 3: Text Adventure Game

```python
def game():
    print("You are in a dark room.")
    choice = input("Go left or right? ")
    
    if choice == "left":
        print("You found a treasure! 🏆")
    else:
        print("You fell in a pit! 💀")

game()
```

All of these should work naturally in the terminal!

## 📊 Monitoring

### Session Statistics

```bash
curl http://localhost:3001/api/sessions/stats
```

### Docker Container Status

```bash
docker ps | grep python-session
```

### Backend Logs

```bash
# If running with docker-compose
docker-compose logs -f backend

# If running with npm
# Logs are in the terminal where you ran npm run dev
```

## 🔒 Security

The backend implements multiple security layers:

- ✅ Docker container isolation per session
- ✅ Read-only filesystem (except /workspace)
- ✅ Memory limit: 256MB per session
- ✅ CPU limit: 0.5 core per session
- ✅ Execution timeout: 10 seconds
- ✅ No network access
- ✅ Non-root user in container
- ✅ PID limit (prevents fork bombs)
- ✅ Rate limiting on API endpoints

## 📚 Architecture

For detailed architecture documentation, see:

- [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) - System architecture
- [backend/README.md](backend/README.md) - Backend API documentation

## 🆘 Need Help?

If you're stuck:

1. Check the [Troubleshooting](#-troubleshooting) section above
2. Verify all prerequisites are installed
3. Check backend logs for errors
4. Ensure Docker is running and healthy

## ✅ Success Checklist

Before considering the setup complete, verify:

- [ ] Backend health check returns "healthy"
- [ ] Frontend loads without errors
- [ ] Terminal connects and shows welcome message
- [ ] Can run basic Python code
- [ ] `input()` works naturally in terminal (no popup!)
- [ ] Can create/edit/run multiple files
- [ ] Sessions auto-cleanup after 5 minutes idle

---

**Congratulations!** 🎉 You now have a professional Python IDE with real CPython execution! No more browser limitations!
