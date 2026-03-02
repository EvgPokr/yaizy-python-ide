#!/usr/bin/env python3
"""
Python startup script to configure interactive mode for YaizY Python Editor.
This script removes Python prompts (>>> and ...) for cleaner output.
"""
import sys
import os

# Remove Python prompts for cleaner console
sys.ps1 = ''
sys.ps2 = ''

# Ensure unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Hide this function from user
def __run_user_code__(filepath):
    """Execute user code file silently (hidden function)"""
    os.system(f'python3 -u /usr/local/bin/run_wrapper.py {filepath}')
    return None  # Don't print return value

# Make displayhook not show None values
_original_displayhook = sys.displayhook
def _clean_displayhook(value):
    if value is not None:
        _original_displayhook(value)
sys.displayhook = _clean_displayhook
