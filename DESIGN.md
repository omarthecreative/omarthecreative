# DESIGN.md — OmarTheCreative.com

## 1. Brand Essence
Pre-med precision meets poetic instinct. Cinematic, Brutalist, Minimal, Sophisticated.

## 2. Color Palette
- **Near Black:** `#050505` (Primary Background)
- **White:** `#FFFFFF` (Primary Text)
- **Burnt Orange:** `#D26446` (Accents, Progress, Interactive)
- **Grey:** `#666666` (Muted UI for high-contrast scenarios)

## 3. Typography
- **Display:** "Brothers" (900/Black) — Used for high-impact headlines and project titles.
- **Primary:** "Freight Sans Pro" (300/Light, 400/Regular) — Used for body, nav, and CV data.
- **Mono:** "Courier New" — Used for UI controls, counters, and technical data.

## 4. UI Components (American Haiku Style)
- **Viewfinder:** Centered controls, progress bar spanning viewport.
- **Controls:** Square-bordered buttons with monospace labels.
- **Meta:** Role/Year data in the bottom-left/right corners.

## 5. Layout Patterns
- **Full-Width Breakout:** Elements must escape Semplice constraints to be 100vw.
- **Zigzag Gallery:** Alternating image/text blocks for projects.

## 6. Design System Notes for Stitch Generation
**IMPORTANT:** Always use these specific tokens when generating pages:
- Background: `#050505`
- Accent: `#D26446`
- Header Font: "Brothers", sans-serif (900)
- Body Font: "freight-sans-pro", sans-serif (300/400)
- UI Font: "Courier New", monospace
- Navigation: 11px uppercase, 1.5px letter-spacing
