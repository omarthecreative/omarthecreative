// nav-name-reveal.js — Nav name unlock + menu sound on all sub-pages
(function () {
    function applyNavReveal() {
        var el = document.querySelector('.nav-name');
        if (!el) return;
        if (el.dataset.revealApplied) return;
        
        var viewed = JSON.parse(localStorage.getItem('omar_viewed') || '[]');
        if (viewed.length === 0) return;

        el.dataset.revealApplied = "true";
        
        // Support both simple text and multi-span structures
        var last = el.querySelector('.name-last');
        var space = el.querySelector('.name-space');
        var suffix = el.querySelector('.name-suffix');

        if (last && suffix) {
            // Already has spans, just hide/show
            if (last) last.style.display = 'none';
            if (space) space.style.display = 'none';
            if (suffix) {
                suffix.style.display = 'inline';
                suffix.style.opacity = '1';
                suffix.style.transform = 'translateX(0)';
            }
        } else {
            // Legacy text-only, replace content
            el.textContent = 'OMAR, THE CREATIVE';
        }
    }

    function wireMenuSound() {
        var t = document.querySelector('.menu-trigger');
        if (t) t.addEventListener('click', function () {
            if (typeof ApexSound !== 'undefined') {
                ApexSound.init();
                ApexSound.play('door');
            }
        });
    }

    // Global Exhibits transition with sound
    window.playExhibitsSound = function(e, url) {
        if (e) e.preventDefault();
        if (typeof ApexSound !== 'undefined') {
            ApexSound.init();
            ApexSound.play('projector', 1.0);
        }
        setTimeout(function() {
            window.location.href = url;
        }, 800);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyNavReveal();
            wireMenuSound();
        });
    } else {
        applyNavReveal();
        wireMenuSound();
    }
})();
