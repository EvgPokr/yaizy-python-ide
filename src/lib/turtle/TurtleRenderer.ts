/**
 * Turtle Graphics Renderer for Canvas2D
 * Renders turtle commands from Python backend
 */

export interface TurtleCommand {
  type: string;
  state: {
    x: number;
    y: number;
    angle: number;
    pen_down: boolean;
    pen_color: string;
    pen_size: number;
    speed: number;
    bg_color: string;
    fill_color: string | null;
    filling: boolean;
    visible: boolean;
  };
  [key: string]: any;
}

export class TurtleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private fillPath: Path2D | null = null;
  
  // Canvas snapshot without turtle (to redraw turtle cleanly)
  private canvasSnapshot: ImageData | null = null;
  
  // Animation state
  private commandQueue: TurtleCommand[] = [];
  private isAnimating: boolean = false;
  private currentSpeed: number = 6;
  private animationDelay: number = 10;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    
    // Set default background
    this.clear('white');
  }

  private getSpeedDelay(speed: number): number {
    // Speed 0 = instant, 1-10 = slower to faster
    if (speed === 0) return 0;
    const delays = [0, 100, 80, 60, 40, 30, 20, 15, 10, 5, 1];
    return delays[Math.min(speed, 10)];
  }

  private async animateMove(cmd: any, state: any) {
    const fromX = cmd.from_x;
    const fromY = cmd.from_y;
    const toX = cmd.to_x;
    const toY = cmd.to_y;
    
    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    
    // If speed is 0 or distance is tiny, draw immediately
    if (this.currentSpeed === 0 || distance < 5) {
      if (cmd.draw && state.pen_down) {
        this.ctx.strokeStyle = state.pen_color;
        this.ctx.lineWidth = state.pen_size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(fromX), this.toCanvasY(fromY));
        this.ctx.lineTo(this.toCanvasX(toX), this.toCanvasY(toY));
        this.ctx.stroke();

        if (state.filling && this.fillPath) {
          this.fillPath.lineTo(this.toCanvasX(toX), this.toCanvasY(toY));
        }
      }
      
      // Save canvas state and draw turtle at final position
      if (state.visible) {
        this.saveCanvasSnapshot();
        this.drawTurtle(toX, toY, state.angle);
      }
      return;
    }

    // Animate movement in steps
    const steps = Math.max(10, Math.floor(distance / 5));
    const dx = (toX - fromX) / steps;
    const dy = (toY - fromY) / steps;

    for (let i = 0; i <= steps; i++) {
      const currentX = fromX + dx * i;
      const currentY = fromY + dy * i;

      // Restore canvas without turtle from previous iteration
      if (this.canvasSnapshot && state.visible) {
        this.ctx.putImageData(this.canvasSnapshot, 0, 0);
      }

      // Draw line segment if pen is down
      if (i > 0 && cmd.draw && state.pen_down) {
        const prevX = fromX + dx * (i - 1);
        const prevY = fromY + dy * (i - 1);

        this.ctx.strokeStyle = state.pen_color;
        this.ctx.lineWidth = state.pen_size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(prevX), this.toCanvasY(prevY));
        this.ctx.lineTo(this.toCanvasX(currentX), this.toCanvasY(currentY));
        this.ctx.stroke();

        if (state.filling && this.fillPath) {
          this.fillPath.lineTo(this.toCanvasX(currentX), this.toCanvasY(currentY));
        }
      }

      // Save canvas state WITHOUT turtle (only lines)
      if (state.visible) {
        this.saveCanvasSnapshot();
      }

      // Draw turtle at current position AFTER saving snapshot
      if (state.visible) {
        this.drawTurtle(currentX, currentY, state.angle);
      }

      // Wait for animation delay
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, this.animationDelay));
      }
    }
  }

  private async animateCircle(cmd: any, state: any) {
    const { radius, extent, steps, start_x, start_y, start_angle } = cmd;
    const angleStep = extent / steps;
    
    // Calculate circle center
    const angleRad = (start_angle * Math.PI) / 180;
    const centerX = start_x - radius * Math.sin(angleRad);
    const centerY = start_y + radius * Math.cos(angleRad);

    this.ctx.strokeStyle = state.pen_color;
    this.ctx.lineWidth = state.pen_size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // If speed is 0, draw all at once
    if (this.currentSpeed === 0) {
      this.ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const angle = start_angle + i * angleStep;
        const rad = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.sin(rad);
        const y = centerY - radius * Math.cos(rad);
        
        if (i === 0) {
          this.ctx.moveTo(this.toCanvasX(x), this.toCanvasY(y));
        } else {
          this.ctx.lineTo(this.toCanvasX(x), this.toCanvasY(y));
        }
      }
      if (state.pen_down) {
        this.ctx.stroke();
      }
      
      // Save canvas and draw turtle at final position
      if (state.visible) {
        this.saveCanvasSnapshot();
        const finalAngle = start_angle + extent;
        const finalRad = (finalAngle * Math.PI) / 180;
        const finalX = centerX + radius * Math.sin(finalRad);
        const finalY = centerY - radius * Math.cos(finalRad);
        this.drawTurtle(finalX, finalY, finalAngle);
      }
      return;
    }

    // Animate circle step by step
    for (let i = 0; i <= steps; i++) {
      const angle = start_angle + i * angleStep;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.sin(rad);
      const y = centerY - radius * Math.cos(rad);

      // Restore canvas without turtle from previous iteration
      if (this.canvasSnapshot && state.visible) {
        this.ctx.putImageData(this.canvasSnapshot, 0, 0);
      }

      if (i > 0 && state.pen_down) {
        const prevAngle = start_angle + (i - 1) * angleStep;
        const prevRad = (prevAngle * Math.PI) / 180;
        const prevX = centerX + radius * Math.sin(prevRad);
        const prevY = centerY - radius * Math.cos(prevRad);

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(prevX), this.toCanvasY(prevY));
        this.ctx.lineTo(this.toCanvasX(x), this.toCanvasY(y));
        this.ctx.stroke();
      }

      // Save canvas WITHOUT turtle (only lines)
      if (state.visible) {
        this.saveCanvasSnapshot();
      }

      // Draw turtle at current position AFTER saving snapshot
      if (state.visible) {
        this.drawTurtle(x, y, angle);
      }
      
      // Wait for animation delay
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, this.animationDelay));
      }
    }
  }

  private toCanvasX(x: number): number {
    return this.centerX + x;
  }

  private toCanvasY(y: number): number {
    return this.centerY - y; // Flip Y axis (turtle: up is positive)
  }

  clear(bgColor: string = 'white') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.fillPath = null;
    this.canvasSnapshot = null;
  }

  executeCommand(cmd: TurtleCommand) {
    // Add command to queue
    this.commandQueue.push(cmd);
    
    // Start animation if not already running
    if (!this.isAnimating) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isAnimating = true;

    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift();
      if (!cmd) break;

      await this.executeCommandImmediate(cmd);
    }

    this.isAnimating = false;
  }

  private async executeCommandImmediate(cmd: TurtleCommand) {
    const { type, state } = cmd;

    switch (type) {
      case 'init':
        this.width = cmd.width || 800;
        this.height = cmd.height || 600;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.clear(state.bg_color);
        // Initialize with turtle visible at center
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'speed':
        this.currentSpeed = cmd.speed || 6;
        this.animationDelay = this.getSpeedDelay(this.currentSpeed);
        break;

      case 'move':
        await this.animateMove(cmd, state);
        break;

      case 'circle':
        await this.animateCircle(cmd, state);
        break;

      case 'dot':
        // Restore canvas without turtle
        if (this.canvasSnapshot && state.visible) {
          this.ctx.putImageData(this.canvasSnapshot, 0, 0);
        }
        
        this.ctx.fillStyle = cmd.color;
        this.ctx.beginPath();
        this.ctx.arc(
          this.toCanvasX(cmd.x),
          this.toCanvasY(cmd.y),
          cmd.size / 2,
          0,
          2 * Math.PI
        );
        this.ctx.fill();
        
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'begin_fill':
        this.fillPath = new Path2D();
        this.fillPath.moveTo(
          this.toCanvasX(state.x),
          this.toCanvasY(state.y)
        );
        break;

      case 'end_fill':
        // Restore canvas without turtle
        if (this.canvasSnapshot && state.visible) {
          this.ctx.putImageData(this.canvasSnapshot, 0, 0);
        }
        
        if (this.fillPath && state.fill_color) {
          this.fillPath.closePath();
          this.ctx.fillStyle = state.fill_color;
          this.ctx.fill(this.fillPath);
          this.fillPath = null;
        }
        
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'bg_color':
        this.clear(cmd.color);
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'clear':
        this.clear(state.bg_color);
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'reset':
        this.clear('white');
        break;

      case 'write':
        // Restore canvas without turtle
        if (this.canvasSnapshot && state.visible) {
          this.ctx.putImageData(this.canvasSnapshot, 0, 0);
        }
        
        // Draw text
        const { text, x, y, align, font } = cmd;
        const [fontFamily, fontSize, fontStyle] = font;
        
        this.ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = align as CanvasTextAlign;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = state.pen_color;
        this.ctx.fillText(text, this.toCanvasX(x), this.toCanvasY(y));
        
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'done':
        // Animation complete
        console.log('Turtle drawing complete!');
        // Keep turtle visible at final position
        if (state.visible) {
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        }
        break;

      case 'rotate':
      case 'pen_up':
      case 'pen_down':
      case 'pen_size':
      case 'pen_color':
      case 'fill_color':
      case 'show_turtle':
      case 'hide_turtle':
        // These commands don't draw, but may affect turtle visibility
        if (state.visible && type !== 'hide_turtle') {
          // Restore canvas without turtle
          if (this.canvasSnapshot) {
            this.ctx.putImageData(this.canvasSnapshot, 0, 0);
          }
          // Save new snapshot and redraw turtle at current position with new state
          this.saveCanvasSnapshot();
          this.drawTurtle(state.x, state.y, state.angle);
        } else if (type === 'hide_turtle' && this.canvasSnapshot) {
          // If hiding turtle, just restore canvas without it
          this.ctx.putImageData(this.canvasSnapshot, 0, 0);
        }
        break;

      default:
        // Unknown command
        break;
    }
  }

  private saveCanvasSnapshot() {
    this.canvasSnapshot = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  private drawTurtle(x: number, y: number, angle: number) {
    const cx = this.toCanvasX(x);
    const cy = this.toCanvasY(y);
    const angleRad = (-angle * Math.PI) / 180; // Negative because canvas Y is flipped

    this.ctx.save();
    this.ctx.translate(cx, cy);
    
    // Flip horizontally based on direction (left/right)
    // If moving right (angle between -90 and 90), flip to face right
    const normalizedAngle = ((angle % 360) + 360) % 360;
    if (normalizedAngle > 270 || normalizedAngle < 90) {
      // Moving right - flip horizontally
      this.ctx.scale(-1, 1);
    }

    // Draw turtle emoji - always upright, flips horizontally for direction
    this.ctx.font = '40px Arial'; // Big size for visibility
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🐢', 0, 0);

    this.ctx.restore();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
