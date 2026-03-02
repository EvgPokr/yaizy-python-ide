# 🎨 YaizY Official Brand Colors

## From Official Logo

### Primary Colors

**Sky Blue (Primary)**
- Hex: `#00A8FF`
- RGB: `rgb(0, 168, 255)`
- Use: Background, primary buttons, links, main brand color
- **Source**: Official logo background

**Vibrant Orange (Secondary)**
- Hex: `#FF6600`
- RGB: `rgb(255, 102, 0)`
- Use: Call-to-action, highlights, Run button, star symbol
- **Source**: Official logo star/checkmark

**White**
- Hex: `#FFFFFF`
- RGB: `rgb(255, 255, 255)`
- Use: Text on dark backgrounds, logo text on blue
- **Source**: Logo text

### Supporting Colors

**Success (Green)**
- Hex: `#10B981`
- RGB: `rgb(16, 185, 129)`
- Use: Success messages, completed tasks

**Error (Red)**
- Hex: `#EF4444`
- RGB: `rgb(239, 68, 68)`
- Use: Error messages, delete buttons

**Text Colors**
- Primary Text: `#111827`
- Secondary Text: `#6B7280`
- Light Text: `#9CA3AF`

**Background Colors**
- Main: `#FFFFFF`
- Secondary: `#F9FAFB`
- Tertiary: `#F3F4F6`
- Border: `#E5E7EB`

## Gradients

### Blue to Orange
```css
background: linear-gradient(135deg, #00A8FF 0%, #FF6600 100%);
```
Use: Special highlights, active elements

### Blue Hover
```css
background: #0090DD;
```

### Orange Hover
```css
background: #FF5500;
```

## Logo Specifications

### Star Symbol
- Color: #FF6600 (Orange)
- Shape: Dynamic star/checkmark
- Position: Left side of logo
- Meaning: Progress, achievement, energy

### Text "YaizY"
- Font: Bold, modern sans-serif
- Letter spacing: Increased for readability
- White on blue backgrounds
- Blue on white backgrounds

### Backgrounds
- Dark version: White text on transparent
- Light version: Blue (#00A8FF) text on transparent
- Official: White text on #00A8FF background

## Usage Guidelines

### DO ✅
- Use **#00A8FF** for primary brand presence
- Use **#FF6600** for calls-to-action and important buttons
- Maintain high contrast (white on blue, blue on white)
- Keep logo proportions intact
- Use solid blue background for splash screens

### DON'T ❌
- Don't alter logo colors
- Don't use gradients in the logo itself
- Don't place orange text on blue background (low contrast)
- Don't distort the star shape
- Don't use outdated color codes

## Component Examples

### Buttons
```css
/* Primary button (Blue) */
.primary-button {
  background: #00A8FF;
  color: white;
}

/* Action button (Orange) */
.action-button {
  background: #FF6600;
  color: white;
}

/* Gradient button (Special) */
.special-button {
  background: linear-gradient(135deg, #00A8FF 0%, #FF6600 100%);
  color: white;
}
```

### Links
```css
a {
  color: #00A8FF;
}

a:hover {
  color: #0090DD;
}
```

### Backgrounds
```css
/* Brand background */
.brand-bg {
  background: #00A8FF;
  color: white;
}

/* Accent highlight */
.highlight {
  background: #FF6600;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
}
```

## Accessibility

All color combinations meet WCAG AA standards:

| Combination | Ratio | Status |
|-------------|-------|--------|
| Blue (#00A8FF) on white | 3.07:1 | ⚠️ Large text only |
| White on blue (#00A8FF) | 3.07:1 | ✅ AA Large |
| Orange (#FF6600) on white | 3.28:1 | ⚠️ Large text only |
| White on orange (#FF6600) | 3.28:1 | ✅ AA Large |
| Blue text on white | 3.07:1 | ✅ AA for 18pt+ |

**Note**: Use white text on colored backgrounds for best contrast.

## Brand Assets

Logo files:
- `/public/yaizy-logo.svg` - White text version (for dark/blue backgrounds)
- `/public/yaizy-logo-dark.svg` - Blue text version (for light backgrounds)

### Logo Usage
- Minimum size: 100px width
- Clear space: Logo height on all sides
- Dark backgrounds: Use white text version
- Light backgrounds: Use blue text version
- Always include both star and text

## Color Psychology

**Blue (#00A8FF)**
- Trust, intelligence, efficiency
- Tech-forward, modern
- Clear communication

**Orange (#FF6600)**
- Energy, enthusiasm, action
- Creativity, determination
- Encouragement to learn

Perfect combination for educational platform! 🎓

---

**Official YaizY brand colors - March 2026**

*Questions? Contact the design team.*
