// apex-sound.js — Cinematic sound engine for omarthecreative.com
// BBC Sound Effects © BBC | freesound.org CC0
// Fetches buffers on page load. AudioContext unlocks on first gesture.

const ApexSound = (function () {

    let ctx = null;
    const _raw = {};      // ArrayBuffers from fetch
    const _decoded = {};  // Decoded AudioBuffers
    const _queue = {};    // Queued play requests
    const _elements = {}; // HTMLAudioElement cache for Safari/iOS priming

    // Format detection — Safari needs MP3
    const _ext = (function () {
        var a = document.createElement('audio');
        var canOgg = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
        return canOgg ? 'ogg' : 'mp3';
    })();

    // Self-detect base path
    const _base = (function () {
        var s = document.currentScript;
        if (s && s.src) return s.src.replace(/[^/]*$/, '');
        return '/'; 
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

    function load() {
        Object.keys(_sounds).forEach(function (name) {
            const url = _base + _sounds[name] + '.' + _ext;
            fetch(url)
                .then(function (r) { 
                    if (!r.ok) throw new Error('Fetch failed');
                    return r.arrayBuffer(); 
                })
                .then(function (ab) { 
                    _raw[name] = ab;
                    if (_queue[name]) {
                        _queue[name].forEach(function(vol) {
                            play(name, vol);
                        });
                        delete _queue[name];
                    }
                })
                .catch(function () {});
        });
    }

    function init() {
        if (ctx && ctx.state === 'running') return;
        
        // 1. Initialize WebAudio Context
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            ctx.resume();
        }

        // 2. Prime HTMLAudioElements for Safari (MUST happen in a user gesture)
        Object.keys(_sounds).forEach(function(name) {
            if (!_elements[name]) {
                const el = new Audio(_base + _sounds[name] + '.' + _ext);
                el.load();
                _elements[name] = el;
            }
        });

        // 3. Kick off decoding for WebAudio
        Object.keys(_raw).forEach(function (name) {
            _decodeOne(name);
        });
    }

    function _decodeOne(name) {
        if (!ctx || !_raw[name] || _decoded[name]) return;
        ctx.decodeAudioData(_raw[name].slice(0), function(buf) {
            _decoded[name] = buf;
        }, function(){});
    }

    function play(name, volume) {
        var vol = (volume !== undefined) ? volume : 1;

        // SAFARI/iOS SCROLL FIX: 
        // Use the pre-primed HTMLAudioElement if available.
        // This is the only way to play audio from a scroll event in Safari.
        if (_elements[name]) {
            try {
                const el = _elements[name];
                // Reset if already playing
                if (!el.paused) {
                    el.pause();
                    el.currentTime = 0;
                }
                el.volume = vol;
                el.play().catch(function(e) {
                    // Fallback to WebAudio below if this failed
                });
                if (name === 'bourbon' || name === 'knife') return; 
            } catch (e) {}
        }

        // Fallback/WebAudio logic
        if (!_raw[name] && !_decoded[name]) {
            if (!_queue[name]) _queue[name] = [];
            _queue[name].push(vol);
            return;
        }

        if (!ctx) init();
        if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
            ctx.resume();
        }

        function _fire(buf) {
            var gain = ctx.createGain();
            gain.gain.value = vol;
            var source = ctx.createBufferSource();
            source.buffer = buf;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
        }

        if (_decoded[name]) {
            _fire(_decoded[name]);
        } else if (_raw[name]) {
            ctx.decodeAudioData(_raw[name].slice(0), function(buf) {
                _decoded[name] = buf;
                _fire(buf);
            }, function(){});
        }
    }

    var _loopNodes = {};

    function startLoop(name, volume) {
        if (_loopNodes[name]) return;
        var vol = (volume !== undefined) ? volume : 1;

        if (!ctx) init();
        if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
            ctx.resume();
        }

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

        if (_decoded[name]) {
            _fireLoop(_decoded[name]);
        } else if (_raw[name]) {
            ctx.decodeAudioData(_raw[name].slice(0), function(buf) {
                _decoded[name] = buf;
                _fireLoop(buf);
            }, function(){});
        }
    }

    function stopLoop(name) {
        var node = _loopNodes[name];
        if (node) {
            try { node.stop(); } catch (e) {}
            delete _loopNodes[name];
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    return { init: init, play: play, startLoop: startLoop, stopLoop: stopLoop };

})();
