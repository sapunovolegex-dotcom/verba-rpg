'use strict';
// ============================================================
// Vegetation sprites and small outdoor props.
// ============================================================
const LEAF = {
  lime:  ['#1d3a22', '#2b5429', '#3a6e31', '#4f8a3a', '#6ea64a', '#97c266'],
  oak:   ['#1f3a20', '#2f5a2a', '#416f33', '#58893d', '#78a64d', '#a0c46a'],
  birch: ['#2c4a22', '#47712f', '#5f8c38', '#7aa845', '#9dc35c', '#c3dc84'],
  bush:  ['#21401f', '#33602c', '#47793a', '#5f9447', '#7fb05a', '#a6cb79'],
};
function canopy(g, cx, cy, rx, ry, seed, pal, nClusters, cr) {
  const cw = g.canvas.width, ch = g.canvas.height, mask = new Uint8Array(cw * ch), cl = [];
  for (let k = 0; k < nClusters; k++) {
    const a = hash(k, 1, seed) * Math.PI * 2, d = Math.sqrt(hash(k, 2, seed)) * 0.78;
    cl.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r: cr * (0.65 + hash(k, 3, seed) * 0.5) });
  }
  cl.push({ x: cx, y: cy - ry * 0.2, r: cr * 1.15 });
  cl.sort((a, b) => a.y - b.y);
  for (const c of cl) for (let j = Math.floor(c.y - c.r); j <= c.y + c.r; j++) for (let i = Math.floor(c.x - c.r); i <= c.x + c.r; i++) {
    if (i < 0 || j < 0 || i >= cw || j >= ch) continue;
    const nx = (i + 0.5 - c.x) / c.r, ny = (j + 0.5 - c.y) / c.r, d = nx * nx + ny * ny, jit = (hash(i, j, seed + 5) - 0.5) * 0.35;
    if (d > 1 + jit) continue;
    const top = 1 - (j - (cy - ry)) / (2 * ry);
    let l = -(nx * 0.5 + ny * 0.85) * 0.9 + top * 0.9 - 0.15 + (hash(i, j, seed + 9) > 0.5 ? 0.35 : -0.15);
    if (d > 0.78 + jit && ny > -0.2) l -= 0.9;
    P1(g, i, j, pal[Math.max(1, Math.min(5, Math.round(2.4 + l * 1.6)))]); mask[j * cw + i] = 1;
  }
  for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) {
    if (mask[j * cw + i]) continue;
    if (mask[j * cw + i + 1] || mask[j * cw + i - 1] || mask[(j + 1) * cw + i] || mask[(j - 1) * cw + i]) P1(g, i, j, pal[0]);
  }
}
function trunk(g, cx, top, bottom, w, birch) {
  const x0 = Math.round(cx - w / 2);
  for (let y = top; y <= bottom; y++) {
    const flare = y > bottom - 2 ? 1 : 0;
    R(g, x0 - flare, y, w + flare * 2, 1, birch ? '#e6e3d8' : '#6b4c33');
    P1(g, x0 - flare, y, birch ? '#bcb8aa' : '#8a6644'); P1(g, x0 + w - 1 + flare, y, birch ? '#9a978c' : '#4a3322');
    if (birch && hash(cx, y, 77) > 0.72) R(g, x0, y, Math.max(1, w - 1), 1, '#2b2b2b');
  }
}
function makeTree(kind, seed) {
  if (kind === 'bigtree') {
    const [c, g] = mkCanvas(48, 64);
    trunk(g, 24, 30, 63, 6, false);
    R(g, 18, 34, 2, 6, '#6b4c33'); R(g, 16, 32, 2, 3, '#6b4c33'); R(g, 28, 33, 2, 5, '#6b4c33'); R(g, 30, 31, 2, 3, '#6b4c33');
    canopy(g, 24, 24, 21, 21, seed, seed % 2 ? LEAF.lime : LEAF.oak, 16, 10);
    return c;
  }
  if (kind === 'birch') {
    const [c, g] = mkCanvas(24, 40);
    trunk(g, 12, 10, 39, 3, true);
    canopy(g, 12, 15, 9, 13, seed, LEAF.birch, 8, 5.5);
    R(g, 11, 26, 3, 13, '#e6e3d8'); R(g, 13, 26, 1, 13, '#9a978c'); for (let y = 27; y < 39; y += 3) if (hash(y, 1, seed) > 0.4) R(g, 11, y, 2, 1, '#2b2b2b');
    return c;
  }
  if (kind === 'pine') {
    const [c, g] = mkCanvas(20, 36);
    trunk(g, 10, 28, 35, 3, false);
    for (const [t0, t1, hw] of [[0, 9, 4], [5, 16, 6], [11, 23, 8], [17, 30, 9.5]]) for (let j = t0; j <= t1; j++) {
      const w = Math.max(1, Math.round(hw * Math.pow((j - t0 + 1) / (t1 - t0 + 1), 0.8)));
      for (let i = 10 - w; i < 10 + w; i++) {
        const edge = i === 10 - w || i === 10 + w - 1 || j === t1, rel = (i - (10 - w)) / (2 * w);
        P1(g, i, j, edge ? '#173a26' : rel < 0.35 ? (hash(i, j, seed) > 0.55 ? '#5e9a5a' : '#3f7a47') : rel < 0.7 ? (hash(i, j, seed) > 0.6 ? '#3f7a47' : '#2e6038') : '#24502f');
      }
    }
    return c;
  }
  if (kind === 'thuja') {
    const [c, g] = mkCanvas(16, 28);
    for (let j = 0; j < 27; j++) {
      const w = Math.max(1, Math.round(6.5 * Math.pow(Math.min(1, (j + 1) / 20), 0.7) * (j > 22 ? 0.85 : 1)));
      for (let i = 8 - w; i < 8 + w; i++) {
        const edge = i === 8 - w || i === 8 + w - 1, rel = (i - (8 - w)) / (2 * w), n = hash(i, j, seed);
        P1(g, i, j, edge ? '#24401f' : rel < 0.4 ? (n > 0.5 ? '#8aae4c' : '#6a9440') : rel < 0.75 ? (n > 0.5 ? '#557f36' : '#4a7230') : '#365a26');
      }
    }
    R(g, 7, 26, 2, 2, '#5a3f2a');
    return c;
  }
  const [c, g] = mkCanvas(24, 34);
  trunk(g, 12, 18, 33, 4, false);
  R(g, 8, 20, 2, 4, '#6b4c33'); R(g, 15, 21, 2, 3, '#6b4c33');
  canopy(g, 12, 13, 11, 12, seed, [LEAF.oak, LEAF.lime, LEAF.birch][seed % 3], 9, 6.5);
  return c;
}
function makeBush(type, seed) {
  const [c, g] = mkCanvas(20, 18);
  canopy(g, 10, 10, 8, 6.5, seed, LEAF.bush, 6, 5);
  const fl = { lilac:['#8a5cc4', '#b48ae6', '#d9c2f7'], jasmine:['#e8e4d6', '#fbfaf3', '#ffffff'], rose:['#c9476a', '#ec7f9c', '#fbc4d3'] }[type];
  if (fl) for (let k = 0; k < (type === 'rose' ? 7 : 6); k++) {
    const x = 3 + Math.floor(hash(k, 1, seed) * 13), y = 3 + Math.floor(hash(k, 2, seed) * 9);
    if (type === 'rose') { P1(g, x, y, fl[0]); P1(g, x + 1, y, fl[1]); P1(g, x, y - 1, fl[2]); }
    else { R(g, x, y, 2, 3, fl[0]); P1(g, x, y, fl[1]); P1(g, x + 1, y + 1, fl[2]); P1(g, x, y - 1, fl[1]); }
  }
  return c;
}
const SPR = {
  bigtree: [makeTree('bigtree', 1), makeTree('bigtree', 2), makeTree('bigtree', 3)],
  tree: [makeTree('tree', 3), makeTree('tree', 4), makeTree('tree', 5)],
  birch: [makeTree('birch', 6), makeTree('birch', 7), makeTree('birch', 8)],
  pine: [makeTree('pine', 9), makeTree('pine', 10), makeTree('pine', 11)],
  thuja: [makeTree('thuja', 12)],
  bush: { green: makeBush('green', 13), lilac: makeBush('lilac', 14), jasmine: makeBush('jasmine', 15), rose: makeBush('rose', 16) },
};

function drawHedge(g, X, Y, x, y) {
  R(g, X, Y - 4, 16, 20, '#24452a'); R(g, X + 1, Y - 3, 14, 16, '#3a6e34');
  for (let i = 0; i < 16; i++) for (let j = -3; j < 13; j++) { const n = hash(X + i, Y + j, 150); if (n > 0.7) P1(g, X + i, Y + j, j < 2 ? '#6a9e48' : '#4d8239'); else if (n < 0.12) P1(g, X + i, Y + j, '#2c5629'); }
  for (let i = 0; i < 4; i++) { const bx = X + i * 4 + (y % 2 ? 2 : 0); R(g, bx, Y - 4, 4, 2, '#5a9142'); P1(g, bx + 1, Y - 4, '#89b863'); }
  R(g, X, Y + 13, 16, 3, '#1f3d22');
}
function drawFence(g, X, Y, t) {
  const st = t.style;
  if (st === 'brick') {
    R(g, X, Y - 6, 16, 21, '#7a4a3c'); R(g, X, Y - 5, 16, 19, '#c4876f');
    for (let r = 0; r < 7; r++) { const yy = Y - 5 + r * 3; R(g, X, yy + 2, 16, 1, '#a46a56'); for (let i = (r % 2) * 3; i < 16; i += 6) P1(g, X + i, yy, '#a46a56'); }
    for (let i = 0; i < 12; i++) { const a = Math.round(Math.sin(i / 11 * Math.PI) * 4); P1(g, X + 2 + i, Y + 1 - a, '#e3b09b'); P1(g, X + 2 + i, Y + 2 - a, '#9a5f4c'); }
    R(g, X, Y - 6, 16, 2, '#e2d3c6'); R(g, X, Y - 4, 16, 1, '#9a8d82'); R(g, X, Y + 13, 16, 2, '#6a4034');
    const pillar = px => { R(g, px, Y - 11, 6, 26, '#7a4a3c'); R(g, px + 1, Y - 10, 4, 24, '#b9786a'); R(g, px + 1, Y - 10, 1, 24, '#d79a88');
      R(g, px - 1, Y - 13, 8, 3, '#e8e1d6'); R(g, px + 1, Y - 15, 4, 2, '#f2ede4'); R(g, px + 2, Y - 16, 2, 1, '#f2ede4'); };
    if (t.capL) pillar(X); if (t.capR) pillar(X + 10);
    return;
  }
  if (st === 'boards') {
    R(g, X, Y + 1, 16, 12, '#5a5246');
    for (let r = 0; r < 3; r++) { R(g, X, Y + 1 + r * 4, 16, 3, r % 2 ? '#8a8274' : '#7c7466'); R(g, X, Y + 1 + r * 4, 16, 1, '#a39b8c'); }
    for (let i = 0; i < 16; i++) if (hash(X + i, Y, 170) > 0.8) P1(g, X + i, Y + 2 + Math.floor(hash(X + i, Y, 171) * 9), '#a7b0a0');
    if ((t.i | 0) % 2 === 0) { R(g, X + 1, Y - 3, 3, 17, '#4a4238'); R(g, X + 1, Y - 3, 1, 17, '#6a6052'); }
    R(g, X, Y + 13, 16, 2, 'rgba(0,0,0,.25)');
    return;
  }
  const cols = st === 'uaflag' ? ['#2f63c8', '#f0c230'] : st === 'white' ? ['#f2efe8', '#f2efe8'] : ['#a3a39d', '#9a9a93'];
  if (!t.vertical) {
    R(g, X, Y + 3, 16, 2, '#6b6b66'); R(g, X, Y + 10, 16, 2, '#6b6b66');
    for (let i = 0, n = (t.i | 0) * 4; i < 16; i += 4, n++) {
      const col = cols[n % 2];
      R(g, X + i, Y - 3, 3, 16, col); R(g, X + i + 2, Y - 3, 1, 16, shade(col, -0.25)); P1(g, X + i + 1, Y - 4, col); P1(g, X + i, Y - 3, shade(col, -0.1));
      R(g, X + i, Y + 13, 3, 1, 'rgba(0,0,0,.3)');
    }
  } else {
    R(g, X + 6, Y - 4, 4, 20, cols[0]); R(g, X + 9, Y - 4, 1, 20, shade(cols[0], -0.3)); R(g, X + 6, Y - 4, 1, 20, shade(cols[0], 0.2));
    for (let j = 0; j < 16; j += 4) R(g, X + 5, Y + j, 6, 1, shade(cols[0], -0.15));
  }
}
function drawLamp(g, X, Y) {
  R(g, X + 3, Y + 15, 10, 1, 'rgba(0,0,0,.25)');
  R(g, X + 5, Y + 12, 6, 3, '#2f3340'); R(g, X + 7, Y - 10, 2, 22, '#3b3f4f'); R(g, X + 7, Y - 10, 1, 22, '#5a5f72');
  R(g, X + 4, Y - 16, 8, 2, '#2f3340'); R(g, X + 5, Y - 14, 6, 4, '#2f3340'); R(g, X + 6, Y - 14, 4, 3, '#fff1a8'); P1(g, X + 6, Y - 14, '#ffffff');
}
function drawPole(g, X, Y) {
  R(g, X + 5, Y + 14, 7, 2, 'rgba(0,0,0,.25)');
  R(g, X + 7, Y - 30, 3, 45, '#5c4630'); R(g, X + 7, Y - 30, 1, 45, '#7e6446'); R(g, X + 9, Y - 30, 1, 45, '#3e2f20');
  R(g, X + 1, Y - 26, 15, 2, '#4e3b28'); R(g, X + 1, Y - 26, 15, 1, '#6e5538');
  for (const ix of [X + 2, X + 13]) { R(g, ix, Y - 29, 2, 3, '#e9eee8'); P1(g, ix, Y - 29, '#ffffff'); }
}
function drawBench(g, X, Y) {
  R(g, X + 1, Y + 3, 14, 3, '#7a5030'); R(g, X + 1, Y + 3, 14, 1, '#a0703f');
  R(g, X + 1, Y + 8, 14, 4, '#8a5c34'); R(g, X + 1, Y + 8, 14, 1, '#b4824a'); R(g, X + 1, Y + 11, 14, 1, '#5a3a1e');
  R(g, X + 2, Y + 12, 2, 3, '#3b3f4f'); R(g, X + 12, Y + 12, 2, 3, '#3b3f4f'); R(g, X + 2, Y + 6, 1, 2, '#3b3f4f'); R(g, X + 13, Y + 6, 1, 2, '#3b3f4f');
}
function drawCar(g, X, Y, col) {
  const dk = shade(col, -0.28), lt = shade(col, 0.22);
  R(g, X + 2, Y + 29, 13, 2, 'rgba(0,0,0,.25)');
  R(g, X + 1, Y + 5, 2, 6, '#1d1d24'); R(g, X + 13, Y + 5, 2, 6, '#1d1d24'); R(g, X + 1, Y + 20, 2, 6, '#1d1d24'); R(g, X + 13, Y + 20, 2, 6, '#1d1d24');
  R(g, X + 2, Y + 1, 12, 29, PAL.ol); R(g, X + 3, Y + 2, 10, 27, col); R(g, X + 3, Y + 2, 10, 2, lt); R(g, X + 3, Y + 27, 10, 2, dk);
  R(g, X + 4, Y + 8, 8, 5, '#2b3a55'); R(g, X + 5, Y + 9, 2, 2, '#8fb6e6'); R(g, X + 4, Y + 13, 8, 8, lt); R(g, X + 4, Y + 21, 8, 3, '#2b3a55');
  R(g, X + 3, Y + 2, 2, 1, '#fff6c0'); R(g, X + 11, Y + 2, 2, 1, '#fff6c0'); R(g, X + 3, Y + 28, 2, 1, '#e04040'); R(g, X + 11, Y + 28, 2, 1, '#e04040');
}
function drawFlag(g, X, Y) {
  R(g, X + 5, Y + 13, 6, 3, '#6d6d78'); R(g, X + 7, Y - 30, 2, 44, '#c8c8d2'); R(g, X + 8, Y - 30, 1, 44, '#8d8d98'); R(g, X + 6, Y - 32, 4, 2, '#e8c040');
  for (let i = 0; i < 14; i++) { const w = Math.round(Math.sin(i / 2.2)); R(g, X + 9 + i, Y - 29 + w, 1, 5, '#2f63c8'); R(g, X + 9 + i, Y - 24 + w, 1, 5, '#f0c230'); }
}
