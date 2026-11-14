/* Dashboard motion: window.DashMotion
   start()   called by initIntro() next to DashIntro.startClip(), when the intro
             starts (never when it is skipped). Sweeps the gauge needles
             0 -> 0.6 -> rest over 1400 ms.
   The car moves only while the scene's clip plays: html.dash-moving, set by
   dashboard-intro.js. The needles' rest values, their 1500 ms ease, the
   wander and the minimap's roll are CSS (dashboard-motion.css) reading that
   class. Script only steps the sweep's stages: nothing runs per frame. */
(function () {
    'use strict';

    // — Gauges —
    // Three classes on #dash-gauges, each added when the last stage's
    // transition ends: on (both needles up to 0.6), swept (down to rest),
    // settled (rest changes ease over 1500 ms, the wander starts). The revs
    // needle drives them: its targets never change mid-stage. Hidden gauges
    // (the drawn or tall look, or the intro gone mid-sweep) have no
    // transitions: they go straight to settled. No timers.
    function sweepGauges() {
        var svg = document.getElementById('dash-gauges');
        var revs = svg && svg.querySelector('.dash-gauge-revs');
        if (!revs || svg.classList.contains('dash-gauges-on')) return;
        var settle = function () {
            svg.classList.add('dash-gauges-on', 'dash-gauges-swept', 'dash-gauges-settled');
            revs.removeEventListener('transitionend', step);
            revs.removeEventListener('transitioncancel', step);
        };
        var step = function (e) {
            if (e.target !== revs || e.propertyName !== 'transform') return;
            if (e.type === 'transitionend' && !svg.classList.contains('dash-gauges-swept')) {
                svg.classList.add('dash-gauges-swept');
            } else {
                settle();
            }
        };
        // The wander's two custom properties must be registered (@property in
        // dashboard-motion.css) to animate smoothly; without that, no wander.
        if (window.CSS && typeof CSS.registerProperty === 'function') svg.classList.add('dash-gauges-wander');
        revs.addEventListener('transitionend', step);
        revs.addEventListener('transitioncancel', step);
        // Read the needle once, so the sweep starts from v = 0 as drawn.
        if (getComputedStyle(revs).transform === 'none' || getComputedStyle(svg).display === 'none') {
            settle();
            return;
        }
        svg.classList.add('dash-gauges-on');
    }

    function start() {
        sweepGauges();
    }

    window.DashMotion = { start: start };
})();
