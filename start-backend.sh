#!/bin/bash
# Backend startup script with proper environment

cd /opt/python-ide/backend

# Set environment
export NODE_ENV=production
export PORT=3001

# Start with tsx
exec node_modules/.bin/tsx src/server.ts
