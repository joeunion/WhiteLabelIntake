# Visual Style Guide: WhiteLabelIntake

**Based on**: Next Level Urgent Care (nextlevelurgentcare.com)

---

## Color Palette

### Primary Brand Colors
| Name            | Hex       | Usage                                      |
|-----------------|-----------|---------------------------------------------|
| Brand Teal      | `#066880` | Primary brand color, CTAs, links, accents   |
| Dark Teal       | `#005A6E` | Hover states, active elements               |
| Black           | `#1A1618` | Headlines, body text, filled buttons        |

### Extended Brand Colors (from Elementor Kit)
| Name            | Hex       | Usage                                      |
|-----------------|-----------|---------------------------------------------|
| Green           | `#61CE70` | Accent color, gradient start                |
| Dark Green      | `#23A455` | Secondary green, success states             |
| Teal Green      | `#008372` | Alternate teal accent                       |
| Blue            | `#007AAC` | Alternate blue accent                       |
| Bright Blue     | `#0071E6` | Bright blue accent                          |
| Cyan Blue       | `#6EC1E4` | Light cyan accent                           |
| Olive Green     | `#799A05` | Tertiary accent                             |
| Red             | `#DA0000` | Alerts, errors, urgent indicators           |

### Neutrals
| Name            | Hex       | Usage                                      |
|-----------------|-----------|---------------------------------------------|
| Off-White       | `#FFFEF9` | Page background                             |
| White           | `#FFFFFF` | Card backgrounds, input backgrounds         |
| Light Gray      | `#F5F4F0` | Section backgrounds                         |
| Card Border     | `#CCCACB` | Card and divider borders                    |
| Medium Gray     | `#575254` | Secondary text, captions, labels            |
| Warm Orange     | `#FFBC7D` | Page transition color, warm accent          |

---

## Typography

### Font Stack
- **Headlines**: `"area-normal", sans-serif` — Weight 600
- **Body**: `"articulat-cf", sans-serif` — Weight 400, line-height 136%
- **Buttons**: `"area-normal", sans-serif` — Bold
- **General/Fallback**: `"Roboto", sans-serif`

### Scale
| Element          | Size     | Weight | Letter-Spacing | Notes                     |
|------------------|----------|--------|----------------|---------------------------|
| Hero Headline    | 80px     | 600    | -6px           | "area-normal", very tight |
| Section Headline | 36-42px  | 600    | -1px           | "area-normal"             |
| Subtitle         | 20-24px  | 600    | normal         | "area-normal"             |
| Body             | 24px     | 400    | normal         | "articulat-cf", 136% line-height |
| Small/Caption    | 14px     | 400    | normal         | Labels, metadata          |
| Nav Links        | 15px     | 500    | normal         | Medium weight             |
| Buttons          | 16px     | bold   | normal         | "area-normal"             |

### Text Colors
- Headlines: `#1A1618` (near-black)
- Body text: `#1A1618` or `#575254` (secondary)
- Links: `#005A9A` (blue) — from live site
- Accent text: Green-to-blue gradient for emphasis words

---

## Gradient Effect (Signature Style)

The brand uses a **green-to-blue text gradient** on key emphasis words (like "delighted" on the homepage):

```css
.gradient-text {
  background: linear-gradient(135deg, #61CE70 0%, #23A455 30%, #008372 60%, #066880 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

The gradient flows from green (`#61CE70`) through teal-green (`#008372`) to brand teal (`#066880`). Use sparingly — only on 1 key word or phrase per section for impact.

---

## Buttons

### Primary (Filled)
- Background: `#1A1618` (black)
- Text: `#FFFFFF`
- Border-radius: `16px`
- Font: 16px "area-normal", bold
- Hover: background becomes transparent, text becomes `#1A1618`

### Secondary (Outlined)
- Background: transparent
- Border: `1.5px solid #1A1618`
- Text: `#1A1618`
- Border-radius: `16px`
- Font: 16px "area-normal", bold
- Hover: fill with `#1A1618`, text becomes `#FFFFFF`

### CTA (Teal)
- Background: `#066880`
- Text: `#FFFFFF`
- Border-radius: `16px`
- Padding: `14px 32px`
- Hover: `#005A6E`

---

## Background Gradient (Signature Style)

The brand uses a **soft, blurred gradient background image** behind hero and key sections. Two diffused color blobs (lime-green and sky-blue) float on the off-white base, creating a gentle, calming, medical-friendly aesthetic.

**Background images:**
- `docs/assets/bg-gradient-desktop.jpg` — wide diagonal gradient stripe (for desktop)
- `docs/assets/bg-gradient-mobile.jpg` — two distinct overlapping blobs (for mobile)

**Usage:**
```css
.hero-background {
  background-color: #FFFEF9;
  background-image: url('/assets/bg-gradient-desktop.jpg');
  background-size: cover;
  background-position: center;
}

@media (max-width: 640px) {
  .hero-background {
    background-image: url('/assets/bg-gradient-mobile.jpg');
  }
}
```

Use on hero sections and key landing areas. The rest of the page uses solid off-white or white backgrounds.

---

## Layout & Spacing

### General Principles
- **Generous whitespace** — let elements breathe
- **Centered content** with max-width of `1140px`
- **Hero sections**: large vertical padding (`120-160px` top/bottom)
- **Section padding**: `80-100px` vertical
- **Content text**: centered, max-width `640px` for readability

### Border Radius
- Cards: `24px`
- Buttons: `16px`
- Input fields: `12px`
- Images: `24px`

### Shadows
- Minimal — prefer flat design with subtle depth
- Cards: `0 2px 12px rgba(0,0,0,0.06)`

---

## Components (Intake Form Specific)

### Form Inputs
- Font: `"articulat-cf"`, 24px
- Background: transparent
- Border: `1.5px solid #CCCACB`
- Border-radius: `12px`
- Padding: `14px 16px`
- Focus border: `#066880`
- Focus shadow: `0 0 0 3px rgba(6,104,128,0.15)`
- Label: `14px`, weight `500`, color `#575254`, positioned above

### Progress Indicator
- Track: `#E8E6E3`
- Fill: `#066880` (teal)
- Step indicators: circles with teal fill for completed, outline for upcoming
- Height: `4px` for track

### Cards
- Background: `#FFFFFF`
- Border: `1px solid #CCCACB`
- Border-radius: `24px`
- Padding: `32px`
- Shadow: `0 2px 12px rgba(0,0,0,0.06)`

---

## Iconography
- Style: Simple, outlined (not filled)
- Stroke width: 1.5-2px
- Size: 20-24px for inline, 32-40px for feature icons
- Color: `#1A1618` or `#066880`

---

## Tone & Voice
- **Professional but warm** — "We're delighted to have you here"
- **Clear and direct** — no medical jargon in patient-facing copy
- **Reassuring** — patients should feel safe and welcomed
- **Concise** — respect the patient's time

---

## Responsive Breakpoints
| Name     | Width     | Notes                          |
|----------|-----------|--------------------------------|
| Mobile   | < 640px   | Single column, stacked layout  |
| Tablet   | 640-1024px| Two columns where appropriate  |
| Desktop  | > 1024px  | Full layout, max-width 1140px  |

---

## Design Dos and Don'ts

**Do:**
- Use plenty of whitespace
- Keep forms simple and focused (one section at a time)
- Use the green-to-blue gradient sparingly for emphasis
- Round corners on everything (cards, buttons, inputs)
- Center-align hero content

**Don't:**
- Clutter the interface — less is more
- Use bright/saturated colors outside the palette
- Use sharp corners (0 border-radius)
- Make text too small — accessibility matters in healthcare
- Overuse the gradient effect
