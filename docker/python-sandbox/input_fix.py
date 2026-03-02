#!/usr/bin/env python3
"""
Wrapper that fixes input() to always show prompts immediately.
"""
import sys
import builtins

# Save original input
_original_input = builtins.input

def fixed_input(prompt=''):
    """input() that ALWAYS displays prompt before waiting for input"""
    if prompt:
        # Write prompt directly to stdout
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
    
    # Read line from stdin (without using built-in input)
    try:
        line = sys.stdin.readline()
        if line:
            return line.rstrip('\n\r')
        else:
            raise EOFError
    except EOFError:
        raise EOFError

# Replace built-in input globally
builtins.input = fixed_input

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: input_fix.py <script.py>", file=sys.stderr)
        sys.exit(1)
    
    script_path = sys.argv[1]
    
    # Read and execute the script
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Execute in clean namespace
        namespace = {
            '__name__': '__main__',
            '__file__': script_path,
            '__builtins__': builtins,
        }
        
        exec(compile(code, script_path, 'exec'), namespace)
        
    except KeyboardInterrupt:
        print()
        sys.exit(130)
    except SystemExit:
        raise
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
