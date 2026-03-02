#!/bin/bash
# Initialize TTY settings for interactive session

# Set proper TTY settings
stty sane 2>/dev/null || true
stty echo 2>/dev/null || true
stty -echoctl 2>/dev/null || true
stty erase ^? 2>/dev/null || true

# Export environment
export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
export TERM=xterm-256color
export PS1=">>> "

# Start bash with force interactive mode
exec /bin/bash -i
