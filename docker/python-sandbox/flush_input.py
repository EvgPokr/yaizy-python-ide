#!/usr/bin/env python3
"""
Wrapper that makes input() flush stdout automatically.
"""
import sys
import builtins

# Save original input
_original_input = builtins.input

def flushing_input(prompt=''):
    """input() that always flushes stdout before reading"""
    # Print prompt and flush immediately
    if prompt:
        sys.stdout.write(prompt)
        sys.stdout.flush()
    # Read input without prompt (already printed)
    return _original_input('')

# Replace built-in input
builtins.input = flushing_input

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: flush_input.py <script.py>", file=sys.stderr)
        sys.exit(1)
    
    script_path = sys.argv[1]
    
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
