#!/bin/bash
# Backend startup script with proper environment

cd /opt/python-ide/backend

# Set environment
export NODE_ENV=production
export PORT=3001

# Log startup
echo "Starting Python IDE Backend..."
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "PORT: $PORT"

# Check if Docker socket is accessible
if [ ! -S /var/run/docker.sock ]; then
    echo "ERROR: Docker socket not found!"
    exit 1
fi

# Start with tsx
echo "Starting server with tsx..."
exec node_modules/.bin/tsx src/server.ts
