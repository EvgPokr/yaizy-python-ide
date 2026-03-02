"""
Turtle command interceptor for browser-based rendering.
Captures turtle commands and sends them to frontend via JSON.
"""
import json
import sys

# Turtle state
_turtle_state = {
    'x': 0,
    'y': 0,
    'angle': 0,
    'pen_down': True,
    'pen_color': 'black',
    'pen_size': 3,  # Increased default pen size for better visibility
    'speed': 6,
    'bg_color': 'white',
    'fill_color': None,
    'filling': False,
    'visible': True,
}

def _send_command(cmd_type, **kwargs):
    """Send turtle command to frontend via stdout."""
    command = {
        'type': cmd_type,
        'state': _turtle_state.copy(),
        **kwargs
    }
    # Use special markers for turtle commands
    print(f'\n__TURTLE_CMD__{json.dumps(command)}__TURTLE_CMD__\n', flush=True)

# Movement commands
def forward(distance):
    global _turtle_state
    import math
    rad = math.radians(_turtle_state['angle'])
    new_x = _turtle_state['x'] + distance * math.cos(rad)
    new_y = _turtle_state['y'] + distance * math.sin(rad)
    
    _send_command('move', 
                  from_x=_turtle_state['x'], 
                  from_y=_turtle_state['y'],
                  to_x=new_x,
                  to_y=new_y,
                  draw=_turtle_state['pen_down'])
    
    _turtle_state['x'] = new_x
    _turtle_state['y'] = new_y

def backward(distance):
    forward(-distance)

def right(angle):
    global _turtle_state
    _turtle_state['angle'] = (_turtle_state['angle'] - angle) % 360
    _send_command('rotate', angle=_turtle_state['angle'])

def left(angle):
    right(-angle)

def goto(x, y=None):
    global _turtle_state
    if y is None:
        # goto((x, y)) format
        y = x[1]
        x = x[0]
    
    _send_command('move',
                  from_x=_turtle_state['x'],
                  from_y=_turtle_state['y'],
                  to_x=x,
                  to_y=y,
                  draw=_turtle_state['pen_down'])
    
    _turtle_state['x'] = x
    _turtle_state['y'] = y

def setposition(x, y=None):
    goto(x, y)

def setpos(x, y=None):
    goto(x, y)

def position():
    """Return current turtle position as (x, y) tuple."""
    return (_turtle_state['x'], _turtle_state['y'])

def pos():
    """Return current turtle position as (x, y) tuple."""
    return position()

def setheading(angle):
    global _turtle_state
    _turtle_state['angle'] = angle % 360
    _send_command('rotate', angle=_turtle_state['angle'])

def seth(angle):
    setheading(angle)

# Pen control
def pendown():
    global _turtle_state
    _turtle_state['pen_down'] = True
    _send_command('pen_down')

def penup():
    global _turtle_state
    _turtle_state['pen_down'] = False
    _send_command('pen_up')

def pensize(size=None):
    global _turtle_state
    if size is None:
        return _turtle_state['pen_size']
    _turtle_state['pen_size'] = size
    _send_command('pen_size', size=size)

def width(size=None):
    return pensize(size)

def pencolor(color=None):
    global _turtle_state
    if color is None:
        return _turtle_state['pen_color']
    _turtle_state['pen_color'] = color
    _send_command('pen_color', color=color)

def color(pen_color=None, fill_color=None):
    if pen_color is not None:
        pencolor(pen_color)
    if fill_color is not None:
        fillcolor(fill_color)

# Fill
def fillcolor(color=None):
    global _turtle_state
    if color is None:
        return _turtle_state['fill_color']
    _turtle_state['fill_color'] = color
    _send_command('fill_color', color=color)

def begin_fill():
    global _turtle_state
    _turtle_state['filling'] = True
    _send_command('begin_fill')

def end_fill():
    global _turtle_state
    _turtle_state['filling'] = False
    _send_command('end_fill')

# Screen
def bgcolor(color):
    global _turtle_state
    _turtle_state['bg_color'] = color
    _send_command('bg_color', color=color)

def bgpic(picname):
    pass  # Not supported

def clear():
    _send_command('clear')

def reset():
    global _turtle_state
    _turtle_state = {
        'x': 0, 'y': 0, 'angle': 0,
        'pen_down': True, 'pen_color': 'black',
        'pen_size': 1, 'speed': 6,
        'bg_color': 'white', 'fill_color': None,
        'filling': False, 'visible': True,
    }
    _send_command('reset')

def setup(width=None, height=None, startx=None, starty=None):
    # Canvas size is controlled by frontend, ignore these parameters
    pass

def title(titlestring):
    # Title is shown in frontend header, ignore for now
    pass

# Visibility
def hideturtle():
    global _turtle_state
    _turtle_state['visible'] = False
    _send_command('hide_turtle')

def showturtle():
    global _turtle_state
    _turtle_state['visible'] = True
    _send_command('show_turtle')

# Speed
def speed(s=None):
    global _turtle_state
    if s is None:
        return _turtle_state['speed']
    _turtle_state['speed'] = s
    _send_command('speed', speed=s)

# Circle
def circle(radius, extent=None, steps=None):
    import math
    if extent is None:
        extent = 360
    if steps is None:
        steps = max(12, int(abs(radius) / 2))
    
    _send_command('circle',
                  radius=radius,
                  extent=extent,
                  steps=steps,
                  start_x=_turtle_state['x'],
                  start_y=_turtle_state['y'],
                  start_angle=_turtle_state['angle'])
    
    # Update position
    angle_rad = math.radians(_turtle_state['angle'])
    center_x = _turtle_state['x'] - radius * math.sin(angle_rad)
    center_y = _turtle_state['y'] + radius * math.cos(angle_rad)
    
    extent_rad = math.radians(extent)
    final_angle = (_turtle_state['angle'] + extent) % 360
    final_angle_rad = math.radians(final_angle)
    
    _turtle_state['x'] = center_x + radius * math.sin(final_angle_rad)
    _turtle_state['y'] = center_y - radius * math.cos(final_angle_rad)
    _turtle_state['angle'] = final_angle

# Dot
def dot(size=None, color=None):
    if size is None:
        size = max(_turtle_state['pen_size'] + 4, 2 * _turtle_state['pen_size'])
    if color is None:
        color = _turtle_state['pen_color']
    
    _send_command('dot',
                  x=_turtle_state['x'],
                  y=_turtle_state['y'],
                  size=size,
                  color=color)

# Write text
def write(text, move=False, align="left", font=("Arial", 8, "normal")):
    _send_command('write',
                  text=str(text),
                  x=_turtle_state['x'],
                  y=_turtle_state['y'],
                  align=align,
                  font=font)

# Done/Exit
def done():
    _send_command('done')
    # Don't actually call turtle.done() - it would hang
    # Exit immediately to prevent timeout
    import sys
    sys.exit(0)

def exitonclick():
    done()

# Aliases
fd = forward
bk = backward
back = backward
rt = right
lt = left
pu = penup
pd = pendown
ht = hideturtle
st = showturtle

# Turtle class (singleton pattern - all instances share same state)
class Turtle:
    def __init__(self):
        pass
    
    def forward(self, distance):
        forward(distance)
    
    def backward(self, distance):
        backward(distance)
    
    def right(self, angle):
        right(angle)
    
    def left(self, angle):
        left(angle)
    
    def goto(self, x, y=None):
        goto(x, y)
    
    def setposition(self, x, y=None):
        setposition(x, y)
    
    def setpos(self, x, y=None):
        setpos(x, y)
    
    def position(self):
        return position()
    
    def pos(self):
        return pos()
    
    def setheading(self, angle):
        setheading(angle)
    
    def seth(self, angle):
        seth(angle)
    
    def pendown(self):
        pendown()
    
    def penup(self):
        penup()
    
    def pensize(self, size=None):
        return pensize(size)
    
    def width(self, size=None):
        return width(size)
    
    def pencolor(self, color=None):
        if color is None:
            return pencolor()
        pencolor(color)
    
    def color(self, pen_color=None, fill_color=None):
        color(pen_color, fill_color)
    
    def fillcolor(self, color=None):
        if color is None:
            return fillcolor()
        fillcolor(color)
    
    def begin_fill(self):
        begin_fill()
    
    def end_fill(self):
        end_fill()
    
    def hideturtle(self):
        hideturtle()
    
    def showturtle(self):
        showturtle()
    
    def speed(self, s=None):
        if s is None:
            return speed()
        speed(s)
    
    def circle(self, radius, extent=None, steps=None):
        circle(radius, extent, steps)
    
    def dot(self, size=None, color=None):
        dot(size, color)
    
    def write(self, text, move=False, align="left", font=("Arial", 8, "normal")):
        write(text, move, align, font)
    
    # Aliases
    fd = forward
    bk = backward
    back = backward
    rt = right
    lt = left
    pu = penup
    pd = pendown
    ht = hideturtle
    st = showturtle

# Screen class
class Screen:
    def __init__(self):
        pass
    
    def bgcolor(self, color):
        bgcolor(color)
    
    def clear(self):
        clear()
    
    def reset(self):
        reset()
    
    def setup(self, width=None, height=None, startx=None, starty=None):
        # Ignore setup parameters for now
        pass
    
    def title(self, titlestring):
        # Ignore title
        pass

def getscreen():
    return Screen()

# Initialize
_send_command('init', width=800, height=600)
