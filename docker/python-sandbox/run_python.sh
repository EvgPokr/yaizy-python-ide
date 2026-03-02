#!/bin/bash
# Wrapper to run Python code without showing technical commands

# Disable command echo
set +v

# Block SIGINT during execution
trap '' SIGINT

# Run Python with unbuffered I/O
export PYTHONUNBUFFERED=1
python3 -u /usr/local/bin/input_fix.py "$@"

# Capture exit code
EXIT_CODE=$?

# Re-enable SIGINT
trap - SIGINT

# Send completion marker
echo "__EXECUTION_COMPLETE__:$EXIT_CODE"

exit $EXIT_CODE
