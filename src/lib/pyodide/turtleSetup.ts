import type { PyodideInterface } from '@/types';

/**
 * Sets up turtle graphics support in Pyodide
 * Creates a Python turtle module that draws on HTML canvas
 */
export async function setupTurtle(pyodide: PyodideInterface): Promise<void> {
  await pyodide.runPythonAsync(`
import sys
import math
from types import ModuleType

# Create turtle module
turtle_module = ModuleType('turtle')

class TurtleGraphics:
    """Simple turtle graphics implementation for browser canvas"""
    
    def __init__(self):
        self.x = 250  # Center x (canvas is 500x500, center at 250)
        self.y = 250  # Center y (canvas is 500x500, center at 250)
        self.angle = 0  # Heading in degrees (0 = right)
        self.pen_down = True
        self.pen_color = 'black'
        self.pen_width = 2
        self._speed = 3  # Speed: 0=fastest, 1=slowest, 3=medium, 6=normal, 10=slow (default 3 for visible animation)
        self._is_visible = True  # Turtle cursor visibility
        self.turtle_size = 30  # Size of turtle cursor (HUGE for visibility)
        self._drawing_history = []  # Store all drawing commands for redrawing
        self._animation_queue = []  # Queue of animation frames
        self._is_animating = False  # Whether animation is in progress
        
    def _get_canvas(self):
        """Get canvas context from JavaScript"""
        try:
            import js
            return js.turtleContext
        except:
            return None
    
    def _clear_and_redraw(self):
        """Clear canvas and redraw all saved drawing commands"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        try:
            import js
            canvas = js.turtleCanvas
            # Clear canvas
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            # Redraw all saved drawings
            for item in self._drawing_history:
                cmd_type = item['type']
                
                if cmd_type == 'line':
                    ctx.beginPath()
                    ctx.moveTo(item['x1'], item['y1'])
                    ctx.lineTo(item['x2'], item['y2'])
                    ctx.strokeStyle = item['color']
                    ctx.lineWidth = item['width']
                    ctx.stroke()
                
                elif cmd_type == 'arc':
                    ctx.beginPath()
                    ctx.arc(item['cx'], item['cy'], item['radius'], 
                           item['start_angle'], item['end_angle'], item['ccw'])
                    ctx.strokeStyle = item['color']
                    ctx.lineWidth = item['width']
                    ctx.stroke()
                
                elif cmd_type == 'dot':
                    ctx.beginPath()
                    ctx.arc(item['x'], item['y'], item['size'] / 2, 0, 2 * math.pi)
                    ctx.fillStyle = item['color']
                    ctx.fill()
                
                elif cmd_type == 'text':
                    ctx.font = item['font']
                    ctx.fillStyle = item['color']
                    ctx.fillText(item['text'], item['x'], item['y'])
        except Exception as e:
            print(f"Error in _clear_and_redraw: {e}")
    
    def _start_animation(self):
        """Start processing animation queue using JavaScript setTimeout"""
        if not self._animation_queue:
            return
        
        if self._is_animating:
            # Animation already running, frames will be processed
            return
        
        self._is_animating = True
        
        try:
            import js
            from pyodide.ffi import create_proxy
            
            def process_frame():
                if not self._animation_queue:
                    self._is_animating = False
                    # Final redraw with turtle cursor if visible
                    self._clear_and_redraw()
                    if self._is_visible:
                        self._draw_turtle()
                    return
                
                # Get next frame
                frame = self._animation_queue.pop(0)
                
                # Update turtle state
                self.x = frame['x']
                self.y = frame['y']
                self.angle = frame['angle']
                
                # Add drawing command to history if present
                if 'draw_cmd' in frame:
                    self._drawing_history.append(frame['draw_cmd'])
                
                # Redraw everything
                self._clear_and_redraw()
                
                # Draw turtle cursor
                if self._is_visible:
                    self._draw_turtle()
                
                # Schedule next frame
                delay = frame.get('delay', 20)
                js.setTimeout(create_proxy(process_frame), delay)
            
            # Start processing
            js.setTimeout(create_proxy(process_frame), 0)
            
        except Exception as e:
            print(f"Animation error: {e}")
            self._is_animating = False
    
    def forward(self, distance):
        """Move turtle forward by distance with animation"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        # Calculate number of steps based on speed
        if self._speed == 0:
            steps = max(10, int(abs(distance) / 3))  # Fast but still visible
        else:
            # More steps for slower speeds (more frames = smoother)
            steps = max(5, int(abs(distance) / 5))
        
        # Calculate step size
        step_distance = distance / steps
        delay = self._get_delay_ms()
        
        # Save starting position
        start_x = self.x
        start_y = self.y
        
        # Calculate radians once
        radians = math.radians(self.angle)
        step_dx = step_distance * math.cos(radians)
        step_dy = -step_distance * math.sin(radians)
        
        # Add animation frames to queue
        current_x = start_x
        current_y = start_y
        
        for i in range(steps):
            # Calculate new position
            new_x = current_x + step_dx
            new_y = current_y + step_dy
            
            # Create animation frame
            frame = {
                'x': new_x,
                'y': new_y,
                'angle': self.angle,
                'delay': delay
            }
            
            # Add drawing command if pen is down
            if self.pen_down:
                frame['draw_cmd'] = {
                    'type': 'line',
                    'x1': current_x,
                    'y1': current_y,
                    'x2': new_x,
                    'y2': new_y,
                    'color': self.pen_color,
                    'width': self.pen_width
                }
            
            self._animation_queue.append(frame)
            
            # Update current position for next iteration
            current_x = new_x
            current_y = new_y
        
        # Update turtle's final position
        self.x = current_x
        self.y = current_y
        
        # Start animation if not already running
        self._start_animation()
    
    def _draw_turtle(self):
        """Draw turtle cursor - always upright, facing direction of movement"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        if not self._is_visible:
            return
        
        try:
            import js
            
            ctx.save()
            ctx.translate(self.x, self.y)
            
            # Determine if turtle should face left or right
            # angle 0° = right, 90° = up, 180° = left, 270° = down
            # If angle is NOT between 90° and 270°, flip it
            normalized_angle = self.angle % 360
            should_flip = normalized_angle <= 90 or normalized_angle >= 270
            
            # Flip horizontally if moving left
            if should_flip:
                ctx.scale(-1, 1)
            
            # Draw turtle emoji (always upright, but flipped left/right)
            emoji_size = self.turtle_size * 1.8
            ctx.font = f"{emoji_size}px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            
            # Draw shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillText("🐢", 2, 2)
            
            # Draw turtle emoji
            ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'
            ctx.fillText("🐢", 0, 0)
            
            ctx.restore()
            
        except Exception as e:
            print(f"❌ Error drawing turtle: {e}")
    
    def _get_delay_ms(self):
        """Get delay in milliseconds based on speed setting"""
        if self._speed == 0:
            return 1  # Fastest
        elif self._speed == 1:
            return 40  # Slowest (32 * 1.25)
        elif self._speed == 2:
            return 30  # (24 * 1.25)
        elif self._speed == 3:
            return 21  # Default (17 * 1.25)
        elif self._speed <= 5:
            return 13  # (10 * 1.25)
        elif self._speed <= 7:
            return 5  # (4 * 1.25)
        elif self._speed <= 10:
            return 4  # (3 * 1.25)
        else:
            return 1
    
    def _sleep(self, ms):
        """Sleep for milliseconds using busy wait"""
        try:
            import time
            start = time.time()
            while (time.time() - start) * 1000 < ms:
                pass
        except:
            pass
    
    def backward(self, distance):
        """Move turtle backward by distance"""
        self.forward(-distance)
    
    def right(self, angle):
        """Turn turtle right by angle degrees"""
        self.angle -= angle
        self.angle %= 360
        
        # Add frame to show rotation
        self._animation_queue.append({
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': self._get_delay_ms()
        })
        self._start_animation()
    
    def left(self, angle):
        """Turn turtle left by angle degrees"""
        self.angle += angle
        self.angle %= 360
        
        # Add frame to show rotation
        self._animation_queue.append({
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': self._get_delay_ms()
        })
        self._start_animation()
    
    def goto(self, x, y):
        """Move turtle to absolute position"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        # Adjust for canvas center (250, 250) - canvas is 500x500
        canvas_x = 250 + x
        canvas_y = 250 - y
        
        # Create animation frame
        frame = {
            'x': canvas_x,
            'y': canvas_y,
            'angle': self.angle,
            'delay': self._get_delay_ms()
        }
        
        if self.pen_down:
            frame['draw_cmd'] = {
                'type': 'line',
                'x1': self.x,
                'y1': self.y,
                'x2': canvas_x,
                'y2': canvas_y,
                'color': self.pen_color,
                'width': self.pen_width
            }
        
        self._animation_queue.append(frame)
        
        self.x = canvas_x
        self.y = canvas_y
        
        self._start_animation()
    
    def setx(self, x):
        """Set x coordinate"""
        self.goto(x, self.y - 250)
    
    def sety(self, y):
        """Set y coordinate"""
        self.goto(self.x - 250, y)
    
    def setheading(self, angle):
        """Set heading to angle degrees"""
        self.angle = angle % 360
    
    def home(self):
        """Move turtle to origin (0, 0) and set heading to 0"""
        self.goto(0, 0)
        self.setheading(0)
    
    def circle(self, radius, extent=360):
        """Draw a circle with given radius - turtle moves along circumference"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        # Calculate number of steps for smooth circle animation
        if self._speed == 0:
            steps = max(20, int(abs(extent) / 10))
        else:
            steps = max(15, int(abs(extent) / 8))
        
        delay = self._get_delay_ms()
        step_angle = extent / steps
        
        # Save starting position
        start_x = self.x
        start_y = self.y
        start_angle = self.angle
        
        # Calculate circle center
        # Center is perpendicular to turtle's current heading, distance = radius
        center_radians = math.radians(self.angle)
        center_x = self.x - radius * math.sin(center_radians)
        center_y = self.y - radius * math.cos(center_radians)
        
        # Draw circle as many small arc segments
        for i in range(steps):
            prev_angle_offset = step_angle * i
            curr_angle_offset = step_angle * (i + 1)
            
            # Calculate arc angles in canvas coordinates
            start_arc = math.radians(90 - start_angle) + math.radians(prev_angle_offset)
            end_arc = math.radians(90 - start_angle) + math.radians(curr_angle_offset)
            
            # Turtle position should be at the END of the current arc segment
            # Use the SAME angle calculation as the arc end point
            next_x = center_x + radius * math.cos(end_arc)
            next_y = center_y + radius * math.sin(end_arc)
            
            # Keep turtle heading constant during animation (don't rotate)
            # Only change heading at the very end
            
            # Create animation frame
            frame = {
                'x': next_x,
                'y': next_y,
                'angle': start_angle,  # Keep original angle, don't rotate during animation
                'delay': delay
            }
            
            if self.pen_down:
                frame['draw_cmd'] = {
                    'type': 'arc',
                    'cx': center_x,
                    'cy': center_y,
                    'radius': abs(radius),
                    'start_angle': start_arc,
                    'end_angle': end_arc,
                    'ccw': radius < 0,
                    'color': self.pen_color,
                    'width': self.pen_width
                }
            
            self._animation_queue.append(frame)
        
        # Update turtle's final position using the same formula
        final_arc_angle = math.radians(90 - start_angle) + math.radians(extent)
        
        if extent == 360:
            self.x = start_x
            self.y = start_y
        else:
            self.x = center_x + radius * math.cos(final_arc_angle)
            self.y = center_y + radius * math.sin(final_arc_angle)
        
        self.angle = (start_angle + extent) % 360
        
        self._start_animation()
    
    def dot(self, size=5, color=None):
        """Draw a dot"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        dot_color = color if color else self.pen_color
        
        frame = {
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': self._get_delay_ms(),
            'draw_cmd': {
                'type': 'dot',
                'x': self.x,
                'y': self.y,
                'size': size,
                'color': dot_color
            }
        }
        
        self._animation_queue.append(frame)
        self._start_animation()
    
    def penup(self):
        """Lift pen up (stop drawing)"""
        self.pen_down = False
    
    def pendown(self):
        """Put pen down (start drawing)"""
        self.pen_down = True
    
    def pensize(self, width):
        """Set pen width"""
        self.pen_width = width
    
    def pencolor(self, color):
        """Set pen color"""
        self.pen_color = color
    
    def color(self, *args):
        """Set pen color (alias for pencolor)"""
        if len(args) == 1:
            self.pencolor(args[0])
        elif len(args) == 3:
            # RGB tuple
            self.pencolor(f'rgb({args[0]},{args[1]},{args[2]})')
    
    def fillcolor(self, color):
        """Set fill color (not implemented in this version)"""
        pass
    
    def begin_fill(self):
        """Begin fill (not implemented in this version)"""
        pass
    
    def end_fill(self):
        """End fill (not implemented in this version)"""
        pass
    
    def clear(self):
        """Clear the canvas"""
        ctx = self._get_canvas()
        if not ctx:
            return
        try:
            import js
            canvas = js.turtleCanvas
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            self._drawing_history = []  # Clear drawing history
            self._animation_queue = []  # Clear animation queue
            self._is_animating = False
            self.home()
            if self._is_visible:
                self._draw_turtle()
        except:
            pass
    
    def reset(self):
        """Clear canvas and reset turtle"""
        # Clear animation queue first
        self._animation_queue = []
        self._is_animating = False
        
        ctx = self._get_canvas()
        if ctx:
            try:
                import js
                canvas = js.turtleCanvas
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            except:
                pass
        self.__init__()
    
    def speed(self, s):
        """Set turtle speed: 0=fastest, 1=slowest, 6=normal, 10=slow"""
        self._speed = max(0, min(10, int(s)))
    
    def hideturtle(self):
        """Hide turtle cursor"""
        self._is_visible = False
        # Add frame to update visibility
        self._animation_queue.append({
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': 0
        })
        self._start_animation()
    
    def showturtle(self):
        """Show turtle cursor"""
        self._is_visible = True
        # Add frame to update visibility
        self._animation_queue.append({
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': 0
        })
        self._start_animation()
    
    def write(self, text, move=False, align="left", font=("Arial", 12, "normal")):
        """Write text at current position"""
        ctx = self._get_canvas()
        if not ctx:
            return
        
        # Parse font
        font_name = font[0] if len(font) > 0 else "Arial"
        font_size = font[1] if len(font) > 1 else 12
        font_style = font[2] if len(font) > 2 else "normal"
        
        # Set font
        font_weight = "bold" if font_style == "bold" else "normal"
        font_str = f"{font_weight} {font_size}px {font_name}"
        
        # Calculate text width for alignment (approximate)
        text_width = len(str(text)) * font_size * 0.6
        
        x_offset = 0
        if align == "center":
            x_offset = -text_width / 2
        elif align == "right":
            x_offset = -text_width
        
        frame = {
            'x': self.x,
            'y': self.y,
            'angle': self.angle,
            'delay': self._get_delay_ms(),
            'draw_cmd': {
                'type': 'text',
                'text': str(text),
                'x': self.x + x_offset,
                'y': self.y + 5,
                'font': font_str,
                'color': self.pen_color
            }
        }
        
        self._animation_queue.append(frame)
        self._start_animation()
    
    # Aliases for common functions
    fd = forward
    bk = backward
    rt = right
    lt = left
    pu = penup
    pd = pendown
    setpos = goto
    setposition = goto
    seth = setheading
    width = pensize
    ht = hideturtle
    st = showturtle

# Create Turtle class for module
class Turtle(TurtleGraphics):
    """Turtle class compatible with standard turtle module"""
    pass

# Create Screen class (simple implementation)
class Screen:
    """Screen class for turtle graphics"""
    def __init__(self):
        self._title = "Turtle Graphics"
        self._bgcolor = "white"
    
    def title(self, text):
        """Set window title"""
        self._title = text
    
    def bgcolor(self, color):
        """Set background color"""
        self._bgcolor = color
        ctx = None
        try:
            import js
            canvas = js.turtleCanvas
            ctx = js.turtleContext
            ctx.fillStyle = color
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        except:
            pass
    
    def setup(self, width=None, height=None):
        """Setup window size (not implemented)"""
        pass
    
    def setworldcoordinates(self, llx, lly, urx, ury):
        """Set world coordinates (not implemented)"""
        pass

# Create default turtle instance
_default_turtle = TurtleGraphics()
_screen = Screen()

# Add classes to module
turtle_module.Turtle = Turtle
turtle_module.Screen = Screen

# Add all turtle methods to module (for direct usage like turtle.forward())
turtle_module.forward = _default_turtle.forward
turtle_module.backward = _default_turtle.backward
turtle_module.right = _default_turtle.right
turtle_module.left = _default_turtle.left
turtle_module.goto = _default_turtle.goto
turtle_module.setx = _default_turtle.setx
turtle_module.sety = _default_turtle.sety
turtle_module.setheading = _default_turtle.setheading
turtle_module.home = _default_turtle.home
turtle_module.circle = _default_turtle.circle
turtle_module.dot = _default_turtle.dot
turtle_module.penup = _default_turtle.penup
turtle_module.pendown = _default_turtle.pendown
turtle_module.pensize = _default_turtle.pensize
turtle_module.pencolor = _default_turtle.pencolor
turtle_module.color = _default_turtle.color
turtle_module.fillcolor = _default_turtle.fillcolor
turtle_module.begin_fill = _default_turtle.begin_fill
turtle_module.end_fill = _default_turtle.end_fill
turtle_module.clear = _default_turtle.clear
turtle_module.reset = _default_turtle.reset
turtle_module.speed = _default_turtle.speed
turtle_module.hideturtle = _default_turtle.hideturtle
turtle_module.showturtle = _default_turtle.showturtle
turtle_module.write = _default_turtle.write
turtle_module.done = lambda: None  # Done not implemented

# Aliases
turtle_module.fd = turtle_module.forward
turtle_module.bk = turtle_module.backward
turtle_module.rt = turtle_module.right
turtle_module.lt = turtle_module.left
turtle_module.pu = turtle_module.penup
turtle_module.pd = turtle_module.pendown
turtle_module.setpos = turtle_module.goto
turtle_module.setposition = turtle_module.goto
turtle_module.seth = turtle_module.setheading
turtle_module.width = turtle_module.pensize
turtle_module.ht = turtle_module.hideturtle
turtle_module.st = turtle_module.showturtle

# Register turtle module in sys.modules
sys.modules['turtle'] = turtle_module

print("🐢 Turtle graphics loaded!")
  `);
}
