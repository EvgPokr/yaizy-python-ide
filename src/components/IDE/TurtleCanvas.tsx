import React, { useRef, useEffect } from 'react';

interface TurtleCanvasProps {
  width?: number;
  height?: number;
  onClear?: () => void;
}

export const TurtleCanvas: React.FC<TurtleCanvasProps> = ({
  width = 600,
  height = 400,
  onClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[TurtleCanvas] Canvas ref not ready');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('[TurtleCanvas] Could not get 2d context');
      return;
    }

    console.log('[TurtleCanvas] Setting up canvas:', width, 'x', height);

    // Set up canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Expose canvas to global scope for Python access
    (window as any).turtleCanvas = canvas;
    (window as any).turtleContext = ctx;
    
    console.log('[TurtleCanvas] Canvas exposed to window');
  }, [width, height]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    onClear?.();
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="turtle-canvas"
    />
  );
};
