/* Tiny WebAudio sound effects (no asset files). Press M to mute. */
window.DEF = window.DEF || {};

(function () {
  'use strict';

  var ctx = null;
  var muted = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) { ctx = null; }
  }

  function tone(f0, f1, dur, type, vol, delay) {
    if (!ctx || muted) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  DEF.audio = {
    init: init,
    toggleMute: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; },
    hop: function () { tone(300, 640, 0.13, 'square', 0.035); },
    land: function () { tone(140, 90, 0.07, 'triangle', 0.05); },
    coin: function () { tone(880, 880, 0.06, 'square', 0.03); tone(1320, 1320, 0.1, 'square', 0.03, 0.06); },
    battery: function () { tone(440, 880, 0.18, 'triangle', 0.06); tone(660, 1320, 0.18, 'triangle', 0.05, 0.1); },
    hurt: function () { tone(260, 70, 0.32, 'sawtooth', 0.05); },
    stomp: function () { tone(520, 180, 0.12, 'square', 0.04); },
    bump: function () { tone(110, 80, 0.06, 'triangle', 0.05); },
    checkpoint: function () { tone(523, 523, 0.1, 'triangle', 0.06); tone(784, 784, 0.18, 'triangle', 0.06, 0.1); },
    respawn: function () { tone(400, 200, 0.25, 'sawtooth', 0.04); },
    win: function () {
      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 0.2, 'square', 0.04, i * 0.11); });
    }
  };
})();
