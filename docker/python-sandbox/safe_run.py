#!/usr/bin/env python3
"""
Safe runner that ignores spurious SIGINT at startup.
"""
import signal
import sys
import time

# Flag to track if we've started executing user code
started = False
sigint_count = 0

def sigint_handler(sig, frame):
    global sigint_count, started
    sigint_count += 1
    
    # Ignore the first SIGINT if it comes within 0.5s of startup (spurious signal)
    if not started and sigint_count == 1:
        return
    
    # Real Ctrl+C - raise KeyboardInterrupt
    raise KeyboardInterrupt

# Install our custom SIGINT handler
signal.signal(signal.SIGINT, sigint_handler)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: safe_run.py <script.py>", file=sys.stderr)
        sys.exit(1)
    
    script_path = sys.argv[1]
    
    # Small delay to let spurious signals pass
    time.sleep(0.1)
    started = True
    
    try:
        with open(script_path, 'r') as f:
            code = f.read()
        
        exec(compile(code, script_path, 'exec'), {'__name__': '__main__', '__file__': script_path})
    except KeyboardInterrupt:
        print()
        sys.exit(130)
    except SystemExit:
        raise
    except Exception:
        raise
