/**
 * Turtle animation system using requestAnimationFrame
 * Provides smooth animations for turtle graphics
 */

interface DrawCommand {
  type: 'line' | 'arc' | 'dot' | 'text';
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  size?: number;
  text?: string;
  color: string;
  width: number;
}

class TurtleAnimator {
  private queue: DrawCommand[] = [];
  private isAnimating = false;
  private speed = 5; // 0 = instant, 10 = slowest

  setSpeed(speed: number) {
    this.speed = Math.max(0, Math.min(10, speed));
  }

  addLine(
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    width: number
  ) {
    this.queue.push({ type: 'line', from, to, color, width });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isAnimating || this.queue.length === 0) return;

    this.isAnimating = true;

    while (this.queue.length > 0) {
      const command = this.queue.shift()!;
      await this.drawCommand(command);
    }

    this.isAnimating = false;
  }

  private async drawCommand(command: DrawCommand): Promise<void> {
    const canvas = (window as any).turtleCanvas as HTMLCanvasElement;
    const ctx = (window as any).turtleContext as CanvasRenderingContext2D;

    if (!canvas || !ctx) return;

    if (command.type === 'line' && command.from && command.to) {
      await this.animateLine(ctx, command.from, command.to, command.color, command.width);
    }
  }

  private async animateLine(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    width: number
  ): Promise<void> {
    if (this.speed === 0) {
      // Instant draw
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      return;
    }

    // Animated draw
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(10, Math.floor(distance / 2));
    const delay = this.speed * 2; // milliseconds per step

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = from.x + dx * progress;
      const currentY = from.y + dy * progress;

      if (i > 0) {
        const prevProgress = (i - 1) / steps;
        const prevX = from.x + dx * prevProgress;
        const prevY = from.y + dy * prevProgress;

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      }

      if (i < steps) {
        await this.sleep(delay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  clear() {
    this.queue = [];
  }
}

// Global animator instance
export const turtleAnimator = new TurtleAnimator();
