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
        // Safari can return "maybe" or "probably", but for OGG it usually returns ""
        var canOgg = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
        return canOgg ? 'ogg' : 'mp3';
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
    function init() {
        if (ctx && ctx.state === 'running') return;

        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (ctx.state === 'suspended') {
            _resumePromise = ctx.resume().then(function() {
                // Safari hardware wakeup: play a silent buffer
                var buffer = ctx.createBuffer(1, 1, 22050);
                var source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            }).catch(function (err) {
                console.warn('ApexSound: resume failed', err);
            });
        } else {
            _resumePromise = Promise.resolve();
        }

        Object.keys(_raw).forEach(function (name) {
            _decodeOne(name);
        });
    }

    function _decodeOne(name) {
        if (!ctx || !_raw[name] || _decoded[name]) return;
        
        var data = _raw[name].slice(0);
        
        // Safari/Legacy compatibility: use callback syntax as fallback
        var promise = ctx.decodeAudioData(data, function(buf) {
            _decoded[name] = buf;
        }, function(err) {
            console.warn('ApexSound: decode failed for ' + name, err);
        });

        // Some browsers return a promise, some return undefined
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function(){});
        }
    }

    function play(name, volume) {
        var vol = (volume !== undefined) ? volume : 1;

        // Safari/iOS Fallback: Use direct HTMLAudioElement for simple plays.
        // This is significantly more reliable than Web Audio for SFX in Safari.
        if (_ext === 'mp3' || (window.webkitAudioContext && !window.AudioContext)) {
            try {
                var audio = new Audio(_base + _sounds[name] + '.' + _ext);
                audio.volume = vol;
                audio.play().catch(function(e) {
                    console.warn('ApexSound: Direct play fallback failed', e);
                });
                return;
            } catch (e) {
                // If direct audio fails, continue to Web Audio logic
            }
        }

        if (!ctx) return;

        function _fire(buf) {
            try {
                var gain = ctx.createGain();
                gain.gain.value = vol;
                var source = ctx.createBufferSource();
                source.buffer = buf;
                source.connect(gain);
                gain.connect(ctx.destination);
                source.start(0);
            } catch (e) {
                console.warn('ApexSound: WebAudio play failed', e);
            }
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
