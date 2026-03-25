// apex-sound.js — Cinematic sound engine for omarthecreative.com
// BBC Sound Effects © BBC | freesound.org CC0
// Fetches buffers on page load. AudioContext unlocks on first gesture.

const ApexSound = (function () {

    let ctx = null;
    const _raw = {};      // ArrayBuffers from fetch
    const _decoded = {};  // Decoded AudioBuffers

    // Format detection — Safari needs MP3
    const _ext = (function () {
        var a = document.createElement('audio');
        var canOgg = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
        return canOgg ? 'ogg' : 'mp3';
    })();

    // Self-detect base path from the script's own URL
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

    function load() {
        Object.keys(_sounds).forEach(function (name) {
            fetch(_base + _sounds[name] + '.' + _ext)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (ab) { _raw[name] = ab; })
                .catch(function () {});
        });
    }

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
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
            ctx.decodeAudioData(_raw[name].slice(0), function(buf) {
                _decoded[name] = buf;
                _fire(buf);
            }, function(){});
        }
    }

    var _loopNodes = {};

    function startLoop(name, volume) {
        if (_loopNodes[name]) return;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

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
