/* Dashboard intro: window.DashIntro
   mount()        places the live grid in the dashboard's screen frame (adds html.dash-intro)
   pushIn(onDone) pushes the scene in until the screen's edges meet the window's,
                  then removes the intro layer and calls onDone once.
   applyScene()   picks a scene from window.DashScenes (dashboard-scenes.js)
                  and writes it into the intro markup. Returns { sceneId }.
                  Runs once at load, on a first visit, while the page is dark.
   startClip()    starts the scene's clip, if it has one and its still loaded.
                  Called when the hold starts, never when the intro is skipped.
                  In the rendered cockpit it first loads the moving cut-out
                  (foregroundClip) and checks that it is see-through.
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

    function isPhone() {
        return window.matchMedia('(max-width: 760px)').matches;
    }

    // — Rendered cockpit —
    // Each cockpit picture counts only if it loaded while the page was still
    // dark; a late one never swaps the dashboard in front of the visitor.
    var cockpitLoaded = { wide: false, tall: false };
    // The rendered doll counts only if both of its pieces loaded while dark too.
    var dollLoaded = { top: false, base: false };
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
        var on = (o.mode === 'wide' || o.mode === 'tall') && cockpitLoaded[o.mode];
        Object.keys(LAYOUT_VARS).forEach(function (name) {
            var key = LAYOUT_VARS[name];
            if (on) root.style.setProperty(name, key === 'k' ? String(o.k) : o[key] + 'px');
            else root.style.removeProperty(name);
        });
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
            root.classList.remove('dash-intro', 'dash-pushing');
            if (splash) splash.style.display = 'none';
            // Pause both videos, then let go of their files: a clip still
            // loading would otherwise keep downloading under the grid. Their
            // failure paths check state, so the AbortError this gives a
            // pending play() changes nothing on screen.
            ['dash-clip', 'dash-fgclip'].forEach(function (id) {
                var v = document.getElementById(id);
                if (!v) return;
                if (!v.paused) v.pause();
                v.removeAttribute('src');
                v.load();
            });
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
    var stillLoaded = false; // until then the drawn scene shows: no cut-out over it
    var fgLoaded = false;    // the poster cut-out (#dash-fg) has loaded
    var pairOn = false;      // the clip and the moving cut-out are on screen

    // The poster cut-out shows when it and the still have loaded, and the
    // moving cut-out is not standing in for it. A still that is slow or missing
    // leaves the drawn scene, without rendered palms over it.
    function updateForeground() {
        var fg = document.getElementById('dash-fg');
        if (fg) fg.hidden = !(fgLoaded && stillLoaded && !pairOn);
    }

    // The still replaces the drawn scene only once it has loaded. The page
    // stays dark (html.dash-loading) until it does, for at most STILL_WAIT_MS.
    function showStill(src) {
        if (isPhone() && scene && scene.stillSmall) src = scene.stillSmall;
        var still = document.getElementById('dash-still');
        var shield = document.getElementById('dash-shield');
        if (!still || !shield) return;
        var ready = new Promise(function (done) {
            still.addEventListener('load', function () {
                stillLoaded = true;
                still.hidden = false;
                shield.classList.add('dash-has-still');
                updateForeground();
                done();
            });
            still.addEventListener('error', function () {
                stillLoaded = false;
                still.hidden = true;
                shield.classList.remove('dash-has-still');
                updateForeground();
                done();
            });
        });
        holdDarkFor(ready);
        still.src = src;
    }

    // The foreground cut-out (palms, hotels) over the still. Only called when the
    // scene has a still and the cockpit fits this window (the same test as
    // loadCockpit, so it is fetched alongside the cockpit, not after it). The
    // page stays dark for it too, at most STILL_WAIT_MS, so the palms do not pop
    // in over a scene already showing. A missing file leaves the still as it is.
    // Until the still has loaded (and for good if it is missing) it stays
    // hidden: the drawn scene shows, without palms.
    // If the cockpit then fails to load, the drawn dashboard shows and this
    // box stays display: none.
    function showForeground(src) {
        var fg = document.getElementById('dash-fg');
        if (!fg) return;
        var ready = new Promise(function (done) {
            fg.addEventListener('load', function () { fgLoaded = true; updateForeground(); done(); });
            fg.addEventListener('error', function () { fgLoaded = false; updateForeground(); done(); });
        });
        holdDarkFor(ready);
        fg.src = src;
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

    // A scene file field for this window: on phones the Small one when present.
    // '' when the scene has neither.
    function sized(s, key) {
        var v = isPhone() && typeof s[key + 'Small'] === 'string' && s[key + 'Small'] ? s[key + 'Small'] : s[key];
        return typeof v === 'string' ? v : '';
    }

    var CUT_WAIT_MS = 4000; // longest the moving cut-out may take to show its first frame
    var DRIFT_S = 0.08;     // the cut-out is pulled back to the clip's time past this

    // WebKit keeps a video's alpha only in HEVC (.mov); the others get VP9 (.webm).
    function isWebKit() {
        var ua = navigator.userAgent;
        // Edg\/ and not Edg: Edge on iOS says EdgiOS and is WebKit, so it must get the .mov.
        return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\/|OPR/.test(ua);
    }

    // The cut-out has only sky at 50% across, 6% down. A browser that drops the
    // alpha paints that pixel opaque; then the cut-out would hide the scene.
    function frameIsClear(video) {
        if (!video.videoWidth || !video.videoHeight) return false;
        var c = document.createElement('canvas');
        c.width = 1;
        c.height = 1;
        var g = c.getContext('2d');
        g.drawImage(video, Math.floor(video.videoWidth * 0.5), Math.floor(video.videoHeight * 0.06), 1, 1, 0, 0, 1, 1);
        return g.getImageData(0, 0, 1, 1).data[3] < 16;
    }

    // Rendered cockpit: the clip plays with its moving cut-out over it.
    // The cut-out loads first and must show a see-through first frame within
    // CUT_WAIT_MS; only then is the clip requested. Both start in the same
    // task when the clip can play, and the cut-out follows the clip's time.
    // On any failure both are hidden and the still and poster cut-out stay.
    function startPair(clip, cutBase) {
        var cut = document.getElementById('dash-fgclip');
        if (!cut || cut.getAttribute('src')) return;
        var phase = 'checking'; // checking -> loading -> playing, or off for good
        var timer = null;

        function off() {
            if (phase === 'off') return;
            var was = phase;
            phase = 'off';
            clearTimeout(timer);
            // The intro is over: finish() has paused both and let go of their files.
            if (state === 'done') return;
            [clip, cut].forEach(function (v) {
                v.hidden = true;
                if (!v.paused) v.pause();
            });
            if (was === 'checking') {
                cut.removeAttribute('src'); // stop its download
                cut.load();
            }
            pairOn = false;
            updateForeground();
        }
        function onCutData() {
            if (phase !== 'checking') return;
            clearTimeout(timer);
            var clear = false;
            try { clear = frameIsClear(cut); } catch (e) {}
            if (!clear || state === 'done') { off(); return; }
            phase = 'loading';
            clip.addEventListener('canplay', function onCanPlay() {
                clip.removeEventListener('canplay', onCanPlay);
                if (phase !== 'loading') return;
                if (state === 'done') { off(); return; }
                phase = 'playing';
                clip.currentTime = 0;
                cut.currentTime = 0;
                var played = [clip.play(), cut.play()];
                clip.hidden = false;
                cut.hidden = false;
                pairOn = true;
                updateForeground();
                played.forEach(function (p) {
                    if (p && typeof p.catch === 'function') p.catch(off);
                });
            });
            clip.addEventListener('timeupdate', function () {
                if (phase === 'playing' && Math.abs(clip.currentTime - cut.currentTime) > DRIFT_S) {
                    cut.currentTime = clip.currentTime;
                }
            });
            // The markup says preload="none" so nothing loads before this. Firefox
            // and WebKit keep to it after load() and wait for play(): canplay
            // would never come.
            clip.preload = 'auto';
            clip.src = sized(scene, 'clip');
            clip.load();
        }

        clip.loop = false;
        cut.loop = false;
        clip.addEventListener('error', off);
        cut.addEventListener('error', off);
        cut.addEventListener('loadeddata', onCutData);
        timer = setTimeout(off, CUT_WAIT_MS);
        cut.preload = 'auto';
        cut.src = cutBase + (isWebKit() ? '.mov' : '.webm');
        cut.load();
    }

    // Plays once over the still. Until it can play, and if it never can, the
    // still stays. In the rendered cockpit a scene with a poster cut-out needs
    // its moving cut-out too: without one the clip does not start.
    function startClip() {
        try {
            if (!scene || !scene.clip || !stillLoaded) return;
            var clip = document.getElementById('dash-clip');
            if (!clip || clip.getAttribute('src')) return;
            if (rendered()) {
                var cutBase = sized(scene, 'foregroundClip');
                if (cutBase) { startPair(clip, cutBase); return; }
                if (sized(scene, 'foreground')) return;
            }
            clip.loop = false;
            clip.addEventListener('canplay', function onCanPlay() {
                clip.removeEventListener('canplay', onCanPlay);
                var played = clip.play();
                clip.hidden = false;
                if (played && typeof played.catch === 'function') {
                    played.catch(function () { if (state !== 'done') clip.hidden = true; });
                }
            });
            // After the intro, finish() let go of the file: nothing to hide.
            clip.addEventListener('error', function () { if (state !== 'done') clip.hidden = true; });
            clip.preload = 'auto'; // as in startPair: without it canplay never comes in Firefox and WebKit
            clip.src = isPhone() && scene.clipSmall ? scene.clipSmall : scene.clip;
            clip.load();
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
            if (typeof picked.still === 'string' && picked.still) {
                var fgSrc = sized(picked, 'foreground');
                var fits = layout(window.innerWidth, window.innerHeight).mode !== 'none';
                if (fits && fgSrc) showForeground(fgSrc);
            }
            if (typeof picked.minimap === 'string' && picked.minimap) showMinimap(picked.minimap);
            var mirror = document.querySelector('.dash-mirror');
            if (mirror && typeof picked.mirror === 'string') mirror.setAttribute('data-gag', picked.mirror);
            return { sceneId: picked.id };
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

    // First visit, at load: request the cockpit picture this window needs, if
    // the cockpit fits at all. The page stays dark for it (holdDarkFor, at most
    // STILL_WAIT_MS). It counts only if it loads while the page is still dark.
    function loadCockpit() {
        var img = document.getElementById('dash-cockpit-img');
        if (!img) return;
        var kind = layout(window.innerWidth, window.innerHeight).mode;
        if (kind !== 'wide' && kind !== 'tall') return;
        var src = kind === 'tall' ? 'assets/dash/cockpit-tall-1080.webp'
            : window.innerWidth > 2560 ? 'assets/dash/cockpit-wide-3840.webp'
            : 'assets/dash/cockpit-wide-2560.webp';
        holdDarkFor(new Promise(function (done) {
            img.addEventListener('load', function () {
                if (root.classList.contains('dash-loading')) {
                    cockpitLoaded[kind] = true;
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
        [['top', 'assets/dash/doll-top.webp'], ['base', 'assets/dash/doll-base.webp']].forEach(function (p) {
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

    if (root.classList.contains('dash-first')) {
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
