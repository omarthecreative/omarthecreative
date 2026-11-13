/* Dashboard intro: window.DashIntro
   mount()        places the live grid in the dashboard's screen frame (adds html.dash-intro)
   pushIn(onDone) pushes the scene in until the screen's edges meet the window's,
                  then removes the intro layer and calls onDone once.
   Geometry lives in dashboard-intro.css; this file only sets the two
   artwork scales and runs the state changes. */
(function () {
    'use strict';

    var PUSH_TIMEOUT_MS = 1300; // push-in is 1000ms; finish even if transitionend never fires
    var root = document.documentElement;
    var mounted = false;
    var state = 'idle'; // idle -> pushing -> done

    function isPhone() {
        return window.matchMedia('(max-width: 760px)').matches;
    }

    function setScales() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        root.style.setProperty('--dash-fit', String(Math.min(w / 1440, h / 900)));
        var shield = document.getElementById('dash-shield');
        // offsetHeight is layout size, unaffected by the push-in transform.
        var shieldPx = shield ? shield.offsetHeight : 0;
        root.style.setProperty('--dash-ss', String(shieldPx / (isPhone() ? 260 : 400)));
    }

    // Size the artwork now, before first paint. This script loads after the
    // splash markup, so #dash-shield exists. Waiting for mount() showed the
    // CSS default scale (1) first, and the doll and banner visibly shrank.
    setScales();
    window.addEventListener('resize', setScales);

    function mount() {
        if (mounted) return;
        mounted = true;
        setScales();
        root.classList.add('dash-intro');

        // Wire Omar is a real link: keep its click and Enter away from the
        // page's document-level skip handlers so it navigates.
        var wire = document.getElementById('dash-wire');
        if (wire) {
            wire.addEventListener('click', function (e) { e.stopPropagation(); });
            wire.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') e.stopPropagation();
            });
        }
    }

    function pushIn(onDone) {
        if (state !== 'idle') return;
        state = 'pushing';

        var portal = document.getElementById('portal');
        var splash = document.getElementById('standoff-splash');
        var timer = null;

        function finish() {
            if (state !== 'pushing') return;
            state = 'done';
            clearTimeout(timer);
            if (portal) portal.removeEventListener('transitionend', onEnd);
            document.removeEventListener('visibilitychange', onHidden);
            window.removeEventListener('resize', setScales);
            root.classList.remove('dash-intro', 'dash-pushing');
            if (splash) splash.style.display = 'none';
            if (typeof onDone === 'function') onDone();
        }
        function onEnd(e) {
            if (e.target === portal && e.propertyName === 'transform') finish();
        }
        // Hidden tabs throttle timers and skip transitions: land now.
        function onHidden() {
            if (document.hidden) finish();
        }

        if (portal) portal.addEventListener('transitionend', onEnd);
        document.addEventListener('visibilitychange', onHidden);
        timer = setTimeout(finish, PUSH_TIMEOUT_MS);
        if (!mounted || document.hidden) {
            // Nothing to push into, or nobody watching: land immediately.
            finish();
            return;
        }
        root.classList.add('dash-pushing');
    }

    window.DashIntro = { mount: mount, pushIn: pushIn };
})();
