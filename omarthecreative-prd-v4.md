# OmarTheCreative.com - Product Requirements Document

## **Project Overview:**
The goal of this project is to refresh OmarTheCreative.com portfolio website with a Brutalist-inspired intro section (Systemantics style) and featured projects displayed in an Eduardo Gomes-inspired zigzag layout. Individual project pages feature an American Haiku-inspired overlay UI with cinematic viewfinder controls.

The Home page copy exemplifies Omar's distinctive copywriting approach as a mentee of A.R. Ammons and practitioner of Orwell's emphasis on clarity, brevity, and impact in English language. The tone is deliberately creative copy—poetic, punchy, and provocative—NOT case-study speak. In contrast, the INFO page serves as a crucial component, presenting a more CV-like narrative that encapsulates Omar's 20+ year career journey from Branding to Advertising, providing depth and context to his evolution as a Creative Director.

The site showcases high-profile brand campaign work for enterprise clients and positions Omar Silwany as a premium creative consultant through sophisticated writing, editorial design and UI/UX. A responsive site has been thoughtfully engineered for multiple breakpoints, ensuring optimal experiences across all devices from iPhone SE to iPad Pro to desktop displays.

**As of February 2026**, the site has expanded beyond the original portfolio scope to include two new sections:
- **Deep Cuts** — 20 project pages showcasing additional work
- **Long Copy** — an editorial writing section; inaugural post is *Remember WE*, a long-form tribute essay for Warren Eakins

## **Level:**
Medium to Advanced

## **Type of Project:**
Web Development, Portfolio Design, Brand Positioning

## **Skills Required:**
- Semplice 7 CMS    
- WordPress Development    
- CSS Architecture (Custom Properties, Layers)    
- Vanilla JavaScript    
- Responsive Design  
- Animation Implementation
- Performance Optimization
- SEO/AIO Implementation
- WCAG 2.1 AA Compliance

## **Key Features**

### **Milestone 1: Homepage Implementation** ✅ COMPLETE
- **Brutalist Intro Section:**
  - Animated text fragments: "I PUSH BRANDS OFF SLIDES ONTO STREETS & SCREENS"
  - Brothers typography used sparingly for maximum impact
  - Staggered entrance animations with hover effects
  - Bio text in Freight Sans Pro with personal narrative
  - Burnt orange (#D26446) accent on near-black (#050505) background

- **Featured Projects Gallery:**
  - 6 projects with animated GIFs
  - Eduardo Gomes-inspired alternating layout
  - Brothers for project titles, Freight Sans Pro for all other text
  - Creative copy approach: poetic, punchy headlines and descriptions
  - Projects display with role/year metadata
  - Smooth scroll animations

### **Milestone 2: Project Pages** ✅ COMPLETE
- **American Haiku Interface:**
  - Full-screen Vimeo video backgrounds
  - Viewfinder UI overlay with precise control positioning
  - Video controls (REW/PLAY/FST) centered over video
  - Progress bar spanning viewport width with duration counter
  - Project details drawer with burnt orange/white typography
  - Navigation between projects (arrow keys)
  - Time display (center right) and frame counter (bottom right)
  - Audio toggle with line art SVG sound waves (center left)
  - Interactive hints side-by-side (bottom left)
  - Korean font for 안녕하세요 button (creative easter egg)

### **Milestone 3: INFO Page** ✅ COMPLETE
- Opening animation: "OMAR SILWANY" displays for 2.5 seconds
- Personal narrative spanning 20+ year career
- CV-like professional presentation
- Client logos and credentials
- Contact information with email copy function (info@omarsilwany.com)
- Freight Sans Pro throughout (no Brothers font)
- Scroll-triggered reveal animations for sections

### **Milestone 4: Hamburger Navigation** ✅ COMPLETE (February 2026)
- Unified nav deployed across all pages: Home, Deep Cuts (20 project pages), Long Copy, Info
- Fixed position, `z-index: 9999`, full-width, transparent background
- Logo left / hamburger toggle right
- Dropdown menu: DEEP CUTS, LONG COPY, INFO
- Active link highlighted in burnt orange (`#D26446`) per section context
- Three nav variants: generic (no active), Deep Cuts active (hardcoded), Long Copy active (JS-detected)
- Source file: `long-copy/semplice/block-1-nav.html`

### **Milestone 5: Deep Cuts Section** ✅ COMPLETE (February 2026)
- 20 project pages showcasing additional creative work
- Hamburger nav with DEEP CUTS highlighted on all project pages
- Consistent with main portfolio visual system (Brothers, Freight Sans Pro, burnt orange)

### **Milestone 6: Long Copy Section** ✅ COMPLETE (March 2026)
- Editorial writing section for long-form essays and criticism
- **Index page** (`long-copy/index.html`) — follows main portfolio type and color system
  - **Refined March 2026:** Converted to Vanilla CSS (removed Tailwind dependencies) for better integration and performance.
  - **Layout:** Editorial-first approach (Text Left / Image Right) to prioritize writing over thumbnails.
  - **Fixes:** Resolved critical desktop scrolling issue caused by `overflow-x-hidden` flex wrappers.
  - **CMS Ready:** Stripped of redundant navigation and footer to function as a clean "middle block" in Semplice.
- **Post 01:** *Remember WE* — long-form tribute essay for Warren Eakins, art director
  - Typographically-driven dark design; each post gets its own visual identity
  - Three-font stencil/script system (Stencil Std, Octin Stencil, Dalliance Script, Tribute)
  - Full-width breakout technique to escape Semplice's column constraints
  - Live at omarthecreative.com/long-copy
- **Future posts:** each will define its own typographic and visual identity

---

## **Session Log: March 4, 2026**
- **Issue:** Long Copy index page was not scrollable below the fold on desktop.
- **Diagnosis:** Identified `overflow-x-hidden` on a `min-h-screen` flex wrapper was trapping the viewport.
- **Action:** 
  - Removed Tailwind CDN and converted the entire index to **Vanilla CSS**.
  - Stripped internal navigation and footer code to resolve "double logo" conflict with Semplice global nav blocks.
  - Added explicit `html, body { overflow-y: auto !important; height: auto !important; }` to force scrollability within CMS wrappers.
  - Corrected image path to production WordPress URL for "Remember WE" thumbnail.
  - Flipped layout to **Text Left / Image Right** per creative direction to prioritize the writing.
- **Result:** Index page is now a lightweight, scrollable, editorial-first middle block.

---

## **Milestone 7: Secret Modes (Easter Eggs)** ✅ COMPLETE (March 2026)
- **Fearless Mode:** A tribute to Alysa Liu's gold-winning performance at the 2026 Milan Cortina Winter Games.
  - Linked to the "Year of the Fire Horse" (2026) for explosive, creative energy.
  - Features a custom `/fearless` route redirecting to a dedicated home page mode with a full-screen video background of the routine.
  - Custom UI: "FEARLESS MODE" label and link to the full routine.
  - Social Campaign: Native video posts on LinkedIn and X featuring the 8-minute performance.
- **Bunny Mode:** Existing Bad Bunny-inspired secret mode (`/bunny`).
- **Wizard Mode:** Existing portfolio secret mode (`/wizard`).

## **Current Project Portfolio**

### **1. SAMSUNG**
- **Title:** Study is Better With Play
- **Role:** Creative Director, Writer
- **Year:** 2021
- **Copy:** We told students to make play work for them. Then proved it with pen spinning. Turned ADHD into a superpower. Made fidgeting fashionable. Convinced a generation that distraction is focus.

### **2. MBK ALLIANCE**
- **Title:** We Are The Ones
- **Role:** Creative Director, Writer  
- **Year:** 2017
- **Copy:** One voice becomes a movement. Obama listens. Curry takes note. Chance amplifies. And it all starts when a kid decides to speak. 50 million impressions. Zero paid media. Just truth traveling at the speed of culture.

### **3. GOOGLE PIXEL**
- **Title:** Lose The Flash
- **Role:** Creative Director, Writer
- **Year:** 2018
- **Copy:** Dracula sells cameras now. Queen provides the soundtrack. The flash is officially dead. We turned Pixel's Night Sight from a spec into a cultural moment. No technical jargon. Just vampires doing what they do best.

### **4. SAMSUNG**
- **Title:** Stay Ahead of Tomorrow
- **Role:** Creative Director, Writer
- **Year:** 2020
- **Copy:** Samsung wanted to sell 5G devices. We sold Gen Z their own skepticism instead. Let our hero argue with her future. Made global markets copy our playbook. Turns out that little 5G icon changes everything.

### **5. R1-RCM × PALANTIR**
- **Title:** Two Forces
- **Role:** Creative Director, Art & Copy
- **Year:** 2025
- **Copy:** Healthcare meets defense intelligence. What could go wrong? We didn't merge two brands. We crashed them together. Called it R37. Made billing, thrilling. Turns out bravado is exactly what healthcare needed.

### **6. LEGENCE**
- **Title:** Built For Building
- **Role:** Creative Director, Art
- **Year:** 2025
- **Copy:** We made infrastructure sexy. $5 billion sexy, to be exact. Turned mechanical, electrical, and plumbing into a rallying cry. Made engineers feel like astronauts. Helped a company nobody heard of become essential overnight.

## **Technical Specifications**

### **Platform:**
- **CMS:** Semplice 7 on WordPress
- **Hosting:** Flywheel
- **Domain Management:** Squarespace (URL/DNS)
- **Staging:** harmonicajaguar.flywheelsites.com
- **Production:** omarthecreative.com
- **Analytics:** Google Analytics 4 (integrated via Semplice)

### **Design System:**

#### **Typography - Sophisticated. Modern. Minimal.**
```css
/* Display Font - Used Sparingly */
--font-display: "brothers", sans-serif;
Usage: Home page headlines only (brutalist intro, project titles)
Weight: 900 (Black)

/* Primary Font - Everything Else */
--font-primary: "freight-sans-pro", sans-serif;
Usage: All body copy, navigation, INFO page, project descriptions
Weights: 300 (Light), 400 (Regular)

/* Monospace Font - UI Controls */
--font-mono: "Courier New", monospace;
Usage: Project page controls, time displays, frame counters
```

The typography strategy is deliberately restrained. Brothers font appears ONLY on the home page for maximum impact. All other text uses Freight Sans Pro for sophistication and readability.

#### **Color Palette:**
```css
--color-primary: #050505;      /* Near-black background */
--color-text: #FFFFFF;          /* White text */
--color-accent: #D26446;        /* Burnt orange - used sparingly */
--color-grey: #666666;          /* Grey for R1-RCM controls on white video */
--color-subtle: rgba(255, 255, 255, 0.7); /* Muted white for secondary text */
```

#### **Breakpoints:**
```css
/* Mobile First Approach */
@media (min-width: 390px)  /* iPhone 12+ */
@media (min-width: 428px)  /* iPhone Pro Max */
@media (min-width: 768px)  /* iPad Portrait */
@media (min-width: 1024px) /* iPad Landscape / Desktop */
@media (min-width: 1440px) /* Large Desktop */
```

### **Performance Requirements:**

#### **Target Metrics:**
- **First Contentful Paint:** <1.5s
- **Largest Contentful Paint:** <2.5s  
- **Time to Interactive:** <3.5s
- **Cumulative Layout Shift:** <0.1
- **First Input Delay:** <100ms
- **JavaScript bundle:** <50KB minified (down from ~200KB)
- **CSS bundle:** <30KB minified
- **Image optimization:** WebP with JPEG fallback
- **Video strategy:** Lazy load with poster frames

#### **Performance Optimization Techniques:**
- Critical CSS inlined in <head>
- Non-critical CSS loaded asynchronously
- JavaScript deferred and minified
- Images served via CDN with appropriate sizing
- Vimeo videos loaded on-demand
- Browser caching headers configured
- GZIP compression enabled

### **SEO Strategy:**

#### **Meta Structure:**
```html
<!-- Home Page -->
<title>Omar Silwany - Creative Director & Writer | Push Brands Into Culture</title>
<meta name="description" content="Premium creative consultant crafting brand campaigns that matter. Samsung, Google, MBK Alliance. Where poetry meets business strategy.">

<!-- Project Pages -->
<title>{Project Title} - {Client} | Omar Silwany Creative Director</title>
<meta name="description" content="{Project description excerpt - 155 chars max}">

<!-- INFO Page -->
<title>About Omar Silwany - 20+ Years Creative Leadership | Meanwhile In Jupiter</title>
<meta name="description" content="From Miami to NYC, branding to advertising. Cornell-educated, A.R. Ammons mentored. Available for projects that push brands into culture.">
```

#### **Open Graph & Social:**
```html
<meta property="og:type" content="website">
<meta property="og:title" content="{Page Title}">
<meta property="og:description" content="{Page Description}">
<meta property="og:image" content="{Project Thumbnail / Logo}">
<meta property="og:url" content="https://omarthecreatice.com/{page-slug}">
<meta name="twitter:card" content="summary_large_image">
```

#### **Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Omar Silwany",
  "jobTitle": "Creative Director & Writer",
  "worksFor": {
    "@type": "Organization",
    "name": "Meanwhile In Jupiter LLC"
  },
  "alumniOf": "Cornell University",
  "knowsAbout": ["Creative Direction", "Copywriting", "Brand Strategy"],
  "sameAs": [
    "https://omarsilwany.com",
    "https://linkedin.com/in/omarsilwany"
  ]
}
```

#### **Technical SEO:**
- XML sitemap auto-generated via Yoast SEO
- Canonical URLs set per page
- Clean URL structure: /project-name/
- 301 redirects for any changed URLs
- robots.txt properly configured
- SSL certificate active

### **AIO (AI Optimization) Strategy:**

#### **Content Structure for AI Understanding:**
```markdown
<!-- Semantic HTML5 -->
- Proper heading hierarchy (h1 > h2 > h3)
- <article> tags for projects
- <section> tags for major divisions
- <nav> for navigation elements
- <figure> and <figcaption> for images
- Descriptive alt text focusing on creative concept
```

#### **AI-Friendly Content Patterns:**
```javascript
// Project metadata structure
{
  "projectName": "Study is Better With Play",
  "client": "Samsung",
  "year": 2021,
  "role": ["Creative Director", "Writer"],
  "outcome": "Convinced a generation that distraction is focus",
  "approach": "Turned ADHD into a superpower",
  "category": "Brand Campaign"
}
```

#### **LLM Optimization:**
- Clear, contextual project descriptions
- Outcome-focused case study snippets
- Creative philosophy stated explicitly on INFO page
- Consistent terminology across all projects
- Natural language navigation labels
- Descriptive file names for all assets

### **Accessibility Standards (WCAG 2.1 AA):**

#### **Keyboard Navigation:**
- All interactive elements keyboard accessible
- Logical tab order throughout site
- Skip links for main content
- Focus visible indicators (2px burnt orange outline)
- Keyboard shortcuts documented (M for mute, arrows for navigation)

#### **Screen Reader Support:**
```html
<!-- ARIA Labels -->
<button aria-label="Toggle audio" class="audio-toggle">
<nav aria-label="Main navigation">
<section aria-labelledby="project-title">
<div role="region" aria-live="polite"> <!-- For dynamic updates -->
```

#### **Visual Accessibility:**
- Contrast ratio: 4.5:1 minimum (white on #050505 = 20.4:1 ✓)
- Burnt orange on black: 3.8:1 (decorative use only)
- Text sizing: Minimum 11px with user scalable
- No text in images
- Sufficient touch targets (44x44px minimum)

#### **Motion & Cognitive:**
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- Pause button for all auto-playing content
- No flashing content above 3Hz
- Clear, consistent navigation patterns
- Error messages with clear remediation

### **Global JavaScript v2.0 Architecture:**

#### **Clean Architecture (Target: ~1000 lines from 7000+):**
```javascript
/**
 * OmarTheCreative.com - Global JavaScript v2.0
 * Lean rebuild for Semplice 7
 * 
 * MODULAR STRUCTURE:
 * 1. Core Utilities (Safety & Helpers)
 * 2. Device Detection
 * 3. Page Router
 * 4. Animation Engine (Home)
 * 5. Video Controller (Projects)
 * 6. UI Components
 * 7. Initialization Orchestrator
 */

const Omar = {
    version: '2.0.0',
    
    // Single initialization
    init() {
        const page = this.detectPage();
        
        switch(page) {
            case 'home':
                this.initHome();
                break;
            case 'project':
                this.initProject();
                break;
            case 'info':
                this.initInfo();
                break;
        }
    },
    
    // Page-specific initialization
    initHome() {
        // Brutalist intro animations
        // Project gallery scroll reveal
    },
    
    initProject() {
        // R1-RCM detection (add class if needed)
        // Vimeo Player API integration
        // Video controls
        // Keyboard shortcuts
    },
    
    initInfo() {
        // May be handled by inline scripts
        // Or moved to global JS
    }
};
```

### **Project Page Specifications:**

#### **Standard Template (5 projects):**
- 16:9 landscape video
- Centered American Haiku controls
- White UI elements on dark video
- Standard progress bar at bottom

#### **R1-RCM Special Requirements:**
- White video background requires grey (#666666) UI elements
- All controls, borders, and interactive elements use grey on desktop
- Mobile portrait maintains white controls for consistency
- CSS being rebuilt with custom properties (separate task)

### **File Architecture:**

#### **Global Files:**
- `global-css-v1.6d.23.css` - Main stylesheet (current)
- `global-js-v200.js` - Current JavaScript (being replaced)
- `global-js-v2.0.js` - New lean JavaScript (to be created)

#### **Page-Specific HTML:**
- `OmartheCreativeHOMEpageHTML.html` - Homepage structure
- `OmartheCreativeINFOpageHTML.html` - INFO page with inline animations
- `samsung-project-fixed.html` - Samsung Study template
- `samsung-tomorrow-project.html` - Samsung Tomorrow template
- `mbk-project-fixed.html` - MBK Alliance page
- `pixel-project-fixed.html` - Google Pixel page
- `r1-rcm-project-fixed.html` - R1-RCM page (grey controls)
- `legence-project-fixed.html` - Legence page

#### **Long Copy Section (new February 2026):**
```
long-copy/
├── index.html                       ← Blog index (local dev)
├── post-01-remember-we.html         ← Remember WE post (local dev)
└── semplice/
    ├── block-1-nav.html             ← Hamburger nav — paste into any page
    └── post-01-remember-we.html     ← Remember WE (Semplice-ready)
```

#### **Project-Specific CSS:**
- `samsung-project.css` - Samsung Study styles
- `samsung-tomorrow-project.css` - Samsung Tomorrow styles
- `mbk-project.css` - MBK styles
- `pixel-project.css` - Pixel styles
- `r1-rcm-project.css` - R1-RCM styles (current 1000+ lines)
- `r1-rcm-project-clean.css` - R1-RCM rebuilt with CSS variables (to be created)
- `legence-project.css` - Legence styles

## **Implementation Workflow**

### **For JavaScript Rebuild:**
1. Archive v200 as `global-js-v200-archive.js`
2. Create v2.0 following clean architecture
3. Test each module in isolation
4. Integration test on staging
5. A/B test with select users
6. Full deployment with monitoring
7. Keep v200 available for 30-day rollback

### **For New Projects:**
1. Duplicate closest matching project template
2. Update Vimeo video ID
3. Modify project-specific details
4. Test across all breakpoints
5. Update navigation counters
6. Verify SEO/AIO metadata
7. Accessibility audit

### **For Homepage Updates:**
1. Edit HTML block in Semplice
2. Update project order if needed
3. Ensure GIF paths are correct and loading
4. Update schema markup if projects change

### **For Global Updates:**
1. Create new version number
2. Test changes locally before deploying
3. Maintain archive versions for rollback
4. Comment all custom code sections
5. Follow existing naming conventions
6. Update PRD documentation

### **For Semplice Updates:**
1. Always use HTML blocks (not visual editor)
2. Keep Global CSS/JS separate from Semplice styles
3. Use custom classes with `omar-` prefix
4. Avoid modifying Semplice core files
5. Test after WordPress/Semplice updates

## **Known Issues & Solutions**

### **Current Bugs:**

1. **Issue:** Project page videos not autoplaying
   - **Solution:** Add `&autoplay=1&muted=1&background=1` to Vimeo URLs

2. **Issue:** Mobile navigation overlapping content
   - **Solution:** Adjust z-index to 9000 and add backdrop blur

3. **Issue:** Eduardo Gomes layout breaking on tablet
   - **Solution:** Simplify to 2-column grid for tablets

4. **Issue:** American Haiku controls not showing on mobile
   - **Solution:** Create mobile-specific control layout

5. **Special Case:** R1-RCM white video background
   - **Solution:** Grey UI controls (#666666) implemented in dedicated CSS file
   - All controls, borders, and text use grey for visibility on desktop
   - Mobile maintains white controls
   - CSS being rebuilt with custom properties for efficiency

### **Testing Requirements:**

#### **Browser Compatibility:**
- [x] Chrome 90+
- [x] Safari 14+
- [x] Firefox 88+
- [x] Edge 90+
- [ ] Mobile Safari iOS 14+
- [ ] Chrome Mobile Android 10+

#### **Device Testing:**
- [ ] iPhone SE/8 (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone Pro Max (428px width)
- [ ] iPad Mini (768px portrait, 1024px landscape)
- [ ] iPad Pro 11" (834px portrait, 1194px landscape)
- [ ] iPad Pro 12.9" (1024px portrait, 1366px landscape)
- [x] Desktop 1440px (MacBook Pro)
- [x] Desktop 1920px (Standard monitor)
- [ ] Desktop 2560px (Large display)
- [ ] Android phones (360px, 412px widths)

#### **Functionality Tests:**
- [x] All navigation links work
- [x] Project GIFs autoplay
- [ ] Vimeo videos load and play with controls
- [ ] Keyboard shortcuts function (Space, M, Arrows)
- [ ] Mobile touch gestures work
- [ ] Email copy function (INFO page)
- [ ] Opening animation timing (2.5 seconds)

#### **Performance Tests:**
- [ ] Lighthouse score >90
- [ ] No JavaScript errors in console
- [ ] No layout shifts during load
- [ ] Videos load within 3 seconds
- [ ] Smooth animations (60fps)

#### **Accessibility Tests:**
- [ ] Keyboard navigation complete
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast passing
- [ ] Reduced motion respected

## **Development Checklist**

### **Pre-Development:**
- [x] PRD approved
- [x] Design system defined
- [x] Copy finalized
- [x] Assets collected
- [x] Staging environment ready

### **Development:**
- [x] Global CSS architecture
- [ ] Global JS v2.0 rebuild (IN PROGRESS)
- [x] Homepage implementation
- [x] Project pages (6 total)
- [x] Info page
- [x] Deep Cuts section (20 project pages)
- [x] Hamburger navigation (all pages)
- [x] Long Copy section — index page
- [x] Long Copy — Post 01: Remember WE
- [x] Secret Modes / Fearless Mode (Year of the Fire Horse)
- [ ] Long Copy — Post 02+ (ongoing)
- [ ] SEO implementation
- [ ] AIO optimization
- [ ] Accessibility audit
- [ ] Performance optimization

### **Pre-Launch:**
- [ ] Cross-browser testing
- [ ] Device testing
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Analytics setup
- [ ] 301 redirects configured
- [ ] SSL certificate verified
- [ ] Backup created

### **Launch:**
- [ ] DNS propagation
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Submit sitemap
- [ ] Announce launch

### **Post-Launch:**
- [ ] 24-hour monitoring
- [ ] Week 1 performance review
- [ ] User feedback collection
- [ ] Bug fixes if needed
- [ ] Performance optimization round 2

## **Future Enhancements (v2.0)**

### **Phase 1 (Post-Launch):**
- Case study deep-dives for select projects
- ~~Blog/thoughts section~~ → **COMPLETE: Long Copy section launched February 2026**
- Newsletter integration
- Performance monitoring dashboard

### **Phase 2 (6 months):**
- Interactive project filters
- Client testimonials
- Awards showcase
- Speaking engagements calendar
- Dynamic project loading (AJAX)

## **Resources & References**

### **Design Inspiration:**
- Systemantics.com (Brutalist intro)
- Eduardo Gomes portfolio (Project layout)
- American Haiku (Video interface)

### **Technical Resources:**
- Semplice 7 docs: docs.semplice.com
- WordPress Codex: codex.wordpress.org
- Vimeo Player API: developer.vimeo.com
- MDN Web Docs: developer.mozilla.org
- Can I Use: caniuse.com

### **Performance Tools:**
- PageSpeed Insights: pagespeed.web.dev
- WebPageTest: webpagetest.org
- GTmetrix: gtmetrix.com

### **Accessibility Tools:**
- WAVE: wave.webaim.org
- axe DevTools: deque.com/axe
- Lighthouse: built into Chrome DevTools

### **Assets:**
- Fonts: Adobe Fonts (Brothers, Freight Sans Pro)
- Videos: Vimeo Pro account
- Images: Hosted on Flywheel CDN
- Icons: Custom SVG library

---

## **Client Information:**
**Omar Silwany**  
Creative Director & Writer  
Meanwhile In Jupiter LLC  
Portfolio: omarsilwany.com  
Staging: harmonicajaguar.flywheelsites.com  
Email: info@omarsilwany.com

---

**Document Version:** 4.0
**Last Updated:** February 23, 2026
**Major Changes:** Added Deep Cuts milestone, Long Copy section milestone, hamburger nav milestone; updated file architecture with Long Copy files; updated CSS version to v1.6d.23; fixed production URL typo; moved Blog/thoughts from Future to Complete; updated Development Checklist
**Previous Version:** v3.0 (August 19, 2025) — Performance Requirements, SEO/AIO Strategy, Accessibility Standards, Global JS v2.0 Architecture
**Next Review:** Post JS rebuild implementation; Post 02 Long Copy launch

---

## **Sign-Off**

**Creative Director:** Omar Silwany  
**Technical Lead:** [Cursor Implementation]  
**QA Lead:** [Pending]  
**Accessibility Auditor:** [Pending]  

**Status:** Ready for Global JS v2.0 Development