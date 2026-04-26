# DESIGN.md — OmarTheCreative.com
> Current as of March 2026. Source of truth: base.css, index.html, info.html

---

## 1. Headline — Title
Cycling series of five coined words: BROUHAHAHA, FUNISSIMO, HULLABAWHO, PANDEMONEYUM, RAZZZMATAZZZ

```css
.title {
    font-family: 'griffith-gothic-condensed', sans-serif;
    font-size: 15vw;
    line-height: 0.8;
    font-weight: 900;
    text-transform: uppercase;
    color: #bb0006;
    letter-spacing: -0.04em;
    text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
    text-align: left;
    white-space: nowrap;
}
```

Words cycle via typewriter effect with `auger-mono` blinking cursor (`#FF0015`). On interaction, title triggers `vibrate-heavy` animation — `0.15s` infinite, translating ±2px with `#FF0015` text-shadow glitch.

---

## 2. Brand Essence
Pre-med precision meets poetic instinct. Cinematic, Brutalist, Minimal, Sophisticated.

---

## 3. Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#050505` | Primary background, all pages |
| Primary Text | `#FFFFFF` | All body and headline text |
| Display Red | `#bb0006` | Headlines, titles, tagline — restrained authority |
| HUD Red | `#FF0015` | HUD corners, nav hover states, mono tags, cursor ONLY |
| Glow | `rgba(255, 0, 0, 0.8)` | Glow/shadow effects on title |
| Muted | `#666666` | Muted UI, secondary labels |

**Important:** `#bb0006` clears large-text AA compliance (3.02:1 on `#050505`). Not suitable for small body text. `#FF0015` is reserved strictly for HUD elements — do not use for editorial text.

---

## 4. Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display | `griffith-gothic-condensed` | 900/Black | Headlines, section titles |
| Tagline | `lust-stencil-display` | italic | Subtitle/tagline only |
| Body | `freight-text-pro` | 400/Regular | Body copy, cover letter, info page |
| Mono | `auger-mono` | — | UI controls, counters, HUD tags, cursor |
| Serif Accent | `lust-display` | — | Accent serif moments |

Adobe Fonts kit: `https://use.typekit.net/niv4qrq.css`

---

## 5. UI Components (Observatory Style)
- **HUD Corners:** Square corner frames, `#FF0015` — fixed position, pointer-events none
- **Controls:** Square-bordered buttons, `auger-mono` labels, uppercase, `0.55rem`, `letter-spacing: 0.3em`
- **Blinking Cursor:** `auger-mono`, `#FF0015`, `0.6s step-end` blink — appears during typewriter cycling
- **Footer Metadata:** Fixed bottom, `auger-mono`, `0.55rem`, uppercase, `letter-spacing: 0.3em`, opacity `0.8`
- **Film Grain Overlay:** `body::before` fixed, opacity `0.03` — always present

---

## 6. Layout Patterns
- **Full-Width Breakout:** Elements escape container constraints to 100vw
- **100vh Hero:** Centered title + subtitle stack, `15vw` title / `3.5vw` subtitle
- **Subtitle offset:** `margin-top: -1.5vw` — subtitle tucks under title
- **Zigzag Gallery:** Alternating image/text blocks for projects
- **Corner Frame:** Fixed, `top/left/right/bottom: 2rem`, `#FF0015`

---

## 7. Tagline — Subtitle
Revolving animated copy. The fourth phrase cycles through three words via typewriter effect:

`Ideas. Into Copy. Into Scripts. Into [Films / Actions / Sites]. Into Campaigns.`

- **Films** → **Actions** → **Sites** — each word types in, holds, then deletes before the next types in
- Typewriter cursor: `auger-mono`, `#FF0015`, `0.6s step-end` blink — active during type/delete, hidden on hold
- Delete speed: `60ms` per character | Type speed: `90ms` per character | Pause between: `220ms` | Hold duration: `3200ms`

```css
.subtitle {
    font-family: 'lust-stencil-display', serif;
    font-style: italic;
    font-size: 3.5vw;
    color: #FFFFFF;
    margin-top: -1.5vw;
    letter-spacing: -0.01em;
    line-height: 1.1;
    text-align: left;
    white-space: nowrap;
}

.rotating-wrap { position: relative; display: inline-block; }
#rotating-word { display: inline-block; }

.type-cursor {
    position: absolute;
    left: 100%;
    font-family: 'auger-mono', monospace;
    font-style: normal;
    font-size: 0.85em;
    font-weight: 400;
    color: #FF0015;
    opacity: 0;
    margin-left: 2px;
    white-space: nowrap;
    pointer-events: none;
}
.type-cursor.active {
    opacity: 1;
    animation: cursor-blink 0.6s step-end infinite;
}
```

---

## 8. Design System Tokens for Code Generation

```css
:root {
    --bg: #050505;
    --text: #FFFFFF;
    --vibrant-red: #bb0006;        /* Headlines, titles, tagline */
    --vibrant-red-hud: #FF0015;    /* HUD only — corners, nav hover, cursor, mono tags */
    --glow: rgba(255, 0, 0, 0.8);
    --display: 'griffith-gothic-condensed', sans-serif;
    --body: 'freight-text-pro', Georgia, serif;
    --mono: 'auger-mono', monospace;
    --serif: 'lust-display', serif;
}
```
