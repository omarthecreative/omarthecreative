// apex-sound.js — Cinematic sound engine for omarthecreative.com
// BBC Sound Effects © BBC | freesound.org CC0
// Fetches buffers on page load. AudioContext unlocks on first gesture.

const ApexSound = (function () {

    let ctx = null;
    let _resumePromise = null; // Promise from gesture-initiated ctx.resume()
    const _raw = {};      // ArrayBuffers from fetch (no gesture needed)
    const _decoded = {};  // Decoded AudioBuffers (requires AudioContext)
    const _fetchQueue = {}; // name → [fn] — callbacks waiting for _raw to arrive

    // Format detection — Safari doesn't support OGG/Opus
    const _ext = (function () {
        var a = document.createElement('audio');
        return (a.canPlayType('audio/ogg; codecs="opus"') || a.canPlayType('audio/ogg; codecs="vorbis"'))
            ? 'ogg' : 'mp3';
    })();

    // Self-detect base path from the script's own URL — works at any page depth
    const _base = (function () {
        var s = document.currentScript;
        return s ? s.src.replace(/[^/]*$/, '') : '';
    })();

    const _sounds = {
        shutter:   'assets/sound-effects/07076042',
        film:      'assets/sound-effects/07076045',
        door:      'assets/sound-effects/07011044',
        projector: 'assets/sound-effects/07004203',
        hum:       'assets/sound-effects/07004188',
        bourbon:   'assets/sound-effects/563231__ammorts__pouring-whisky-in-the-glass',
        knife:     'assets/sound-effects/07001020',
        whistle:   'assets/sound-effects/the-whistle',
        anthem:    'assets/sound-effects/star-spangled-banner',
    };

    // Fetch all buffers on page load — no gesture required.
    // When a buffer arrives, pre-decode if ctx exists, then flush any
    // play/startLoop calls that were queued while the fetch was in flight.
    function load() {
        Object.keys(_sounds).forEach(function (name) {
            fetch(_base + _sounds[name] + '.' + _ext)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (ab) {
                    _raw[name] = ab;
                    if (ctx) _decodeOne(name);
                    // Fire any sounds queued before this buffer arrived.
                    // ctx is already running at this point (init() was called
                    // from a prior gesture), so source.start() is safe here.
                    var cbs = _fetchQueue[name];
                    if (cbs) {
                        delete _fetchQueue[name];
                        cbs.forEach(function (fn) { fn(); });
                    }
                })
                .catch(function () {});
        });
    }

    // Create AudioContext on first gesture and decode all fetched buffers.
    // Call from within any user gesture handler — safe to call repeatedly.
    // If ctx already exists but iOS re-suspended it, refreshes _resumePromise
    // so play()/startLoop() chains correctly on the new resume.
    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') {
                _resumePromise = ctx.resume().catch(function () {});
            }
            return;
        }
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Resume synchronously within the gesture handler and store the promise.
        // play() chains on _resumePromise rather than calling ctx.resume() again
        // from outside a gesture — iOS blocks that second call (scroll/async).
        _resumePromise = ctx.state === 'suspended'
            ? ctx.resume().catch(function () {})
            : Promise.resolve();
        Object.keys(_raw).forEach(function (name) {
            _decodeOne(name);
        });
    }

    function _decodeOne(name) {
        if (!ctx || !_raw[name] || _decoded[name]) return;
        ctx.decodeAudioData(_raw[name].slice(0))
            .then(function (buf) { _decoded[name] = buf; })
            .catch(function () {});
    }

    function play(name, volume) {
        if (!ctx) return;

        var vol = (volume !== undefined) ? volume : 1;

        function _fire(buf) {
            var gain = ctx.createGain();
            gain.gain.value = vol;
            var source = ctx.createBufferSource();
            source.buffer = buf;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
        }

        function _dispatch() {
            if (_decoded[name]) {
                _fire(_decoded[name]);
            } else if (_raw[name]) {
                ctx.decodeAudioData(_raw[name].slice(0))
                    .then(function (buf) { _decoded[name] = buf; _fire(buf); })
                    .catch(function () {});
            } else {
                // Fetch still in flight — queue; will fire when buffer arrives
                if (!_fetchQueue[name]) _fetchQueue[name] = [];
                _fetchQueue[name].push(function () {
                    ctx.decodeAudioData(_raw[name].slice(0))
                        .then(function (buf) { _decoded[name] = buf; _fire(buf); })
                        .catch(function () {});
                });
            }
        }

        var rp = _resumePromise || Promise.resolve();
        rp.then(_dispatch).catch(function () {});
    }

    var _loopNodes = {};

    function startLoop(name, volume) {
        if (_loopNodes[name]) return; // already running
        if (!ctx) return;
        var vol = (volume !== undefined) ? volume : 1;

        function _fireLoop(buf) {
            var gain = ctx.createGain();
            gain.gain.value = vol;
            var source = ctx.createBufferSource();
            source.buffer = buf;
            source.loop = true;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
            _loopNodes[name] = source;
        }

        function _dispatch() {
            if (_decoded[name]) {
                _fireLoop(_decoded[name]);
            } else if (_raw[name]) {
                ctx.decodeAudioData(_raw[name].slice(0))
                    .then(function (buf) { _decoded[name] = buf; _fireLoop(buf); })
                    .catch(function () {});
            } else {
                // Fetch still in flight — queue; will fire when buffer arrives
                if (!_fetchQueue[name]) _fetchQueue[name] = [];
                _fetchQueue[name].push(function () {
                    if (_loopNodes[name]) return; // started by another path already
                    ctx.decodeAudioData(_raw[name].slice(0))
                        .then(function (buf) { _decoded[name] = buf; _fireLoop(buf); })
                        .catch(function () {});
                });
            }
        }

        var rp = _resumePromise || Promise.resolve();
        rp.then(_dispatch).catch(function () {});
    }

    function stopLoop(name) {
        var node = _loopNodes[name];
        if (node) {
            try { node.stop(); } catch (e) {}
            delete _loopNodes[name];
        }
    }

    // Kick off fetching immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    return { init: init, play: play, startLoop: startLoop, stopLoop: stopLoop };

})();
