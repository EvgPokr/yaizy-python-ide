import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { TurtleRenderer } from '@/lib/turtle/TurtleRenderer';
import './CanvasPanel.css';

interface CanvasPanelProps {
  sessionId: string | null;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export interface CanvasPanelRef {
  clearCanvas: () => void;
}

export const CanvasPanel = forwardRef<CanvasPanelRef, CanvasPanelProps>(({ sessionId, onCollapsedChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TurtleRenderer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  // Expose clearCanvas method to parent
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      if (rendererRef.current) {
        rendererRef.current.clear();
        setHasContent(false);
        setIsDrawing(false);
        console.log('Canvas cleared via ref');
      }
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    
    if (!parent) return;

    // Function to resize canvas to fill container
    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Set canvas size to match container
      canvas.width = Math.max(800, width);
      canvas.height = Math.max(600, height);
      
      // Reinitialize renderer with new size
      if (rendererRef.current) {
        rendererRef.current.resize(canvas.width, canvas.height);
      } else {
        rendererRef.current = new TurtleRenderer(canvas);
      }
      
      console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    };

    // Initial resize
    resizeCanvas();

    // Observe container size changes
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed]);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to canvas WebSocket
    const ws = new WebSocket(
      `ws://localhost:3001/api/sessions/${sessionId}/canvas`
    );

    ws.onopen = () => {
      console.log('Canvas WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'turtle_command') {
          // Parse turtle command from JSON string
          const command = JSON.parse(data.image);
          console.log('Turtle command:', command);
          
          if (rendererRef.current) {
            rendererRef.current.executeCommand(command);
            setHasContent(true);
            setIsDrawing(command.type !== 'done');
          }
        } else if (data.type === 'canvas_clear') {
          if (rendererRef.current) {
            rendererRef.current.clear();
            setHasContent(false);
            setIsDrawing(false);
          }
        }
      } catch (error) {
        console.error('Failed to parse canvas message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Canvas WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Canvas WebSocket closed');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return (
    <div className={`canvas-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="canvas-header">
        <span className="canvas-title">🐢 Turtle Graphics</span>
        <div className="canvas-header-right">
          {isDrawing && !isCollapsed && (
            <span className="canvas-status">
              <span className="drawing-indicator">●</span> Drawing...
            </span>
          )}
          <button
            className="canvas-toggle-btn"
            onClick={handleToggle}
            title={isCollapsed ? 'Show Turtle Graphics' : 'Hide Turtle Graphics'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="canvas-content">
          {!hasContent && (
            <div className="canvas-placeholder-overlay">
              <div className="canvas-icon">🐢</div>
              <p>Canvas will appear here when turtle starts drawing</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="turtle-canvas"
          />
        </div>
      )}
    </div>
  );
});

CanvasPanel.displayName = 'CanvasPanel';
