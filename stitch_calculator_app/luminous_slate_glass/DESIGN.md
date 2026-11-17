---
name: Luminous Slate Glass
colors:
  surface: '#03161c'
  surface-dim: '#03161c'
  surface-bright: '#293c43'
  surface-container-lowest: '#001017'
  surface-container-low: '#0a1e25'
  surface-container: '#0f2229'
  surface-container-high: '#1a2d34'
  surface-container-highest: '#25373f'
  on-surface: '#d1e6ef'
  on-surface-variant: '#d4c3b8'
  inverse-surface: '#d1e6ef'
  inverse-on-surface: '#20333a'
  outline: '#9d8e84'
  outline-variant: '#50453c'
  surface-tint: '#efbc94'
  primary: '#efbc94'
  on-primary: '#48290c'
  primary-container: '#b58863'
  on-primary-container: '#402306'
  inverse-primary: '#7d5635'
  secondary: '#b8c9d3'
  on-secondary: '#23333a'
  secondary-container: '#394951'
  on-secondary-container: '#a7b8c1'
  tertiary: '#d3c3b9'
  on-tertiary: '#382e28'
  tertiary-container: '#9d8f86'
  on-tertiary-container: '#322922'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#efbc94'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#623f20'
  secondary-fixed: '#d4e5ef'
  secondary-fixed-dim: '#b8c9d3'
  on-secondary-fixed: '#0d1e25'
  on-secondary-fixed-variant: '#394951'
  tertiary-fixed: '#f0dfd5'
  tertiary-fixed-dim: '#d3c3b9'
  on-tertiary-fixed: '#221a14'
  on-tertiary-fixed-variant: '#50453d'
  background: '#03161c'
  on-background: '#d1e6ef'
  surface-variant: '#25373f'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3.5rem
    fontWeight: '500'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 2.5rem
    fontWeight: '400'
    lineHeight: 3rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.375rem
    fontWeight: '500'
    lineHeight: 1.875rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.06em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system blends high-precision technical computing with modern, atmospheric glassmorphism. Designed for students, researchers, engineers, and everyday professionals, it transforms utilitarian calculation into a tactile, sensory experience. 

The aesthetic is anchored in frosted, semi-translucent glass layered over deep midnight gradients and warm ambient glimmers. Visual elements mirror real-world optical glass: precision-beveled edges, inner highlights, deep ambient shadows, and luminous accent glows on interactive states. Precision and clarity govern all layouts, balancing scientific complexity with airy, ergonomic touch surfaces and pill-shaped keypads.

## Colors

The palette is derived directly from the atmospheric slate, terracotta amber, and cream spectrum:

- **Primary (`#B58863` Amber Terracotta):** Used for primary calculation actions, equals (`=`), active toggle indicators, and luminous glows.
- **Secondary (`#3D4D55` Slate Steel):** Used for primary function keys (Trigonometry, Logarithms, Parentheses, Radicals) and active mode surfaces.
- **Tertiary (`#D3C3B9` Soft Sand/Cream):** Highlights text on dark glass, inactive symbol badges, and high-readability digit keys in light mode.
- **Neutral (`#10232A` Deep Midnight Navy) & Obsidian (`#161616`):** Foundational backdrops, canvas base, and ambient shadows.
- **Muted Silver-Grey (`#A79E9C`):** Sub-formulas, secondary notations, degree/radian flags, and inactive state borders.

### Theming
- **Dark Glass Mode (Default):** Canvas sits over a radial gradient from `#10232A` to `#161616` with warm terracotta ambient light leaking from the upper edge. Glass panels use `rgba(61, 77, 85, 0.22)` with white hairline borders (`rgba(211, 195, 185, 0.12)`).
- **Light Glass Mode:** Canvas relies on a warm atmospheric gradient transitioning between `#D3C3B9` and `#A79E9C`. Glass panels use `rgba(255, 255, 255, 0.45)` with soft amber-slate shadows and crisp white specular edges.

## Typography

Typography pairs the technical precision of **Space Grotesk** with the balanced humanist legibility of **Plus Jakarta Sans**. 

- **Space Grotesk** powers calculation outputs, live numerical inputs, scientific symbols (e.g., $\sin$, $\cos$, $\log$, $\pi$), and keypad pill labels. Its tabular spacing qualities ensure mathematical figures align reliably across calculations and variable histories.
- **Plus Jakarta Sans** provides smooth, warm readability for contextual menus, unit conversion titles, memory history readouts, and settings modals.

## Layout & Spacing

The layout model is anchored in an ergonomic, fluid keypad grid wrapped within an isolated glass chassis:

- **Mobile Viewport:** A compact 4-to-5 column layout. Basic arithmetic operations sit adjacent to a sliding or top-collapsible scientific drawer. Keypad rows maintain a tight `0.75rem` (`gutter`) separation to optimize single-hand touch ergonomics.
- **Desktop/Tablet Viewport:** Expands into a dual-chamber interface or an integrated 8-to-10 column scientific array. The calculation ledger (tape history/scratchpad) occupies the right pane, while keypad matrices and matrix tools sit centered or left-aligned within maximum chassis widths (typically `960px` to `1140px`).
- **Rhythm & Touch Density:** Button aspect ratios retain a pill/capsule proportion with minimum hit-targets of $48\times48\text{px}$ on mobile and $56\times56\text{px}$ on desktop. Outer app margins adjust smoothly from `margin: 1rem` on handheld devices to `margin-desktop: 2.5rem`.

## Elevation & Depth

Visual hierarchy uses multi-tiered frosted glassmorphism rather than flat opaque elevation:

1. **Base Surface (Level 0):** Background gradient incorporating dark obsidian (`#161616`) and midnight navy (`#10232A`), highlighted with diffused background radial blurs.
2. **Main Chassis Panel (Level 1):** `backdrop-filter: blur(24px) saturate(160%)`. Background fill uses `rgba(61, 77, 85, 0.16)` bordered with a crisp `1px` translucent edge (`rgba(211, 195, 185, 0.18)`), creating an optical prism effect.
3. **Display Screen Inset (Level 2):** Inset bevel effect using `box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4)` and a slightly darker glass layer `rgba(16, 35, 42, 0.4)` to recede behind the keys.
4. **Keypad Pills & Interactive Components (Level 3):** Frosted pills with `backdrop-filter: blur(12px)`, top-lit borders (`rgba(255, 255, 255, 0.15)` on top edge, `rgba(0, 0, 0, 0.2)` on bottom edge), and soft drop shadows `0 4px 12px rgba(0, 0, 0, 0.25)`.
5. **Active Accent & Operator States (Level 4):** Keys styled with amber terracotta (`#B58863`) incorporate a distinct luminous glow: `box-shadow: 0 0 20px rgba(181, 136, 99, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.4)`.

## Shapes

The design system is defined by capsule and pill geometry (`roundedness: 3`). 

Keypad buttons, mode selectors, angle switch toggles (DEG/RAD), and chip tabs use full pill styling (`border-radius: 9999px` / `rounded-xl`). The overarching calculator chassis and main calculation output window adopt generous corner radiuses (`2rem` / `rounded-lg`) to balance the elongated pill keys while maintaining a sleek, handheld device aesthetic.

## Components

### Calculator Display Monitor
- Encased in a recessed glass slab with an inset perimeter shadow.
- Top row: displays active modes (RAD/DEG, 2nd, M+, Floating Pt) as micro-labels in `#A79E9C`.
- Middle row: historical equation preview in `#D3C3B9` with scrollable overflow.
- Main row: dynamic real-time result in `display-lg` Space Grotesk, brightened with a soft drop-shadow for optical legibility against dark slate.

### Keypad Buttons (Pills)
- **Standard Number Keys:** Neutral dark glass (`rgba(61, 77, 85, 0.25)`), typography in `#D3C3B9`, subtle white border stroke.
- **Scientific Function Keys:** Semi-matte dark slate (`#3D4D55` at 50% opacity), typography in `#A79E9C`, smaller uppercase Space Grotesk.
- **Operator Keys ($+$, $-$, $\times$, $\div$):** Tinted warm slate with accent borders. On active press or selection, transition to subtle amber backlight.
- **Action / Equals Key ($=$):** High-prominence terracotta amber (`#B58863`) fill with white/warm cream numerals and luminous aura glow.
- **Clear / All Clear (C/AC):** Subtle muted terracotta text tone (`#B58863`) on neutral glass to indicate destructive utility without overpowering the canvas.

### Segmented Mode Controls & Chips
- Capsule-shaped segmented toggles for switching between Basic, Scientific, Programmer, and Converter.
- Active segment glides over an elevated glass pill backed with `#3D4D55` and a hairline rim.

### Interactive Inputs & Dropdowns
- Unit conversion selectors and constant pickers ($\pi$, $e$, $c$, $G$) open floating glass cards with `backdrop-filter: blur(32px)`.
- Input fields display glowing amber focus rings (`0 0 0 2px rgba(181, 136, 99, 0.6)`).

### Calculation History Drawer
- Translucent side or slide-over drawer with individual card items denoting past calculations.
- Clicking an entry restores both expression and output into the primary display monitor.