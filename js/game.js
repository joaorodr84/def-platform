/* Deficientezinho — game logic: input, physics, entities, main loop. */
window.DEF = window.DEF || {};

(function () {
  'use strict';

  var W = 960, H = 540;
  var DT = 1 / 120;           // fixed physics step
  var TAU = Math.PI * 2;

  // ---- Tuning: this is where the "feel" of the chair lives ----------------
  var PH = {
    HALF_W: 16,        // half width used for wall checks
    WALL_TOL: 14,      // ledges up to this high are rolled over without hopping
    GROUND_TOL: 18,    // how far above the wheels ground is still "ground"
    LAND_TOL: 14,
    BASE_CAP: 240,     // normal top speed (px/s)
    BOOST_CAP: 390,
    ACC: 520,
    BOOST_ACC: 950,
    BRAKE: 1100,
    FRIC: 300,
    SLOPE_G: 800,      // how strongly ramps push you (times slope)
    OVER_DRAG: 100,    // slows you from above top speed
    MAX_V: 560,
    GRAV: 1500,
    FALL_MULT: 1.3,
    CUT_MULT: 3,       // extra gravity when hop is released early
    HOP_V: 500,        // hop speed: ~83px tall held, ~50px on a quick tap
    AIR_ACC: 1400,     // steering while airborne (strong, so one tap of a direction is enough)
    MAXFALL: 900,
    COYOTE: 0.1,
    BUFFER: 0.12,
    BOOST_DRAIN: 34,
    BOOST_REGEN: 10,
    HEARTS: 3
  };
  var SURF = {
    pave:   { cap: 1,    acc: 1,   fric: 1 },
    grass:  { cap: 0.85, acc: 0.85, fric: 1.5 },
    gravel: { cap: 0.55, acc: 0.6, fric: 2.4 }
  };

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  function fitCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
    var scale = Math.max(1, Math.min(2, (cssW * dpr) / W));
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // ---- Settings (remembered in the browser) --------------------------------
  // boostMode: 'toggle' = press the boost key once to turn boost on, again to
  //            turn it off (no holding). 'hold' = boost only while the key is held.
  var SETTINGS_KEY = 'def.settings';
  //  lang: 'pt' (Portugal, the default) or 'en'; see js/i18n.js.
  //  avatar: 'classic' or 'logo' (the hand-drawn Deficientezinho from the logo).
  var settings = { boostMode: 'toggle', lang: 'pt', avatar: 'classic' };
  try {
    var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved && (saved.boostMode === 'hold' || saved.boostMode === 'toggle')) settings.boostMode = saved.boostMode;
    if (saved && (saved.lang === 'pt' || saved.lang === 'en')) settings.lang = saved.lang;
    if (saved && (saved.avatar === 'classic' || saved.avatar === 'logo')) settings.avatar = saved.avatar;
  } catch (err) { /* no storage: defaults are fine */ }
  DEF.i18n.set(settings.lang);
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
  }

  // ---- Input ---------------------------------------------------------------
  var input = { left: false, right: false, down: false, hop: false };
  var touch = { left: false, right: false, hop: false };

  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', Numpad4: 'left',
    ArrowRight: 'right', KeyD: 'right', Numpad6: 'right',
    ArrowDown: 'down', KeyS: 'down', Numpad2: 'down',
    ArrowUp: 'hop', KeyW: 'hop', Space: 'hop', Numpad8: 'hop', Numpad0: 'hop',
    Numpad5: 'boost', KeyB: 'boost'
  };
  var held = {};

  function recomputeInput() {
    input.left = !!(held.left || touch.left);
    input.right = !!(held.right || touch.right);
    input.down = !!held.down;
    var hop = !!(held.hop || touch.hop);
    if (hop && !input.hop) S.hopBuf = PH.BUFFER;
    input.hop = hop;
  }

  // Boost: one key does everything, so nobody has to hold two keys at once.
  function setBoost(on) {
    S.boostOn = !!on && !(S.player && S.player.boost <= 0);
    var b = document.getElementById('tb');
    if (b) b.classList.toggle('on', S.boostOn);
  }
  function boostPressed() {
    if (S.mode !== 'play') return;
    setBoost(settings.boostMode === 'toggle' ? !S.boostOn : true);
  }
  function boostReleased() {
    if (settings.boostMode === 'hold') setBoost(false);
  }

  function openSettings() { S.settingsOpen = true; S.settingsRow = 0; if (S.mode === 'play') S.mode = 'pause'; }
  function closeSettings() { S.settingsOpen = false; }
  // Row 0 = boost mode, row 1 = language, row 2 = avatar. A press flips the selected row.
  function changeSetting(row) {
    if (row === 0) {
      settings.boostMode = settings.boostMode === 'toggle' ? 'hold' : 'toggle';
      setBoost(false);
    } else if (row === 1) {
      settings.lang = settings.lang === 'pt' ? 'en' : 'pt';
      DEF.i18n.set(settings.lang);
    } else {
      settings.avatar = settings.avatar === 'logo' ? 'classic' : 'logo';
    }
    saveSettings();
    DEF.audio.checkpoint();
  }

  var SETTINGS_FLIP = ['Space', 'Enter', 'NumpadEnter', 'Numpad5', 'ArrowLeft', 'ArrowRight', 'Numpad4', 'Numpad6'];
  var SETTINGS_BACK = ['KeyO', 'Escape', 'KeyP'];
  var SETTINGS_UP = ['ArrowUp', 'KeyW', 'Numpad8'];
  var SETTINGS_DOWN = ['ArrowDown', 'KeyS', 'Numpad2'];

  window.addEventListener('keydown', function (e) {
    DEF.audio.init();
    // Settings screen swallows every key
    if (S.settingsOpen) {
      if (!e.repeat) {
        if (SETTINGS_FLIP.indexOf(e.code) >= 0) changeSetting(S.settingsRow);
        else if (SETTINGS_UP.indexOf(e.code) >= 0) S.settingsRow = Math.max(0, S.settingsRow - 1);
        else if (SETTINGS_DOWN.indexOf(e.code) >= 0) S.settingsRow = Math.min(2, S.settingsRow + 1);
        else if (SETTINGS_BACK.indexOf(e.code) >= 0) closeSettings();
      }
      e.preventDefault();
      return;
    }
    var a = KEYMAP[e.code];
    if (a === 'boost') {
      if (!e.repeat) boostPressed();
      e.preventDefault();
      return;
    }
    if (a) {
      held[a] = true;
      recomputeInput();
      e.preventDefault();
    }
    if (e.repeat) return;
    if (e.code === 'KeyO' && S.mode !== 'win') { openSettings(); return; }
    if (S.mode === 'title' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) { startRun(); e.preventDefault(); return; }
    if (S.mode === 'win' && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyR')) { startRun(); return; }
    if (e.code === 'KeyR' && (S.mode === 'play' || S.mode === 'pause')) startRun();
    if ((e.code === 'KeyP' || e.code === 'Escape') && (S.mode === 'play' || S.mode === 'pause')) {
      S.mode = S.mode === 'play' ? 'pause' : 'play';
    }
    if (e.code === 'KeyM') { S.muted = DEF.audio.toggleMute(); }
  });
  window.addEventListener('keyup', function (e) {
    var a = KEYMAP[e.code];
    if (a === 'boost') { boostReleased(); e.preventDefault(); return; }
    if (a) { held[a] = false; recomputeInput(); e.preventDefault(); }
  });
  window.addEventListener('blur', function () {
    held = {}; touch.left = touch.right = touch.hop = false;
    recomputeInput();
    boostReleased();
    if (S.mode === 'play') S.mode = 'pause';
  });

  // Mouse / touch on the canvas (logical 960x540 coordinates)
  canvas.addEventListener('pointerdown', function (e) {
    DEF.audio.init();
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (S.settingsOpen) {
      var top = (H - 496) / 2;
      if (y > top + 446) closeSettings();                           // Back button
      else if (y > top + 332) { S.settingsRow = 2; changeSetting(2); }
      else if (y > top + 232) { S.settingsRow = 1; changeSetting(1); }
      else if (y > top + 62) { S.settingsRow = 0; changeSetting(0); }
      return;
    }
    if (x > W - 190 && y > H - 56 && (S.mode === 'title' || S.mode === 'pause')) { openSettings(); return; }
    if (S.mode === 'title' || S.mode === 'win') startRun();
    else if (S.mode === 'pause') S.mode = 'play';
  });

  // Touch buttons (shown only on touch devices)
  (function () {
    var el = document.getElementById('touch');
    if (!el) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) el.hidden = false;
    function bind(id, key) {
      var b = document.getElementById(id);
      function set(v) { touch[key] = v; b.classList.toggle('on', v); recomputeInput(); }
      b.addEventListener('pointerdown', function (e) {
        DEF.audio.init(); e.preventDefault();
        if (key === 'boost') { boostPressed(); return; }
        set(true);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) {
        b.addEventListener(n, function () { if (key === 'boost') boostReleased(); else set(false); });
      });
    }
    bind('tl', 'left'); bind('tr', 'right'); bind('th', 'hop'); bind('tb', 'boost');
  })();

  // ---- State ---------------------------------------------------------------
  var S = {
    mode: 'title',          // title | play | pause | win
    W: W, H: H, ctx: ctx,
    level: DEF.level1,
    clock: 0,               // seconds, drives moving platforms + animation
    time: 0,                // run timer
    cam: { x: 0 },
    player: null,
    tokens: [], batteries: [], carts: [], checkpoints: [], movers: [],
    particles: [], toasts: [],
    hopBuf: 0, coyote: 0,
    boostOn: false,         // is boost currently on
    settings: settings,
    settingsOpen: false,
    settingsRow: 0,
    muted: false,
    best: null,
    result: null,
    shake: 0
  };
  DEF.S = S;

  var terrain, ramps, moverSegs, hitSeg = null;

  function prep(seg) { seg.slope = (seg.y2 - seg.y1) / (seg.x2 - seg.x1); return seg; }

  // ---- Queries -------------------------------------------------------------
  // Highest surface at x that is no more than `tol` above `py`. Sets hitSeg.
  function surfaceAt(x, py, tol, solidOnly) {
    var best = Infinity, hit = null, i, s, v, lim = py - tol;
    for (i = 0; i < terrain.length; i++) {
      s = terrain[i];
      if (x < s.x1 || x > s.x2) continue;
      v = s.y1 + (x - s.x1) * s.slope;
      if (v >= lim && v < best) { best = v; hit = s; }
    }
    if (!solidOnly) {
      for (i = 0; i < ramps.length; i++) {
        s = ramps[i];
        if (x < s.x1 || x > s.x2) continue;
        v = s.y1 + (x - s.x1) * s.slope;
        if (v >= lim && v < best) { best = v; hit = s; }
      }
      for (i = 0; i < moverSegs.length; i++) {
        s = moverSegs[i];
        if (x < s.x1 || x > s.x2) continue;
        v = s.y1;
        if (v >= lim && v < best) { best = v; hit = s; }
      }
    }
    hitSeg = hit;
    return best;
  }
  // Highest solid ground at x regardless of height (for walls & enemies).
  function solidTop(x) {
    var best = Infinity;
    for (var i = 0; i < terrain.length; i++) {
      var s = terrain[i];
      if (x < s.x1 || x > s.x2) continue;
      var v = s.y1 + (x - s.x1) * s.slope;
      if (v < best) best = v;
    }
    return best;
  }
  S.solidTop = solidTop;

  // ---- Effects -------------------------------------------------------------
  function puff(x, y, n, color, spread, up) {
    for (var i = 0; i < n; i++) {
      S.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * spread, vy: -Math.random() * (up || 60),
        life: 0.35 + Math.random() * 0.3, max: 0.65,
        size: 2 + Math.random() * 3, color: color, grav: 200
      });
    }
  }
  function confetti(x, y) {
    var cols = ['#ffb703', '#0ea5a4', '#ff6b6b', '#ffffff', '#8ecae6'];
    for (var i = 0; i < 90; i++) {
      S.particles.push({
        x: x + (Math.random() - 0.5) * 300, y: y - 80 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 260,
        life: 2.5 + Math.random(), max: 3.5, size: 3 + Math.random() * 4,
        color: cols[i % cols.length], grav: 300, confetti: true
      });
    }
  }
  // msg is a translation key (js/i18n.js)
  function toast(msg, secs) { S.toasts.push({ msg: msg, t: secs || 2.2 }); if (S.toasts.length > 3) S.toasts.shift(); }

  // ---- Run setup -----------------------------------------------------------
  function startRun() {
    var L = S.level;
    terrain = L.terrain.map(prep);
    ramps = L.ramps.map(prep);
    S.movers = L.movers.map(function (m) {
      var mv = {
        cx: m.cx, cy: m.cy, ax: m.ax, ay: m.ay, w: m.w, omega: TAU / m.period, phase: m.phase,
        x: 0, y: 0, dx: 0, dy: 0
      };
      mv.x = mv.cx + mv.ax * Math.sin(mv.phase);
      mv.y = mv.cy + mv.ay * Math.sin(mv.phase);
      mv.seg = { x1: mv.x - mv.w / 2, x2: mv.x + mv.w / 2, y1: mv.y, y2: mv.y, slope: 0, mover: mv };
      return mv;
    });
    moverSegs = S.movers.map(function (m) { return m.seg; });

    S.tokens = L.tokens.map(function (t) { return { x: t.x, y: t.y, got: false }; });
    S.batteries = L.batteries.map(function (b) { return { x: b.x, y: b.y, got: false }; });
    S.carts = L.carts.map(function (c) {
      return { x: c.x, y: solidTop(c.x), x0: c.x0, x1: c.x1, speed: c.speed, dir: c.dir, dead: 0, wheel: 0 };
    });
    S.checkpoints = L.checkpoints.map(function (c) { return { x: c.x, y: c.y, on: false }; });
    S.particles = []; S.toasts = [];
    S.clock = 0; S.time = 0; S.hopBuf = 0; S.coyote = 0; S.shake = 0; S.boostOn = false;
    S.deaths = 0; S.result = null; S.stomps = 0;
    S.respawn = { x: L.spawn.x, y: solidTop(L.spawn.x) };

    S.player = {
      x: S.respawn.x, y: S.respawn.y, vx: 0, vy: 0,
      grounded: true, groundSeg: null, slope: 0, surf: 'pave',
      face: 1, hearts: PH.HEARTS, boost: 100, boosting: false,
      invuln: 0, hopping: false, wheelRot: 0, tilt: 0, wheelie: 0, push: 0,
      lastSlope: 0, hopsUsed: 0, squash: 0
    };
    S.cam.x = 0;
    S.mode = 'play';
  }

  function respawn(reason) {
    var p = S.player;
    S.deaths++;
    p.x = S.respawn.x; p.y = S.respawn.y; p.vx = 0; p.vy = 0;
    p.grounded = true; p.groundSeg = null; p.slope = 0;
    p.hearts = PH.HEARTS; p.invuln = 1.5; p.boost = Math.max(p.boost, 50);
    p.hopping = false; p.tilt = 0; p.wheelie = 0;
    DEF.audio.respawn();
    toast(reason, 2.6);
    S.shake = 0.2;
  }

  // ---- Physics -------------------------------------------------------------
  function updateMovers() {
    S.movers.forEach(function (m) {
      var a = S.clock * m.omega + m.phase;
      var nx = m.cx + m.ax * Math.sin(a), ny = m.cy + m.ay * Math.sin(a);
      m.dx = nx - m.x; m.dy = ny - m.y; m.x = nx; m.y = ny;
      var s = m.seg;
      s.x1 = nx - m.w / 2; s.x2 = nx + m.w / 2; s.y1 = s.y2 = ny;
    });
  }

  function updatePlayer(dt) {
    var p = S.player, L = S.level;

    // Ride moving platforms
    if (p.grounded && p.groundSeg && p.groundSeg.mover) {
      p.x += p.groundSeg.mover.dx; p.y += p.groundSeg.mover.dy;
    }

    var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    p.invuln = Math.max(0, p.invuln - dt);
    S.hopBuf -= dt;

    // Boost
    if (S.boostOn && p.boost <= 0) S.boostOn = false;
    p.boosting = S.boostOn && p.boost > 0 && (dir !== 0 || Math.abs(p.vx) > 60);
    if (p.boosting) {
      p.boost = Math.max(0, p.boost - PH.BOOST_DRAIN * dt);
    } else if (p.grounded && !S.boostOn) {
      p.boost = Math.min(100, p.boost + PH.BOOST_REGEN * dt);
    }

    var air = !p.grounded;
    var sf = SURF[p.surf] || SURF.pave;
    var cap = (p.boosting ? PH.BOOST_CAP : PH.BASE_CAP) * (air ? 1 : sf.cap);
    var acc = air ? PH.AIR_ACC : (p.boosting ? PH.BOOST_ACC : PH.ACC) * sf.acc;

    // Horizontal control
    if (dir !== 0) {
      p.face = dir;
      if (p.vx * dir < 0) {
        p.vx += dir * PH.BRAKE * dt;                    // turning around
      } else if (p.vx * dir < cap) {
        p.vx += dir * acc * dt;
        if (p.vx * dir > cap) p.vx = dir * cap;
      }
    } else if (!air) {
      var f = PH.FRIC * sf.fric * dt;
      p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
    }
    if (!air) {
      if (input.down) {
        var br = PH.BRAKE * dt;
        p.vx = Math.abs(p.vx) <= br ? 0 : p.vx - Math.sign(p.vx) * br;
      }
      p.vx += PH.SLOPE_G * p.slope * dt;                // ramps push you
      if (Math.abs(p.vx) > cap) {
        var drag = PH.OVER_DRAG * sf.fric * dt;
        p.vx -= Math.sign(p.vx) * Math.min(drag, Math.abs(p.vx) - cap);
      }
    }
    p.vx = Math.max(-PH.MAX_V, Math.min(PH.MAX_V, p.vx));

    // Coyote time + hop
    S.coyote = p.grounded ? PH.COYOTE : S.coyote - dt;
    if (S.hopBuf > 0 && (p.grounded || S.coyote > 0)) {
      p.vy = -PH.HOP_V; p.grounded = false; p.groundSeg = null;
      p.hopping = true; p.hopsUsed++;
      S.coyote = 0; S.hopBuf = 0;
      DEF.audio.hop();
      puff(p.x, p.y, 4, '#cfd6e4', 60, 20);
    }

    // Move horizontally, blocked by walls taller than WALL_TOL
    var dx = p.vx * dt;
    if (dx !== 0) {
      var nx = p.x + dx;
      var edge = nx + Math.sign(dx) * PH.HALF_W;
      var sy = solidTop(edge);
      if (sy < p.y - PH.WALL_TOL) {
        if (Math.abs(p.vx) > 150) { DEF.audio.bump(); puff(edge, p.y - 10, 4, '#cfd6e4', 80, 40); }
        p.vx = 0;
      } else {
        p.x = nx;
      }
    }
    p.x = Math.max(PH.HALF_W, Math.min(L.worldEnd, p.x));

    // Vertical
    if (p.grounded) {
      var gy = surfaceAt(p.x, p.y, PH.GROUND_TOL);
      var drop = gy - p.y;
      if (gy !== Infinity && drop <= 4 + Math.abs(dx) * 1.1) {
        p.y = gy;
        p.groundSeg = hitSeg;
        p.slope = hitSeg.slope;
        p.surf = hitSeg.surf || 'pave';
        p.lastSlope = p.slope;
      } else {
        // Rolled off an edge. Leaving the top of a ramp launches you.
        p.grounded = false; p.groundSeg = null;
        p.vy = Math.min(0, p.vx * p.lastSlope);
        p.slope = 0;
      }
    } else {
      var g = PH.GRAV * (p.vy < 0 ? 1 : PH.FALL_MULT);
      if (p.vy < 0 && !input.hop && p.hopping) g = PH.GRAV * PH.CUT_MULT;
      var prevY = p.y;
      p.vy = Math.min(PH.MAXFALL, p.vy + g * dt);
      p.y += p.vy * dt;
      if (p.vy >= 0) {
        var ly = surfaceAt(p.x, prevY, PH.LAND_TOL);
        if (ly !== Infinity && p.y >= ly) {
          var impact = p.vy;
          p.y = ly; p.vy = 0; p.grounded = true; p.hopping = false;
          p.groundSeg = hitSeg; p.slope = hitSeg.slope; p.lastSlope = p.slope;
          p.surf = hitSeg.surf || 'pave';
          if (impact > 200) {
            p.squash = Math.min(1, impact / 600);
            DEF.audio.land();
            puff(p.x, p.y, 5, p.surf === 'grass' ? '#6fb653' : '#cfd6e4', 90, 30);
          }
        }
      }
    }

    // Visual state
    p.wheelRot += (p.vx * dt) / 17;
    var tiltTarget = p.grounded ? Math.atan(p.slope) : Math.max(-0.25, Math.min(0.35, p.vy * 0.0004));
    p.tilt += (tiltTarget - p.tilt) * Math.min(1, dt * 14);
    var wheelieTarget = 0;
    if (p.boosting && p.grounded) wheelieTarget = 0.32;
    else if (!p.grounded && p.vy < 0) wheelieTarget = 0.16;
    p.wheelie += (wheelieTarget - p.wheelie) * Math.min(1, dt * 10);
    p.squash = Math.max(0, p.squash - dt * 5);
    p.push = Math.abs(p.vx) > 5 ? p.push + Math.abs(p.vx) * dt * 0.05 : p.push;
    if (p.boosting && Math.random() < 0.5) {
      puff(p.x - p.face * 18, p.y - 8, 1, '#ffb703', 50, 20);
    }

    // Fell into a pit
    if (p.y > 760) respawn('toast.pit');
  }

  function hurt(from) {
    var p = S.player;
    if (p.invuln > 0) return;
    p.hearts--;
    p.invuln = 1.4;
    p.vx = (p.x < from ? -1 : 1) * 220;
    p.vy = -260; p.grounded = false; p.groundSeg = null; p.hopping = false;
    DEF.audio.hurt();
    S.shake = 0.25;
    puff(p.x, p.y - 30, 8, '#ff6b6b', 160, 120);
    if (p.hearts <= 0) respawn('toast.cells');
  }

  function updateCarts(dt) {
    var p = S.player;
    S.carts.forEach(function (c) {
      if (c.dead > 0) { c.dead -= dt; if (c.dead <= 0) c.dead = -1; return; }
      if (c.dead < 0) return;
      c.x += c.dir * c.speed * dt;
      if (c.x < c.x0) { c.x = c.x0; c.dir = 1; }
      if (c.x > c.x1) { c.x = c.x1; c.dir = -1; }
      var sy = solidTop(c.x);
      if (sy !== Infinity) c.y = sy;
      c.wheel += c.dir * c.speed * dt / 7;

      // Collision (boxes)
      if (Math.abs(p.x - c.x) < 14 + 24 && p.y > c.y - 34 && p.y - 60 < c.y) {
        var prevFeet = p.y - p.vy * dt;
        if (p.vy > 0 && prevFeet <= c.y - 22) {
          c.dead = 0.35;                          // squashed
          p.vy = -380; p.hopping = true; p.grounded = false; p.groundSeg = null;
          S.stomps++;
          DEF.audio.stomp();
          puff(c.x, c.y - 10, 8, '#cfd6e4', 140, 100);
        } else {
          hurt(c.x);
        }
      }
    });
  }

  function updatePickups() {
    var p = S.player;
    S.tokens.forEach(function (t) {
      if (t.got) return;
      var dx = t.x - p.x, dy = t.y - (p.y - 30);
      if (dx * dx + dy * dy < 30 * 30) {
        t.got = true; DEF.audio.coin();
        puff(t.x, t.y, 6, '#ffb703', 120, 80);
      }
    });
    S.batteries.forEach(function (b) {
      if (b.got) return;
      var dx = b.x - p.x, dy = b.y - (p.y - 30);
      if (dx * dx + dy * dy < 32 * 32) {
        b.got = true; p.boost = Math.min(100, p.boost + 50);
        if (p.hearts < PH.HEARTS) p.hearts++;
        DEF.audio.battery();
        puff(b.x, b.y, 8, '#9bf06a', 140, 100);
        toast('toast.battery', 1.4);
      }
    });
    S.checkpoints.forEach(function (c) {
      if (!c.on && p.x >= c.x) {
        c.on = true;
        S.respawn = { x: c.x, y: c.y };
        DEF.audio.checkpoint();
        toast('toast.checkpoint', 1.6);
      }
    });
  }

  function finishRun() {
    var L = S.level, got = 0, total = S.tokens.length;
    S.tokens.forEach(function (t) { if (t.got) got++; });
    var stars = 1;
    if (got >= Math.ceil(total * 0.8)) stars++;
    if (S.time <= L.par) stars++;
    S.result = { time: S.time, tokens: got, total: total, stars: stars, deaths: S.deaths, stomps: S.stomps };
    try {
      var key = 'def.best.level1';
      var prev = parseFloat(localStorage.getItem(key));
      S.best = (isFinite(prev) && prev < S.time) ? prev : S.time;
      localStorage.setItem(key, String(S.best));
    } catch (e) { S.best = null; }
    S.mode = 'win';
    DEF.audio.win();
    confetti(S.player.x, S.player.y);
  }

  function step(dt) {
    S.clock += dt;
    if (S.mode === 'play') {
      S.time += dt;
      updateMovers();
      updatePlayer(dt);
      updateCarts(dt);
      updatePickups();
      if (S.player.x >= S.level.finishX) finishRun();
    } else if (S.mode === 'win') {
      updateMovers();
    }
    // Particles + toasts keep running
    for (var i = S.particles.length - 1; i >= 0; i--) {
      var q = S.particles[i];
      q.life -= dt;
      if (q.life <= 0) { S.particles.splice(i, 1); continue; }
      q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (var j = S.toasts.length - 1; j >= 0; j--) {
      S.toasts[j].t -= dt;
      if (S.toasts[j].t <= 0) S.toasts.splice(j, 1);
    }
    S.shake = Math.max(0, S.shake - dt);
  }

  function updateCamera(dt) {
    var p = S.player, L = S.level;
    var px = p ? p.x : 0;
    var target = px - W * 0.38 + (p ? p.face * 70 : 0);
    target = Math.max(0, Math.min(L.worldEnd + 100 - W, target));
    S.cam.x += (target - S.cam.x) * Math.min(1, dt * 6);
  }

  // ---- Main loop -----------------------------------------------------------
  var last = 0, acc = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (S.mode === 'play' || S.mode === 'win' || S.mode === 'title') {
      acc += dt;
      while (acc >= DT) { step(DT); acc -= DT; }
    }
    updateCamera(dt);
    DEF.render(S, PH);
    requestAnimationFrame(frame);
  }

  // Prepare a world to show behind the title screen.
  (function initTitle() {
    var L = S.level;
    terrain = L.terrain.map(prep);
    ramps = L.ramps.map(prep);
    S.movers = L.movers.map(function (m) {
      var mv = { cx: m.cx, cy: m.cy, ax: m.ax, ay: m.ay, w: m.w, omega: TAU / m.period, phase: m.phase, x: m.cx, y: m.cy, dx: 0, dy: 0 };
      mv.seg = { x1: mv.x - mv.w / 2, x2: mv.x + mv.w / 2, y1: mv.y, y2: mv.y, slope: 0, mover: mv };
      return mv;
    });
    moverSegs = S.movers.map(function (m) { return m.seg; });
    S.tokens = L.tokens.map(function (t) { return { x: t.x, y: t.y, got: false }; });
    S.batteries = L.batteries.map(function (b) { return { x: b.x, y: b.y, got: false }; });
    S.carts = L.carts.map(function (c) {
      return { x: c.x, y: solidTop(c.x), x0: c.x0, x1: c.x1, speed: c.speed, dir: c.dir, dead: 0, wheel: 0 };
    });
    S.checkpoints = L.checkpoints.map(function (c) { return { x: c.x, y: c.y, on: false }; });
    S.player = {
      x: L.spawn.x, y: solidTop(L.spawn.x), vx: 0, vy: 0, grounded: true, slope: 0, surf: 'pave',
      face: 1, hearts: PH.HEARTS, boost: 100, boosting: false, invuln: 0, wheelRot: 0, tilt: 0, wheelie: 0, push: 0, squash: 0
    };
    try {
      var b = parseFloat(localStorage.getItem('def.best.level1'));
      S.best = isFinite(b) ? b : null;
    } catch (e) { S.best = null; }
  })();

  // Handy for debugging / automated tests
  DEF.debug = { step: step, startRun: startRun, input: input, recompute: recomputeInput, held: held, PH: PH };

  requestAnimationFrame(frame);
})();
