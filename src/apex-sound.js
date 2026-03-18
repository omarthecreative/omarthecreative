// apex-sound.js — Cinematic sound engine for omarthecreative.com
// BBC Sound Effects © BBC | freesound.org CC0
// Fetches buffers on page load. AudioContext unlocks on first gesture.

const ApexSound = (function () {

    let ctx = null;
    const _raw = {};      // ArrayBuffers from fetch (no gesture needed)
    const _decoded = {};  // Decoded AudioBuffers (requires AudioContext)

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
    };

    // Fetch all buffers on page load — no gesture required
    function load() {
        Object.keys(_sounds).forEach(function (name) {
            fetch(_base + _sounds[name] + '.' + _ext)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (ab) { _raw[name] = ab; })
                .catch(function () {});
        });
    }

    // Create AudioContext on first gesture and decode all fetched buffers
    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        if (ctx.state === 'suspended') ctx.resume();

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

        if (_decoded[name]) {
            _fire(_decoded[name]);
        } else if (_raw[name]) {
            // Decode on demand then play — covers first-gesture edge case
            ctx.decodeAudioData(_raw[name].slice(0))
                .then(function (buf) { _decoded[name] = buf; _fire(buf); })
                .catch(function () {});
        }
    }

    // Kick off fetching immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    return { init: init, play: play };

})();
