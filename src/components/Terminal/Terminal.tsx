import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

interface TerminalProps {
  onData: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function Terminal({ onData, onResize }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create xterm instance
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      scrollback: 1000,
      convertEol: true,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Open terminal
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle user input (bash shell handles echo)
    xterm.onData((data) => {
      onData(data);
    });

    // Handle terminal resize
    xterm.onResize(({ cols, rows }) => {
      onResize?.(cols, rows);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    // Initial welcome message
    xterm.writeln('\x1b[1;32m✓ Terminal connected\x1b[0m');
    xterm.writeln('');

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [onData, onResize]);

  // Expose write and clear methods
  useEffect(() => {
    if (xtermRef.current) {
      (window as any).__terminal_write = (data: string) => {
        xtermRef.current?.write(data);
      };
      (window as any).__terminal_clear = () => {
        xtermRef.current?.clear();
      };
    }
    return () => {
      delete (window as any).__terminal_write;
      delete (window as any).__terminal_clear;
    };
  }, []);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span className="terminal-title">🐍 Python Console</span>
        <span className="terminal-status">Connected</span>
      </div>
      <div ref={terminalRef} className="terminal-content" />
    </div>
  );
}

// Utility function to write to terminal from outside
export function writeToTerminal(data: string) {
  if ((window as any).__terminal_write) {
    (window as any).__terminal_write(data);
  }
}

export function clearTerminal() {
  if ((window as any).__terminal_clear) {
    (window as any).__terminal_clear();
  }
}
