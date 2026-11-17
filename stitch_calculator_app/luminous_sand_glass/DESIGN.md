---
name: Luminous Sand Glass
colors:
  surface: '#fef8f4'
  surface-dim: '#ded9d5'
  surface-bright: '#fef8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ef'
  surface-container: '#f2ede9'
  surface-container-high: '#ece7e3'
  surface-container-highest: '#e6e2de'
  on-surface: '#1d1b19'
  on-surface-variant: '#42484a'
  inverse-surface: '#32302e'
  inverse-on-surface: '#f5f0ec'
  outline: '#73787a'
  outline-variant: '#c2c7ca'
  surface-tint: '#4e6169'
  primary: '#000b10'
  on-primary: '#ffffff'
  primary-container: '#10232a'
  on-primary-container: '#788b94'
  inverse-primary: '#b6cad3'
  secondary: '#7d5635'
  on-secondary: '#ffffff'
  secondary-container: '#fecaa1'
  on-secondary-container: '#795332'
  tertiary: '#000b12'
  on-tertiary: '#ffffff'
  tertiary-container: '#13232a'
  on-tertiary-container: '#7a8b94'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e6ef'
  primary-fixed-dim: '#b6cad3'
  on-primary-fixed: '#0a1e25'
  on-primary-fixed-variant: '#374951'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#efbc94'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#623f20'
  tertiary-fixed: '#d4e5ef'
  tertiary-fixed-dim: '#b8c9d3'
  on-tertiary-fixed: '#0d1e25'
  on-tertiary-fixed-variant: '#394951'
  background: '#fef8f4'
  on-background: '#1d1b19'
  surface-variant: '#e6e2de'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system embodies serene tactility, architectural light, and translucent modernism. Designed for premium lifestyle, elevated architectural software, and editorial SaaS, it prioritizes clarity, organic warmth, and optic depth. The visual language merges high-end organic minimalism with tactile light-mode glassmorphism—avoiding sterile cold greys in favor of sunlit sand, deep marine slate, and terracotta amber.

Interactions evoke physical weight paired with luminous transparency: frosted glassy planes that float effortlessly over soft atmospheric gradients, crisp micro-borders that catch light along structural edges, and deep contrast typography that guarantees effortless legibility.

## Colors

The color palette is derived directly from warm desert dusk and deep coastal slate, balanced for an airy light-mode canvas:

- **Primary Canvas & Backgrounds (`#F4EFEB`, `#EBE4DC`):** Luminous, warm sand neutrals that provide the light source behind translucent layers. Atmospheric backdrops may incorporate subtle radial sweeps shifting toward `#D3C3B9` and `#A79E9C`.
- **Text & High-Contrast Elements (`#10232A`, `#1A2E35`):** Deep oceanic slate-navy for authoritative headline hierarchy, guaranteeing sharp legibility across frosted glass panes.
- **Glass Surfaces & Borders:** Containers use semi-translucent fills (`rgba(255, 255, 255, 0.65)` to `rgba(255, 255, 255, 0.85)`) framed by hairline borders (`rgba(211, 195, 185, 0.45)` to `rgba(255, 255, 255, 0.8)` on top highlight edges).
- **Secondary & Tertiary Accents (`#B58863`, `#3D4D55`, `#7C7573`):** Warm terracotta amber serves as the focal interaction color for primary CTAs, active indicators, and conversion points. Muted warm slate and stone gray handle utility iconography, secondary navigation, and tertiary metadata.

## Typography

Typography relies on **Plus Jakarta Sans** for its geometric balance, contemporary poise, and rounded optical apertures that integrate seamlessly with curved glass surfaces. 

- Large titles leverage tight negative tracking (`-0.02em` to `-0.03em`) and deep slate `#10232A` rendering to command visual hierarchy against translucent panels.
- Body text remains grounded, open, and strictly neutral-warm, maintaining optimal contrast against frosted layers.
- Labels, badges, and micro-actions feature slight positive tracking and medium-to-bold weights to guarantee legibility at small scale.

## Layout & Spacing

The layout structure employs a fluid 12-column grid system on desktop, collapsing to an 8-column layout on tablet, and a 4-column layout on mobile.

- **Desktop (1200px+):** Generous 40px (`2.5rem`) outer canvas margins and 24px (`1.5rem`) gutters allow glass layers to float with sufficient background breathing room.
- **Tablet (768px - 1199px):** 24px gutters with 24px outer margins. Multi-column cards compress into flexible two-column groupings.
- **Mobile (< 768px):** 16px (`1rem`) gutters and canvas padding ensure touch efficiency while preserving panel separation.
- Component padding strictly follows rhythmic modular steps (`space-sm` for inline badges, `space-lg` to `space-xl` for card viewports), ensuring glass containers feel substantial and expansive.

## Elevation & Depth

Visual hierarchy is constructed through multi-layered glass physics rather than opaque shadow stacks:

1. **Base Surface (Ground):** The ambient light foundation (`#F4EFEB`), often rendered with soft warm environmental gradients blending into `#D3C3B9`.
2. **Glass Level 1 (Default Containers & Panels):**
   - Background: `rgba(255, 255, 255, 0.72)`
   - Backdrop Blur: `20px` (with `saturate(140%)` for optic clarity)
   - Border: `1px solid rgba(211, 195, 185, 0.5)` with an interior highlight inset `0 1px 0 0 rgba(255, 255, 255, 0.8)`
   - Shadow: `0 12px 32px -4px rgba(16, 35, 42, 0.06), 0 4px 12px -2px rgba(16, 35, 42, 0.03)`
3. **Glass Level 2 (Floating Modals, Flyouts & Menus):**
   - Background: `rgba(255, 255, 255, 0.88)`
   - Backdrop Blur: `32px`
   - Border: `1px solid rgba(255, 255, 255, 0.9)`
   - Shadow: `0 24px 48px -8px rgba(16, 35, 42, 0.12), 0 8px 16px -4px rgba(16, 35, 42, 0.04)`
4. **Interactive Glass State (Hover & Active):**
   - On hover, cards transition to `rgba(255, 255, 255, 0.82)`, elevating slightly with an intensified warm ambient tint `rgba(181, 136, 99, 0.12)`.

## Shapes

The design system adopts a Pill-shaped (`roundedness: 3`) geometry directly inspired by the smooth, rounded glass capsules in the visual foundation:

- **Buttons, Chips, and Form Fields:** Fully rounded stadium/pill contours (`9999px`) provide sleek tactile ergonomics.
- **Surface Cards & Window Containers:** Large softened radii (`rounded-xl: 3rem` / `48px` or `rounded-lg: 2rem` / `32px`), giving structural boundaries the appearance of smoothed river glass.
- **Nested Inner Containers:** Proportionately reduced radius (`1rem` / `16px`) ensuring concentric visual harmony within larger capsules.

## Components

- **Buttons:**
  - *Primary Button:* Solid terracotta amber (`#B58863`) with white text (`#FFFFFF`), styled in a pill shape with an ambient warm glow shadow `0 6px 18px rgba(181, 136, 99, 0.35)`.
  - *Secondary Button (Glass Action):* Translucent white (`rgba(255, 255, 255, 0.75)`), border `1px solid rgba(211, 195, 185, 0.6)`, text `#10232A`. Hover transitions fill to `rgba(255, 255, 255, 0.95)`.
  - *Ghost Button:* Transparent with `#3D4D55` text, active under ambient hover.

- **Cards & Surface Containers:**
  - Double-radiused pill-inspired rounded containers (`32px` to `48px`), frosted translucent white glass fill, subtle 1px border with a soft sunlit top edge.

- **Chips & Tags:**
  - Frosted capsule pills with `8px 16px` padding. Default state uses `rgba(255, 255, 255, 0.6)` with text `#3D4D55`. Active state uses warm amber tint `rgba(181, 136, 99, 0.15)` with border `#B58863` and text `#B58863`.

- **Input Fields:**
  - Height `48px`, full pill radius (`9999px`), frosted base `rgba(255, 255, 255, 0.6)`, hairline boundary `#D3C3B9`. On focus: `rgba(255, 255, 255, 0.95)`, border `#B58863`, and a diffused ring `0 0 0 3px rgba(181, 136, 99, 0.2)`.

- **Checkboxes & Radios:**
  - Radio circles and softened square checkboxes (`rounded: 6px`) in frosted glass with deep slate `#10232A` checks or terracotta `#B58863` fills when active.

- **Segmented Controls & Glass Navigation Bars:**
  - Floating frosted docks with `rgba(255, 255, 255, 0.65)` fill and `backdrop-filter: blur(24px)`. Active segments utilize a crisp white elevated pill slider with soft ambient shadow.