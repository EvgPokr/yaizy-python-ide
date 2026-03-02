# Secure Python sandbox for YaizY Python Editor
FROM python:3.11-slim

# Metadata
LABEL maintainer="YaizY"
LABEL description="Sandboxed Python environment for student code execution"

# No GUI dependencies needed - turtle is rendered in browser!

# Install util-linux for 'script' and coreutils for 'stdbuf'
RUN apt-get update && apt-get install -y --no-install-recommends \
    util-linux \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN useradd -m -u 1000 -s /bin/bash student

# Install common Python packages
RUN pip install --no-cache-dir \
    numpy==1.26.3 \
    matplotlib==3.8.2 \
    pillow==10.2.0 \
    requests==2.31.0 \
    pandas==2.1.4 \
    scipy==1.11.4

# Copy turtle wrapper (intercepts commands for browser rendering)
COPY turtle_wrapper.py /usr/local/lib/python3.11/turtle.py

# Copy run wrapper (suppresses KeyboardInterrupt traceback)
COPY run_wrapper.py /usr/local/bin/run_wrapper.py
RUN chmod +x /usr/local/bin/run_wrapper.py

# Copy safe runner (ignores spurious SIGINT)
COPY safe_run.py /usr/local/bin/safe_run.py
RUN chmod +x /usr/local/bin/safe_run.py

# Copy flush_input wrapper (makes input() flush stdout)
COPY flush_input.py /usr/local/bin/flush_input.py
RUN chmod +x /usr/local/bin/flush_input.py

# Copy input_fix wrapper (fixes input() to show prompts immediately)
COPY input_fix.py /usr/local/bin/input_fix.py
RUN chmod +x /usr/local/bin/input_fix.py

# Copy run_python wrapper (runs Python without showing technical commands)
COPY run_python.sh /usr/local/bin/run_python.sh
RUN chmod +x /usr/local/bin/run_python.sh

# Copy TTY init script (sets up proper terminal)
COPY init_tty.sh /usr/local/bin/init_tty.sh
RUN chmod +x /usr/local/bin/init_tty.sh

# Copy Python startup script (removes >>> prompts)
COPY startup.py /usr/local/lib/python3.11/startup.py

# Copy runner script (interactive command processor)
COPY runner.py /usr/local/bin/runner.py
RUN chmod +x /usr/local/bin/runner.py

# Create workspace directory
RUN mkdir -p /workspace && chown student:student /workspace

# Set working directory
WORKDIR /workspace

# Switch to non-root user  
USER student

# Keep container alive with bash
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
