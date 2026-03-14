# GEMINI.md — Project Context for Omar, the Creative

## Project Status
- **Last Updated:** March 14, 2026 (Evening)
- **Current Task:** Apex Migration / Interactive Core Complete

## Progress Log (March 14, 2026)
- **Deep Cuts Migration:**
    - Built `src/deep-cuts.html` grid index with category filtering.
    - Migrated first project: Disney Parks & Resorts "Be Our Guest."
    - Established `project-template.html` and `project-page.css` for 4-column editorial layout.
- **Long Copy Template:**
    - Built `src/long-copy.html` index for editorial essays.
    - Migrated inaugural essay: "Remember WE" (Tribute to Warren Eakins).
    - Preserved sacrosanct custom logo (Brothers/Stencil/Script) and original Typekit kits (`fqr6eyz`, `shz5hny`).
- **Interactive HUD & Tracking:**
    - Implemented Live Camera HUD in `src/index.html` corner frame.
    - Features: Timecode `[ TC ]`, Battery `[ BAT ]` (progress %), and clickable `[ LUT ]` toggle.
    - Logic: `localStorage` tracks 10 content milestones (7 videos, Info, 1 Deep Cut, 1 Long Copy).
    - Reward: Viewing 1+ item unlocks `[ LUT: RUBY ]` toggle; 100% completion unlocks `[ STATUS: LOCKED ]` (Picture Lock).
- **Advanced "Learn" Modals:**
    - Redesigned Intel Overlay with scrollable manifestos.
    - Restored "American Haiku" poem-like line breaks for all project descriptions.
    - Added Credits Drawer triggered by `Enter` key shorthand: `[ ↵ // CREDITS ]`.
    - Added "Shooting Script" discovery layer triggered by `S` key: `[ S // SCRIPT ]`.
- **Responsiveness & UX:**
    - Fine-tuned all layouts for iPad Pro (Landscape) and Mobile Portrait.
    - Fixed "OMAR SILWANY" header size and footer overlap issues on smaller viewports.
    - Implemented hierarchical `Escape` key navigation (Levels: Project/Essay -> Section Index -> Landing).
    - Added elegant HUD-styled **`[ TOP ]`** back-to-top buttons.
- **Utility & Metadata:**
    - Contact link now copies email to clipboard with visual `[ COPIED ]` feedback.
    - Added Open Graph and Twitter metadata with high-impact "BROUHAHAHA" landing screenshot.

## Technical Decisions
- **Color:** Finalized Ruby Red at `#FF0000` with `rgba(255, 0, 0, 0.8)` glow for maximum cinematic impact.
- **Typography:** Verified `text-wrap: pretty` and non-breaking spaces across INFO to eliminate widows/orphans.
- **Interactivity:** HUD elements tucked inside frame corners on mobile for "mechanical UI" feel.

## Roadmap for Next Session
1/ **Deep Cuts Completion:** Batch-migrate the remaining 20 lessons using established template.
2/ **Viewfinder Overlays:** Implement interactive crosshair/line overlays for project hover states.
3/ **Script Content:** Source or create verified transcripts for all featured video shooting scripts.
4/ **Performance Audit:** Review asset weight (`og-image.png`, background stills) for mobile load times.
