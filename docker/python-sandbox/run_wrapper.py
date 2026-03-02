#!/usr/bin/env python3
"""
Wrapper to execute user code and suppress KeyboardInterrupt traceback.
"""
import sys
import os

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: run_wrapper.py <script.py>", file=sys.stderr)
        sys.exit(1)
    
    script_path = sys.argv[1]
    
    if not os.path.exists(script_path):
        print(f"Error: File '{script_path}' not found", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Read and execute the script
        with open(script_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Execute the code with proper globals
        exec(compile(code, script_path, 'exec'), {'__name__': '__main__', '__file__': script_path})
        
    except KeyboardInterrupt:
        # Silently exit on Ctrl+C - just print newline
        print()
        sys.exit(130)
    except SystemExit:
        raise
    except Exception:
        raise
