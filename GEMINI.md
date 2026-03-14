# GEMINI.md — Project Context for Omar, the Creative

## Project Status
- **Last Updated:** March 4, 2026
- **Current Task:** Favicon / Site Icon Resolution (Completed)

## Technical Decisions & Memory

### Favicon / Site Icon (Mobile Safari Cache Bug)
- **Problem:** Mobile Safari was persistently showing an old Squarespace-era favicon even after updating Semplice settings and clearing browser cache. Firefox and Desktop browsers showed the correct icon.
- **Root Cause:** iOS Safari uses an aggressive, separate internal database for favicons and `apple-touch-icon` metadata that is not always cleared by standard cache deletion.
- **Resolution:**
  1. **WordPress Site Icon:** Logged into the WordPress dashboard via mobile (which bypassed the Semplice-only restrictions encountered on desktop) to update the **Appearance > Customize > Site Identity > Site Icon**.
  2. **Cache Busting:** Used versioning (`?v=3`) in the header code to force Safari to treat the icon as a new asset.
  3. **Metadata Force:** Added explicit `apple-touch-icon` and `shortcut icon` links to the global Semplice Header Custom Code (documented in `GLOBAL-CUSTOM-HEAD.md`).

### Deployment Context
- **Hosting:** Flywheel
- **CMS:** Semplice 7 on WordPress
- **DNS/Domain:** Squarespace (Current Registrar)
