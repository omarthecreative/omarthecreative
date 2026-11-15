/* Dashboard intro: window.DashIntro
   mount()        places the live grid in the dashboard's screen frame (adds html.dash-intro)
   pushIn(onDone) pushes the scene in until the screen's edges meet the window's,
                  then removes the intro layer and calls onDone once.
   applyScene()   picks a scene from window.DashScenes (dashboard-scenes.js)
                  and writes it into the intro markup. Returns { sceneId }.
                  Runs once at load, on a first visit, while the page is dark.
   startClip()    starts the scene's clip, if it has one and its still loaded:
                  play() at once, shown once it is playing, played once.
                  html.dash-moving is set exactly while it plays: on at its
                  playing event, off when it waits, pauses, ends, errors or
                  is let go, and when the intro ends. The car moves only then.
                  Called when the intro starts waiting for the visitor, never
                  when the intro is skipped.
   pickScene      the pure part of that pick.
   layout(w, h)   geometry of the rendered cockpit for a window (pure).
   rendered()     true while html.dash-rendered is set: the cockpit picture
                  loaded while the page was dark and fits this window. Then
                  layout() is written to :root as inline variables; otherwise
                  the drawn dashboard shows on the stylesheet's own geometry.
   Geometry lives in dashboard-intro.css; this file sets the two artwork
   scales, the rendered layout variables, and runs the state changes. */
(function () {
    'use strict';

    var PUSH_TIMEOUT_MS = 1300; // push-in is 1000ms; finish even if transitionend never fires
    var root = document.documentElement;
    var mounted = false;
    var state = 'idle'; // idle -> pushing -> done

    // The stylesheet's phone rules: a narrow window standing upright.
    function isPhone() {
        return window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
    }
    // The smaller still and clip go to any narrow window, upright or not.
    function smallMedia() {
        return window.matchMedia('(max-width: 760px)').matches;
    }

    // — Rendered cockpit —
    // At first load a cockpit picture counts only if it loaded while the page
    // was still dark; a late one never swaps the dashboard in front of the
    // visitor. A picture asked for by a turn of the window (loadForTurn)
    // counts when it arrives.
    var cockpitLoaded = { wide: false, tall: false };
    // The <img> that holds each kind's picture, once loaded. The one for the
    // mode on show sits in #dash-cockpit as #dash-cockpit-img.
    var cockpitEl = { wide: null, tall: null };
    var firstEl = null;     // the markup's <img>, and the kind it was given at load
    var firstKind = null;
    // The rendered doll counts only if both of its pieces loaded, by the same rule.
    var dollLoaded = { top: false, base: false };
    var DOLL_FILES = [['top', 'assets/dash/doll-top.webp'], ['base', 'assets/dash/doll-base.webp']];
    var firstVisit = false; // the intro plays on this visit: pictures may load
    var lastMode = null;    // layout().mode at the last applyLayout()
    var turnAsked = {};     // what loadForTurn() has already asked for
    // Inline variable on :root -> the layout() field it carries (px, except k).
    var LAYOUT_VARS = {
        '--dash-k': 'k', '--dash-left': 'left', '--dash-top': 'top', '--dash-shield': 'shield',
        '--ck-x': 'ckX', '--ck-w': 'ckW', '--ck-h': 'ckH', '--ck-crop-r': 'cropR',
        '--sb-x': 'sbX', '--sb-y': 'sbY', '--sb-w': 'sbW', '--sb-h': 'sbH'
    };

    // Rendered when the cockpit fits this window and that kind's picture has
    // loaded: write layout() into :root and set html.dash-rendered. Otherwise
    // clear all of it, so the stylesheet's own (drawn) geometry applies.
    function applyLayout() {
        var o = layout(window.innerWidth, window.innerHeight);
        var fits = o.mode === 'wide' || o.mode === 'tall';
        // The window turned to another mode while the intro waits: get what
        // that mode still lacks.
        if (fits && lastMode !== null && o.mode !== lastMode) loadForTurn(o.mode);
        lastMode = o.mode;
        var on = fits && cockpitLoaded[o.mode];
        // Put this mode's picture in the cockpit, already loaded: no moment
        // with the other mode's picture in this mode's box.
        var pic = document.getElementById('dash-cockpit-img');
        if (on && pic && cockpitEl[o.mode] && pic !== cockpitEl[o.mode]) {
            pic.parentNode.replaceChild(cockpitEl[o.mode], pic);
        }
        Object.keys(LAYOUT_VARS).forEach(function (name) {
            var key = LAYOUT_VARS[name];
            if (on) root.style.setProperty(name, key === 'k' ? String(o.k) : o[key] + 'px');
            else root.style.removeProperty(name);
        });
        // The short screen: inline only in rendered tall mode. Elsewhere the
        // stylesheet's default (--dash-h, k * 100vh) stays exactly as it was.
        if (on && o.mode === 'tall') root.style.setProperty('--dash-frame-h', o.frameH + 'px');
        else root.style.removeProperty('--dash-frame-h');
        root.classList.toggle('dash-rendered', on);
        // The rendered doll stands on the rendered cockpit only: never without it.
        var doll = document.querySelector('.dash-doll');
        if (doll) doll.classList.toggle('dash-doll-rendered', on && dollLoaded.top && dollLoaded.base);
        if (on) root.setAttribute('data-dash-mode', o.mode);
        else root.removeAttribute('data-dash-mode');
    }

    function rendered() {
        return root.classList.contains('dash-rendered');
    }

    function setScales() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        root.style.setProperty('--dash-fit', String(Math.min(w / 1440, h / 900)));
        applyLayout();
        var shield = document.getElementById('dash-shield');
        // offsetHeight is layout size, unaffected by the push-in transform.
        var shieldPx = shield ? shield.offsetHeight : 0;
        root.style.setProperty('--dash-ss', String(shieldPx / (isPhone() ? 260 : 400)));
    }

    // Size the artwork now, before first paint. This script loads after the
    // splash markup, so #dash-shield exists. Waiting for mount() showed the
    // CSS default scale (1) first, and the doll visibly shrank.
    // layout() is a function declaration below, so it is already defined here.
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
            root.classList.remove('dash-intro', 'dash-pushing', 'dash-moving');
            if (splash) splash.style.display = 'none';
            // Pause the clip, then let go of its file: a clip still loading
            // would otherwise keep downloading under the grid. Its failure
            // paths check state, so the AbortError this gives a pending
            // play() changes nothing on screen.
            var clip = document.getElementById('dash-clip');
            if (clip) {
                if (!clip.paused) clip.pause();
                clip.removeAttribute('src');
                clip.load();
            }
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

    // — Scenes —
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

    var STILL_WAIT_MS = 1500; // longest the page stays dark waiting for a still

    var scene = null;        // the scene on screen, once applyScene has run
    var stillLoaded = false; // the clip starts only over a still that loaded
    var clipStarted = false; // startClip() starts the clip once at most

    // The still replaces the drawn scene only once it has loaded. The page
    // stays dark (html.dash-loading) until it does, for at most STILL_WAIT_MS.
    function showStill(src) {
        if (smallMedia() && scene && scene.stillSmall) src = scene.stillSmall;
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

    var MINIMAP_ARROW = 'assets/dash/minimap-arrow.svg';

    // The scene's minimap strip, with the arrow over it, replaces the inline
    // minimap once both have loaded, if the page is still dark then (a late
    // pair never swaps in front of the visitor); dashboard-motion.css rolls
    // the strip while the car moves. If either fails, the inline minimap stays.
    function showMinimap(src) {
        var box = document.querySelector('.dash-minimap');
        if (!box) return;
        var load = function (className, url) {
            return new Promise(function (done) {
                var img = new Image();
                img.alt = '';
                img.className = className;
                img.onload = function () { done(img); };
                img.onerror = function () { done(null); };
                img.src = url;
            });
        };
        holdDarkFor(Promise.all([
            load('dash-minimap-strip', src),
            load('dash-minimap-arrow', MINIMAP_ARROW)
        ]).then(function (imgs) {
            if (!imgs[0] || !imgs[1] || !root.classList.contains('dash-loading')) return;
            while (box.firstChild) box.removeChild(box.firstChild);
            box.appendChild(imgs[0]);
            box.appendChild(imgs[1]);
        }));
    }

    // Plays once over the still, the same way in both modes. It starts by
    // playing: iOS Safari loads no data until something calls play(), and the
    // clip is muted and playsinline, so no gesture is needed. play() fetches
    // the file whatever the markup's preload="none" says. The clip stays
    // hidden until it is really playing. If play() is refused or the clip
    // errors, it is hidden and let go, so nothing keeps downloading; the still
    // stays. No retry. Once the intro is over it does nothing.
    function startClip() {
        try {
            if (state === 'done' || clipStarted) return;
            if (!scene || !scene.clip || !stillLoaded) return;
            var clip = document.getElementById('dash-clip');
            if (!clip) return;
            clipStarted = true;
            // After the intro, finish() has already let go of the file.
            var release = function () {
                root.classList.remove('dash-moving');
                if (state === 'done' || !clip.getAttribute('src')) return;
                clip.hidden = true;
                if (!clip.paused) clip.pause();
                clip.removeAttribute('src');
                clip.load();
            };
            clip.loop = false;
            clip.addEventListener('playing', function () {
                if (state === 'done') return;
                clip.hidden = false;
                root.classList.add('dash-moving');
            });
            ['waiting', 'pause', 'ended', 'emptied'].forEach(function (type) {
                clip.addEventListener(type, function () { root.classList.remove('dash-moving'); });
            });
            clip.addEventListener('error', release);
            clip.src = smallMedia() && scene.clipSmall ? scene.clipSmall : scene.clip;
            var played = clip.play();
            if (played && typeof played.catch === 'function') played.catch(release);
        } catch (e) {}
    }

    // Never throws. On any failure the markup stays as written: the drawn scene.
    function applyScene() {
        var fallback = { sceneId: null };
        try {
            var data = window.DashScenes;
            if (!data) return fallback;
            var picked = pickScene(data.scenes, readStore('omar_last_scene'), Math.random);
            if (!picked) return fallback;

            var shield = document.getElementById('dash-shield');
            if (shield) shield.setAttribute('data-scene', picked.id);
            writeStore('omar_last_scene', picked.id);
            scene = picked;
            if (typeof picked.still === 'string' && picked.still) showStill(picked.still);
            if (typeof picked.minimap === 'string' && picked.minimap) showMinimap(picked.minimap);
            return { sceneId: picked.id };
        } catch (e) {
            return fallback;
        }
    }

    // Geometry of the rendered cockpit for a w x h window. Pure: no DOM, no
    // globals, so it can run on every resize. All values are px except k.
    // mode 'none' means the rendered cockpit does not fit; nothing else is set.
    // Both modes use the wide cockpit's coordinates; frameH is the screen's
    // visible height before the push-in (k * h in wide mode).
    function layout(w, h) {
        var o = { mode: 'none' };
        var ckH = h, ckW = h * 16 / 9, shield = 0.412 * h;
        var ckX, cropR = 0, k, left, top, frameH, sbW, sbH, sbX, sbY;
        if (w <= 760 && h > w) {
            // A narrow window standing upright: a slice of the wide cockpit
            // (the phone picture covers x 0.25 to 0.64 of it), part of the
            // steering wheel, and a short, wide screen. X0 is the window's
            // left edge as a fraction of the cockpit; the slice must cover it.
            var x0 = Math.min(0.40, Math.max(0.26, 0.615 - w / ckW));
            if (x0 + w / ckW > 0.64) x0 = 0.64 - w / ckW;
            ckX = -x0 * ckW;
            left = ckX + 0.458 * ckW + 2;
            k = (w - left - 8) / w;
            top = 0.474 * h;
            frameH = 0.62 * k * w;
            o.mode = (x0 >= 0.25 && k >= 0.40 && top + frameH <= h - 24) ? 'tall' : 'none';
            // The scene box covers the window, the Colony mid-window.
            sbH = shield; sbW = sbH * 1920 / 824; sbY = 0;
            sbX = (-ckX + w / 2) - 0.60 * sbW;
        } else {
            // Every other window, a phone on its side included.
            ckX = Math.max(0, (w - ckW) / 2);
            cropR = Math.max(0, ckX + ckW - w);
            top = 0.43 * h;
            var leftMin = ckX + 0.458 * ckW;
            var rightMax = Math.min(w, ckX + ckW) - 16;
            k = Math.min(0.48, (rightMax - leftMin) / w);
            left = Math.max(leftMin, Math.min(0.49 * w, rightMax - k * w));
            frameH = k * h;
            // The k floor. Under 500 px tall (a phone on its side, with the
            // browser's bars showing) the grid may be smaller in the screen.
            o.mode = (k >= (h < 500 ? 0.25 : 0.36)) ? 'wide' : 'none';
            // The scene box covers the whole windshield view.
            sbW = Math.max(ckW, shield * 1920 / 824); sbH = sbW * 824 / 1920;
            sbX = (ckW - sbW) * 0.62; sbY = (shield - sbH) * 0.35;
        }
        if (o.mode === 'none') return o;
        o.k = k; o.left = left; o.top = top; o.shield = shield; o.frameH = frameH;
        o.ckX = ckX; o.ckW = ckW; o.ckH = ckH; o.cropR = cropR;
        o.sbX = sbX; o.sbY = sbY; o.sbW = sbW; o.sbH = sbH;
        return o;
    }

    // First visit, at load: request the cockpit picture this window needs, if
    // the cockpit fits at all. The page stays dark for it (holdDarkFor, at most
    // STILL_WAIT_MS). It counts only if it loads while the page is still dark.
    function loadCockpit() {
        var img = document.getElementById('dash-cockpit-img');
        if (!img) return;
        var kind = layout(window.innerWidth, window.innerHeight).mode;
        if (kind !== 'wide' && kind !== 'tall') return;
        var src = cockpitFile(kind);
        firstEl = img;
        firstKind = kind;
        holdDarkFor(new Promise(function (done) {
            img.addEventListener('load', function () {
                if (root.classList.contains('dash-loading')) {
                    cockpitLoaded[kind] = true;
                    cockpitEl[kind] = img;
                    setScales(); // applyLayout(), then --dash-ss from the new shield
                }
                done();
            });
            img.addEventListener('error', function () { done(); });
        }));
        img.src = src;
        loadDoll();
    }

    // The doll's two pieces, requested with the cockpit. Each counts only if it
    // loaded while the page was dark; applyLayout() decides whether the rendered
    // doll shows. A missing piece leaves the drawn doll.
    function loadDoll() {
        DOLL_FILES.forEach(function (p) {
            var img = document.querySelector('.dash-doll-r-' + p[0]);
            if (!img) return;
            holdDarkFor(new Promise(function (done) {
                img.addEventListener('load', function () {
                    if (root.classList.contains('dash-loading')) {
                        dollLoaded[p[0]] = true;
                        setScales();
                    }
                    done();
                });
                img.addEventListener('error', function () { done(); });
            }));
            img.src = p[1];
        });
    }

    function cockpitFile(kind) {
        return kind === 'tall' ? 'assets/dash/cockpit-phone-1620.webp'
            : window.innerWidth > 2560 ? 'assets/dash/cockpit-wide-3840.webp'
            : 'assets/dash/cockpit-wide-2560.webp';
    }

    // A resize has changed the mode (a phone turned on its side, say) while
    // the intro waits. Ask now for the cockpit picture and the doll's pieces
    // that this mode lacks; the dashboard switches when they arrive. Called
    // from applyLayout(), so it only marks what is ready at once and leaves
    // the rest to setScales() on arrival. Each file is asked for once.
    function loadForTurn(kind) {
        if (!firstVisit || state !== 'idle') return;
        if (!cockpitLoaded[kind] && !turnAsked[kind]) {
            turnAsked[kind] = true;
            var shown = document.getElementById('dash-cockpit-img');
            if (kind === firstKind && firstEl.complete && firstEl.naturalWidth > 0) {
                // The markup's own picture, too late for the first load: here now.
                cockpitLoaded[kind] = true;
                cockpitEl[kind] = firstEl;
            } else if (shown) {
                // A second <img> like the first, loaded out of the page. Not a
                // clone: a clone would fetch the first one's file again.
                var pic = document.createElement('img');
                Array.prototype.forEach.call(shown.attributes, function (a) {
                    if (a.name !== 'src') pic.setAttribute(a.name, a.value);
                });
                pic.addEventListener('load', function () {
                    if (state !== 'idle') return;
                    cockpitLoaded[kind] = true;
                    cockpitEl[kind] = pic;
                    setScales();
                });
                pic.src = cockpitFile(kind);
            }
        }
        DOLL_FILES.forEach(function (p) {
            var img = document.querySelector('.dash-doll-r-' + p[0]);
            if (!img || dollLoaded[p[0]] || turnAsked['doll-' + p[0]]) return;
            turnAsked['doll-' + p[0]] = true;
            if (img.complete && img.naturalWidth > 0) { dollLoaded[p[0]] = true; return; }
            img.addEventListener('load', function () {
                if (state !== 'idle') return;
                dollLoaded[p[0]] = true;
                setScales();
            });
            img.src = p[1];
        });
    }

    if (root.classList.contains('dash-first')) {
        firstVisit = true;
        applyScene();
        loadCockpit();
    }

    window.DashIntro = {
        mount: mount,
        pushIn: pushIn,
        applyScene: applyScene,
        startClip: startClip,
        layout: layout,
        rendered: rendered,
        pickScene: pickScene
    };
})();
