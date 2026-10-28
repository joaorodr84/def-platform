/* Deficientezinho — drawing. Everything is vector shapes, no image files.
 * Swap the THEME colours to match your brand. */
window.DEF = window.DEF || {};

(function () {
  'use strict';

  var TAU = Math.PI * 2;

  var THEME = DEF.theme = {
    brand: '#0ea5a4',        // main brand colour (shirt, ramps, buttons)
    brandDark: '#0b4f5c',    // cap, shadows
    accent: '#ffb703',       // coins, boost, highlights
    skyTop: '#6ec3ee',
    skyBottom: '#eaf8ff',
    ink: '#1d2433',
    font: '"Trebuchet MS", "Segoe UI", Helvetica, Arial, sans-serif'
  };

  var SURF_COLORS = {
    pave:   { body: '#59627a', top: '#8e99b0', deep: '#474f65' },
    grass:  { body: '#5a4a38', top: '#69b44e', deep: '#4a3c2d' },
    gravel: { body: '#6f6254', top: '#b3a48f', deep: '#5c5145' }
  };

  var ctx, S, PH;
  var tr = function (k, a) { return DEF.i18n.t(k, a); };

  // ---- Seeded scenery -------------------------------------------------------
  function rng(seed) {
    var s = seed;
    return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  }
  var layers = null;
  function makeLayers(worldEnd) {
    var r = rng(7);
    function mk(speed, color, minH, maxH, minW, maxW, windows) {
      var arr = [], x = -100, end = worldEnd * speed + 1400;
      while (x < end) {
        var w = minW + r() * (maxW - minW);
        arr.push({ x: x, w: w, h: minH + r() * (maxH - minH), seed: r() });
        x += w + r() * 14;
      }
      return { speed: speed, color: color, items: arr, windows: windows };
    }
    layers = [
      mk(0.12, '#cfe2f1', 120, 260, 70, 150, false),
      mk(0.30, '#b4cde3', 90, 220, 60, 130, true)
    ];
  }

  // ---- Small helpers -------------------------------------------------------
  function text(str, x, y, o) {
    o = o || {};
    ctx.font = (o.weight || 'bold') + ' ' + (o.size || 16) + 'px ' + THEME.font;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.stroke) {
      ctx.lineWidth = o.strokeW || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round';
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, x, y);
  }
  function wrap(str, maxW) {
    var words = str.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function line(x1, y1, x2, y2, w, color, cap) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap || 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // ---- Background ----------------------------------------------------------
  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, S.H);
    g.addColorStop(0, THEME.skyTop);
    g.addColorStop(1, THEME.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S.W, S.H);
    // sun
    ctx.fillStyle = 'rgba(255,244,200,0.85)';
    ctx.beginPath(); ctx.arc(790, 110, 46, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,244,200,0.25)';
    ctx.beginPath(); ctx.arc(790, 110, 74, 0, TAU); ctx.fill();
    // clouds
    var cx = S.cam.x * 0.05 + S.clock * 6;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (var i = 0; i < 6; i++) {
      var x = ((i * 260 - cx) % 1500 + 1500) % 1500 - 200, y = 60 + (i * 53) % 130;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, TAU); ctx.arc(x + 24, y - 10, 26, 0, TAU);
      ctx.arc(x + 54, y, 22, 0, TAU); ctx.arc(x + 26, y + 6, 22, 0, TAU);
      ctx.fill();
    }
  }
  function drawLayers() {
    if (!layers) makeLayers(S.level.worldEnd);
    layers.forEach(function (ly) {
      var off = S.cam.x * ly.speed;
      var base = 520;
      ctx.fillStyle = ly.color;
      ly.items.forEach(function (b) {
        var sx = b.x - off;
        if (sx > S.W + 20 || sx + b.w < -20) return;
        ctx.fillRect(sx, base - b.h, b.w, b.h + 60);
        if (ly.windows) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          for (var wy = base - b.h + 12; wy < base - 20; wy += 22) {
            for (var wx = sx + 8; wx < sx + b.w - 12; wx += 18) {
              if (((wx * 7 + wy * 13 + b.seed * 100) | 0) % 5 < 3) ctx.fillRect(wx, wy, 8, 11);
            }
          }
          ctx.fillStyle = ly.color;
        }
      });
    });
  }

  // ---- World ---------------------------------------------------------------
  function inView(x1, x2) { return x2 > S.cam.x - 80 && x1 < S.cam.x + S.W + 80; }

  function drawPits() {
    S.level.pits.forEach(function (p) {
      if (!inView(p.x1, p.x2)) return;
      var g = ctx.createLinearGradient(0, p.y, 0, S.H);
      g.addColorStop(0, 'rgba(14,18,32,0.0)');
      g.addColorStop(1, 'rgba(14,18,32,0.92)');
      ctx.fillStyle = g;
      ctx.fillRect(p.x1, p.y - 40, p.x2 - p.x1, S.H - p.y + 80);
    });
  }

  function drawTerrain() {
    var L = S.level, H = S.H + 60;
    L.terrain.forEach(function (s) {
      if (!inView(s.x1, s.x2)) return;
      var c = SURF_COLORS[s.surf] || SURF_COLORS.pave;
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.lineTo(s.x2, H); ctx.lineTo(s.x1, H);
      ctx.closePath(); ctx.fill();
      // top strip
      ctx.fillStyle = c.top;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.lineTo(s.x2, s.y2 + 9); ctx.lineTo(s.x1, s.y1 + 9);
      ctx.closePath(); ctx.fill();
      // surface detail
      if (s.surf === 'gravel') {
        ctx.fillStyle = 'rgba(40,30,20,0.35)';
        for (var gx = Math.ceil(s.x1 / 14) * 14; gx < s.x2; gx += 14) {
          var gy = s.y1 + (gx - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
          ctx.fillRect(gx + (gx * 7) % 5, gy + 3 + (gx * 3) % 9, 3, 2);
          ctx.fillRect(gx + 5, gy + 14 + (gx * 5) % 17, 4, 2);
        }
      } else if (s.surf === 'grass') {
        ctx.strokeStyle = '#4d9a38'; ctx.lineWidth = 2;
        for (var tx = Math.ceil(s.x1 / 10) * 10; tx < s.x2; tx += 10) {
          var ty = s.y1 + (tx - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 2, ty - 5 - (tx * 3) % 4); ctx.stroke();
        }
      } else {
        // pavement joints
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (var jx = Math.ceil(s.x1 / 90) * 90; jx < s.x2; jx += 90) {
          var jy = s.y1 + (jx - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
          ctx.fillRect(jx, jy + 9, 2, 40);
        }
      }
    });
    // Curb faces and cliff walls
    L.edges.forEach(function (e) {
      if (!inView(e.x, e.x)) return;
      if (e.kind === 'step') {
        line(e.x, e.y1, e.x, e.y2, 3, '#b9c2d6', 'butt');
      } else {
        line(e.x, e.y1, e.x, e.y2, 3, '#2b3248', 'butt');
      }
    });
  }

  function drawRamps() {
    var L = S.level;
    L.ramps.forEach(function (r) {
      if (!inView(r.x1, r.x2)) return;
      var slope = (r.y2 - r.y1) / (r.x2 - r.x1);
      var yAt = function (x) { return r.y1 + (x - r.x1) * slope; };
      // supports
      for (var sx = r.x1 + 40; sx < r.x2; sx += 90) {
        var top = S.solidTop(sx);
        if (top < 700) line(sx, yAt(sx) + 12, sx, top, 5, '#4b5469', 'butt');
      }
      // slab
      ctx.fillStyle = THEME.brandDark;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.lineTo(r.x2, r.y2 + 14); ctx.lineTo(r.x1, r.y1 + 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = THEME.brand;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.lineTo(r.x2, r.y2 + 7); ctx.lineTo(r.x1, r.y1 + 7);
      ctx.closePath(); ctx.fill();
      // chevrons
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (var cx = r.x1 + 20; cx < r.x2 - 20; cx += 36) {
        var cy = yAt(cx);
        ctx.beginPath();
        ctx.moveTo(cx, cy + 1); ctx.lineTo(cx + 8, cy + 1); ctx.lineTo(cx + 14, cy + 5); ctx.lineTo(cx + 6, cy + 5);
        ctx.closePath(); ctx.fill();
      }
      // handrail
      line(r.x1 + 20, yAt(r.x1 + 20) - 34, r.x2, yAt(r.x2) - 34, 3, THEME.accent);
      for (var px = r.x1 + 20; px <= r.x2; px += 70) {
        line(px, yAt(px), px, yAt(px) - 34, 3, THEME.accent);
      }
    });
  }

  function drawMovers() {
    S.movers.forEach(function (m) {
      if (!inView(m.x - m.w, m.x + m.w)) return;
      var x = m.x - m.w / 2, y = m.y;
      // cable
      line(m.x, y, m.x, y - 600, 2, 'rgba(60,70,90,0.35)', 'butt');
      ctx.fillStyle = THEME.brandDark; roundRect(x, y, m.w, 14, 5); ctx.fill();
      ctx.fillStyle = THEME.accent; roundRect(x, y, m.w, 6, 3); ctx.fill();
      ctx.fillStyle = THEME.ink;
      for (var i = 6; i < m.w - 10; i += 20) {
        ctx.beginPath();
        ctx.moveTo(x + i, y); ctx.lineTo(x + i + 8, y); ctx.lineTo(x + i + 2, y + 6); ctx.lineTo(x + i - 6, y + 6);
        ctx.closePath(); ctx.fill();
      }
    });
  }

  function drawDecor() {
    S.level.decor.forEach(function (d) {
      if (d.type === 'building') drawBuilding(d);
      else if (d.type === 'lamp') drawLamp(d);
      else if (d.type === 'tree') drawTree(d);
      else if (d.type === 'bench') drawBench(d);
    });
  }
  function drawLamp(d) {
    if (!inView(d.x - 30, d.x + 30)) return;
    line(d.x, d.y, d.x, d.y - 130, 5, '#3a4258', 'butt');
    line(d.x, d.y - 130, d.x + 26, d.y - 130, 5, '#3a4258', 'butt');
    ctx.fillStyle = '#fff3b0';
    roundRect(d.x + 18, d.y - 130, 18, 8, 3); ctx.fill();
  }
  function drawTree(d) {
    if (!inView(d.x - 60, d.x + 60)) return;
    line(d.x, d.y + 4, d.x, d.y - 60, 10, '#6b4a2e', 'butt');
    ctx.fillStyle = '#3f8f3e';
    ctx.beginPath(); ctx.arc(d.x, d.y - 85, 40, 0, TAU); ctx.fill();
    ctx.fillStyle = '#52a84b';
    ctx.beginPath(); ctx.arc(d.x - 18, d.y - 74, 26, 0, TAU); ctx.arc(d.x + 20, d.y - 96, 24, 0, TAU); ctx.fill();
  }
  function drawBench(d) {
    if (!inView(d.x - 50, d.x + 50)) return;
    line(d.x - 34, d.y, d.x - 34, d.y - 14, 4, '#3a4258', 'butt');
    line(d.x + 34, d.y, d.x + 34, d.y - 14, 4, '#3a4258', 'butt');
    ctx.fillStyle = '#9a6b3c'; ctx.fillRect(d.x - 42, d.y - 22, 84, 8);
    ctx.fillRect(d.x - 42, d.y - 42, 84, 6);
  }
  function drawBuilding(d) {
    if (!inView(d.x, d.x + d.w)) return;
    var bottom = 600;
    ctx.fillStyle = '#8c93a8'; ctx.fillRect(d.x, d.top, d.w, bottom - d.top);
    ctx.fillStyle = '#767d93'; ctx.fillRect(d.x, d.top, d.w, 16);
    // windows
    for (var wy = d.top + 40; wy < d.y - 60; wy += 56) {
      for (var wx = d.x + 30; wx < d.x + d.w - 50; wx += 62) {
        var lit = ((wx * 3 + wy) | 0) % 7 === 0;
        ctx.fillStyle = lit ? '#ffe9a8' : '#c8d6e8';
        ctx.fillRect(wx, wy, 34, 34);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(wx + 16, wy, 2, 34);
      }
    }
    // sign
    ctx.fillStyle = THEME.brandDark; roundRect(d.x + d.w / 2 - 190, d.top + 22, 380, 44, 8); ctx.fill();
    text(tr(d.label), d.x + d.w / 2, d.top + 52, { size: 24, align: 'center', color: '#fff' });
    // door at plateau level
    ctx.fillStyle = '#3a4258'; roundRect(d.doorX - 28, d.doorY - 84, 56, 84, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(d.doorX - 22, d.doorY - 78, 44, 30);
    ctx.fillStyle = THEME.accent; ctx.fillRect(d.doorX + 14, d.doorY - 40, 5, 12);
    // out-of-order elevator
    var ex = d.elevatorX;
    ctx.fillStyle = '#5a6278'; roundRect(ex - 34, d.doorY - 92, 68, 92, 4); ctx.fill();
    ctx.fillStyle = '#aab3c7'; ctx.fillRect(ex - 28, d.doorY - 86, 27, 86); ctx.fillRect(ex + 1, d.doorY - 86, 27, 86);
    ctx.fillStyle = '#d33'; ctx.fillRect(ex - 40, d.doorY - 118, 80, 18);
    text(tr('elevator.broken'), ex, d.doorY - 104, { size: 11, align: 'center', color: '#fff' });
    // stairs railing hint (the "main entrance")
    ctx.globalAlpha = 1;
  }

  function drawSigns() {
    var p = S.player;
    S.level.signs.forEach(function (s) {
      if (!inView(s.x - 40, s.x + 40)) return;
      line(s.x, s.y, s.x, s.y - 52, 5, '#6b4a2e', 'butt');
      ctx.fillStyle = '#f4e3b2'; roundRect(s.x - 22, s.y - 72, 44, 30, 4); ctx.fill();
      ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 3; roundRect(s.x - 22, s.y - 72, 44, 30, 4); ctx.stroke();
      text('i', s.x, s.y - 50, { size: 22, align: 'center', color: THEME.brandDark });
    });
    // Speech panel for the closest sign in range
    var best = null, bd = 190;
    S.level.signs.forEach(function (s) {
      var d = Math.abs(s.x - p.x);
      if (d < bd) { bd = d; best = s; }
    });
    if (best) {
      ctx.font = 'bold 15px ' + THEME.font;
      var lines = wrap(tr(best.text), 260);
      var w = 290, h = 22 + lines.length * 20;
      var bx = best.x - w / 2, by = best.y - 84 - h;
      ctx.globalAlpha = Math.min(1, (190 - bd) / 60);
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; roundRect(bx, by, w, h, 10); ctx.fill();
      ctx.strokeStyle = THEME.brand; ctx.lineWidth = 3; roundRect(bx, by, w, h, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(best.x - 8, by + h); ctx.lineTo(best.x, by + h + 9); ctx.lineTo(best.x + 8, by + h); ctx.fillStyle = '#fff'; ctx.fill();
      for (var i = 0; i < lines.length; i++) {
        text(lines[i], bx + w / 2, by + 26 + i * 20, { size: 15, align: 'center', color: THEME.ink, weight: '600' });
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawCheckpoints() {
    S.checkpoints.forEach(function (c) {
      if (!inView(c.x - 30, c.x + 30)) return;
      line(c.x, c.y, c.x, c.y - 70, 4, '#4b5469', 'butt');
      var wave = Math.sin(S.clock * 5) * 3;
      ctx.fillStyle = c.on ? THEME.brand : '#9aa3b8';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 70); ctx.lineTo(c.x + 34 + wave, c.y - 60); ctx.lineTo(c.x, c.y - 44);
      ctx.closePath(); ctx.fill();
      text('E', c.x + 11, c.y - 53, { size: 12, color: '#fff' });
    });
  }

  function drawFinish() {
    var fx = S.level.finishX, fy = S.level.terrainTop(fx);
    if (!inView(fx - 80, fx + 80)) return;
    line(fx - 50, fy, fx - 50, fy - 150, 8, '#4b5469', 'butt');
    line(fx + 50, fy, fx + 50, fy - 150, 8, '#4b5469', 'butt');
    ctx.fillStyle = THEME.brand; roundRect(fx - 66, fy - 176, 132, 40, 8); ctx.fill();
    text(tr('finish.label'), fx, fy - 149, { size: 17, align: 'center', color: '#fff' });
    // checkered banner
    for (var i = 0; i < 10; i++) {
      for (var j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#fff' : THEME.ink;
        ctx.fillRect(fx - 50 + i * 10, fy - 134 + j * 10, 10, 10);
      }
    }
  }

  function drawCoin(t, i) {
    var sq = Math.abs(Math.cos(S.clock * 3 + i * 0.7)) * 0.75 + 0.25;
    ctx.save(); ctx.translate(t.x, t.y + Math.sin(S.clock * 3 + i) * 2); ctx.scale(sq, 1);
    ctx.fillStyle = THEME.accent; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d98e00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
    if (sq > 0.5) text('E', 0, 5, { size: 12, align: 'center', color: '#a86400' });
    ctx.restore();
  }
  function drawBattery(b) {
    var y = b.y + Math.sin(S.clock * 3 + b.x) * 3;
    ctx.fillStyle = '#2e8b2e'; roundRect(b.x - 10, y - 14, 20, 28, 4); ctx.fill();
    ctx.fillStyle = '#9bf06a'; roundRect(b.x - 7, y - 11, 14, 22, 3); ctx.fill();
    ctx.fillStyle = '#2e8b2e'; ctx.fillRect(b.x - 4, y - 18, 8, 5);
    ctx.fillStyle = '#145214';
    ctx.beginPath(); ctx.moveTo(b.x + 2, y - 8); ctx.lineTo(b.x - 5, y + 2); ctx.lineTo(b.x, y + 2);
    ctx.lineTo(b.x - 2, y + 9); ctx.lineTo(b.x + 5, y - 2); ctx.lineTo(b.x, y - 2); ctx.closePath(); ctx.fill();
  }

  function drawCart(c) {
    if (c.dead < 0 || !inView(c.x - 40, c.x + 40)) return;
    var squash = c.dead > 0 ? 0.35 : 1;
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.dir * -1, squash);
    // basket
    ctx.fillStyle = '#c9d1e0'; ctx.strokeStyle = '#6b7488'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-22, -32); ctx.lineTo(22, -32); ctx.lineTo(16, -12); ctx.lineTo(-16, -12); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(107,116,136,0.7)'; ctx.lineWidth = 1;
    for (var i = -12; i <= 12; i += 8) { ctx.beginPath(); ctx.moveTo(i, -31); ctx.lineTo(i * 0.75, -13); ctx.stroke(); }
    // paperwork sticking out of the basket
    ctx.fillStyle = '#fff'; ctx.save(); ctx.rotate(-0.15); ctx.fillRect(-12, -42, 14, 14); ctx.restore();
    ctx.save(); ctx.rotate(0.2); ctx.fillRect(2, -44, 14, 14); ctx.restore();
    // handle
    line(-22, -32, -30, -42, 3, '#6b7488');
    line(-30, -42, -36, -42, 3, '#6b7488');
    // wheels
    [-12, 12].forEach(function (wx) {
      ctx.save(); ctx.translate(wx, -6); ctx.rotate(c.wheel);
      ctx.fillStyle = THEME.ink; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9aa3b8'; ctx.fillRect(-1, -5, 2, 10);
      ctx.restore();
    });
    // angry eyes
    ctx.fillStyle = '#d33';
    ctx.beginPath(); ctx.arc(6, -22, 3, 0, TAU); ctx.arc(-4, -22, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---- The hero --------------------------------------------------------------
  // ---- Avatar 2: the hand-drawn Deficientezinho from the logo ---------------
  // Crayon look: wobbly outlines that "boil" a little, scribbled blue body,
  // lumpy black wheels with irregular holes, red smile, red shoe.
  var CRAYON = { ink: '#1b1b1b', head: '#ece7de', blue: '#1f5fae', arm: '#4a4a4a', red: '#c8244a' };

  function wobble(i, seed) {
    var f = Math.floor(S.clock * 8) % 3;             // 3 frames of "boil"
    return Math.sin(i * 12.9898 + seed * 78.233 + f * 1.7) * 0.7;
  }
  // A slightly curvy hand-drawn line
  function crayon(x1, y1, x2, y2, w, color, seed) {
    var mx = (x1 + x2) / 2 + wobble(1, seed) * 1.6, my = (y1 + y2) / 2 + wobble(2, seed) * 1.6;
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + wobble(3, seed) * 0.5, y1 + wobble(4, seed) * 0.5);
    ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
  }
  // A lumpy blob ring: outer radius r, hole is a rounded triangle that rotates.
  function lumpyWheel(cx, cy, r, rot, seed) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    var n = 18, i, a, rr;
    for (i = 0; i <= n; i++) {
      a = i / n * TAU; rr = r * (1 + 0.05 * Math.sin(a * 3 + seed) + 0.025 * Math.sin(a * 5 + seed * 2));
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    for (i = 0; i <= 12; i++) {                          // hole, drawn the other way round
      a = -i / 12 * TAU; rr = r * 0.42 * (1 + 0.3 * Math.cos(a * 3));
      ctx[i ? 'lineTo' : 'moveTo'](r * 0.1 + Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill('evenodd');
    ctx.restore();
  }

  function drawLogoAvatar(p) {
    var C = CRAYON;
    var hx0 = -6, hy0 = -33;                 // hip
    // rear wheel and front caster (behind the body)
    lumpyWheel(-6, -17, 17, p.wheelRot, 1);
    lumpyWheel(25, -6, 6, p.wheelRot * 1.6, 3);

    // legs: thick scribbled blue, thigh then shin down to the red shoe
    crayon(hx0, hy0, 22, -35, 9, C.blue, 2);
    crayon(22, -35, 27, -15, 8, C.blue, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    [[0, -3], [7, -2], [14, -4]].forEach(function (h, i) {
      ctx.beginPath(); ctx.moveTo(hx0 + 4 + h[0], -37 + h[1]); ctx.lineTo(hx0 + 9 + h[0], -31 + h[1] + wobble(i, 5)); ctx.stroke();
    });
    // red shoe
    ctx.fillStyle = C.red; ctx.beginPath();
    ctx.ellipse(28, -12, 7, 5.5, 0.2, 0, TAU); ctx.fill();

    // torso: blue scribble leaning slightly forward
    crayon(hx0, hy0 + 2, -8, -58, 13, C.blue, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    for (var k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.moveTo(-12, -38 - k * 5); ctx.lineTo(-5, -41 - k * 5 + wobble(k, 6)); ctx.stroke();
    }

    // pushing arm (gray stick) with a black fist: rests forward, pushes on the wheel
    var moving = Math.abs(p.vx) > 5;
    var a2 = -1.0 + 0.55 * Math.sin(p.push);
    var fx = moving ? -6 + 15 * Math.cos(a2) : 11, fy = moving ? -17 + 15 * Math.sin(a2) : -50;
    crayon(-8, -57, (-8 + fx) / 2 + 2, (-57 + fy) / 2 - 3, 4.5, C.arm, 5);
    crayon((-8 + fx) / 2 + 2, (-57 + fy) / 2 - 3, fx, fy, 4.5, C.arm, 6);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(fx, fy, 4.2, 0, TAU); ctx.fill();

    // other arm: raised and waving (stays up, waves when standing still)
    var wave = moving ? 0 : Math.sin(S.clock * 5) * 5;
    crayon(-9, -58, -19, -76 + wave * 0.4, 4.5, C.arm, 7);
    ctx.fillStyle = C.arm; ctx.beginPath(); ctx.ellipse(-20, -80 + wave * 0.4, 4, 5.5, -0.3, 0, TAU); ctx.fill();

    // head: big off-white circle with a hand-drawn outline
    var hcx = -3, hcy = -75, hr = 13.5;
    ctx.fillStyle = C.head; ctx.beginPath(); ctx.arc(hcx, hcy, hr, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (var i = 0; i <= 20; i++) {
      var ang = i / 20 * TAU, rr = hr + wobble(i, 8) * 0.8;
      ctx[i ? 'lineTo' : 'moveTo'](hcx + Math.cos(ang) * rr, hcy + Math.sin(ang) * rr);
    }
    ctx.stroke();
    // spiky hair
    [-165, -135, -105, -75, -45, -15].forEach(function (deg, i) {
      var r1 = hr - 1, r2 = hr + 9 + (i % 2) * 4, d = deg * Math.PI / 180;
      crayon(hcx + Math.cos(d) * r1, hcy + Math.sin(d) * r1, hcx + Math.cos(d) * r2, hcy + Math.sin(d) * r2, 2.2, C.ink, 9 + i);
    });
    // face: "D" eye, black nose triangle, red smile
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.moveTo(hcx + 4, hcy - 4); ctx.lineTo(hcx + 9, hcy - 2); ctx.lineTo(hcx + 5, hcy + 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hcx - 4, hcy - 4); ctx.lineTo(hcx - 2, hcy - 4); ctx.lineTo(hcx - 2, hcy + 1); ctx.lineTo(hcx - 4, hcy + 1); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hcx + 1, hcy + 2, 6.5, 0.35, 1.45); ctx.stroke();
  }

  function drawPlayer(p) {
    var flick = p.invuln > 0 && Math.floor(S.clock * 16) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = flick ? 0.35 : 1;
    ctx.translate(p.x, p.y);
    // shadow
    if (p.grounded) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 1, 26, 4, 0, 0, TAU); ctx.fill(); }
    ctx.rotate(p.tilt);
    ctx.scale(p.face, 1 - p.squash * 0.12);
    // wheelie rotation around the rear wheel contact point
    ctx.translate(-6, 0); ctx.rotate(-p.wheelie); ctx.translate(6, 0);

    var skin = '#e0ac82', pants = '#2b3a55', wx = -6, wy = -17;

    // boost flame
    if (p.boosting) {
      ctx.fillStyle = THEME.accent;
      ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(-34 - Math.random() * 10, -17); ctx.lineTo(-16, -12); ctx.closePath(); ctx.fill();
    }

    if (S.settings.avatar === 'logo') { drawLogoAvatar(p); ctx.restore(); return; }

    // front caster + fork
    line(14, -28, 19, -10, 3, '#4b5469');
    ctx.fillStyle = THEME.ink; ctx.beginPath(); ctx.arc(19, -5, 5, 0, TAU); ctx.fill();
    // footrest
    line(14, -28, 22, -14, 3, '#4b5469'); line(22, -14, 30, -14, 3, '#4b5469');

    // far arm is hidden; frame
    line(-11, -28, 14, -28, 4, '#4b5469');
    line(-11, -28, -15, -52, 4, '#4b5469');
    line(-15, -52, -22, -52, 3, '#4b5469');
    line(wx, wy, -3, -28, 3, '#4b5469');

    // legs
    line(-3, -34, 13, -34, 9, pants);
    line(13, -34, 24, -18, 8, pants);
    line(24, -16, 31, -15, 7, '#f1f4fa');

    // rear wheel
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(p.wheelRot);
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke();
    ctx.strokeStyle = THEME.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#8c95aa'; ctx.lineWidth = 1;
    for (var i = 0; i < 6; i++) {
      var a = i * TAU / 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke();
    }
    ctx.fillStyle = '#4b5469'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    ctx.restore();

    // torso
    line(-3, -34, -6, -54, 12, THEME.brand);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4.5, -44, 5, 0, TAU); ctx.fill();
    text('E', -4.5, -40, { size: 9, align: 'center', color: THEME.brandDark });

    // head + cap
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-5, -64, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = THEME.ink; ctx.beginPath(); ctx.arc(-1, -65, 1.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a85d4a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -62, 3, 0.2, 1.4); ctx.stroke();
    ctx.fillStyle = THEME.brandDark;
    ctx.beginPath(); ctx.arc(-5, -66, 8.5, Math.PI, TAU); ctx.fill();
    ctx.fillRect(-4, -67, 13, 3);

    // pushing arm: shoulder -> hand on the push rim
    var a2 = -1.0 + 0.55 * Math.sin(p.push);
    var hx = wx + 12 * Math.cos(a2), hy = wy + 12 * Math.sin(a2);
    var sx = -6, sy = -50;
    var ex = (sx + hx) / 2 - 5, ey = (sy + hy) / 2 + 2;
    line(sx, sy, ex, ey, 5, THEME.brand);
    line(ex, ey, hx, hy, 4, skin);
    ctx.restore();
  }

  // ---- HUD / overlays --------------------------------------------------------
  function fmt(t) {
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1).replace('.', DEF.i18n.decimal());
  }

  function drawHUD() {
    var p = S.player, got = 0;
    S.tokens.forEach(function (t) { if (t.got) got++; });

    // panel
    ctx.fillStyle = 'rgba(11,30,38,0.62)'; roundRect(12, 12, 292, 82, 12); ctx.fill();
    // coin icon + count
    drawCoin({ x: 34, y: 34 }, 0);
    text(got + ' / ' + S.tokens.length, 52, 40, { size: 20, stroke: 'rgba(0,0,0,0.3)', strokeW: 3 });
    // battery cells
    for (var i = 0; i < PH.HEARTS; i++) {
      var on = i < p.hearts;
      ctx.fillStyle = on ? '#9bf06a' : 'rgba(255,255,255,0.18)';
      roundRect(176 + i * 36, 22, 28, 18, 4); ctx.fill();
      ctx.fillStyle = on ? '#9bf06a' : 'rgba(255,255,255,0.18)'; ctx.fillRect(176 + i * 36 + 28, 27, 3, 8);
    }
    // boost bar
    text(S.boostOn ? tr('hud.boostOn') : tr('hud.boost'), 24, 76, { size: 11, color: S.boostOn ? '#ffd24a' : '#cfe7ee' });
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; roundRect(90, 66, 200, 12, 6); ctx.fill();
    var bw = 200 * (p.boost / 100);
    if (bw > 1) {
      ctx.fillStyle = p.boosting ? '#ffd24a' : THEME.accent; roundRect(90, 66, bw, 12, 6); ctx.fill();
    }

    // time
    ctx.fillStyle = 'rgba(11,30,38,0.62)'; roundRect(S.W - 190, 12, 178, 56, 12); ctx.fill();
    text(fmt(S.time), S.W - 101, 43, { size: 24, align: 'center' });
    text(tr('hud.par', fmt(S.level.par)), S.W - 101, 60, { size: 11, align: 'center', color: '#cfe7ee' });

    // toasts
    S.toasts.forEach(function (t, i) {
      ctx.globalAlpha = Math.min(1, t.t * 2);
      text(tr(t.msg), S.W / 2, 100 + i * 28, { size: 20, align: 'center', stroke: 'rgba(11,30,38,0.7)', strokeW: 5 });
      ctx.globalAlpha = 1;
    });
    if (S.muted) text(tr('hud.muted'), S.W - 14, S.H - 12, { size: 12, align: 'right', color: '#fff' });
  }

  function panel(w, h) {
    ctx.fillStyle = 'rgba(11,30,38,0.72)'; ctx.fillRect(0, 0, S.W, S.H);
    var x = (S.W - w) / 2, y = (S.H - h) / 2;
    ctx.fillStyle = '#f7fbfd'; roundRect(x, y, w, h, 18); ctx.fill();
    ctx.fillStyle = THEME.brand; roundRect(x, y, w, 8, 4); ctx.fill();
    return { x: x, y: y };
  }

  function drawTitle() {
    var o = panel(680, 380);
    var cx = S.W / 2;
    text('DEFICIENTEZINHO', cx, o.y + 84, { size: 50, align: 'center', color: THEME.brandDark });
    text(tr(S.level.name), cx, o.y + 122, { size: 18, align: 'center', color: '#5a6278', weight: '600' });
    ['roll', 'hop', 'boost', 'brake', 'misc'].forEach(function (k, i) {
      text(tr('ctl.' + k + '.key'), cx - 20, o.y + 180 + i * 26, { size: 16, align: 'right', color: THEME.ink });
      text(tr('ctl.' + k + '.do'), cx + 4, o.y + 180 + i * 26, { size: 16, color: '#5a6278', weight: '600' });
    });
    var pulse = 0.65 + 0.35 * Math.sin(S.clock * 4);
    ctx.globalAlpha = pulse;
    text(tr('title.press'), cx, o.y + 336, { size: 20, align: 'center', color: THEME.brand });
    ctx.globalAlpha = 1;
    if (S.best) text(tr('title.best', fmt(S.best)), cx, o.y + 362, { size: 13, align: 'center', color: '#5a6278', weight: '600' });
  }

  function drawPause() {
    var o = panel(420, 160);
    text(tr('pause.title'), S.W / 2, o.y + 70, { size: 38, align: 'center', color: THEME.brandDark });
    text(tr('pause.hint'), S.W / 2, o.y + 112, { size: 17, align: 'center', color: '#5a6278' });
  }

  function drawSettingsHint() {
    ctx.font = 'bold 16px ' + THEME.font;
    var label = tr('settings.btn'), w = ctx.measureText(label).width + 36;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(S.W - w - 14, S.H - 50, w, 36, 10); ctx.fill();
    text(label, S.W - 14 - w / 2, S.H - 26, { size: 16, align: 'center', color: THEME.brandDark });
  }

  // Settings layout (the click areas in game.js use the same numbers):
  // panel 660x496. rows: 0 = boost mode, 1 = language, 2 = avatar, then Back.
  function choice(x, y, label, on) {
    ctx.fillStyle = on ? THEME.brand : '#e3e8f0'; roundRect(x, y, 150, 44, 10); ctx.fill();
    text(label, x + 75, y + 30, { size: 19, align: 'center', color: on ? '#fff' : '#7b8499' });
  }
  function rowFrame(o, y, h) {
    ctx.strokeStyle = THEME.brand; ctx.lineWidth = 3; roundRect(o.x + 24, o.y + y, 612, h, 12); ctx.stroke();
  }

  function drawSettings() {
    var o = panel(660, 496), cx = S.W / 2, toggle = S.settings.boostMode === 'toggle';
    var row = S.settingsRow;
    text(tr('settings.title'), cx, o.y + 48, { size: 30, align: 'center', color: THEME.brandDark });

    // Row 0: boost mode
    if (row === 0) rowFrame(o, 62, 160);
    text(tr('settings.boost'), cx, o.y + 90, { size: 18, align: 'center', color: '#5a6278' });
    choice(cx - 160, o.y + 102, tr('settings.toggle'), toggle);
    choice(cx + 10, o.y + 102, tr('settings.hold'), !toggle);
    text(tr(toggle ? 'settings.toggle1' : 'settings.hold1'), cx, o.y + 178, { size: 15, align: 'center', color: THEME.ink, weight: '600' });
    text(tr(toggle ? 'settings.toggle2' : 'settings.hold2'), cx, o.y + 200, { size: 15, align: 'center', color: THEME.ink, weight: '600' });

    // Row 1: language
    if (row === 1) rowFrame(o, 232, 90);
    text(tr('settings.lang'), cx, o.y + 258, { size: 18, align: 'center', color: '#5a6278' });
    DEF.i18n.langs.forEach(function (l, i) {
      choice(cx - 160 + i * 170, o.y + 270, l.name, DEF.i18n.code() === l.code);
    });

    // Row 2: avatar
    if (row === 2) rowFrame(o, 332, 90);
    text(tr('settings.avatar'), cx, o.y + 358, { size: 18, align: 'center', color: '#5a6278' });
    choice(cx - 160, o.y + 370, tr('settings.avatar.classic'), S.settings.avatar !== 'logo');
    choice(cx + 10, o.y + 370, tr('settings.avatar.logo'), S.settings.avatar === 'logo');

    text(tr('settings.hint'), cx, o.y + 444, { size: 14, align: 'center', color: '#5a6278' });
    ctx.fillStyle = '#e3e8f0'; roundRect(cx - 100, o.y + 452, 200, 34, 10); ctx.fill();
    text(tr('settings.back'), cx, o.y + 475, { size: 16, align: 'center', color: THEME.brandDark });
  }

  function star(x, y, r, on) {
    ctx.fillStyle = on ? THEME.accent : '#d5dbe6';
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  }

  function drawWin() {
    var o = panel(600, 400), r = S.result, cx = S.W / 2;
    text(tr('win.title'), cx, o.y + 62, { size: 38, align: 'center', color: THEME.brandDark });
    for (var i = 0; i < 3; i++) star(cx + (i - 1) * 76, o.y + 128, 32, i < r.stars);
    var rows = [
      [tr('win.time'), fmt(r.time) + '   ' + (r.time <= S.level.par ? tr('win.under') : tr('win.par', fmt(S.level.par)))],
      [tr('win.tokens'), r.tokens + ' / ' + r.total],
      [tr('win.stomps'), String(r.stomps)],
      [tr('win.deaths'), String(r.deaths)]
    ];
    if (S.best) rows.push([tr('win.best'), fmt(S.best)]);
    rows.forEach(function (row, i) {
      text(row[0], cx - 20, o.y + 200 + i * 28, { size: 17, align: 'right', color: '#5a6278' });
      text(row[1], cx, o.y + 200 + i * 28, { size: 17, color: THEME.ink });
    });
    text(tr('win.legend'), cx, o.y + 346, { size: 13, align: 'center', color: '#5a6278', weight: '600' });
    var pulse = 0.65 + 0.35 * Math.sin(S.clock * 4);
    ctx.globalAlpha = pulse;
    text(tr('win.again'), cx, o.y + 382, { size: 19, align: 'center', color: THEME.brand });
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    S.particles.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life / q.max * 1.5));
      ctx.fillStyle = q.color;
      if (q.confetti) ctx.fillRect(q.x, q.y, q.size, q.size * 0.6);
      else { ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  }

  // ---- Entry point -----------------------------------------------------------
  DEF.render = function (state, physics) {
    S = state; PH = physics; ctx = S.ctx;
    ctx.save();
    drawSky();
    drawLayers();

    var sx = S.shake > 0 ? (Math.random() - 0.5) * 8 * S.shake * 4 : 0;
    var sy = S.shake > 0 ? (Math.random() - 0.5) * 8 * S.shake * 4 : 0;
    ctx.translate(-Math.round(S.cam.x) + sx, sy);

    drawDecor();
    drawPits();
    drawTerrain();
    drawRamps();
    drawMovers();
    drawCheckpoints();
    drawFinish();
    drawSigns();
    S.batteries.forEach(function (b) { if (!b.got && inView(b.x - 20, b.x + 20)) drawBattery(b); });
    S.tokens.forEach(function (t, i) { if (!t.got && inView(t.x - 20, t.x + 20)) drawCoin(t, i); });
    S.carts.forEach(drawCart);
    drawPlayer(S.player);
    drawParticles();
    ctx.restore();

    if (S.mode !== 'title') drawHUD();
    if (S.mode === 'title') drawTitle();
    else if (S.mode === 'pause') drawPause();
    else if (S.mode === 'win') drawWin();
    if ((S.mode === 'title' || S.mode === 'pause') && !S.settingsOpen) drawSettingsHint();
    if (S.settingsOpen) drawSettings();
  };
})();
