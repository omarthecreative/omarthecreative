# OmarTheCreative.com - Product Requirements Document

## **Project Overview:**
The goal of this project is to refresh OmarTheCreative.com portfolio website with a Brutalist-inspired intro section (Systemantics style) and featured projects displayed in an Eduardo Gomes-inspired zigzag layout. Individual project pages feature an American Haiku-inspired overlay UI with cinematic viewfinder controls. 

The Home page copy exemplifies Omar's distinctive copywriting approach as a mentee of A.R. Ammons and practitioner of Orwell's emphasis on clarity, brevity, and impact in English language. The tone is deliberately creative copy—poetic, punchy, and provocative—NOT case-study speak. In contrast, the INFO page serves as a crucial component, presenting a more CV-like narrative that encapsulates Omar's 20+ year career journey from Branding to Advertising, providing depth and context to his evolution as a Creative Director. 

The site showcases high-profile brand campaign work for enterprise clients and positions Omar Silwany as a premium creative consultant through sophisticated writing, editorial design and UI/UX. A responsive site has been thoughtfully engineered for multiple breakpoints, ensuring optimal experiences across all devices from iPhone SE to iPad Pro to desktop displays.

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
  - Korean font for 안녕하세요 button (R1-RCM project)

### **Milestone 3: INFO Page** ✅ COMPLETE
- Personal narrative spanning 20+ year career
- CV-like professional presentation
- Client logos and credentials
- Contact information with email copy function
- Freight Sans Pro throughout (no Brothers font)

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
- **Copy:** Healthcare meets defense intelligence. What could go wrong? We didn't merge two brands. We crashed them together. Called it R37. Made AI sound dangerous again. Turns out that's exactly what healthcare needed.

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
- **Production:** omarthecreatice.com

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
Exception: HELLO button uses Korean language font (Noto Sans KR)
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
- Special CSS file manages these overrides

### **File Architecture:**

#### **Global Files:**
- `global-css-v1.6d.22.css` - Main stylesheet (latest version)
- `global-js-v200.js` - Main JavaScript (latest version)

#### **Page-Specific HTML:**
- `OmartheCreativeHOMEpageHTML.html` - Homepage structure
- `samsung-project-fixed.html` - Samsung Study template
- `samsung-tomorrow-project.html` - Samsung Tomorrow template
- `mbk-project-fixed.html` - MBK Alliance page
- `pixel-project-fixed.html` - Google Pixel page  
- `r1-rcm-project-fixed.html` - R1-RCM page (grey controls)
- `legence-project-fixed.html` - Legence page
- `info-page.html` - INFO/About page

#### **Project-Specific CSS:**
- `samsung-project.css` - Samsung Study styles
- `samsung-tomorrow-project.css` - Samsung Tomorrow styles
- `mbk-project.css` - MBK styles
- `pixel-project.css` - Pixel styles
- `r1-rcm-project.css` - R1-RCM styles (grey overrides)
- `legence-project.css` - Legence styles

## **Implementation Workflow**

### **For New Projects:**
1. Duplicate closest matching project template
2. Update Vimeo video ID
3. Modify project-specific details
4. Test across all breakpoints
5. Update navigation counters

### **For Homepage Updates:**
1. Edit HTML block in Semplice
2. Update project order if needed
3. Ensure GIF paths are correct and loading

### **For Global Updates:**
1. Create new version number
2. Test changes locally before deploying
3. Maintain archive versions for rollback
4. Comment all custom code sections
5. Follow existing naming conventions

### **Project CSS Management:**
- Standard template can be copied between similar projects
- Always test R1-RCM with grey controls on white video
- Samsung projects use standard landscape template

### **For Semplice Updates:**
1. Always use HTML blocks (not visual editor)
2. Keep Global CSS/JS separate from Semplice styles
3. Use custom classes with `omar-` prefix
4. Avoid modifying Semplice core files

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

### **Testing Requirements:**

#### **Browser Compatibility:**
- [ ] Chrome 90+
- [ ] Safari 14+
- [ ] Firefox 88+
- [ ] Edge 90+
- [ ] Mobile Safari iOS 14+
- [ ] Chrome Mobile Android 10+

#### **Device Testing:**
- [ ] iPhone SE/8 (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone Pro Max (428px width)
- [ ] iPad Mini (768px portrait, 1024px landscape)
- [ ] iPad Pro 11" (834px portrait, 1194px landscape)
- [ ] iPad Pro 12.9" (1024px portrait, 1366px landscape)
- [ ] Desktop 1440px (MacBook Pro)
- [ ] Desktop 1920px (Standard monitor)
- [ ] Desktop 2560px (Large display)
- [ ] Android phones (360px, 412px widths)

#### **Functionality Tests:**
- [ ] All navigation links work
- [ ] Project GIFs autoplay
- [ ] Vimeo videos load and play
- [ ] Keyboard shortcuts function
- [ ] Mobile touch gestures work
- [ ] Form submissions (contact)

## **Future Enhancements (v2.0)**

### **Phase 1 (Post-Launch):**
- Case study deep-dives for select projects
- Blog/thoughts section
- Newsletter integration

### **Phase 2 (6 months):**
- Interactive project filters
- Client testimonials
- Awards showcase
- Speaking engagements calendar

## **Resources & References**

### **Design Inspiration:**
- Systemantics.com (Brutalist intro)
- Eduardo Gomes portfolio (Project layout)
- American Haiku (Video interface)

### **Assets:**
- Fonts: Adobe Fonts (Brothers, Freight Sans Pro)
- Videos: Vimeo Pro account
- Images: Hosted on Flywheel

### **Documentation:**
- Semplice 7 docs: docs.semplice.com
- WordPress Codex: codex.wordpress.org
- Vimeo Player API: developer.vimeo.com

---

## **Client Information:**
**Omar Silwany**  
Creative Director & Writer  
Meanwhile In Jupiter LLC  
Portfolio: omarsilwany.com  
Staging: harmonicajaguar.flywheelsites.com

---

**Document Version:** 2.2  
**Last Updated:** August 18, 2025  
**Next Review:** Post-launch assessment