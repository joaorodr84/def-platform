/* Level 1 — "The Accessibility Tour"
 *
 * The level is described with a tiny builder: a cursor walks left to right
 * laying down ground (flat / slope / step / gap). Everything else (tokens,
 * signs, enemies...) is placed relative to the ground that was built.
 *
 * Coordinates: x grows to the right, y grows DOWN (canvas style). The ground
 * starts at y = 440 on a 960x540 screen. "step(-24)" raises the ground 24px.
 */
window.DEF = window.DEF || {};

(function () {
  'use strict';

  var GROUND = 440;

  function build() {
    var terrain = [];   // solid ground segments (block you from the side)
    var ramps = [];     // sloped one-way platforms (you can only land on top)
    var movers = [];    // moving one-way platforms
    var edges = [];     // vertical faces drawn for steps / cliffs
    var pits = [];      // gaps, for drawing the void
    var L = {
      name: 'Level 1 — The Accessibility Tour',
      terrain: terrain, ramps: ramps, movers: movers, edges: edges, pits: pits,
      tokens: [], batteries: [], carts: [], signs: [], checkpoints: [],
      decor: [], spawn: { x: 90 }, finishX: 7640, worldEnd: 7860, par: 60
    };

    var x = 0, y = GROUND;
    var marks = {};

    function seg(dx, dy, surf) {
      terrain.push({ x1: x, y1: y, x2: x + dx, y2: y + dy, surf: surf || 'pave' });
      x += dx; y += dy;
    }
    function flat(w, surf) { seg(w, 0, surf); }
    function slope(dx, dy, surf) { seg(dx, dy, surf); }
    function step(dy) {
      edges.push({ x: x, y1: y, y2: y + dy, kind: 'step' });
      y += dy;
    }
    function gap(w, dy) {
      dy = dy || 0;
      pits.push({ x1: x, x2: x + w, y: Math.max(y, y + dy) + 30 });
      edges.push({ x: x, y1: y, y2: 700, kind: 'cliff' });
      edges.push({ x: x + w, y1: y + dy, y2: 700, kind: 'cliff' });
      x += w; y += dy;
    }
    function mark(name) { marks[name] = { x: x, y: y }; return marks[name]; }

    // Highest static surface (ground or ramp) at px, or Infinity over a pit.
    function topAt(px) {
      var best = Infinity, i, s, v;
      for (i = 0; i < terrain.length; i++) {
        s = terrain[i];
        if (px < s.x1 || px > s.x2) continue;
        v = s.y1 + (px - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
        if (v < best) best = v;
      }
      for (i = 0; i < ramps.length; i++) {
        s = ramps[i];
        if (px < s.x1 || px > s.x2) continue;
        v = s.y1 + (px - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
        if (v < best) best = v;
      }
      return best;
    }
    function terrainTop(px) {
      var best = Infinity;
      terrain.forEach(function (s) {
        if (px < s.x1 || px > s.x2) return;
        var v = s.y1 + (px - s.x1) * (s.y2 - s.y1) / (s.x2 - s.x1);
        if (v < best) best = v;
      });
      return best;
    }

    /* ---------------------------------------------------------------
     * 1. GROUND — walk the cursor from left to right
     * ------------------------------------------------------------- */
    // A. Start + two curbs (teaches rolling and hopping)
    flat(700);
    mark('curb1'); step(-24); flat(260); slope(60, 24);
    flat(200);
    mark('curb2'); step(-40); flat(180); slope(70, 40);
    flat(150);

    // B. The hill: free speed downhill, then a gap that needs it
    mark('hill'); slope(330, -100); flat(260); slope(330, 100); flat(40);
    mark('gap1'); gap(175);
    flat(260);

    // C. The Ministry: three 70cm "steps" and the long way around (the ramp)
    var rx0 = x;               // ramp starts here
    var S = rx0 + 385;         // foot of the stairs
    flat(385);                 // dead-end alley under the ramp
    step(-70); flat(70); step(-70); flat(70); step(-70);
    var plateau = mark('plateau');   // y = 230
    flat(560);

    // D. The unfinished bridge: three moving platforms
    var padStart = mark('padStart');
    gap(680, 150);

    // E. The park
    flat(120);
    mark('drain'); flat(60); gap(100); flat(100);
    mark('gravel'); flat(440, 'gravel');
    mark('hills');
    flat(60, 'grass');
    slope(200, -60, 'grass'); flat(120, 'grass'); slope(200, 60, 'grass');
    flat(80, 'grass');
    slope(200, -60, 'grass'); flat(100, 'grass'); slope(200, 60, 'grass');
    flat(160);

    // F. The last ramp and the finish
    mark('final'); slope(560, -180); flat(300);

    /* ---------------------------------------------------------------
     * 2. RAMP over the stairs (slope 0.4, always above the steps)
     * ------------------------------------------------------------- */
    ramps.push({ x1: rx0, y1: GROUND, x2: S + 140, y2: GROUND - 210 });

    /* ---------------------------------------------------------------
     * 3. MOVING PLATFORMS across the bridge gap
     * ------------------------------------------------------------- */
    var py = plateau.y;
    movers.push({ cx: padStart.x + 130, cy: py + 40,  ax: 70, ay: 0,  w: 110, period: 3.2, phase: 0 });
    movers.push({ cx: padStart.x + 335, cy: py + 90,  ax: 0,  ay: 45, w: 110, period: 3.0, phase: 1.2 });
    movers.push({ cx: padStart.x + 525, cy: py + 120, ax: 60, ay: 0,  w: 110, period: 3.6, phase: 2.4 });

    /* ---------------------------------------------------------------
     * 4. PICKUPS
     * ------------------------------------------------------------- */
    function token(tx, ty) { L.tokens.push({ x: tx, y: ty }); }
    function tokenRow(x1, x2, n, h) {
      for (var i = 0; i < n; i++) {
        var tx = x1 + (x2 - x1) * (n === 1 ? 0.5 : i / (n - 1));
        token(tx, topAt(tx) - h);
      }
    }
    // Arc of n tokens centred on cx, peaking `peak` px above baseY.
    function tokenArc(cx, n, spread, baseY, peak) {
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        token(cx + t * spread, baseY - peak * (1 - t * t));
      }
    }
    // Arc that follows the ground: each coin sits 30px above the surface under
    // it, plus the arc height. Use this over ground; tokenArc is for pits.
    function tokenArcOn(cx, n, spread, peak) {
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        var tx = cx + t * spread;
        token(tx, topAt(tx) - 30 - peak * (1 - t * t));
      }
    }
    function battery(bx, h) { L.batteries.push({ x: bx, y: topAt(bx) - (h || 34) }); }

    tokenRow(250, 400, 4, 32);                                   // tutorial row
    tokenArcOn(marks.curb1.x + 10, 3, 55, 55);                   // over curb 1
    tokenArcOn(marks.curb2.x + 10, 3, 55, 60);                   // over curb 2
    tokenRow(1700, 1900, 4, 30);                                 // up the hill
    battery(2060);
    tokenRow(1990, 2170, 3, 30);                                 // hill top
    tokenArc(marks.gap1.x + 88, 5, 100, marks.gap1.y - 20, 70);  // over the gap
    tokenRow(rx0 + 60, S + 100, 8, 30);                          // along the ramp
    battery(S - 120, 34);
    tokenRow(plateau.x + 120, plateau.x + 380, 4, 30);           // plateau
    battery(plateau.x + 440);
    tokenArc(padStart.x + 255, 3, 40, py + 10, 60);              // bridge tokens
    tokenArc(padStart.x + 435, 3, 40, py + 30, 60);
    battery(padStart.x + 700, 34);                               // landing
    tokenRow(marks.gravel.x + 60, marks.gravel.x + 380, 5, 30);  // gravel path
    tokenArcOn(marks.hills.x + 260, 4, 80, 40);                  // first hill
    battery(marks.hills.x + 400);
    tokenRow(marks.hills.x + 690, marks.hills.x + 790, 3, 30);
    tokenRow(marks.final.x + 100, marks.final.x + 480, 6, 30);   // last ramp
    token(L.finishX - 60, topAt(L.finishX - 60) - 30);
    token(L.finishX - 100, topAt(L.finishX - 100) - 30);

    /* ---------------------------------------------------------------
     * 5. ENEMIES (shopping carts with a mind of their own)
     * ------------------------------------------------------------- */
    function cart(x0, x1, speed) {
      L.carts.push({ x: (x0 + x1) / 2, x0: x0, x1: x1, speed: speed || 60, dir: -1 });
    }
    cart(2830, 3010, 55);
    cart(3700, 3900, 60);
    cart(3950, 4080, 55);
    cart(marks.gravel.x + 120, marks.gravel.x + 400, 60);
    cart(marks.hills.x + 280, marks.hills.x + 520, 65);
    cart(marks.hills.x + 720, marks.hills.x + 880, 60);
    cart(marks.final.x - 150, marks.final.x - 20, 65);

    /* ---------------------------------------------------------------
     * 6. SIGNS, CHECKPOINTS, SCENERY
     * ------------------------------------------------------------- */
    function sign(sx, text) { L.signs.push({ x: sx, y: terrainTop(sx), text: text }); }
    sign(130,  'ACCESSIBILITY TOUR. Roll with ← → (or A / D).');
    sign(320,  'Hop with SPACE / ↑ / W. Hold it for a taller hop.');
    sign(500,  'Hold SHIFT to boost. It drains the battery — grab the ⚡ to refill.');
    sign(630,  'CURB AHEAD. “Only 10 cm,” said the architect.');
    sign(1160, 'Another curb. They breed.');
    sign(1560, 'RAMP! Downhill is free speed. That’s efficiency.');
    sign(2120, 'GAP AHEAD. Bring speed. Gravity is your intern now.');
    sign(rx0 - 40, 'MAIN ENTRANCE: 3 steps (70 cm each). Accessible entrance: the long ramp →');
    sign(plateau.x + 480, 'ELEVATOR: out of order since 2019. Please use the stairs.');
    sign(padStart.x - 40, 'BRIDGE UNDER CONSTRUCTION. Use the moving platforms. Safety first. (Not provided.)');
    sign(marks.drain.x + 20, 'OPEN DRAIN. Totally normal city infrastructure.');
    sign(marks.gravel.x - 30, 'PARK PATH: gravel. Scenic. Slow. Very slow.');
    sign(marks.final.x - 20, 'LAST RAMP. Get a run-up, or hit SHIFT.');

    function checkpoint(cx) { L.checkpoints.push({ x: cx, y: terrainTop(cx) }); }
    checkpoint(marks.gap1.x + 175 + 40);
    checkpoint(plateau.x + 40);
    checkpoint(padStart.x + 680 + 50);
    checkpoint(marks.hills.x + 30);

    // Scenery
    [180, 820, 1480, 2380, 2980].forEach(function (lx) {
      L.decor.push({ type: 'lamp', x: lx, y: terrainTop(lx) });
    });
    L.decor.push({
      type: 'building', x: S - 30, w: 760, top: 40, y: GROUND,
      label: 'MINISTRY OF PAPERWORK', doorX: plateau.x + 90, doorY: plateau.y,
      elevatorX: plateau.x + 440
    });
    [5230, 5340, 5460, 5700, 5990, 6280, 6560, 6820].forEach(function (tx) {
      L.decor.push({ type: 'tree', x: tx, y: terrainTop(tx) });
    });
    [5100, 5780, 6130].forEach(function (bx) {
      L.decor.push({ type: 'bench', x: bx, y: terrainTop(bx) });
    });

    L.marks = marks;
    L.topAt = topAt;
    L.terrainTop = terrainTop;
    return L;
  }

  DEF.level1 = build();
})();
