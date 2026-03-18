// apex-sound.js — Cinematic sound engine for omarthecreative.com
// BBC Sound Effects © BBC | freesound.org CC0
// Unlocks on first deliberate user gesture.

const ApexSound = (function () {

    let ctx = null;
    const buffers = {};

    // Format detection — Safari doesn't support OGG/Opus
    var _canOgg = (function () {
        var a = document.createElement('audio');
        return !!(a.canPlayType('audio/ogg; codecs="opus"') || a.canPlayType('audio/ogg; codecs="vorbis"'));
    })();
    var _ext = _canOgg ? 'ogg' : 'mp3';

    // Sound library — paths relative to src/
    var _sounds = {
        shutter:   'assets/sound-effects/07076042',   // Hasselblad shutter click — carousel advance
        film:      'assets/sound-effects/07076045',   // 16mm film runout — video overlay open
        door:      'assets/sound-effects/07011044',   // Heavy door with echo — video overlay close
        projector: 'assets/sound-effects/07004203',   // Projector threading — LUT/name unlock
        hum:       'assets/sound-effects/07004188',   // Electrical hum — ambient/idle (reserved)
        bourbon:   'assets/sound-effects/563231__ammorts__pouring-whisky-in-the-glass', // Long Copy
    };

    function init(basePath) {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        var base = basePath || '';
        Object.keys(_sounds).forEach(function (name) {
            fetch(base + _sounds[name] + '.' + _ext)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (data) { return ctx.decodeAudioData(data); })
                .then(function (buffer) { buffers[name] = buffer; })
                .catch(function () {});
        });
    }

    function play(name, volume) {
        if (!ctx || !buffers[name]) return;
        if (ctx.state === 'suspended') ctx.resume();
        var gain = ctx.createGain();
        gain.gain.value = (volume !== undefined) ? volume : 1;
        var source = ctx.createBufferSource();
        source.buffer = buffers[name];
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
    }

    return { init: init, play: play };

})();
