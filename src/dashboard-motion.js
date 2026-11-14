/* Dashboard motion: window.DashMotion
   start()   called by initIntro() next to DashIntro.startClip(), when the intro
             starts (never when it is skipped). Sweeps the gauge needles
             0 -> 0.6 -> rest over 1400 ms.
   The car moves only while the scene's clip plays: html.dash-moving, set by
   dashboard-intro.js. The needles' rest values, their 1500 ms ease, the
   wander and the minimap's roll are CSS (dashboard-motion.css) reading that
   class. Script only steps the sweep's stages: nothing runs per frame.
   The doll (see Doll) is the one per-frame loop, and only with a mouse.
   springStep(state, target)  one 1/60 s step of the doll's spring (pure). */
(function () {
    'use strict';

    // Gauges
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

    // Doll
    // With a mouse, the doll leans toward the cursor on a spring. The first
    // mouse pointermove adds .dash-doll-follow to .dash-doll: the CSS dance
    // and hop stop and the top piece turns by --doll-lean (degrees, written
    // here once a frame). A mouse passing near the doll kicks it; after 4 s
    // with no mouse movement it sways about 0. Touch, and a visitor who never
    // moves a mouse, keep the dance. One requestAnimationFrame loop, fixed
    // 1/60 s steps from a time accumulator, at most 5 a frame. It stops, with
    // its listener, when the push-in starts; dash-sway-hard takes over there,
    // as before.
    var LEAN = 12;              // degrees, at full reach
    var REACH = 0.35;           // of innerWidth, from the doll's centre to full reach
    var STEP = 1000 / 60;       // ms
    var MAX_STEPS = 5;          // a frame
    var NEAR = 90;              // px from the doll's rect: a pass this close kicks
    var KICK = 4;               // added to v, against the cursor's travel
    var KICK_GAP = 600;         // ms, at most one kick per
    var IDLE_AFTER = 4000;      // ms with no mouse movement
    var SWAY = 2;               // degrees, the idle sway
    var SWAY_PERIOD = 3000;     // ms

    // v += (target - lean) * 0.08 - v * 0.14; lean += v. A small overshoot
    // and a wobble. Returns a new state.
    function springStep(state, target) {
        var v = state.v + (target - state.lean) * 0.08 - state.v * 0.14;
        return { lean: state.lean + v, v: v };
    }

    function followDoll() {
        var root = document.documentElement;
        var doll = document.querySelector('.dash-doll');
        if (!doll) return;
        var spring = { lean: 0, v: 0 };
        var aim = 0;
        var lastMove = 0;
        var lastKick = -Infinity;
        var lastX = null;
        var following = false;
        var raf = 0;
        var then = null;
        var acc = 0;

        function frame(now) {
            if (then !== null) acc = Math.min(acc + Math.max(0, now - then), MAX_STEPS * STEP);
            then = now;
            var idle = now - lastMove - IDLE_AFTER;
            var target = idle < 0 ? aim : SWAY * Math.sin(2 * Math.PI * idle / SWAY_PERIOD);
            while (acc >= STEP) {
                spring = springStep(spring, target);
                acc -= STEP;
            }
            doll.style.setProperty('--doll-lean', Math.round(spring.lean * 1000) / 1000 + 'deg');
            raf = requestAnimationFrame(frame);
        }
        // The doll's rect is read here, on the pointer's moves, never per frame.
        function onMove(e) {
            if (e.pointerType !== 'mouse') return;
            var t = performance.now();
            var x = e.clientX;
            var y = e.clientY;
            var r = doll.getBoundingClientRect();
            var reach = (x - (r.left + r.width / 2)) / (REACH * window.innerWidth);
            aim = Math.max(-1, Math.min(1, reach)) * LEAN;
            lastMove = t;
            // A kick away from the cursor's travel when it passes within NEAR
            // of the doll's rect (0 inside it); none for a purely vertical move.
            var dx = lastX === null ? 0 : x - lastX;
            lastX = x;
            var gx = Math.max(r.left - x, 0, x - r.right);
            var gy = Math.max(r.top - y, 0, y - r.bottom);
            if (dx !== 0 && Math.sqrt(gx * gx + gy * gy) < NEAR && t - lastKick >= KICK_GAP) {
                spring.v += -KICK * (dx > 0 ? 1 : -1);
                lastKick = t;
            }
            if (!following) {
                following = true;
                doll.classList.add('dash-doll-follow');
                raf = requestAnimationFrame(frame);
            }
        }
        function stop() {
            watch.disconnect();
            document.removeEventListener('pointermove', onMove);
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        }
        var watch = new MutationObserver(function () {
            if (root.classList.contains('dash-pushing') || !root.classList.contains('dash-intro')) stop();
        });
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        document.addEventListener('pointermove', onMove);
    }

    function start() {
        sweepGauges();
        followDoll();
    }

    window.DashMotion = { start: start, springStep: springStep };
})();
