#!/usr/bin/env python3
"""
Interactive Python runner for YaizY Python Editor.
Monitors command file and executes Python scripts without showing commands.
"""
import sys
import os
import time

# Ensure unbuffered I/O
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

COMMAND_FILE = '/workspace/.yaizy_command'
RESPONSE_FILE = '/workspace/.yaizy_response'

def run_script(filepath):
    """Execute a Python script using the wrapper"""
    exit_code = os.system(f'python3 -u /usr/local/bin/run_wrapper.py {filepath}')
    return exit_code >> 8  # Extract actual exit code

# Remove old command files
try:
    os.remove(COMMAND_FILE)
except FileNotFoundError:
    pass

try:
    os.remove(RESPONSE_FILE)
except FileNotFoundError:
    pass

# Create response file to signal we're ready
with open(RESPONSE_FILE, 'w') as f:
    f.write('READY\n')

# Main loop - monitor command file
while True:
    try:
        # Check if command file exists
        if os.path.exists(COMMAND_FILE):
            # Read and process command
            with open(COMMAND_FILE, 'r') as f:
                command = f.read().strip()
            
            # Remove command file immediately
            os.remove(COMMAND_FILE)
            
            # Execute command
            if command.startswith('RUN:'):
                filepath = command[4:]
                run_script(filepath)
                
                # Signal completion
                with open(RESPONSE_FILE, 'w') as f:
                    f.write('DONE\n')
            elif command == 'EXIT':
                break
        
        # Small sleep to avoid busy loop
        time.sleep(0.01)
            
    except KeyboardInterrupt:
        # Ctrl+C - continue monitoring
        continue
    except Exception as e:
        # Log error but continue
        print(f"Runner error: {e}", file=sys.stderr)
        time.sleep(0.1)
