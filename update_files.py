import os
import re

files = [
    "src/choice-cuts/amex-moments.html",
    "src/choice-cuts/audi-truth-be-bold.html",
    "src/choice-cuts/balvenie-patience.html",
    "src/choice-cuts/bentley-studio.html",
    "src/choice-cuts/chase-blue.html",
    "src/choice-cuts/crayola-64-days.html",
    "src/choice-cuts/disney-be-our-guest.html",
    "src/choice-cuts/espolon-tequila.html",
    "src/choice-cuts/glenfiddich-original.html",
    "src/choice-cuts/google-wonderland.html",
    "src/choice-cuts/guinness-amplify.html",
    "src/choice-cuts/honda-hybrids.html",
    "src/choice-cuts/johnnie-walker-conquista.html",
    "src/choice-cuts/kraft-dish.html",
    "src/choice-cuts/obama-foundation.html",
    "src/choice-cuts/panasonic-luv.html",
    "src/choice-cuts/panasonic-photonista.html",
    "src/choice-cuts/project-rock.html",
    "src/choice-cuts/skyy-vodka.html",
    "src/choice-cuts/stoli-night-edition.html",
    "src/choice-cuts/verizon-droid.html"
]

zero_flash_reveal_script = """<script>
        (function() {
            var v = JSON.parse(localStorage.getItem('omar_viewed') || '[]');
            if (v.length > 0) {
                document.documentElement.classList.add('name-unlocked');
            }
        })();
    </script>"""

nav_css_block = """
        .nav-name {
            position: fixed;
            top: 4rem;
            left: 4rem;
            color: white;
            text-decoration: none;
            font-family: var(--serif);
            font-size: 1.5rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-weight: 900;
            font-style: normal;
            z-index: 10000;
            pointer-events: auto;
        }
        .name-suffix { display: none; }
        .name-unlocked .name-last, .name-unlocked .name-space { display: none; }
        .name-unlocked .name-suffix { display: inline; }
"""

standard_nav_html = """    <nav class="apex-nav">
        <a href="../index.html" class="nav-name">
            OMAR<span class="name-space"> </span><span class="name-last">SILWANY</span><span class="name-suffix">, THE CREATIVE</span>
        </a>
        <div class="menu-trigger" onclick="toggleMenu(true)">[ MENU ]</div>
    </nav>"""

def update_file(file_path):
    print(f"Updating {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update <head>
    # Remove Google Fonts link
    content = re.sub(r'<link href="https://fonts.googleapis.com/css2\?family=[^>]+>', '', content)
    
    # Ensure Adobe Typekit link is present
    if 'https://use.typekit.net/niv4qrq.css' not in content:
        content = content.replace('<link rel="stylesheet" href="../base.css">', '<link rel="stylesheet" href="https://use.typekit.net/niv4qrq.css">\\n    <link rel="stylesheet" href="../base.css">')

    # Replace zero-flash reveal script
    # Matches the single-line version
    content = re.sub(r'<script>\(function\(\)\{var v=JSON.parse\(localStorage.getItem\("omar_viewed"\)\|\|"\[\]"\);if\(v.length>0\)document.documentElement.classList.add\("name-unlocked"\);\}\)\(\)</script>', zero_flash_reveal_script, content)

    # 2. Update CSS in <style>
    if '.nav-name' not in content:
        # Add after </style>
        content = content.replace('</style>', nav_css_block + '    </style>')
    else:
        # If somehow it's there (shouldn't be based on grep), we'd need more logic, but grep said no matches for rule.
        pass

    # 3. Standardize nav-name HTML
    # Matches the multi-line nav structure
    nav_pattern = re.compile(r'<nav class="apex-nav">.*?</nav>', re.DOTALL)
    content = nav_pattern.sub(standard_nav_html, content)

    # 4. Font Tokens
    content = content.replace('var(--font-serif)', 'var(--serif)')
    content = content.replace('var(--font-mono)', 'var(--mono)')
    content = content.replace('var(--font-display)', 'var(--display)')

    # Special case for disney-be-our-guest.html
    if 'disney-be-our-guest.html' in file_path:
        content = content.replace("font-family: 'Titan One', cursive !important;", "font-family: var(--display) !important;")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for file in files:
    update_file(file)
