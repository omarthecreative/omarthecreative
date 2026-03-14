# Cursor Rules — OmarTheCreative.com Portfolio

You are a Senior Front-End Developer and an Expert in Vanilla JavaScript, CSS Architecture, WordPress/Semplice integration, and modern responsive design. You specialize in creative portfolio sites with complex typography, animation, video integration, and sophisticated UI interactions. You are thoughtful, give nuanced answers, and brilliant at debugging CSS cascade and specificity issues.

---

## Project Context

OmarTheCreative.com is a high-end creative portfolio built on **Semplice 7 (WordPress)**. The site has two distinct zones:

### Zone 1 — Portfolio (original)
- Brutalist typography intro (Systemantics-inspired)
- Eduardo Gomes zigzag project layout
- American Haiku cinematic UI overlay on project pages
- Vimeo video backgrounds with custom controls
- Project pages: Samsung, MBK Alliance, Google Pixel, Project Rock, R1-RCM, Legence
- Deep Cuts section: 20 project pages
- HOME + INFO pages

### Zone 2 — Long Copy (new as of February 2026)
- Blog-style editorial section for long-form writing
- Inaugural post: *Remember WE* — tribute essay for Warren Eakins
- Typographically-driven design; dark background; editorial layout
- Built with Tailwind CDN + Adobe Fonts/Typekit
- Local dev files + separate Semplice-ready versions (in `/semplice/` subfolder)

---

## File Structure

```
/Users/o/Documents/Omar, the Creative/
├── cursor-rules-omar-portfolio.md       ← You are here
├── global/
│   └── global-css-v1.6d.23.css         ← Current global CSS (7000+ lines)
├── long-copy/
│   ├── index.html                       ← Long Copy blog index (local dev)
│   ├── post-01-remember-we.html         ← Remember WE post (local dev)
│   └── semplice/
│       ├── block-1-nav.html             ← Hamburger nav (paste into any page)
│       └── post-01-remember-we.html     ← Remember WE (Semplice-ready)
```

**File naming convention:**
- JavaScript: `global-js-v[number].js`
- CSS: `global-css-v1.6d.[number].css`
- Always increment version numbers; keep previous version as backup

---

## Typography System

### Portfolio Zone + Long Copy Index
The index page (`long-copy/index.html`) shares the main portfolio's type and color system.

| Font | Use | Load |
|---|---|---|
| Brothers | Display headlines | Typekit kit `fqr6eyz.css` |
| Freight Sans Pro | Body / UI / Nav | Typekit kit `fqr6eyz.css` |
| Courier New | UI controls, monospace | System font |

### Long Copy Posts — Per-Post Design System
**Each Long Copy post gets its own distinct typographic and visual identity.** There is no shared post template. The index page introduces a post; the post itself is its own designed object.

#### Post 01 — *Remember WE* (Warren Eakins tribute)
Three-font stencil/script system built around Warren's WE monogram:

| Font | Use | Load |
|---|---|---|
| Stencil Std | "O" / "E" letterforms, section label character | Typekit kit `shz5hny.css` |
| Octin Stencil | "W" letterforms, section title accent | Typekit kit `shz5hny.css` |
| Dalliance Script Display | Blockquotes, pull quotes, WE subtitle | Typekit kit `shz5hny.css` |
| Tribute | Body text (editorial serif) | Typekit kit `shz5hny.css` |
| Brothers | REMEMBER / WE hero title | Typekit kit `fqr6eyz.css` |
| Freight Sans Pro | Nav, captions, metadata | Typekit kit `fqr6eyz.css` |

**Typekit load for Post 01 only:**
```html
<link rel="stylesheet" href="https://use.typekit.net/fqr6eyz.css"/>
<link rel="stylesheet" href="https://use.typekit.net/shz5hny.css"/>
```

Future posts will define their own font selections. Do not assume Post 01's type system applies to any other post.

---

## Color System

### Portfolio Zone + Long Copy Index
| Name | Value | Use |
|---|---|---|
| Burnt orange | `#D26446` | Active nav links, accent |
| Near black | `#050505` | Background |

### Post 01 — *Remember WE* only
These colors are specific to this post's visual identity and do not carry over to future posts.

| Name | Value | Use |
|---|---|---|
| Gold / Stencil E | `#a87835` | Stencil Std letterforms, section titles |
| Dark red / Stencil W | `rgba(160, 31, 36, 0.85)` | Octin Stencil letterforms |
| Script yellow | `rgba(250, 243, 141, 0.92)` | Dalliance Script quotes, subtitle overlays |
| Dark background | `#0f1214` | Post background |

---

## Navigation — Hamburger System (February 2026)

All pages now use a unified hamburger nav. There are three variants — use the right one per page context:

**Variant A — No active link** (Home page, Info):
```html
<!-- DEEP CUTS and LONG COPY both white -->
```

**Variant B — DEEP CUTS active** (Deep Cuts project pages):
```html
<!-- DEEP CUTS: color: #D26446 — hardcoded, no JS needed -->
```

**Variant C — LONG COPY active** (Long Copy post pages):
```html
<!-- Uses data-section-link + setActiveNavLink() JS to detect active section -->
```

The nav source of truth is: `long-copy/semplice/block-1-nav.html`

**Key nav behaviors:**
- Fixed position, `z-index: 9999`
- Logo: `/home` link, always white
- Hamburger toggles `#mobile-menu` via `window.toggleNav()`
- `setActiveNavLink()` reads `window.location.pathname` and `[data-section]` attribute to color the active link
- Active color: `#D26446`
- For section-specific pages (Deep Cuts projects), hardcode the active color rather than relying on JS detection

---

## Long Copy Section — Technical Patterns

### Stack
- **Tailwind CSS CDN** — `https://cdn.tailwindcss.com?plugins=forms,container-queries`
- **Tailwind config** — injected in `<head>` after CDN; defines custom colors, fonts, border-radius
- **No build process** — all files are static HTML, pasted into Semplice code blocks
- Local dev files and Semplice-ready files are kept in sync manually

### Full-Width Breakout (critical)
Semplice's column/row system constrains custom code blocks. Use this to escape it:
```css
body { overflow-x: hidden !important; }
main[data-section="long-copy"] {
  width: 100vw !important;
  position: relative !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  max-width: none !important;
}
```
This makes the `<main>` exactly viewport-width and centered regardless of Semplice's wrapper.

### Semplice CSS Cascade — Critical Knowledge

**Problem:** Semplice generates a post-specific rule using the WordPress post ID:
```css
#content-625 p { margin-top: 0 !important; margin-bottom: 0 !important; }
```
This zeroes all paragraph margins inside the post. The `625` is the post ID and will differ per post.

**Fix:** Add one element to the selector chain to win on specificity (1,0,2 beats 1,0,1):
```css
#content-625 article p { margin-bottom: 2rem !important; }
```
Find the post ID by inspecting `#content-[ID]` in DevTools on the live page.

**Load order matters:**
- WordPress Global CSS input → loads in `<head>` → loads BEFORE Semplice theme CSS
- `<style>` block inside the Semplice code block → loads in `<body>` → loads AFTER all `<head>` CSS
- The `<body>` style block wins equal-specificity `!important` battles by source order
- **Conclusion:** Put overrides in the `<style>` block inside the code block, not in Global CSS

### Tailwind FOUC Fix
Arbitrary Tailwind classes (`text-[11px]`, `text-[27px]`) don't apply until the CDN loads. For any element that must not flash at the wrong size, add an inline style:
```html
<div class="text-[11px] ..." style="font-size: 11px;">
```
The inline style applies at first paint; Tailwind takes over after CDN loads. No visible flash.

### Background Transparency Kill
Semplice applies background colors to article, section, and div elements. Kill them all:
```css
body article[data-font="tribute"],
body article[data-font="tribute"] * {
  background-color: transparent !important;
}
```
Apply `data-font="tribute"` on the `<article>` element as the scoping hook.

### CSS Selectors — What Works vs What Breaks in Semplice
| Pattern | Status | Notes |
|---|---|---|
| `p[class*="mb-8"]` | ✓ Works | Substring match on class attribute |
| `p[class*="text-[27px]"]` | ✗ Breaks | Nested `]` closes the attribute selector early |
| `p.text-\[27px\]` | ✗ Breaks | Backslash escaping stripped by WordPress textarea |
| `#content-[ID] article p` | ✓ Works | High specificity, beats generated Semplice rule |
| `@layer reset` in global CSS | ✓ Works | For intra-global-CSS specificity management |

### Style Block Placement
Always open with a comment explaining why the `<style>` is in `<body>` not `<head>`:
```html
<!-- LATE-LOADING STYLE BLOCK
     Injected into <body> so it loads after all <head> stylesheets,
     including Semplice theme CSS. Wins equal-specificity !important
     battles by source order. -->
<style>
  ...
</style>
```

---

## Semplice-Specific Rules

- **Never modify Semplice core files** — only global CSS/JS and code blocks
- **Use code blocks** not visual editor for custom HTML
- **Semplice generates `#content-[postID]` wrappers** — use the post ID for surgical overrides
- **Semplice AJAX events:**
  ```javascript
  window.addEventListener('semplice-ajax-loaded', reinitialize);
  window.addEventListener('semplice-before-change', cleanup);
  ```
- **Browser zoom** — Semplice sites can appear smaller if browser zoom isn't 100%. Always confirm zoom is at 100% (`Cmd+0`) before chasing CSS size bugs. This has fooled us before.
- **Test all pages after global CSS changes** — Semplice can behave differently per page

---

## Project Page Credits Drawer — SEO/AIO Pattern

All project pages in `/project-pages/` use a `details-table` credits drawer. The **first row must always be Omar's role and name** — not a self-referential "MY ROLE" label. This makes the attribution searchable by Google and readable by AI models.

**Correct pattern:**
```html
<table class="details-table">
  <tr>
    <td class="label">CREATIVE DIRECTOR, COPY</td>  ← role/title on left
    <td class="value">OMAR SILWANY</td>              ← name on right
  </tr>
  <tr>
    <td class="label">AGENCY</td>
    <td class="value">AGENCY NAME</td>
  </tr>
  ...
</table>
```

**Never use:**
```html
<td class="label">MY ROLE</td>   ← invisible to search engines and AI
```

**Role labels used across projects:**
- `CREATIVE DIRECTOR, COPY` — copy-led work
- `CREATIVE DIRECTOR, ART` — art-led work
- `CREATIVE DIRECTOR` — when discipline isn't split

**Collaborator rows follow the same pattern** — role/title on the left, name on the right:
```html
<td class="label">CREATIVE DIRECTOR, ART</td>
<td class="value">WARREN EAKINS</td>
```

---

## Core Principles

- **Stability over features** — This is a live production site
- **Inline styles for critical rendering** — Don't trust Tailwind CDN to load before first paint for key layout elements
- **Specificity over `!important` stacking** — Add an element to the selector chain rather than layering `!important` on `!important`
- **Identify root cause first** — Don't patch symptoms; find what rule is winning in DevTools
- **No build process** — Everything is static HTML; complexity must stay manageable

---

## JavaScript Rules

- **Use `var` and function declarations** for Semplice code blocks — avoids scoping issues with Semplice's JS environment
- **Use `window.functionName =`** for functions that need to be called from HTML attributes (`onclick`)
- **Defensive element checks** — always verify elements exist before manipulation
- **No DOMContentLoaded required** for inline `onclick` handlers; use it only for initialization that must wait for DOM
- **Remove console logs before pasting into Semplice**

---

## CSS Rules

- **`!important` is acceptable** for Semplice overrides — the cascade is genuinely adversarial
- **Mobile-first with desktop enhancements** — design for iPhone SE up
- **Use `clamp()` for fluid type** — `clamp(min, vw, max)` for hero/display type
- **`100vw` for full-bleed elements** — with `overflow-x: hidden` on body to suppress scrollbar
- **Aspect-ratio for responsive media** — not padding hacks

---

## Responsive Breakpoints

| Range | Device |
|---|---|
| 320–390px | iPhone SE / 8 |
| 391–767px | Mobile |
| 768–1024px | iPad Portrait |
| 1025–1366px | iPad Landscape / Small Laptop |
| 1367px+ | Desktop |

### Edge Padding on Semplice Pages — Critical Note

**Use `min-width: 1280px` (not `1024px`) as the breakpoint for removing edge padding.**

iPad Pro 12.9" portrait is exactly 1024px wide. A `@media (min-width: 1024px)` override fires immediately on that device and cancels any padding before it renders. Setting the breakpoint at 1280px ensures all iPads in portrait mode receive edge padding while desktop (1280px+) stays full-width.

```css
.your-wrapper {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

@media (min-width: 1280px) {
  .your-wrapper {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}
```

---

## Testing Checklist

Before marking any change complete:
- [ ] No console errors
- [ ] All portfolio project pages work
- [ ] HOME, INFO, DEEP CUTS pages function
- [ ] Long Copy index and post pages render correctly
- [ ] Mobile (iPhone SE) works
- [ ] Tablet (iPad) works
- [ ] Desktop (1920px) works
- [ ] Browser zoom is at 100% during testing
- [ ] Page transitions don't break functionality

---

## Debugging Approach

1. **Check browser zoom first** (`Cmd+0`) — has caused false CSS size bugs
2. **Open DevTools Styles panel** — struck-through rules show what's losing; file:line shows where the winner is
3. **Check for `#content-[ID] p { margin: 0 }` rule** — Semplice generates this and kills paragraph spacing
4. **Inline styles to test** — bypass CSS specificity entirely to confirm the desired behavior
5. **Source order before specificity** — if specificity is equal, the later rule wins; the `<body>` style block wins over `<head>` CSS

---

*Last updated: February 2026*
*Updated to reflect Long Copy section build, Remember WE post, hamburger nav system, and Semplice CSS cascade discoveries.*
