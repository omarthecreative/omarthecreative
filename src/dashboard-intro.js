/* Dashboard intro: window.DashIntro
   mount()        places the live grid in the dashboard's screen frame (adds html.dash-intro)
   pushIn(onDone) pushes the scene in until the screen's edges meet the window's,
                  then removes the intro layer and calls onDone once.
   applyScene()   picks a scene and a banner line from window.DashScenes
                  (dashboard-scenes.js) and writes them into the intro markup.
                  Runs once at load, on a first visit, while the page is dark.
   startClip()    starts the scene's clip, if it has one and its still loaded.
                  Called when the hold starts, never when the intro is skipped.
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
            var clip = document.getElementById('dash-clip');
            if (clip && !clip.paused) clip.pause();
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

    var STILL_WAIT_MS = 1500; // longest the page stays dark waiting for a still

    var scene = null;        // the scene on screen, once applyScene has run
    var stillLoaded = false;

    // The still replaces the drawn scene only once it has loaded. The page
    // stays dark (html.dash-loading) until it does, for at most STILL_WAIT_MS.
    function showStill(src) {
        var still = document.getElementById('dash-still');
        var shield = document.getElementById('dash-shield');
        if (!still || !shield) return;
        var ready = new Promise(function (done) {
            still.addEventListener('load', function () {
                stillLoaded = true;
                still.hidden = false;
                shield.classList.add('dash-has-still');
                done();
            });
            still.addEventListener('error', function () {
                stillLoaded = false;
                still.hidden = true;
                shield.classList.remove('dash-has-still');
                done();
            });
        });
        holdDarkFor(ready);
        still.src = src;
    }

    // The page stays dark for this picture too, at most STILL_WAIT_MS.
    function holdDarkFor(ready) {
        var cap = new Promise(function (r) { setTimeout(r, STILL_WAIT_MS); });
        window.__dashPicsReady = Promise.all([
            window.__dashPicsReady || Promise.resolve(),
            Promise.race([ready, cap])
        ]);
    }

    // The scene's minimap replaces the inline one once it loads. On an error
    // the inline minimap stays.
    function showMinimap(src) {
        var box = document.querySelector('.dash-minimap');
        if (!box) return;
        var img = new Image();
        img.alt = '';
        holdDarkFor(new Promise(function (done) {
            img.onload = function () {
                while (box.firstChild) box.removeChild(box.firstChild);
                box.appendChild(img);
                done();
            };
            img.onerror = done;
        }));
        img.src = src;
    }

    // Plays once over the still. Until it can play, and if it never can, the
    // still stays.
    function startClip() {
        try {
            if (!scene || !scene.clip || !stillLoaded) return;
            var clip = document.getElementById('dash-clip');
            if (!clip || clip.getAttribute('src')) return;
            clip.loop = false;
            clip.addEventListener('canplay', function onCanPlay() {
                clip.removeEventListener('canplay', onCanPlay);
                var played = clip.play();
                clip.hidden = false;
                if (played && typeof played.catch === 'function') {
                    played.catch(function () { clip.hidden = true; });
                }
            });
            clip.addEventListener('error', function () { clip.hidden = true; });
            clip.src = isPhone() && scene.clipSmall ? scene.clipSmall : scene.clip;
            clip.load();
        } catch (e) {}
    }

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
            if (typeof picked.still === 'string' && picked.still) showStill(picked.still);
            if (typeof picked.minimap === 'string' && picked.minimap) showMinimap(picked.minimap);
            var mirror = document.querySelector('.dash-mirror');
            if (mirror && typeof picked.mirror === 'string') mirror.setAttribute('data-gag', picked.mirror);
            return { sceneId: picked.id, line: line };
        } catch (e) {
            return fallback;
        }
    }

    // Geometry of the rendered cockpit for a w x h window. Pure: no DOM, no
    // globals, so it can run on every resize. All values are px except k.
    // mode 'none' means the rendered cockpit does not fit; nothing else is set.
    function layout(w, h) {
        var o = { mode: 'none' };
        var ckW, ckH, ckX, cropR, shield, k, left, top;
        if (w <= 760) {
            ckW = w; ckH = w * 16 / 9; ckX = 0; cropR = 0;
            shield = 0.275 * ckH; k = 0.62; left = 0.19 * w;
            top = Math.max(0.32 * h, shield + 10);
            o.mode = (top + k * h <= h - 8) ? 'tall' : 'none';
        } else {
            ckH = h; ckW = h * 16 / 9; ckX = Math.max(0, (w - ckW) / 2);
            cropR = Math.max(0, ckX + ckW - w);
            shield = 0.412 * h; top = 0.43 * h;
            var leftMin = ckX + 0.445 * ckW;
            var rightMax = Math.min(w, ckX + ckW) - 16;
            k = Math.min(0.48, (rightMax - leftMin) / w);
            left = Math.max(leftMin, Math.min(0.49 * w, rightMax - k * w));
            o.mode = (k >= 0.36) ? 'wide' : 'none';
        }
        if (o.mode === 'none') return o;
        var viewW = ckW, viewH = shield;
        var sbW = Math.max(viewW, viewH * 1920 / 824);
        var sbH = sbW * 824 / 1920;
        o.k = k; o.left = left; o.top = top; o.shield = shield;
        o.ckX = ckX; o.ckW = ckW; o.ckH = ckH; o.cropR = cropR;
        o.sbX = (viewW - sbW) * 0.62; o.sbY = (viewH - sbH) * 0.35;
        o.sbW = sbW; o.sbH = sbH;
        return o;
    }

    if (root.classList.contains('dash-first')) applyScene();

    window.DashIntro = {
        mount: mount,
        pushIn: pushIn,
        applyScene: applyScene,
        startClip: startClip,
        layout: layout,
        localDate: localDate,
        pickScene: pickScene,
        liveBanner: liveBanner,
        pickLine: pickLine,
        DEFAULT_LINE: DEFAULT_LINE
    };
})();
