# CLAUDE.md — Archived Progress Logs
> Entries moved here to keep CLAUDE.md under the 40k character limit.
> These changes are fully baked into the codebase — archived for reference only.

## Progress Log (March 14, 2026)
- **Site-wide Rebranding & Hierarchy:**
    - **"THE WORK" → "EXHIBITS":** Unified across all navigation menus.
    - **"DEEP CUTS" → "CHOICE CUTS":** Rebranded all filenames, directories, and internal links.
    - **The Scalpel is 20:20:** New subtitle for Choice Cuts with centered 100vh hero layout.
- **Navigation & UX Evolution:**
    - **Unified [ MENU ]:** High-impact trigger and full-screen overlay (`#apex-menu`).
    - **Zone Crashing Fix:** Restricted hit-zones for BEEFY menu links to center 60%.
    - **ESC Key Focus Hack:** Periodic focus-check logic ensures ESC reliably closes modals and navigates back even when Vimeo iframes steal focus.
    - **Back to Top:** Unified `[ TOP ]` button across all top-level and project pages.
- **Choice Cuts Migration (Cuts 01–05 Complete):**
    - **Inverted Hierarchy:** Headlines are massive focal points (`12vw`); CUT numbers are minimized to sharp HUD mono tags.
    - **Observatory Metadata:** GPS coordinates (Starrett-Lehigh, Easton, Verizon HQ) and Redacted technical blocks.
    - **Refined Pacing:** `30rem` vertical breathing room between project sections.
    - **Editorial Polish:** Disney's Waltograph drop caps and Kraft's two-column teaser layout with red drop caps.
- **Interaction & Feedback:**
    - **Tactile Clipboard (Info):** 150ms vibration pause + scale-down animation, then Ruby Red toast.
    - **Vimeo Loop:** `loop=1` across all landing page and project-page video embeds.

## Progress Log (March 15, 2026)
- **Landing Page (`src/index.html`):**
    - **New high-impact design:** Full-bleed crowd photo, massive `BROUHAHAHA` in Ruby Red Anton, italic serif headline crashing into it intentionally — the tension is the concept.
    - **Bottom nav refined:** Center label changed from `[ TAP FOR EXHIBITS ]` to `[ EXHIBITS ]`; element converted from `<span class="nav-hint">` to `<button id="exhibits-trigger">` — semantically correct as a carousel trigger, not a link.
    - **Unified styling across all breakpoints:** Removed orphaned `.nav-hint` mobile CSS rule that was pulling `[ EXHIBITS ]` out of the footer row. All three bottom nav items now render identically on desktop, tablet, and mobile.

## Progress Log (March 16, 2026)
- **Viewfinder Video Overlay (Complete):**
    - **New file:** `src/video-overlay.css` — all viewfinder styles isolated here, linked from `src/index.html`. Vimeo Player SDK added to `<head>`.
    - **Layout:** Close button top-right (exclusive). Mute and time display at `top: 50%` on opposite sides of the frame. Center controls (rewind/pause/forward) at `bottom: 120px` centered. Progress bar + project name + nav hints in `.bottom-ui-wrapper` at `bottom: 40px`. Frame counter and project nav unified as a connected pair at bottom-right (`[F 001][← 1/7 →]`).
    - **Auto-hide:** Controls fade out after 3s of inactivity, fade in on any mouse move or touch. `startFocusLock()` / `stopFocusLock()` interval keeps keyboard events alive despite Vimeo iframe focus-stealing.
    - **Vimeo UI suppressed:** `controls=0&transparent=0&dnt=1` in iframe URL kills native Vimeo overlays (Unmute prompt, title bar, branding).
    - **Navigation fix:** `handleEscape` was registered on both `window` AND `document` — caused a double-fire where the second call immediately reset the landing to BROUHAHAHA after the first call correctly showed WATCH/LEARN. Fixed by removing the duplicate `document` listener.
    - **ESC/CLOSE behavior:** Returns to that video's WATCH/LEARN state (title, background, and `actionGroup` visible). Does NOT reset to the BROUHAHAHA origin state.
    - **RESTART button:** Lower-left hint renamed from `[ESC] BACK` to `[R] RESTART`. Seeks to 0 and plays. Keyboard shortcut: `R`.
    - **ENTER button:** Toggles details drawer. Keyboard shortcut: `↵`. Focus lock ensures it fires reliably.
    - **Project title fix:** Google project changed from `"GOOGLE PIXEL"` to `"GOOGLE"` — applies to landing title and video overlay metadata tag.
    - **Per-project video scaling:** `videoScale` field on project data applies `transform: scale()` to the iframe. Citi uses `1.35` with `transform-origin: center 40%` to crop closed captioning from the bottom.
    - **Responsive system:** Three breakpoints in `video-overlay.css` — mobile portrait (single control row, time display hidden, compact nav), mobile landscape (all controls hidden, fullscreen video), tablet portrait (scaled-down controls).
    - **Original site reference:** Original Semplice files (`global/global-js-v3.0.js`, `global/global-css-v1.6d.26.css`) are gitignored but locally readable — used to reverse-engineer the mobile control layout and calibration.
