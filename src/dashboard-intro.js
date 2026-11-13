/* Dashboard intro: window.DashIntro
   mount()        places the live grid in the dashboard's screen frame (adds html.dash-intro)
   pushIn(onDone) pushes the scene in until the screen's edges meet the window's,
                  then removes the intro layer and calls onDone once.
   applyScene()   picks a scene and a banner line from window.DashScenes
                  (dashboard-scenes.js) and writes them into the intro markup.
                  Runs once at load, on a first visit, while the page is dark.
   localDate, pickScene, liveBanner, pickLine: the pure parts of that pick.
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

    // — Scenes and banners —
    var DEFAULT_LINE = 'HAVE TASTE. WILL TRAVEL.';

    function readStore(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeStore(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    }
    function pickFrom(list, rnd) {
        var i = Math.floor(rnd() * list.length);
        return list[Math.min(Math.max(i, 0), list.length - 1)];
    }

    // 'YYYY-MM-DD' for this moment in that time zone. Throws on an unknown zone.
    function localDate(now, timezone) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(now);
    }

    // One scene at random, never the one shown last time when there is a choice.
    function pickScene(scenes, lastId, rnd) {
        var pool = (Array.isArray(scenes) ? scenes : []).filter(function (s) {
            return s && typeof s.id === 'string' && s.id;
        });
        if (pool.length > 1 && lastId) {
            var others = pool.filter(function (s) { return s.id !== lastId; });
            if (others.length) pool = others;
        }
        return pool.length ? pickFrom(pool, rnd) : null;
    }

    function usableLines(lines) {
        return Array.isArray(lines) ? lines.filter(function (l) { return typeof l === 'string' && l.trim(); }) : [];
    }

    // The banner flying over this scene today, in the scene's own time zone.
    // On overlap, the one that started later wins.
    function liveBanner(banners, scene, now) {
        if (!Array.isArray(banners) || !scene) return null;
        var today;
        try { today = localDate(now, scene.timezone); } catch (e) { return null; }
        var live = null;
        banners.forEach(function (b) {
            if (!b || b.scene !== scene.id || !usableLines(b.lines).length) return;
            if (typeof b.start !== 'string' || typeof b.end !== 'string') return;
            if (b.start <= today && today <= b.end && (!live || b.start >= live.start)) live = b;
        });
        return live;
    }

    // One line at random, never the one shown last time when there is a choice.
    function pickLine(lines, last, rnd) {
        var pool = usableLines(lines);
        if (pool.length > 1 && last) {
            var others = pool.filter(function (l) { return l !== last; });
            if (others.length) pool = others;
        }
        return pool.length ? pickFrom(pool, rnd) : DEFAULT_LINE;
    }

    var scene = null; // the scene on screen, once applyScene has run

    // Never throws. On any failure the markup stays as written: the drawn scene
    // and the headline.
    function applyScene(now) {
        var fallback = { sceneId: null, line: DEFAULT_LINE };
        try {
            var data = window.DashScenes;
            if (!data) return fallback;
            var picked = pickScene(data.scenes, readStore('omar_last_scene'), Math.random);
            if (!picked) return fallback;
            var banner = liveBanner(data.banners, picked, now || new Date());
            var line = banner ? pickLine(banner.lines, readStore('omar_last_line'), Math.random) : DEFAULT_LINE;

            var headline = document.querySelector('.dash-headline');
            var shield = document.getElementById('dash-shield');
            if (headline) headline.textContent = line;
            if (shield) shield.setAttribute('data-scene', picked.id);
            writeStore('omar_last_scene', picked.id);
            writeStore('omar_last_line', line);
            scene = picked;
            return { sceneId: picked.id, line: line };
        } catch (e) {
            return fallback;
        }
    }

    if (root.classList.contains('dash-first')) applyScene();

    window.DashIntro = {
        mount: mount,
        pushIn: pushIn,
        applyScene: applyScene,
        localDate: localDate,
        pickScene: pickScene,
        liveBanner: liveBanner,
        pickLine: pickLine,
        DEFAULT_LINE: DEFAULT_LINE
    };
})();
