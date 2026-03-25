# GEMINI.md — Project Context for Omar, the Creative

## Project Status
- **Last Updated:** March 23, 2026
- **Current Task:** Site Promotion Phase — First social posts live. Resume/cover letter redesign next.

## Progress Log (March 14, 2026)
- **Site-wide Rebranding & Hierarchy:**
    *   **"THE WORK" → "EXHIBITS":** Unified across all navigation menus to align with the Observatory theme.
    *   **"DEEP CUTS" → "CHOICE CUTS":** Rebranded all filenames, directories, and internal links.
    *   **The Scalpel is 20:20:** Established new subtitle for Choice Cuts with centered 100vh hero layout.
- **Navigation & UX Evolution:**
    *   **Unified [ MENU ]:** Replaced individual nav links with a high-impact trigger and full-screen overlay (`#apex-menu`).
    *   **Zone Crashing Fix:** Restricted hit-zones for BEEFY menu links to the center 60% only, preventing overlapping link zones.
    *   **Focus Hack:** Implemented periodic focus-check logic to ensure the **ESC** key reliably closes modals and navigates back, even when Vimeo iframes steal focus.
    *   **Back to Top:** Unified the `[ TOP ]` button and visibility logic across all top-level and project pages.
- **Choice Cuts Migration (Exhibits 01-05):**
    *   **Inverted Hierarchy:** Headlines are now massive focal points (`12vw`); CUT numbers are minimized to sharp HUD mono tags.
    *   **Observatory Metadata:** Injected GPS coordinates (Starrett-Lehigh, Easton, Verizon HQ) and Redacted technical blocks (Verizon).
    *   **Refined Pacing:** Added massive `30rem` vertical breathing room between project sections.
    *   **Editorial Polish:** Restored Disney's Waltograph drop caps and Kraft's two-column teaser layout with red drop caps.
- **Interaction & Feedback:**
    *   **Tactile Clipboard (Info):** Enhanced email copy with a 150ms vibration pause and scale-down animation for physical feedback, followed by a Ruby Red toast.
    *   **Vimeo Loop:** Enabled `loop=1` across all landing page and project-page video embeds.

## Progress Log (March 15, 2026)
- **Choice Cuts Batch Migration (Complete: 21/21):**
    *   **Full Integration:** Migrated and integrated the remaining 16 projects (Cut 06: Johnnie Walker Conquista through Cut 21: Project Rock).
    *   **Standardized Layout:** Applied the Observatory 100vh centered hero and metadata HUDs across the entire collection.
- **Landing Page (`src/index.html`):**
    *   **New high-impact design:** Full-bleed crowd photo, massive `BROUHAHAHA` in Ruby Red Anton, italic serif headline crashing into it intentionally — the tension is the concept.
    *   **Bottom nav refined:** Center label changed from `[ TAP FOR EXHIBITS ]` to `[ EXHIBITS ]`; element converted from `<span class="nav-hint">` to `<button id="exhibits-trigger">` — semantically correct as a carousel trigger, not a link.
    *   **Unified styling across all breakpoints:** Removed orphaned `.nav-hint` mobile CSS rule that was pulling `[ EXHIBITS ]` out of the footer row. All three bottom nav items now render identically on desktop, tablet, and mobile.
- **System & Security:**
    *   **Git Scrub:** Removed `GEMINI.md` and `CLAUDE.md` from remote tracking to keep internal logs local-only.

## Progress Log (March 16, 2026)
- **Cinematic Refinement (Locked Backgrounds):**
    *   **Pattern Rollout:** Successfully implemented the fixed-position full-screen background pattern across several Choice Cuts projects.
    *   **Honda Hybrids:** Replaced failing AI background with a custom prompt-driven grass/wildflower image. Scaled down teaser asset to `half-width`.
    *   **Bentley Studio:** Restored original manifesto in full; typeset with high-impact line-height and massive `5rem` Anton "LUXURY UNBOUND".
    *   **Audi Truth Be Bold:** Implemented "Big Wave" locked background (real photograph via reference prompt). Padded intro lines to match the Bentley "landing" rhythm.
    *   **Stoli Night Edition:** Implemented "Predatory Green" background. Updated credits to include Sam Resta and Megan Treme. Padded intro lines for impact.
- **Copyright & HUD System Unification:**
    *   **Conditional Positioning:** Tied copyright behavior to the existence of the `corner-frame`. Fixed position for framed pages (Landing, Info, Projects); scrolling for frameless (Choice Cuts/Long Copy index).
    *   **Layout Fixes:** Resolved Landing page "jamming" by moving the copyright outside the flex container; removed extra top padding to restore original marquee height.
    *   **HUD Calibration:** Dimmed the `#lut-toggle` (box and copy) to `0.3` opacity to prevent glare/distraction while keeping all other HUD elements bright.
- **INFO Page Transformation:**
    *   **Observatory Aesthetic:** Successfully transitioned `src/info.html` to the full Observatory theme.
    *   **Tablet UX:** Increased horizontal padding to `4rem` for tablet viewports to fix edge-crashing issues.
    *   **Tactile Redaction:** Applied decorative red strips and a clickable redacted link for "Meanwhile In Jupiter."
- **System Maintenance:**
    *   **Asset Cleanup:** Purged unused Honda background assets from `src/assets/`.
- **Video Controls Restoration (COMPLETE):**
    *   **Status:** Viewfinder overlay successfully built and calibrated in `src/video-overlay.css`.
    *   **Root cause of previous failure:** CSS file was never linked to `index.html`, and the Vimeo Player SDK was not loaded. Inline CSS in `<style>` was also overriding the external file.
    *   **Outcome:** All controls rendering correctly. See March 16 log below for full detail.
- **Git:** 
    *   Committed all cinematic refinements, HUD calibrations, and INFO page updates.

## Progress Log (March 18, 2026) — Title Treatments Rollout

### background-clip:text — Applied Across 15 Choice Cuts Pages

**Image-in-type (photo clipped to letterforms):**
- **LUV MOVES ME** — bokeh/hands image. `white-space: nowrap` to keep on one line.
- **TRUTH BE BOLD** — big wave image. `background-size: 105%`; `background-position: center 25%` to clear the surfer.
- **NATURALLY DRIVEN** — grass/flowers tiled at `40%` with repeat for dense texture. `white-space: nowrap`. `rgba(255,255,255,0.15)` white overlay to brighten.
- **ILLUMINATE YOUR NIGHT** — night image. `<br>` removed; all three words on one line. `white-space: nowrap`.
- **FOR EVERY PHOTONISTA** — Nathalie/camera image. `background-position: center top`.
- **VISIONARY EXPERIENCE** — infinite grid. `white-space: nowrap`.
- **DISH** — bread texture (`bread-texture.png`, generated via Google Flow from DIRECTOR prompt).
- **WEST OF EXPECTED (Skyy)** — flipped image (`skyy-vodka-bg-flipped.png`). `auto 200% / center 100%`.
- **AMPLIFY** — font-size pushed to `18vw` (from 12vw). `white-space: nowrap`.

**Gradient treatments:**
- **CONQUISTA LA NOCHE** — liquid whisky amber: `#8B4500 → #F0A828 → #C08818`.
- **WINDOW WONDERLAND** — vivid purple: `#7B2FBE → #C040F0 → #9B20D8`.
- **DROIDS** (renamed from INTERSTELLAR) — steel chrome: `#D0D0D0 → #888888 → #404040`. Renamed because Droid names come from constellations — cosmic video and title agree on origin story, not atmosphere.
- **SAPPHIRE, SLATE, INK, LIQUID** — named-color gradient left-to-right: sapphire `#0F52BA` → slate `#708090` → ink `#1C1C2E` → liquid `#C8CAD4`.
- **BE OUR GUEST** — dark Cinderella blue: `#1E4A78 → #3A72B0 → #2A5A94`.

**Other treatments:**
- **WE ARE THE ONES** — translucent ghost type: `color: rgba(255,255,255,0.18)`. Image-in-type reverted — stone texture was illegible.
- **PROJECT ROCK** — page background stripped to `#050505`. DJ Red image in title carries the page solo.

### SVG flip approach — confirmed dead end
SVG files used as CSS `background-image` are sandboxed by the browser — cannot load external PNG references. Always use ffmpeg/ImageMagick to create flipped image files instead.

## Progress Log (March 18, 2026) — Skyy Vodka — Flipped Background-Clip Title
- **Technique:** `background-clip: text` on `WEST OF EXPECTED` uses a vertically flipped version of the background image (`skyy-vodka-bg-flipped.png`) — created via `ffmpeg -vf vflip`.
- **Effect:** Horizon divides the two title rows. WEST OF = warm inverted coast. EXPECTED = deep blue sky. The type image argues with the background image — same landscape, opposite orientation.
- **Sizing:** `background-size: auto 200%; background-position: center 100%` — scales by height for vertical control, positions to land ocean/sky in the letterforms.
- **Note:** SVG wrapper approach fails — browser sandboxes SVG used as `background-image`, blocks external PNG references. ffmpeg flip is the correct solution.

### Guinness Amplify — AMPLIFY Heading Fix
- **`white-space: nowrap`** — prevents Y from wrapping.
- **`max-width: 100%` removed** — was causing right-side clipping against `nowrap`.
- **`.title-kerning-fy` letter-spacing:** Reset to `-0.04em` — was `0.15em`, pushing Y too far from F.

## Technical Decisions
- **Color:** Unified on Ruby Red (`#FF0000`) for all accents and HUD elements.
- **Typography:** Production Adobe Fonts kit `niv4qrq` — Griffith Gothic Condensed (display), Auger Mono Light (HUD), Lust Display (serif italic). Original project fonts (Titan One, Waltograph) preserved where they define the campaign's soul. `remember-we.html` excluded — standalone typographic system.
- **Layout:** Centered `100vh` Hero and Intro sections are now the standard for all Choice Cuts projects.

## Critical Gotchas

**Netlify build (active work):**
- `objectPosition`: lower % = image shifts right; higher % = image shifts left
- iOS Safari: don't use `animation: var(--token)` shorthand — expand to individual `animation-*` properties
- ESC key / focus: Vimeo iframes steal focus — apply periodic focus-check logic on any page with embeds
- `background-position` X axis: higher % moves image LEFT (shows more of right side); lower % moves image RIGHT (shows more of left side). Counter-intuitive — double-check direction before iterating.
- `background-position` Y axis: higher % moves image UP (shows lower portion); lower % moves image DOWN (shows upper portion). "Slide up" = increase Y%.
- Mobile portrait background sizing: `background-size: cover` makes image height = viewport height — no vertical room to reposition. Use `auto 150%` (or similar height %) to create vertical slack for `background-position` to work.
- `background-repeat: no-repeat` must be set explicitly on `.project-bg` — default is `repeat`, causes tiling when `background-size` is not `cover`.

**Semplice (offline — reference only):**
- Semplice/Flywheel site is offline. Local reference files remain: `global/global-css-v1.6d.26.css`, `global/global-js-v3.0.js`.
- These were Semplice constraints. None apply to the APEX build.

## Typography — COMPLETE
Production Adobe Fonts kit `niv4qrq` deployed across all 27 pages (excluding `remember-we.html`). Google Fonts placeholders fully replaced.

| Role | Font | Kit slug |
|---|---|---|
| Display | Griffith Gothic Condensed (900) | `griffith-gothic-condensed` |
| Mono HUD | Auger Mono (Light) | `auger-mono` |
| Serif italic | Lust Display (400) | `lust-display` |
| Editorial / lyrics | Lust Stencil Display (Italic) | `lust-stencil-display` |

`remember-we.html` has its own standalone typographic system with kits `fqr6eyz` + `shz5hny`.

## Progress Log (March 16, 2026) — Viewfinder Video Overlay
- **`src/video-overlay.css` created and linked.** Vimeo Player SDK added to `<head>`. Conflicting inline CSS removed.
- **Layout calibrated:** Close button (top-right, exclusive). Mute + time display at `top: 50%` flanking the video. Center controls at `bottom: 120px`. Frame counter + project nav as a flush pair at bottom-right.
- **Auto-hide:** 3s inactivity → controls fade out. Mouse move / touch → fade back in. `startFocusLock()` / `stopFocusLock()` interval prevents Vimeo iframe from stealing keyboard events.
- **Vimeo native UI suppressed:** `controls=0&transparent=0&dnt=1` kills Unmute prompt and all Vimeo branding overlays.
- **ESC double-fire bug fixed:** `handleEscape` was registered on both `window` and `document`. Second call was immediately resetting the landing to BROUHAHAHA. Fixed by removing the duplicate `document` listener.
- **ESC/CLOSE** now returns to that video's WATCH/LEARN state — title, background, and action buttons all synced to `currentIndex`.
- **RESTART button:** `[R] RESTART` replaces the redundant `[ESC] BACK`. Seeks to 0, plays. Keyboard: `R`.
- **ENTER** toggles details drawer. Keyboard: `↵`. Focus lock ensures reliability.
- **Google title:** Changed from `"GOOGLE PIXEL"` to `"GOOGLE"` across landing and overlay metadata.
- **Citi CC crop:** `videoScale: 1.35` with `transform-origin: center 40%` pushes closed captioning out of frame.
- **Responsive system (3 breakpoints):**
    - Mobile portrait: single control row (mute left / playback center / compact nav+frame bottom-right), time display hidden — modeled on original Semplice build.
    - Mobile landscape: all controls hidden, fullscreen video.
    - Tablet portrait: scaled-down controls, tighter insets.
- **Top-left HUD removed:** `[ TC ]` and `[ STATUS ]` were redundant with time display and play/pause button state.

## Progress Log (March 16, 2026) — Scripts, LEARN Fix, Reel Reorder

### Script Production Drafts
- **Artifact folder created:** `src/assets/script-storyboard-artifacts/[01–07]-[slug]/` — drop source files here for processing.
- **Rule established:** Never write fictional scripts. Source only from real transcripts or materials.
- **Samsung "Study Is Better With Play" — COMPLETE:** Built from production deck PDF (`Study Is Better With Play – Concept Deck.pdf`) + 7 frame screenshots of on-screen supers. Supers in order: Introducing Galaxy Tab S7 FE / S Pen in matching colors / 12.4" big screen / Work across Galaxy devices with ease / Study is better with play / Galaxy Tab S7 FE / SAMSUNG logo card.
- **Legence "Built For Building" — COMPLETE:** Full VO transcript recovered via Vimeo API (token on file). Corporate brand film — exec narration, not cinematic narrative.
- **Citi "RISE" — COMPLETE:** Full VO transcript recovered via Vimeo API. Confirmed :30, not :90.
- **Pending (source files needed):** Google "Lose The Flash", Samsung "Stay Ahead Of Tomorrow", Bud Light "Home Advantage", MBK Alliance "We Are The Ones".
- **Vimeo note:** Samsung 637229831 captions capture music lyrics only ("Do it like this"), not copy. MBK, Google, Samsung Stay Ahead, Bud Light have no captions.

### LEARN Overlay — Enter Key Fix
- **Bug:** `intel-btn` is a `<button>`. Pressing Enter while it had focus triggered a synthetic click on the button, which reset the credits drawer immediately after the `window keydown` handler opened it. Net result: credits appeared to not open.
- **Fix:** Added `intelBtn.addEventListener('keydown', ...)` that calls `e.preventDefault()` when Enter is pressed and the overlay is already showing. Prevents the synthetic click without blocking the window handler.
- `#intel-overlay` also given `tabindex="-1"` and focused on open as a secondary improvement.

### Reel Reorder
- Reordered `projects` array in `src/index.html` for strategic portfolio arc:
  1. Google "Lose The Flash" — opens on wit and voice
  2. Samsung "Stay Ahead Of Tomorrow" — scales up, global idea
  3. Bud Light "Home Advantage" — Super Bowl, emotional pivot
  4. Legence "Built For Building" — range proof, breaks consumer pattern
  5. Citi "RISE" — purpose, global scale
  6. Samsung "Study Is Better With Play" — energy lift, Samsung callback signal
  7. MBK Alliance "We Are The Ones" — closes on the most culturally significant work
- **Rationale:** Separating two Samsung spots prevents blur; #6 position makes the callback story legible ("Samsung kept coming back"). MBK as closer lands harder after viewer has context.

### Git
- Committed and pushed: `src/index.html` + `src/video-overlay.css` to `main`. Deployed to Netlify.

## Progress Log (March 16, 2026) — Landing Page Animations & Google Script

### Google "Lose The Flash" Script — COMPLETE
- Built from 6 production screenshots dropped into `src/assets/script-storyboard-artifacts/01-google-lose-the-flash/`
- Format: :35 television commercial, no VO, Queen "Flash" (Flash Gordon OST) soundtrack
- Structure: bass line build → UGC stills intercut with Dracula (flash fires in sync with "FLASH! AH! AHHH!") → restaurant foodies firing flash, annoying neighbors → small music venue guitarist annoyed by audience flash → heroic orchestral swell → same guitarist shot: flash version (blown out) = "Lose the flash" / Night Sight version (perfect) = "Not the moment" → Pixel 3 product reveal → plane callback: prankster finally gets the sleeping friend selfie without flash → "Night Sight" super over scene and device → "Pixel 3" → Google G end card
- Key story: the plane girls are the through-line. Prankster tries to sneak a selfie of sleeping open-mouth friend → flash wakes her, busted. Night Sight = prank finally lands.

### Artifact Folder Renumbering
- Folders renumbered to match new reel order:
  - `01-google-lose-the-flash/`
  - `02-samsung-stay-ahead-of-tomorrow/`
  - `03-bud-light/`
  - `04-legence-blackstone/`
  - `05-citi/`
  - `06-samsung-study-is-better-with-play/`
  - `07-mbk-alliance/`

### Landing Page — Subtitle Word Animation
- Subtitle line: "I craft copy / into ideas into / scripts into **[word]** into culture."
- Animated word cycles: `films → actions → sites → campaigns`
- Effect: typewriter delete (60ms/char) → pause → retype (90ms/char). Red monospace cursor `|` blinks during transitions only, invisible at rest.
- Cursor is `position: absolute` — zero effect on text flow. No extra space.
- Subtitle is `text-align: left` — left side anchored, "into culture." floats naturally with word length.
- Cycle pauses when project is active, resumes (resets to "films") on ESC back to landing.

### Landing Page — Headline Word System
- Five headline words: `BROUHAHAHA / HULLABAWHO / PANDEMONEYUM / RAZZZMATAZZZ / FUNISSIMO`
- **No in-page animation.** One word shown per visit/return. Increments via `localStorage` (`omar_headline_idx`).
- Each word fits its own composition: `fitLockup(word)` measures the word at 15vw Anton, sets `projectDisplay.style.width` to that exact pixel width. Flex container centers the lockup automatically.
- Subtitle left-aligns within the headline word's width — every lockup is a unique, perfectly fitted composition.
- Width clears to `''` when a project is selected or video closes — project titles remain centered.
- Mobile portrait: width constraint skipped, natural layout preserved.
- Word brainstorm rationale: BROUHAHAHA (anchor), HULLABAWHO (riff on Hullabaloo, "who?" = identity question), PANDEMONEYUM (Milton's Pandemonium + MONEY buried inside), RAZZZMATAZZZ (jazz hands — verbal spectacle), FUNISSIMO (Italian superlative suffix, coined word Omar almost sold to Fiat).

## Progress Log (March 16, 2026) — All Scripts Complete

### Samsung "Stay Ahead Of Tomorrow" — COMPLETE
- Sourced from internal PDF: `013020 5G BRAND SCRIPTS _60 and _30 Internal.pdf`
- Full :60 "Change Everything" script. Gen Z heroine skeptically asks what Galaxy 5G really changes. Netflix costumed characters flood the screen as she downloads. Video call grid. Ping pong → cloud gaming with 75 friends. Bus/concert 360 streaming. Demogorgon callback. Four feature supers: downloading / video calling / gaming / live events. "EXPERIENCE THE CHANGE." SAMSUNG card.
- Internal title: "Change Everything." Production reel title: "Stay Ahead Of Tomorrow."

### Bud Light "Home Advantage" — COMPLETE
- Sourced from internal PDF: `Bud Light SB (_30).pdf` — Idea 1 selected and developed.
- :30. Insight: only fans get the home field advantage on Super Bowl Sunday.
- Opens 1982: close on Budweiser Light bottle → 1982 living room, Zenith console, SB XVI.
- NFL play sequence threads greatest moments across decades: Montana XVI pass → Cliff Branch TD in SB XVIII; Randle El XL pass → David Tyree helmet catch SB XLII.
- VO: "Since 1982, Bud Light has united every Super Bowl fan, connecting one amazing NFL moment to the next."
- Zooms out to 2016 living room. LED TV. SB50 pre-game. Bucket of commemorative bottles.
- Closes on SB50 bottle. Super: "Bud Light. Since 1982. Fans. Forward."

### MBK Alliance "We Are The Ones" — COMPLETE (special format)
- No production script used — final script written by Shabazz Larkin and director Dave Meyers.
- Concept developed by Omar Silwany and Warren Eakins at Matter Unlimited (2017).
- Script panel shows two texts instead:
  1. **ORIGIN:** Obama quote — Senator Barack Obama, February 5, 2008: "Change will not come if we wait for some other person or if we wait for some other time..."
  2. **WE ARE THE ONES MANIFESTO:** Written by Omar & Warren. Ends at "We are each other's keepers."
- Panel design: full-bleed Lincoln Memorial photo (Warren Eakins) at top. Black background (`#050505`). `sc-dark` class + CSS `:has()` selector flips `.script-page` and `.script-paper` dark for this project only — all other scripts remain paper-white.
- Source: `MBKA Presentation OS+WE 080117am.pdf` in `07-mbk-alliance/`.

### video-overlay.css — Project Details Drawer
- `project-details-box` background changed from `#FFFFFF` to `#050505`. Label/value text flipped to white.

### Git
- Committed and pushed: `src/index.html` + `src/video-overlay.css` to `main`. Deployed to Netlify.

## Progress Log (March 17, 2026) — Site Launch & Panasonic LUV

### omarthecreative.com — LIVE
- **Site confirmed live on Netlify, March 17, 2026 (St. Patrick's Day).** SSL active. GA4 tracking live.
- **Netlify support case 531958 resolved:** NS1 conflict caused by Squarespace also using NS1 for DNS. Two zones for the same domain cannot coexist on NS1. External DNS is the confirmed permanent solution — no further action needed.
- **Final DNS architecture:** Squarespace nameservers (`ns01-04.squarespacedns.com`) in control. A record `@ → 75.2.60.5`, CNAME `www → omarthecreative.netlify.app` in Squarespace DNS panel. Netlify DNS setup is permanently blocked by the Squarespace NS1 zone — not worth pursuing.

### Panasonic LUV — Background Complete
- **Background:** Original 2012 concept art — hands + Venus bokeh — `panasonic-luv-bg.png` (copied from iCloud/Dropbox archive). `background-attachment: fixed`; 58% dark overlay via stacked gradient. Mobile falls back to `scroll`.
- **Conceptual argument:** The bokeh dots ARE the Venus processor — camera optics rendered as emotional scatter. The image is the campaign's visual DNA, not a location shot.
- **Credits updated:** Jason Borzouyeh → "Creative Director, Art & Photographer."
- **Intro text:** Breathing room added before "Where Lu.V. stood for Venus. / And love." via blank line in pre-line text.
- **Discovery:** "LuV needs no mirrors." found in `Lumix_LuV.pdf` (original campaign ad for mirrorless camera). Adopted as the Choice Cuts contents page line for Cut 09.
- **Choice Cuts contents:** Cut 09 line updated from "TRANSFORM TECH INTO FEELING" → "LUV NEEDS NO MIRRORS."
- **Asset location:** Panasonic Lumix archive at `~/Library/Mobile Documents/com~apple~CloudDocs/PREVIOUSLY IN DROPBOX/Panasonic/Lumix/` — contains LuV Movement PDFs, concept art, GarageBand anthem files, Photonista pitch materials.
- **Ferris wheel:** Production asset shot on the Lumix GF5 during the Tokyo shoot. Not backed up to Dropbox — lives on the production drive (Jason's). If recovered, use as a visual asset within the LUV page.

### Back-to-Top — Standardized (All Project Pages)
- `#back-to-top` in `project-page.css` updated: `font-size: 2.2rem; width: 64px; height: 64px; border: none; background: transparent`. Designed for emoji, not text labels.
- `panasonic-luv.html`: 📷 emoji.
- All subsequent Choice Cuts pages will receive appropriate emojis as backgrounds are built.

### Panasonic Photonista — Complete
- **Background:** TVC still grab — Nathalie den Dekker holding the GX1 up to her eye, aimed at viewer. `panasonic-photonista-bg.png`. 65% dark overlay, `background-position: center top`. Low-res treated intentionally with overlay weight.
- **Definition block:** Replaced grainy `Lumix_Photonista_Definition.png` with native HTML/CSS typeset using Playfair Display italic at `clamp(52px, 8vw, 120px)`. Phonetic in IBM Plex Mono. Fully crisp and responsive.
- **"terrorista":** Creative license — replaced "turista" in the ORIGIN line. *"as in Sandinista, terrorista."* Sharper, more on-brand. Confirmed: this is a new business tool, not an archive.
- **Credits added:** Peter Bannan — "Director & Photographer." Jason Borzouyeh was NOT the photographer on Photonista (that was Peter Bannan). Jason is credited as "Creative Director, Art" only. Note: Jason IS "Creative Director, Art & Photographer" on LUV (different project).
- **Next-project-nav:** Updated h2 from "TRANSFORM TECH INTO FEELING" → "LUV NEEDS NO MIRRORS."
- **Back-to-top:** 📸 emoji.
- **"Runway Rebel":** Confirmed final campaign name. "Fashion Fantasy" was the working title in pitch documents. All references on page are correct as "Runway Rebel."
- **Archive status:** Clean hero shot (Nathalie in gold dress, pink hair, confetti petals) not in archive — lives on Peter Bannan/Jason's production drive. If recovered, use as background replacement.

## Progress Log (March 17, 2026)

### Choice Cuts Landing Page — Butcher's Block Redesign
- **Steak texture title:** `CHOICE CUTS` headline uses `background-clip: text` with `choice-cuts-texture.jpg` (raw beef marbling). Red gradient overlay + `filter: brightness(1.1) saturate(1.2) contrast(1.05)`. Padding compensates for tight `line-height: 0.75` bounding box clipping letterforms.
- **Subtitle color:** `.page-subtitle-meta` set to `#8B0020` (deep ruby) to coordinate with steak headline.
- **Butcher's block background:** `butchers-block.jpg` (end-grain teak) as fixed full-screen background at `opacity: 0.4`. Applies to choice-cuts.html only — NOT to project pages.
- **Draggable knife:** Japanese gyuto knife PNG (`knife.png`, bg removed in Photoshop) added as `#knife`. `position: fixed; bottom: calc(4vh + 144px); right: 6vw; transform: rotate(-90deg) scaleY(-1) scale(2)`. Mouse + touch drag events. Mobile: scaled down.
- **Back-to-top:** Changed to 🥩 emoji, 44×44px button.

### Long Copy Page — Bourbon Glass & Polish
- **Unified accent red:** `--color-accent: #FF0015` scoped to `.long-copy-body` — eliminates two-red clash between neon script and accent elements.
- **Draggable bourbon glass:** `bourbon-glass.png` (Flow-generated, bg removed) as `#bourbon-glass`. `position: fixed; bottom: 10vh; right: 3vw; transform: rotate(-10deg); width: clamp(220px, 24vw, 400px)`. Mouse + touch drag events.
- **Back-to-top:** Added 🥃 emoji, 44×44px button (page previously had none).
- **Tablet blend-mode fix:** `.hero-text` on tablet now gets `mix-blend-mode: normal; color: rgba(255,255,255,0.03)` — same ghost-opacity fallback as mobile. iOS/Safari fixed-background stacking context blocks compositing.
- **Mobile nav:** `.nav-name { font-size: 0.9rem }` on Long Copy to match landing page.

### Asset Migration — Flywheel → Local (Complete)
- 346 images downloaded from Flywheel via Gemini CLI wget. All HTML files updated. Zero remaining `omarthecreative.com/wp-content` URLs.
- `DJ_Red.png` (53MB) replaced with `DJ_Red.jpg` (2MB). Reference updated in `project-rock.html`.

### Landing Page — Subtitle Restructure
- Subtitle now reads: "I craft copy / into ideas into scripts / into [word] / into entertainment."
- "culture" replaced with "entertainment."
- `#scripts-into` span hidden for `['actions', 'sites']` via `toggleScriptsInto()` — grammar-aware.
- `<br class="culture-break">` shown only in portrait via media query.

### LEARN Overlay — Mobile Tap
- `intel-desc` copy inside LEARN overlay is now tappable on mobile — opens credits drawer.
- `script-hint` tap opens script overlay. Both have `cursor: pointer`.

### DNS Cutover — Resolved (March 17, 2026)
- **omarthecreative.com is live on Netlify.** SSL provisioned via Let's Encrypt. GA4 active.
- **What went wrong:** Switching nameservers to Netlify's `p04.nsone.net` left the DNS zone empty — Netlify's zone had no A/ALIAS records, so the domain resolved nowhere. Netlify's "Use Netlify DNS" flow failed silently due to a pre-existing NS1 zone conflict.
- **Fix:** Switched nameservers back to Squarespace (`ns01-04.squarespacedns.com`). Added A record `@ → 75.2.60.5` and CNAME `www → omarthecreative.netlify.app` in Squarespace DNS panel. Netlify verified and issued SSL cert automatically.
- **Current DNS setup:** Squarespace nameservers in control. Squarespace DNS panel holds the A and CNAME records pointing to Netlify. This is the External DNS configuration.
- **Note:** `dns1-4.p01.nsone.net` entries appear alongside Squarespace nameservers — these are Squarespace's own NS1 infrastructure, added automatically. Do not delete them.
- Semplice/Flywheel site is offline. Local reference files remain: `global/global-css-v1.6d.26.css`, `global/global-js-v3.0.js`.

### Google Analytics
- GA4 tag (`G-DCVBRB1LW6`) added to all 26 live pages via agent batch edit.

### Housekeeping
- `src/type-study.html` deleted (was untracked, never committed).
- `wp_urls.txt` remains untracked — can be deleted next session.

## Progress Log (March 17, 2026) — Film Stills, Emojis, INFO Refresh

### Film Stills — Top-Level Pages
- **Landing (`src/index.html`):** Pooneh Ghana crowd surf photo (`crowd-surf-bg.jpg`). B&W treated, luminosity ~38%. `opacity: 0.44; background-size: 140%; background-position: center 72%`. Laughing figure (Wiz Khalifa) sits above headline; crowd texture fills mid-frame; BROUHAHAHA lands over hands. White Converse shoes in lower frame retained intentionally — unplanned brand moment, youth culture signal. Replaced Dr. Strangelove War Room (March 19, 2026) via CONCEPTOR/DIRECTOR Loop.
- **INFO (`src/info.html`):** El Topo silhouette still (`el-topo-bg.jpg`). Lone gunslinger centered in desert, teal-blue tonal quality. Grayscale filter removed. `filter: contrast(1.1) brightness(0.55)`. Opacity confirmed good — no further tuning needed.
- **Footer credit updated:** "INFO PAGE: EL TOPO © 1970 PRODUCCIONES PÁNICAS." — easter egg for cinephiles. Landing page Strangelove credit removed (background replaced March 19, 2026).
- **Concept:** Top-level pages use film stills from personally meaningful cinema. Choice Cuts and Long Copy stay as-is (a level deeper). Project pages get campaign-specific backgrounds.

### INFO Page — Copy & UX Refresh
- **Opening line:** "The other guy. Brought a knife." — El Topo image taps the shoulder, line begins the conversation. Works for any room Omar walks into, not just a brief.
- **MBK line tightened:** "I've helped a President show young men how to show up for each other" — replaces the triple "help" construction.
- **Fundamentalco:** Moved to first in Agencies list.
- **A.R. Ammons:** `A.R.&nbsp;Ammons` — non-breaking space prevents "A.R." orphaning from "Ammons" on line wrap.
- **Back-to-top:** Custom `cowboy-hat.png` generated via Google Flow (Nanobanana/Imagen). Light brown skin tone. 40×40px `<img>` tag inside standardized 64px transparent button. Plain 🤠 doesn't support skin tone modifier.

### Samsung Stay Ahead Of Tomorrow — Background Live
- **Image:** Ping pong arena still from Samsung film. Sharpened, canvas extended (Generative Fill), watermark removed. `assets/04-samsung-stay-ahead-tomorrow.jpg` (1.6MB, 100% quality). Teal arena against Ruby Red SAMSUNG — accidental but electric color contrast.
- **Path note:** Carousel images live in `src/` root. This image is in `src/assets/` — reference includes `assets/` prefix.

### Back-to-Top — All 21 Project Pages Complete
Every Choice Cuts project page now has a thematic emoji. Full set:
- 01 disney 🏰 / 02 verizon 🤖 / 03 kraft 🍽️ / 04 audi 🎬 / 05 chase 💙
- 06 honda 🌿 / 07 johnnie-walker 🚶🏽 / 08 panasonic-photonista 📸 / 09 panasonic-luv 🩷
- 10 bentley 🎨 / 11 amex-moments 🎇 / 12 stoli 🌙 / 13 guinness 🎸
- 14 (bentley — see above) / 15 glenfiddich 🕰️ / 16 balvenie 🥃 / 17 espolon 🐓
- 18 skyy 🌉 / 19 google ❄️ / 20 obama ✊🏽 / 21 project-rock 💪🏽
- choice-cuts.html 🥩 / long-copy.html 🥃 / info.html 🤠🏽

### Back-to-Top — Index Pages Standardized
- `choice-cuts.html` and `long-copy.html` had old inline styles (border, dark background, 44px). Replaced with standardized transparent/no-border/64px/2.2rem treatment matching project pages.

### Choice Cuts — Backgrounds Pre-Wired (7 pages)
CSS blocks added to all 7 remaining pages. Each falls back to `#050505` until image lands. Images still needed from Omar:
- `amex-moments-bg.png` / `balvenie-patience-bg.png` / `espolon-tequila-bg.png`
- `glenfiddich-original-bg.png` / `guinness-amplify-bg.png` / `skyy-vodka-bg.png` / `project-rock-bg.png`

### Git
- Two commits pushed to `main`: film stills + emojis batch (27 files), back-to-top index fix (2 files), Samsung background (2 files).

## Progress Log (March 17, 2026) — Nav Name Reveal Mechanic

### OMAR SILWANY → OMAR, THE CREATIVE
- **Concept:** Milestone-gated nav name transformation. First-time visitors see `OMAR SILWANY`. Once they've explored even one project page, the name permanently becomes `OMAR, THE CREATIVE` — everywhere, site-wide.
- **Threshold:** Same as LUT unlock — `omar_viewed.length > 0` (any single page visited). Both fire together on the same return trip.
- **Landing page — tease state (count === 0):** `SILWANY` and `, THE CREATIVE` both ghost to `opacity: 0.15` for 1.8s then revert. The name almost revealed itself.
- **Landing page — permanent unlock (count > 0):** Applied instantly on page load — no transitions, no flash of SILWANY. `#name-last` (SILWANY) and `#name-space` (the space before it) both set to `display: none`. `#name-suffix` (`, THE CREATIVE`) set to `opacity: 1; transform: translateX(0)` immediately. Three spans: `OMAR` + `#name-space` + `#name-last` + `#name-suffix`.
- **Space problem:** Removing `SILWANY` left an orphaned space before the comma. Solved by wrapping the space character in its own `#name-space` span, hidden alongside `#name-last` at the same moment.
- **Sub-pages (23 pages):** Shared script `src/nav-name-reveal.js` injected before `</body>` on `choice-cuts.html`, `long-copy.html`, and all 21 Choice Cuts project pages. Script reads `omar_viewed`, and if unlocked, sets `el.textContent = 'OMAR, THE CREATIVE'` instantly — no animation, no transitions. State, not spectacle.
- **Info page:** Excluded. Info has no `.nav-name` link — only a hero `<h1>` title. Not in scope.
- **Git:** Committed and pushed to `main`. 25 files changed — `src/index.html`, `src/nav-name-reveal.js` (new), + 23 sub-pages.

## Sound Design — COMPLETE (March 17, 2026)

### Engine — `src/apex-sound.js`
- IIFE module: `ApexSound.init()`, `ApexSound.play(name, volume)`, `ApexSound.startLoop(name, volume)`
- Pre-fetches all ArrayBuffers on DOMContentLoaded (no gesture needed). AudioContext created on first gesture.
- Format detection via `canPlayType()` — OGG for Chrome/Firefox, MP3 for Safari.
- `play()`: awaits `ctx.resume()` before dispatching — prevents silent failure when AudioContext suspended.
- `startLoop()`: fires a looping BufferSource; guards against double-start via `_loopNodes` cache.
- Self-detects base path from `document.currentScript.src` — works at any page depth.
- **Critical:** `const ApexSound` does NOT attach to `window`. All guards use `typeof ApexSound !== 'undefined'`, not `window.ApexSound`.

### Sound Map
| Key | File | Source | Trigger |
|---|---|---|---|
| `shutter` | `07076042` | BBC | Carousel click, LUT unlock |
| `film` | `07076045` | BBC | Video overlay close |
| `door` | `07011044` | BBC | Menu open (all pages) |
| `projector` | `07004203` | BBC | WATCH button |
| `hum` | `07004188` | BBC | (reserved) |
| `bourbon` | `563231__ammorts__...` | Freesound CC0 | Long Copy glass grab (one-time) |
| `knife` | `07001020` | BBC | Choice Cuts knife grab (one-time) |
| `whistle` | `the-whistle` | Freesound CC0 (Heather Ferreira, ID 699254) | INFO page — title click or first scroll, loops forever |

### Wiring by Page
- **Landing (`index.html`):** Shutter on carousel click; projector on WATCH; film on video close; shutter at 0.5 on first LUT unlock.
- **Choice Cuts (`choice-cuts.html`):** Knife grab (one-time, `mousedown`/`touchstart`); door on menu.
- **Long Copy (`long-copy.html`):** Bourbon glass grab (one-time); door on menu.
- **INFO (`info.html`):** Whistle loop on title click OR first scroll; door on menu.
- **All sub-pages:** Door on menu via `nav-name-reveal.js` (which also handles nav name state).

### Licensing
BBC SFX: Free for personal/non-commercial use with attribution. Portfolio qualifies — no revenue; client work billed through Meanwhile In Jupiter LLC (separate entity). Freesound tracks: CC0.

## Progress Log (March 17, 2026) — Sound, Safari Fixes, Long Copy Polish

### Sound Design — Implemented
- `apex-sound.js` written and deployed. OGG + MP3 versions of all 8 sounds in `src/assets/sound-effects/`.
- All triggers wired across landing, Choice Cuts, Long Copy, INFO, and 21 project pages.
- Safari fixes: `window.ApexSound` guard replaced with `typeof` check; `ctx.resume()` properly awaited before play dispatch.
- Duplicate `apex-sound.js` / `nav-name-reveal.js` removed from malformed `<head>` position in `long-copy.html`.

### Long Copy — Mahogany Background-Clip Treatment
- **Hero text (`LONG` / `COPY`):** `background-clip: text` with `mahogany-dramatic-grain.jpeg`. Applies to ALL browsers (not just Safari) — user preferred this over the Chrome `mix-blend-mode: overlay` rendering. `width: max-content; padding: 0.15em 0.1em; margin-top: -0.15em; margin-left: -0.1em` prevent glyph clipping.
- **Post titles (`REMEMBER WE` etc.):** Same mahogany treatment. Hover switches `background-image` to `linear-gradient(var(--color-accent), ...)` — instant cut to ruby red.
- **Deck text alignment:** Both neon script blocks top-aligned at `top: 1.3em` (one line down from top of hero-col).
- **Safari:** `@supports (-webkit-hyphens: none)` block removed — base rule now handles everything universally.

### INFO Page Polish
- **Western whistle:** `the-whistle` (Heather Ferreira, CC0, Freesound 699254) loops at 0.35 volume. Triggers on title click or first scroll. One-start guard via `whistleStarted` flag.
- **Back-to-top:** Appears only within 100px of page bottom (was appearing after 1vh of scroll).

## Progress Log (March 18, 2026) — Tablet/Mobile QA Pass

### Choice Cuts — Knife Art Direction & Polish
- **Blade cuts the gap** between CHOICE and CUTS — concept: the knife IS the editorial act, not decoration
- **Angle**: `rotate(-55deg) scaleY(-1) scale(2)` — reads as incoming cut, not dropped object
- **transform-origin: 50% 70%** — compensates for blade offset from image center; applies universally
- **Media query order fixed**: portrait tablet rule now comes AFTER mobile rule to win on 768px-wide iPads
- **Landscape fix**: `left: 42vw; right: auto` override aligns blade with gap in landscape too
- **Scroll fade**: knife fades out past 50% hero scroll, gone by 90% — JS targets `#knife` container
- **Shadow**: CSS `filter: drop-shadow` dropped by Safari after opacity cycles; replaced with `knife-shadow.png` (pre-rendered blurred silhouette via Pillow) as absolute-positioned child inside `#knife`

### Long Pour — Bourbon Glass
- **Scroll fade** added — was in `<head>` script before DOM existed; moved to body script block
- **Shadow**: CSS filter dropped by Safari; removed in favour of pre-rendered shadow baked into `bourbon-glass.png` (not visible on dark mahogany background — acceptable)

### iOS Sound Design — AudioContext Unlock
- `apex-sound.js`: `ctx.resume()` called inside `init()` synchronously from gesture handler
- All pages: `touchStarted` flag guards scroll-triggered sounds — prevents page-load scroll from burning one-time flags before AudioContext unlocks

### Nav / Frame Positioning — All Pages
- `apex-nav` inset corrected to `3–3.5rem` on tablet portrait and mobile (was touching frame at 2rem)
- Media query ordering fixed across choice-cuts.html, long-pour.html, info.html, 404.html
- Landing: portrait tablet HUD tags moved outside frame (0.8rem); corner frame tightened to 2rem

### Remember We — Tablet Portrait
- Content padding increased: `pt: 12rem`, `pb: 10rem`, `px: 3.5rem`

### Drag / Scroll Interaction
- `touchmove` listeners changed to `{ passive: false }` with drag guard to suppress page scroll during drag (knife and bourbon glass)
- `filter: drop-shadow` moved from fixed container to child `img` to fix iOS WebKit fixed-positioning bug

## Progress Log (March 18, 2026) — Mobile Portrait QA Pass (Session 2)

### Video Overlay — Mobile Portrait Complete
- **Citi caption bar:** `#cc-bar` — black strip (`height: 25%; z-index: 5`) covers closed captions baked into the Vimeo encode. Toggled via `captionBar: true` on the project data object in `loadVideoProject()`. Applies on tablet and mobile portrait.
- **Mobile portrait controls rewrite:** Complete layout overhaul matching original Semplice reference. Controls live in black letterbox space below 16:9 video. Row order (top to bottom): mute + time display above progress bar, progress bar, center controls (REW/PLAY/FWD), project title, nav hints + frame counter + project nav. Details drawer (`project-details-box`) moved to `top: 20px` (above video frame, not over it).

### Nav — Independent Fixed Elements
- **Root cause identified:** `apex-nav` as flex container prevented pixel-perfect matching to the landing's independently-positioned `header-name` / `info-link`. Also: inline `<style>` blocks in HTML files always override external CSS — nav rules in `choice-cuts.css` / `long-pour.css` were being clobbered by stale inline breakpoints.
- **Fix:** On both `choice-cuts.html` and `long-pour.html`, `.nav-name` and `.menu-trigger` are now `position: fixed` independently. `apex-nav { pointer-events: none }` neutralizes the container. Responsive breakpoints now mirror the landing exactly: `landscape + max-1366px`, `landscape + max-h-600px`, `portrait + max-1024px`, `max-480px`.
- **Critical gotcha:** The landing uses `orientation: landscape and max-width: 1366px` — NOT `max-width: 1024px`. This covers laptops 1024–1366px wide. Using `max-1024px` caused an obvious nav size jump on typical laptops.

### Choice Cuts — Mobile Portrait Layout
- **Content container:** `.choice-cuts-page { padding: 0 4rem }` was stacking inside `.choice-cuts-wrapper { padding: 2rem }` → 6rem per side → ~198px content on 390px phone. Fixed: `padding-left: 0; padding-right: 0` on `.choice-cuts-page` at mobile. Wrapper's 2rem is the only margin.
- **CHOICE CUTS title:** `white-space: nowrap; font-size: clamp(55px, 16vw, 100px)` — one line, texture visible.
- **Subtitle:** Color changed to `#ffffff` with dark drop shadow for legibility on grid background.
- **Lesson titles:** `clamp(44px, 12vw, 80px)` — all 21 uniform. Lesson 10 inline `font-size: 0.9em` override removed.
- **Lesson numbers:** `color: #FF0015; opacity: 0.8` — `#A8002C` was near-invisible on `#050505`.
- **Knife mobile portrait:** `top: 46vh; left: 33vw; width: clamp(160px, 42vw, 240px)`.

### INFO Page — Mobile Portrait
- **Sound fix:** Whistle now starts from `touchstart` gesture on mobile (not scroll — iOS blocks AudioContext from async callbacks).
- **HUD/frame:** Matched to landing — `corner-frame: 1.5rem/1rem`, HUD tags `0.4rem/0.4 opacity`, copyright `bottom: 0.3rem !important`.
- **Typography:** `bio-text: 1.1rem`, `dossier-content: 0.95rem`, Biographia Literaria `0.55rem`.

### Mobile Landscape
- **Landing:** Title switched from `12vw` to `clamp(28px, 12vh, 80px)` — `vh`-based avoids giant text on short 390px landscape viewports.
- **Project pages:** 28rem intro padding → `6rem` in landscape; title `clamp(32px, 9vh, 90px)`.

## Progress Log (March 19, 2026) — iOS QA + Mobile Polish

### apex-sound.js — Full Engine Overhaul
- **`_resumePromise` pattern:** `init()` calls `ctx.resume()` synchronously within gesture, stores promise. `play()`/`startLoop()` chain on it rather than calling fresh `ctx.resume()` from async/scroll — iOS blocks that.
- **Re-suspend fix:** `init()` now refreshes `_resumePromise` if ctx exists but iOS re-suspended it. Safe to call from any gesture handler.
- **`stopLoop(name)`:** Stops BufferSource node, clears `_loopNodes[name]`. Required on bfcache restore — stale node prevents restart.
- **`_fetchQueue`:** `play()`/`startLoop()` called before fetch completes queues the dispatch. `load()` flushes when buffer arrives. Safe because ctx is already running — iOS only gates `ctx.resume()`, not `source.start()`.
- **`load()` pre-decode:** Calls `_decodeOne()` when buffer arrives if ctx exists — faster subsequent plays.

### iOS Sound Trigger Fixes
- **INFO title (touchstart/touchend split):** `touchstart` → `ApexSound.init()` only (ctx.resume() fires within gesture). `touchend` → `startWhistle()` — by then ctx.resume() has resolved. `click` kept for desktop. Fixes case where sound trigger IS the first gesture on the page.
- **bfcache resets:** All three pages reset one-time flags (`whistleStarted`, `poured`, `sliced`) on `pageshow` with `e.persisted`. INFO also calls `ApexSound.stopLoop('whistle')` to clear stale node.
- **scrollY > 50 guard:** All scroll listeners require 50px before triggering — prevents menu-tap micro-scroll from burning flags.

### Project Pages Mobile — All 21 Choice Cuts Projects
- **HUD/frame hidden:** `.corner-frame` and `.hud-tag` hidden at `max-width: 767px` in `project-page.css` — too crowded on phone.
- **Nav — independent fixed elements:** `project-page.css` now uses the same pattern as `choice-cuts.html` and `long-pour.html`. `.apex-nav` neutralized (`pointer-events: none`). `.nav-name` and `.menu-trigger` are `position: fixed` independently. Breakpoints are pixel-identical to landing/choice-cuts/long-pour: `landscape+1366`, `landscape+h600`, `portrait+1024`, `max-480`.

### Long Pour Mobile
- **Neonderthaw copy:** Left-aligned (`align-items: flex-start`, `text-align: left`), positioned `top: -5%` so it sits centrally over LONG/POUR.
- **Bourbon glass:** Moved from bottom-left to gap between G of LONG and R of POUR — `top: 21rem; right: 2vw`.

### Global
- **iOS tap highlight:** `-webkit-tap-highlight-color: transparent` on `*` in `base.css` — eliminates pink/blue flash on touch across all pages.

### Project Rock — Mobile Title
- `background-size: 160%; background-position: center 15%` at `max-width: 767px` — pulls DJ's face into letterforms, pushes lighter tones into LL of WILL.

## Progress Log (March 19, 2026) — Landing Page Background Swap

### CONCEPTOR/DIRECTOR Loop — Landing Background
- **Decision:** Dr. Strangelove War Room (`dr-strangelove-bg.jpg`) replaced with Pooneh Ghana crowd surf photo (`crowd-surf-bg.jpg`)
- **Concept argument:** War Room was closed, institutional, too abstract — put viewer in planning room, not the event. New image puts viewer inside the BROUHAHAHA before the word arrives. The laughing figure (crowd surfing, being carried by a diverse crowd) IS the argument made physical — one person held up by many, fully given over to joy.
- **Treatment:** B&W conversion (Black & White adjustment, Reds +65/Yellows +75/Blues +15), midpoint darkened to ~38% luminosity, S-curve for face contrast. Lower-left camera quieted with Patch tool.
- **CSS:** `opacity: 0.44; background-size: 140%; background-position: center 72%`
- **Converse shoes:** White high-tops visible in lower frame — retained intentionally. Unplanned brand moment, youth culture signal. The one brand that naturally appears in the frame.
- **Photo credit:** Pooneh Ghana (sourced from `proactive-pitches/IMMORTAL/images/Pooneh Ghana/`)

## Progress Log (March 19, 2026) — Landing Background Mobile + Pink Flash Fix

- **Mobile portrait crop:** `background-size: auto 150%; background-position: 49% 75%` — Wiz full body in frame, face above headline, Converse shoes visible lower-right. LOOP approved.
- **background-repeat: no-repeat** added to `.project-bg` — prevents tiling at non-cover sizes
- **Pink flash fix (site-wide):** `.menu-link:active/focus` now explicitly holds `color: #FFFFFF; outline: none` in `base.css` — suppresses browser default pink/active flash on menu link clicks

## Progress Log (March 19, 2026) — Typography Pass + Choice Cuts Polish (Session 3)

### Adobe Fonts System — Complete
- **Production kit `niv4qrq`** deployed across all 27 pages (excluding `remember-we.html`)
- **Griffith Gothic Condensed** (weight 900) replaces Anton — bolder, more confident, less vertically stretched. Fast Company editorial lineage. Fits Observatory dossier register better than Nike/Anton.
- **Auger Mono** (Light) replaces IBM Plex Mono — fresher at small HUD scale. Light preferred over X-Light for bracket glyph legibility at 0.6–0.7rem.
- **Lust Display** replaces Playfair Display — more editorial authority. Used at italic for subtitle and nav name; weight 400 only.
- **`fitLockup()` probe** updated to `griffith-gothic-condensed, font-weight:900` — was hardcoded to Anton, causing BROUHAHAHA to clip left after swap.
- **`base.css` tokens:** `--display: 'griffith-gothic-condensed'`, `--mono: 'auger-mono'`, `--serif: 'lust-display'`
- Exploration kit `qzf6xww` (19 fonts) was research artifact; `niv4qrq` is the lean 3-family production kit.
- `remember-we.html` fully excluded — has its own standalone typographic system (kits `fqr6eyz` + `shz5hny`).

### Choice Cuts Lesson Titles — Polish
- **Period usage (LOOP decision):** 10 of 21 titles receive periods. Rule: period where line 2 is a declaration/verdict; no period where line 2 completes a command or is grammatically dependent on line 1.
- **Letter-spacing:** `-0.04em → -0.02em` — opens collisions around I, Y, T in Griffith Gothic Condensed
- **Font-size:** `clamp(50px, 12vw, 280px) → clamp(44px, 9.5vw, 200px)` — prevents three-line wraps
- **Line-height:** `0.8 → 0.9` — Q descender in CONQUISTADORS cleared from AREN'T below

## Progress Log (March 20, 2026) — Mobile QA + Choice Cuts Polish

### iOS Background Fix — Systemic Pattern Established
`background-attachment: fixed` does not render on iOS Safari. `@supports (-webkit-touch-callout: none)` and media query scroll fallbacks are unreliable (`scroll` on a tall body element sizes the background to full document height, not viewport — position has no visible effect at the hero). **Definitive fix:** dedicated `<div id="[page]-bg" aria-hidden="true">` with `position: fixed; inset: 0; z-index: -1`. Body gets `background: transparent`, html gets `background: #050505`.

**Critical:** The div must exist in the HTML — CSS targeting a non-existent ID does nothing. (This caused a missed fix on Photonista in session.)

Applied: `panasonic-photonista`, `panasonic-luv`, `amex-moments`.

PNG→JPG conversions (via `sips -s format jpeg -s formatOptions 85`):
- `panasonic-photonista-bg`: 5.2MB → 576KB (also fixed RGBA→RGB)
- `panasonic-luv-bg`: 682KB → 243KB
- `amex-moments-bg`: 2.3MB → 798KB

### Credits — Bottom-Right Absolute (Systemic)
Standard established: `position: absolute; bottom: 4rem; right: 5rem; text-align: right`. Credits are siblings of `.hero-content` inside `.project-hero` (not children). `.project-hero { position: relative }` required.

Applied: panasonic-photonista, panasonic-luv, audi, honda, verizon, disney, amex.

### LOOP — Panasonic Photonista Title
- **Diamonds rejected.** Register wrong — decorative luxury vs. authorship. Background image (Nathalie, camera aimed at viewer) is narrative; any fill treatment fights the face.
- **Verdict: plain white.** Rule: narrative backgrounds → white type.

### LOOP — Panasonic LUV Title
- **background-clip:text confirmed correct.** LUV background is abstract (hands, bokeh) — emotional texture, not story. Clip concentrates feeling at the title. Distinct from Photonista.
- `background-position: 25% center` — shifts clasped hands into "LUV" (emotional anchor), ME and MOVES carry bokeh.
- **Rule:** Abstract/atmospheric backgrounds → clip is valid. Narrative backgrounds → white type.

### Amex Mobile Portrait
- Title breaks "FROM THIS / MOMENT, ON" via `<br class="mobile-break">` (display:none base, display:inline in portrait query)
- **CSS cascade gotcha confirmed:** Portrait media query must appear AFTER the base rule it overrides, or it gets clobbered. This caused a "not moving" bug — position override had no effect until reordered.
- `background-size: cover` on a background-clip:text element fills the element exactly — no slack for position to move. Fix: `background-size: auto 250%` oversizes the image and creates vertical room. Final position: `center 0%`.
- Fixed div bg: mobile portrait `background-position: center 85%`.

### Other Pages Polished
- **Disney:** Hero layout top-right (`flex-start / flex-end`, `padding-top: 10rem`); title line break "BE OUR / GUEST"; credits extracted.
- **Verizon DROIDS:** Sky image replaces steel chrome gradient; font-size `clamp(120px, 28vw, 600px)`; credits extracted.
- **Honda:** Grass texture refined — `100% no-repeat`, `brightness(2.5) contrast(1.1) saturate(0.85)`.

## Progress Log (March 20, 2026) — Session 2

### Stoli Night Edition — Title, Credits, Mobile Portrait
- Title scaled to `clamp(40px, 11vw, 210px)` — fits within nav frame left edge. `white-space: nowrap` removed to allow mobile wrapping.
- Credits extracted → `position: absolute; bottom: 4rem; right: 5rem`.
- Mobile portrait: break after ILLUMINATE via `<br class="mobile-break">`; font `clamp(40px, 22vw, 160px)`.
- Mobile portrait title clip: `stoli-night-bg-flipped.jpeg` (ffmpeg `vflip`) swapped in via media query. Image in letterforms is upside-down on mobile — same technique as Skyy Vodka.

### Guinness AMPLIFY — iOS Fix + Title Scale
- Credits extracted → bottom-right.
- iOS background: fixed div pattern applied. `guinness-amplify-bg.png` (2.1MB) → `guinness-amplify-bg.jpg` (690KB).
- Title: `clamp(90px, 27vw, 540px)` — 50% larger than `clamp(60px, 18vw, 360px)`.

## Progress Log (March 20, 2026) — Session 3

### Choice Cuts Index — Polish
- **Cut 20 (Obama Foundation):** "THE&nbsp;SPEECH<br>WAS&nbsp;ALREADY&nbsp;WRITTEN." — used non-breaking spaces and line break to force two-line layout and prevent orphaned words.
- **Cut 10 (Audi):** "SOLVE FOR THE&nbsp;NEED<br>NOT&nbsp;THE&nbsp;ASK." — two-line fix + period added (verdict rule).
- **Cut 04 (Crayola):** "ONE&nbsp;NUMBER<br>GRANTED&nbsp;FOUR&nbsp;WISHES." — two-line fix via non-breaking spaces.
- **Cut 18 (Skyy Vodka):** Period added ("TWO Ys FORWARD.") — verdict rule.

### Project Rock — Restoration of Restraint
- **A24 Standard:** Stripped the full-bleed background image and reimplemented the original high-restraint vision. The `DJ_Red.jpg` asset is now clipped to the title text (`background-clip: text`) against a pure `#050505` field.
- **Line Break:** Updated to "IT TAKES / AN IRON WILL" as the primary layout.
- **Mobile Portrait:** Calibrated title image crop to `background-position: center 40%` — crops the face to show from the chin down to the red T-shirt within the letterforms.

## Progress Log (March 20, 2026) — Final UX/UI Polish
- **EXHIBITS Flow Enhancement:**
    - **Auto-Trigger:** Updated all 25+ files so the "EXHIBITS" menu link points to `index.html?start=true`.
    - **Direct-to-Cut:** Modified `index.html` logic to detect the `start` parameter and automatically trigger the first carousel project (`Google "Lose The Flash"`) after a 300ms delay.
    - **Flash Prevention:** Implemented a `starting` class on `html` (applied immediately in `<head>`) to hide landing elements before they can paint, ensuring a dark transition directly to the first exhibit.
    - **Sound Guards:** Added `e.isTrusted` check to the carousel click listener. Sound effects (shutter) now only fire on physical user gestures, preventing auto-trigger failure due to browser audio policies.
- **Sculptural Menu Leading:**
    - **Tighter Lockup:** Tightened `.menu-link` leading site-wide (`line-height: 0.65`) and kerning (`letter-spacing: -0.07em`). 
    - **Mass Presence:** This restores the "sculptural mass" feel where menu items touch and overlap, creating a monolithic typographic block when the menu is open. Applied to desktop and all mobile portrait queries.
- **Carousel Scaling (MBK Alliance):**
    - **fitLockup Upgrade:** Enhanced the `fitLockup()` function to handle project titles and spacing.
    - **Mobile Alignment:** Long titles (like "MBK ALLIANCE") now scale down to `15vw` in mobile portrait to prevent edge-crashing while maintaining the site's left-aligned layout.

## Progress Log (March 21, 2026) — Disney Mobile QA + Asset Pass

### Bug Fixes
- **Long Pour bourbon glass (iOS Safari):** Root cause — `</head>` was never closed in `long-pour.html`, causing browser to create an implicit body, then a duplicate `<body class="long-pour-body">` at line 288. iOS Safari doesn't render `position: fixed` elements in a second body. Fixed: added `</head>` + single `<body>` in correct position; removed stray duplicate.
- **`html { overflow-x: hidden }`** added to `base.css` — prevents iOS horizontal page drift (was only on `body`).
- **Disney content slide on touch scroll:** `transition: all 0.5s ease` on `.visual-asset-image` was catching scroll-triggered property changes. Changed to `transition: filter 0.5s ease` only.

### Disney — Mobile Portrait Hero Layout
- Full art direction pass. Cinderella shifted right via `object-position: 5% center` to open negative space.
- `DISNEY PARKS & RESORTS` broken to two lines (`.mobile-break`), absolutely positioned top-left at `top: 9rem; left: 2rem`.
- `BE OUR GUEST` broken to three lines (`.title-break`), absolutely positioned below at `top: 14rem; left: 2rem`.
- Both titles escape `.hero-content` (set to `position: static`) and position against `.project-hero` as their context.

### Disney — Credits Expanded
- Full credits: Design Project Director & Rogue Writer: Omar Silwany / Designs by Anita Zeppitelli / Design Director: Don Zinzell / CCO: Gordon Bowen / mcgarrybowen.

### Verizon — Credits Updated
- Added: Design Direction: Jason Borzouyeh / ECD: Warren Eakins / CCO: Gordon Bowen / dentsu mcgarrybowen.

### CREDITS.md Created
- Master source of truth for all 21 Choice Cuts credits at project root. CUT 01 Disney, 05 Verizon, 16 Balvenie, 17 Espolòn (Rich Tu added), 20 Obama Foundation, 21 Project Rock fully credited. 15 cuts still have open fields.

### Disney — WHERE Headlines Mobile Polish
- `.section-headline` reduced to `clamp(28px, 6.5vw, 40px)` on mobile portrait.
- `.section-headline-rounded` ("Join the unforgettable voyage...") reduced to `clamp(36px, 9vw, 52px)` — fits within viewport.
- `white-space: nowrap` applied to "TEA CUPS." and "AND BEYOND." to prevent orphaned words.
- Intro copy widows eliminated at `font-size: 14px`.

### Disney — Transparent Asset Pass
- All five Disney project assets re-exported as PNGs with transparent backgrounds (Photoshop: Background layer unlocked, Magic Wand + delete on black areas):
  - `Disney_Banner_Ads_Cinderella.png`
  - `Disney_Banner_Ads_Infinity.png`
  - `Disney_Banner_Ads_Tea_Cups.png`
  - `Disney_Email_Promotion_Template_blur.png`
  - `Disney_Direct_Mail.png`

## Progress Log (March 21, 2026) — Crayola + Verizon Mobile QA

### Crayola — Full Mobile Pass
- **Live lyric section:** `Crayola_64Days_Manifesto_Song.jpg` replaced with live HTML — 17-line carol, escalating scale (line 1 smallest, line 17 largest), Lust Stencil Display italic, left-anchored in dark negative space. Lines 13–17 cross into the Crayola box face.
- **Lust Stencil Display:** Added to Adobe Fonts kit `niv4qrq` (Regular + Italic). Now used for: Crayola lyrics, Crayola opener, landing page subtitle. Nav name stays Lust Display — intentional contrast (smooth identity vs. tactile editorial).
- **Mobile portrait:** 9:16 background via `<picture>` element; title at `top: 12rem`; credits top-right `0.55rem`; intro copy `14px`; images full-bleed (print `120vw`, bus shelter `100vw`, billboard `115vw`); press headline left-aligned.
- **Transparent assets:** All 7 Crayola images re-exported as PNGs.
- **Padding:** `10rem top / 32rem bottom` desktop; `24rem bottom` mobile.

### Verizon — Mobile Portrait Polish
- VERIZON meta label left-aligned on mobile.
- All copy (setup, manifesto, campaign columns): `14px / line-height: 1.9 / text-wrap: pretty`.
- `Droid_Eris.jpg` background retained as-is.

### Typography System — Current State
| Usage | Font | Style |
|---|---|---|
| Nav name / site identity | Lust Display | normal or italic |
| Subtitle / lyrics / editorial | Lust Stencil Display | Italic |
| HUD / mono | Auger Mono | Light |
| Display headlines | Griffith Gothic Condensed | 900 |

## Progress Log (March 22, 2026) — Art Buyer Phase (Landing Page Backgrounds)
- **Art Buyer Skill Deployment:** Gemini acting as Art Buyer (traditional agency role) to source non-stock, human-shot photography and film stills.
- **Protocol:** Developed `ART-BUYER-LOG.md` as the permanent record for the **Art Buyer Skill** protocol and curated options.
- **Curated Options (Images 2-5):** Sourced iconic frames from Wolfgang Volz (Christo), Philippe Antonello (*Wolf of Wall Street*), Bob Willoughby (Sammy Davis Jr.), Malick Sidibé (*Nuit de Noël*), Bruce Gilden (*Go* series), Anthony Wallace (BTS), and Romano Cagnoni (Fidel Castro).
- **Collaboration:** Gemini and Claude working together for "exponential results."

## Progress Log (March 22, 2026) — Slider Architecture + Credits + Project Rock Polish
- **Espolón Tequila — Regression Fix + Slider Redesign (LOOP):**
...
- **Regression fix:** Global `max-width: 1366px` rule in `project-page.css` scoped to `orientation: landscape` — was firing on all viewports and breaking title/credits layout. `display: block !important` on `.project-hero` was killing flex — replaced with `justify-content: flex-start !important`.
- **LOOP — Slider architecture:** Header band pattern. `.slider-section { display: flex; flex-direction: column; height: 100vh }`. `.slider-header { flex: 0 0 auto }` sits in black negative space with title, subtitle, counter (`1 / N`), pulsing hint (`[ ← SWIPE → ]`). `.slider-container { flex: 1 1 auto }` fills remaining height. Three decks: THE PITCH / THE CREATIVE / THE EXECUTION.
- Tablet landscape: `padding-top: 10rem` on slider header; credits `bottom: 15rem; right: 4rem`.

### Skyy Vodka — Credits + Slider Redesign (LOOP)
- Credit corrected: `Group Creative Director` → `Creative Director: Omar Silwany`. Collaborators TBD.
- LOOP applied same header band architecture as Espolón. Deck titles: `#WESTOF` / `#WHYYES`.
- Tablet landscape credits: `bottom: 9rem; right: 4rem` (iterated from 15 → 12 → 9rem).

### Google Wonderland — Full Credits
- ACD, Art & UX: Alexander Christian / ECD: Eric Lohman / CEO & ECD: Drew Ungvarsky / Creative Director, Writer: Omar Silwany / GROW in partnership with Google Art, Copy & Code.
- Tablet landscape: `bottom: 12rem; right: 4rem`.
- CREDITS.md: CUT 19 fully credited.

### Obama Foundation — Tablet Landscape Credits
- `bottom: 8rem; right: 4rem` (iterated from 12rem).

### Project Rock — Tablet Landscape + Mobile Portrait Polish
- Tablet landscape credits: `bottom: 10rem; right: 2rem`.
- Tablet landscape manifesto: `font-size: 17px; line-height: 1.8; padding-top: 8rem`.
- `manifesto-final` single line in tablet landscape: `br { display: none }` (note: `white-space: nowrap` does NOT suppress `<br>` — must hide the element). Space added before `<br>` in HTML so words don't collide. Font `clamp(32px, 6vw, 90px)`. `padding-bottom: 12rem`.
- Mobile portrait: `.manifesto-text { padding-top: 10rem }`. `.manifesto-final { padding-bottom: 8rem }`.

### CSS Gotchas Confirmed
- `white-space: nowrap` does NOT suppress `<br>` tags — use `br { display: none }` in media query instead.
- `white-space: pre-line` on base rule blocks `nowrap` without `!important`.

### Crayola — Logo Asset Swap
- `Crayola_64Days_Logo.jpg` (pixelated) → `Crayola_64Days_Logo.png` (high-res, white background). Transparent version attempted in Illustrator but rejected — white reads better on dark layout. HTML `src` updated to `.png`.

## Progress Log (March 22, 2026) — Landing Page Image Set

### Five Background Images — One Per Headline Word (LOOP Decision)
Single landing background (Pooneh Ghana crowd surf) replaced with five images — one per headline word, swapped via `HEADLINE_BACKGROUNDS` map in `src/index.html`. `setHeadlineBackground(word)` sets `background-image`, `background-size`, `background-position` on `#initial-bg` per word and viewport. Mobile CSS `!important` override removed — positioning now in JS.

### Final Selections — Five Visual Traditions

| # | Word | Image | Photographer | File | Tradition |
|---|---|---|---|---|---|
| 1 | BROUHAHAHA. | Pooneh Ghana crowd surf | Pooneh Ghana | `crowd-surf-bg.jpg` | Concert photography |
| 2 | HULLABAWHO. | McQueen No. 13 / Shalom Harlow + robot arms | Chris Moore | `hullabawho-bg-comp.jpg` | Fashion/performance |
| 3 | PANDEMONEYUM. | Fidel Castro drinking Coca-Cola, c.1971 | Romano Cagnoni | `pandemoneyum-bg-comp.jpg` | Political photojournalism |
| 4 | RAZZZMATAZZZ. | Ali vs Liston overhead (cropped without Ali) | Neil Leifer | `razzzmatazzz-bg-comp.jpg` | Sports photography |
| 5 | FUNISSIMO. | Nuit de Noel (Christmas Eve, 1963) | Malick Sidibe | `funissimo-bg-comp.jpg` | Social documentary / dance |

### Positioning (Desktop / Mobile Portrait)
- **BROUHAHAHA.** — `140% / center 72%` | `auto 150% / 49% 75%`
- **HULLABAWHO.** — `120% / center 62%` | `auto 150% / center 15%`
- **PANDEMONEYUM.** — `160% / center 35%` | `auto 160% / 45% 30%`
- **RAZZZMATAZZZ.** — `130% / center 25%` | `250% auto / 70% 20%`
- **FUNISSIMO.** — `140% / center 33%` | `auto 150% / center 50%`

### Art Direction Decisions
- **RAZZZMATAZZZ. — The zag:** Most famous Ali image, without Ali. Liston splayed on canvas IS the evidence of craft.
- **FUNISSIMO. — Brightest of five:** LOOP rule: matched density = matched feeling, not matched histogram. The -issimo demands brightness.
- **PANDEMONEYUM. — Getty comp:** Watermark managed via positioning. Full-res license ($375) deferred.

### Art Buyer Process (Gemini + Claude collaboration)
- Briefs written via CONCEPTOR/DIRECTOR LOOP coinage analysis → handed to Gemini CLI for web search → Omar evaluated returns → LOOP validated selections.
- Working log: `ART-BUYER-LOG.md` at project root — contains all briefs, search results, and final selections.
- Skill development observations captured for future Art Buyer skill in Git Mad SKILLS.

### Sourcing Method
- **Gemini CLI** conducted art buyer searches using non-stock channels: photographer portfolios, film stills (Genery), museum archives, photojournalism archives.
- **Claude Code** handled image downloading, Photoshop treatment guidance, CSS wiring, positioning calibration, and LOOP reviews.
- **Rule:** No stock. No AI-generated. Human-shot. Credit the photographer.

## Progress Log (March 22, 2026) — Landing Page Image Set QA + Randomization

### Tablet QA Complete — All Five Images
- `setHeadlineBackground()` upgraded with three-tier breakpoint: mobile (<=480px), tablet (481–1366px), desktop (>1366px). Tablet values optional per-word.
- PANDEMONEYUM watermark permanently removed from `pandemoneyum-bg-comp.jpg` via content-aware fill in Photoshop.
- `fitLockup()` portrait guard extended to `<=1024px` — 12+ char words scale to `14vw` on tablet portrait.

### Tablet Position Overrides
| Word | Tablet Override |
|---|---|
| BROUHAHAHA. | `auto 150% / 49% 80%` |
| HULLABAWHO. | `120% / center 100%` |
| PANDEMONEYUM. | `160% / 20% 45%` |
| RAZZZMATAZZZ. | `250% auto / 75% 15%` |
| FUNISSIMO. | (desktop values) |

### Randomization
- `nextHeadlineWord()` switched from sequential to random (`Math.random()`). Re-roll guard prevents same word on consecutive visits.
- BROUHAHAHA flash fix: `#initial-bg` starts at `opacity: 0`, JS sets image then fades to `0.44`.

### INFO Page Credits
- All five landing page photographers now credited: Pooneh Ghana, Chris Moore, Romano Cagnoni, Neil Leifer, Malick Sidibé.

### Tablet Portrait Nav Size — Site-Wide
- Nav name `0.9rem → 1.1rem`, menu trigger / info link `0.7rem → 0.85rem` across all pages in tablet portrait.

### Bug Fixes
- **Crayola PNG assets** — seven transparent PNGs were missing from git. HTML referenced `.png` but files were never committed. Fixed.
- **Panasonic BTS Tokyo images** — moved from Photonista to Luv (Tokyo content belongs in Luv project). Files renamed `Lumix_Photonista_BTS_Tokyo → Lumix_LuV_BTS_Tokyo`.

### Art Buyer Skill
- v1.0.0 written and deployed to `~/Git-Mad-SKILLS/skills/art-buyer/SKILL.md`.
- Covers: brief format (5 required fields), source channels (5 tiers), coinage protocol, accident protocol, provenance over search, selection rules (range as argument, the zag, matched density = matched feeling).
- Development log preserved at project root: `ART-BUYER-LOG.md`.

## Progress Log (March 23, 2026) — Site Promotion + Social Metadata
- **UNIVERSAL. RESOURCE. LOCATORS. — Social Launch Post:**
    - **File:** `Promotion/url-post.html` — 1080x1080 APEX-styled HTML/CSS canvas
    - **Design:** Griffith Gothic Condensed headline top-left, Lust Display italic URL list bottom-right, Jupiter planet (MIJ favicon, base64 embedded) as drifting period on LOCATORS, APEX corner frame, film grain, deep void.
    - **Two-post strategy (both live):** MIJ LinkedIn "Lost?" (12:04am March 23) + Personal LinkedIn "Remote-friendly?" (1:09pm March 23). Same image, staggered timing.
- **Social Metadata Overhaul:**
    - **Landing page `<meta name="description">`** updated from placeholder to production copy.
    - **Page-specific OG images deployed:** Landing, Choice Cuts, Long Pour, Info, Remember We.
- **Remember We:** Full OG block added; `nav-name-reveal.js` wired for OMAR, THE CREATIVE transformation.

## Progress Log (March 24, 2026) — EXHIBITS Gallery + Sound + System Pruning

### EXHIBITS Gallery Mode (NEW Feature)
- **Concept:** Replaced the direct-to-carousel EXHIBITS link with a curated "Gallery Map" (`exhibits.html`).
- **Layout:** Implemented a 12x12 asymmetrical grid inside the Observatory frame. 
- **Aesthetic:** Added full-bleed "Red Velvet Curtain" background (`exhibits-bg.jpg`) with a ghosted, projected "EXHIBITS" watermark (`mix-blend-mode: screen`).
- **Zero-Crop Interaction:** Switched to `object-fit: contain`. Hovering over a thumbnail blurs the image and reveals the Project Brand (Ruby Red) and Subtitle (White Lust) in a centered lockup.
- **Responsive Architecture:**
    - **Tablet Landscape:** Precise match to landing page frame and HUD.
    - **Portrait (Tablet/Mobile):** "Contact Sheet" layout with tiny, staggered thumbnails fitting on a single screen. Labels anchored bottom-left.
    - **Mobile Landscape:** Pure typographic index. Thumbnails hidden to prioritize readability on short viewports.

### Sound Design Stabilization
- **Projector Sound:** Re-activated the "reel loading" projector sound for the Exhibits transition. 
- **Arrival Logic:** Implemented a robust `pageshow` and interaction trigger in `exhibits.html` to ensure the sound fires on every visit, bypassing Safari's aggressive audio blocking.
- **Hasselblad Shutter:** Restored tactile audio feedback when navigating project-to-project in the main carousel.

### UX & UI Refinements
- **Deep-Linking:** Implemented `?p=N` parameter logic in `index.html`. Clicking a thumbnail in the gallery drops the user directly into that project's true state with a "Blackout Protocol" to prevent landing page flashes.
- **Button Contrast:** `WATCH/LEARN` buttons updated to crisp White with Ruby Red hover states across the site.
- **Centering Logic:** Enhanced `fitLockup()` to measure both Title and Subtitle widths, ensuring perfect horizontal centering for projects with wide subheads (MBK, Bud Light).
- **Landing Randomizer:** Separated landing background/word randomization from carousel logic via `isProjectState` flag. Clicking the background now refreshes the landing page instead of entering the reel.

### System & Repository Health
- **Asset Pruning:** Surgically removed over 4GB of non-site "baggage" (PSDs, high-res videos, research archives).
- **History Purge:** Ran `git filter-branch` to permanently scrub binary bloat from the git record.
- **Git State:** Repository size reduced from 8.1GB to ~768MB, successfully enabling pushes to GitHub again.
- **Cleanup:** Purged legacy `reels.html` and updated `Remember We` menu links.

## Roadmap for Next Session
1. **Cover letter + resume redesign** — apply Observatory design system to job application materials.
2. **X / IG versions** — post UNIVERSAL. RESOURCE. LOCATORS. image to remaining platforms.

## Completed (March 23, 2026)
- **Site promotion launch post** — UNIVERSAL. RESOURCE. LOCATORS. designed, two LinkedIn posts live.
- **Social metadata overhaul** — page-specific OG images, landing description, Remember We full OG block + nav fix.
- **Art Buyer dossier** — five-image cultural context report for landing page conversations.
- **LinkedIn About copy** — refined to align with site INFO page.

## Completed (March 22, 2026)
- **Mobile QA sweep** — Johnnie Walker and all remaining Choice Cuts pages complete.
- **Credits Sweep** — All open credits in `CREDITS.md` filled in and propagated to HTML.
- **iOS background fix** — Fixed div pattern applied to all remaining pages.
- **Landing page image set** — five backgrounds (one per headline word), fully QA'd across all viewports.
- **Art Buyer skill v1.0.0** — written and deployed to `~/Git-Mad-SKILLS/skills/art-buyer/SKILL.md`.
