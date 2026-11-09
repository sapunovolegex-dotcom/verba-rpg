'use strict';
// ============================================================
// Outdoor buildings (footprint b.x,b.y,b.w,b.h in tiles; parts above the footprint become the overhead layer).
// ============================================================
function shell(g, X, Y, W, H, o) {
  const ol = PAL.ol, top = Y - o.over, rb = Y + o.roofH;
  R(g, X, rb, W, Y + H - rb, ol);
  R(g, X + 1, rb, W - 2, Y + H - rb - 1, o.wall);
  R(g, X + 1, rb, 2, Y + H - rb - 1, shade(o.wall, 0.15)); R(g, X + W - 3, rb, 2, Y + H - rb - 1, shade(o.wall, -0.1));
  R(g, X + 1, Y + H - 4, W - 2, 3, o.base || '#8f8577'); R(g, X + 1, rb, W - 2, 3, 'rgba(40,20,20,.3)');
  for (let k = 0; k < W / 3; k++) P1(g, X + 2 + Math.floor(hash(X + k, Y, 500) * (W - 4)), rb + 4 + Math.floor(hash(X + k, Y, 501) * (Y + H - rb - 8)), shade(o.wall, -0.06));
  R(g, X + 2, top - 1, W - 4, 1, ol); R(g, X, top + 1, 1, rb - top, ol); R(g, X + W - 1, top + 1, 1, rb - top, ol); P1(g, X + 1, top, ol); P1(g, X + W - 2, top, ol);
  R(g, X + 1, top + 1, W - 2, rb - top - 1, o.roof); R(g, X + 2, top, W - 4, 1, shade(o.roof, 0.35)); R(g, X + 1, top + 1, W - 2, 2, shade(o.roof, 0.2));
  if (o.slate) {
    for (let xx = X + 2; xx < X + W - 2; xx += 3) { R(g, xx, top + 2, 1, rb - top - 4, shade(o.roof, -0.18)); R(g, xx + 1, top + 2, 1, rb - top - 4, shade(o.roof, 0.12)); }
    for (let k = 0; k < W / 4; k++) R(g, X + 2 + Math.floor(hash(k, X, 502) * (W - 6)), top + 3 + Math.floor(hash(k, Y, 503) * (rb - top - 6)), 2, 1, '#6f7a6a');
  } else { let row = 0; for (let yy = top + 6; yy < rb - 2; yy += 4, row++) { R(g, X + 1, yy, W - 2, 1, shade(o.roof, -0.22)); for (let xx = X + 2 + (row % 2 ? 3 : 0); xx < X + W - 2; xx += 6) R(g, xx, yy - 3, 1, 3, shade(o.roof, -0.12)); } }
  R(g, X + 1, top + 1, 3, rb - top - 2, 'rgba(255,255,255,.10)'); R(g, X + W - 4, top + 1, 3, rb - top - 2, 'rgba(0,0,0,.14)');
  R(g, X + 1, rb - 3, W - 2, 2, shade(o.roof, -0.35)); R(g, X, rb - 1, W, 1, ol);
}
function win(g, x, y, w, h, opts = {}) {
  R(g, x - 1, y - 1, w + 2, h + 2, PAL.ol); R(g, x, y, w, h, opts.glass || '#5f9ccc'); R(g, x, y, w, 2, '#3f74a8');
  R(g, x + 1, y + 2, 1, h - 3, '#bfe2f6'); R(g, x + 2, y + 2, 1, 2, '#bfe2f6');
  if (opts.cross !== false) { R(g, x + (w >> 1), y, 1, h, opts.frame || '#f1ece0'); if (h > 8) R(g, x, y + (h >> 1), w, 1, opts.frame || '#f1ece0'); }
  R(g, x - 1, y + h + 1, w + 2, 1, '#f3eee2');
}
function door(g, x, y, w, h, col) {
  R(g, x - 1, y - 1, w + 2, h + 1, PAL.ol); R(g, x, y, w, h, col); R(g, x, y, w, 1, shade(col, 0.25));
  R(g, x + 1, y + 2, w - 2, h - 4, shade(col, -0.12)); R(g, x + w - 3, y + (h >> 1), 1, 2, '#f0d060'); R(g, x - 2, y + h, w + 4, 1, '#a8a49a');
}
function sign(g, cx, y, text, bg, fg) {
  const w = pixTextWidth(text) + 6;
  R(g, cx - (w >> 1) - 1, y - 1, w + 2, 9, PAL.ol); R(g, cx - (w >> 1), y, w, 7, bg); pixText(g, text, cx - (w >> 1) + 3, y + 1, fg);
}
// --- wooden church ---
const LOG = { base:'#a8743e', hi:'#cf9a58', lo:'#704a24', end:'#d9ac6a', ring:'#7a5028' };
function logs(g, x, y, w, h, opt = {}) {
  R(g, x, y, w, h, LOG.base);
  for (let yy = y; yy < y + h; yy += 4) {
    R(g, x, yy, w, 1, LOG.hi); R(g, x, yy + 3, w, 1, LOG.lo);
    for (let k = 0; k < w / 10; k++) if (hash(x + k, yy, 600) > 0.6) P1(g, x + 2 + Math.floor(hash(x + k, yy, 601) * (w - 4)), yy + 1 + (k & 1), '#8a5c30');
    if (opt.ends) for (const ex of [x - 2, x + w - 2]) { R(g, ex, yy, 4, 4, LOG.ring); R(g, ex + 1, yy + 1, 2, 2, LOG.end); }
  }
}
function shingles(g, x, y, w, h) {
  R(g, x, y, w, h, '#3f5f4c');
  for (let yy = y; yy < y + h; yy += 3) { const off = ((yy - y) / 3) % 2 ? 2 : 0; for (let xx = x + off; xx < x + w; xx += 4) { P1(g, xx, yy + 2, '#2b4436'); P1(g, xx + 1, yy + 2, '#2b4436'); P1(g, xx + 1, yy, '#5a7d66'); } }
}
function gableRoof(g, x, y, w, h, ext) {
  R(g, x - ext - 1, y - 1, w + 2 * ext + 2, h + 2, PAL.ol);
  shingles(g, x - ext, y, w + 2 * ext, h);
  R(g, x - ext, y, w + 2 * ext, 1, '#6e9078'); R(g, x - ext, y + h - 2, w + 2 * ext, 2, '#263c30'); R(g, x - ext, y + h, w + 2 * ext, 1, '#c9cfc9');
}
function drawChurch(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS, cx = X + (W >> 1);
  logs(g, cx - 13, Y - 22, 26, 34); R(g, cx - 14, Y - 22, 1, 34, PAL.ol); R(g, cx + 13, Y - 22, 1, 34, PAL.ol);
  win(g, cx - 3, Y - 16, 6, 9);
  gableRoof(g, cx - 13, Y - 26, 26, 5, 4);
  for (let j = 0; j < 34; j++) {
    const yy = Y - 60 + j, hw = Math.round(2 + j * 0.47);
    for (let i = -hw; i < hw; i++) {
      const edge = i === -hw || i === hw - 1, rel = (i + hw) / (2 * hw);
      const sh = ((j % 3 === 2) && ((i + (j % 6 < 3 ? 0 : 2)) & 3) < 2) ? -0.25 : 0;
      P1(g, cx + i, yy, edge ? PAL.ol : shade(rel < 0.45 ? '#557a62' : rel < 0.8 ? '#3f5f4c' : '#2c4537', sh));
    }
  }
  R(g, cx - 18, Y - 27, 36, 2, '#2c4537'); R(g, cx - 18, Y - 25, 36, 1, '#c9cfc9');
  R(g, cx - 2, Y - 64, 4, 5, '#c9962a'); R(g, cx - 1, Y - 64, 1, 5, '#f3d27a');
  for (let j = 0; j < 10; j++) { const t = j / 9, hw = Math.max(1, Math.round(5 * Math.pow(Math.sin(Math.PI * (t * 0.9 + 0.05)), 0.7)));
    for (let i = -hw; i < hw; i++) { const rel = (i + hw) / (2 * hw); P1(g, cx + i, Y - 74 + j, i === -hw || i === hw - 1 ? '#7a5512' : rel < 0.35 ? '#f6dc7a' : rel < 0.7 ? '#e0b23a' : '#b08020'); } }
  R(g, cx - 1, Y - 88, 2, 15, '#e0b23a'); P1(g, cx - 1, Y - 88, '#f6dc7a');
  R(g, cx - 3, Y - 85, 6, 1, '#e0b23a'); R(g, cx - 5, Y - 81, 10, 2, '#e0b23a'); P1(g, cx - 4, Y - 76, '#e0b23a'); R(g, cx - 3, Y - 77, 2, 1, '#e0b23a'); R(g, cx + 1, Y - 78, 2, 1, '#e0b23a'); P1(g, cx + 3, Y - 79, '#e0b23a');
  logs(g, X + 3, Y + 20, W - 6, H - 24, { ends:true });
  R(g, X + 1, Y + 20, 1, H - 24, PAL.ol); R(g, X + W - 2, Y + 20, 1, H - 24, PAL.ol);
  gableRoof(g, X + 3, Y + 6, 30, 14, 3); gableRoof(g, X + W - 33, Y + 6, 30, 14, 3);
  win(g, X + 12, Y + 36, 8, 12); win(g, X + W - 20, Y + 36, 8, 12);
  const px = cx - 22, pw = 44;
  logs(g, px, Y + 4, pw, H - 8, { ends:true });
  for (let i = 0; i < pw + 8; i++) {
    const t = (i - 4) / pw, a = Math.round(Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * 12), top = Y + 10 - a;
    R(g, px - 4 + i, top - 3, 1, 5, '#3f5f4c'); P1(g, px - 4 + i, top - 4, PAL.ol); P1(g, px - 4 + i, top - 3, '#6e9078'); P1(g, px - 4 + i, top + 2, '#263c30');
  }
  for (let i = 0; i < pw; i++) { const a = Math.round(Math.sin(i / pw * Math.PI) * 12); P1(g, px + i, Y + 13 - a, '#e2b878'); }
  R(g, cx - 8, Y + 4, 16, 20, '#c9962a'); R(g, cx - 7, Y + 5, 14, 18, '#efe7d2');
  R(g, cx - 5, Y + 6, 10, 9, '#f2d27a'); R(g, cx - 2, Y + 8, 4, 4, '#e2bf98'); R(g, cx - 2, Y + 7, 4, 1, '#6a4a2a');
  R(g, cx - 4, Y + 12, 8, 10, '#3a66b0'); R(g, cx - 2, Y + 12, 4, 10, '#b8443a'); R(g, cx - 1, Y + 13, 2, 3, '#e2bf98');
  R(g, cx - 9, Y + 44, 18, 32, '#c99a5c'); R(g, cx - 8, Y + 43, 16, 1, '#c99a5c');
  R(g, cx - 7, Y + 47, 14, 29, '#5a371c'); R(g, cx - 6, Y + 45, 12, 2, '#5a371c');
  R(g, cx - 1, Y + 47, 1, 29, '#3a2210'); R(g, cx - 6, Y + 50, 4, 10, '#6e4626'); R(g, cx + 2, Y + 50, 4, 10, '#6e4626');
  R(g, cx - 6, Y + 63, 4, 10, '#6e4626'); R(g, cx + 2, Y + 63, 4, 10, '#6e4626'); P1(g, cx - 3, Y + 62, '#e0b23a'); P1(g, cx + 1, Y + 62, '#e0b23a');
  win(g, cx - 18, Y + 50, 6, 10); win(g, cx + 12, Y + 50, 6, 10);
  R(g, X + 2, Y + H - 4, W - 4, 4, '#a39a8c'); R(g, X + 2, Y + H - 4, W - 4, 1, '#c2baad');
  R(g, cx - 12, Y + H - 3, 24, 3, '#b8b2a6'); R(g, cx - 10, Y + H - 5, 20, 2, '#cfc9bd');
}
function drawBelfry(g, b, swing) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS, cx = X + (W >> 1);
  R(g, X + 1, Y + H - 7, W - 2, 7, '#8f8576'); R(g, X + 1, Y + H - 7, W - 2, 2, '#c4baa8');
  logs(g, X + 3, Y + 26, W - 6, H - 33);
  for (const px of [X + 3, X + W - 6]) { R(g, px, Y + 2, 3, H - 9, '#7a5028'); R(g, px, Y + 2, 1, H - 9, '#a8743e'); }
  R(g, X + 3, Y + 2, W - 6, 3, '#7a5028');
  drawBell(g, cx, Y + 5, b.bellFixed !== false, swing || 0);
  for (let j = 0; j < 16; j++) { const hw = Math.round(4 + j * 1.25); R(g, cx - hw, Y - 14 + j, hw * 2, 1, j === 15 ? '#263c30' : (j % 3 === 2 ? '#344f40' : '#46695a')); P1(g, cx - hw, Y - 14 + j, PAL.ol); P1(g, cx + hw - 1, Y - 14 + j, PAL.ol); R(g, cx, Y - 14 + j, hw, 1, 'rgba(0,0,0,.14)'); }
  R(g, cx - 1, Y - 22, 2, 8, '#e0b23a'); R(g, cx - 3, Y - 19, 6, 1, '#e0b23a'); R(g, cx - 21, Y + 2, 42, 1, '#c9cfc9');
}
function drawBell(g, cx, y, rope, swing) {
  const off = Math.round(swing * 3);
  R(g, cx - 1, y, 2, 3, '#5a4a30');
  for (let j = 0; j < 11; j++) { const hw = Math.round(2 + j * 0.45 + (j > 8 ? 1 : 0)), sx = cx + Math.round(off * j / 10); for (let i = -hw; i < hw; i++) P1(g, sx + i, y + 3 + j, i === -hw || i === hw - 1 ? '#6e4e10' : i < -hw / 3 ? '#f6dc7a' : i < hw / 3 ? '#d8a832' : '#a07818'); }
  R(g, cx - 1 + off, y + 14, 2, 2, '#6e4e10');
  if (rope) R(g, cx + off, y + 16, 1, 6, '#c9b28a'); else { P1(g, cx + off, y + 16, '#c9b28a'); P1(g, cx + off + 1, y + 17, '#c9b28a'); }
}
function drawShop(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS, slate = b.roof === 'slate';
  shell(g, X, Y, W, H, { over:6, roofH:22, roof: slate ? '#878f90' : '#a5523e', slate, wall:'#e9dfc6', base:'#8f7f6a' });
  sign(g, X + (W >> 1), Y + 23, 'МАГАЗИН', '#2b5fb0', '#ffffff');
  const ay = Y + 33;
  for (let i = 0; i < W - 4; i += 6) { R(g, X + 2 + i, ay, 6, 6, (i / 6) % 2 ? '#f3ece0' : '#c8443c'); R(g, X + 3 + i, ay + 6, 4, 1, (i / 6) % 2 ? '#cfc7b9' : '#9a302a'); }
  R(g, X + 2, ay - 1, W - 4, 1, PAL.ol);
  const dx = X + W - 26;
  for (let wx = X + 7; wx + 22 < dx; wx += 28) { win(g, wx, ay + 11, 22, 13, { cross:false }); for (let i = 0; i < 5; i++) R(g, wx + 3 + i * 4, ay + 19, 3, 4, ['#f2c14e', '#e86a5a', '#8bc06a', '#f4f0e0', '#c88a4a'][i]); }
  door(g, dx, ay + 8, 12, H - 8 - (ay - Y) - 4, '#4f7fb0');
}
function drawGarage(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS;
  R(g, X, Y - 3, W, H + 3, PAL.ol);
  R(g, X + 1, Y - 2, W - 2, 14, '#8a9092'); for (let xx = X + 2; xx < X + W - 2; xx += 3) R(g, xx, Y - 1, 1, 12, '#73797b'); R(g, X + 1, Y - 2, W - 2, 1, '#b4babb'); R(g, X + 1, Y + 10, W - 2, 2, '#5f6567');
  for (let k = 0; k < 5; k++) R(g, X + 4 + Math.floor(hash(k, Y, 700) * (W - 10)), Y + Math.floor(hash(k, X, 701) * 8), 3, 1, '#6c7a64');
  R(g, X + 1, Y + 12, W - 2, H - 13, '#c4bdae'); R(g, X + 1, Y + 12, W - 2, 2, 'rgba(0,0,0,.2)'); R(g, X + 1, Y + H - 4, W - 2, 3, '#8f887a');
  const dx = X + 10, dw = W - 20, dy = Y + 17, dh = H - 20;
  R(g, dx - 1, dy - 1, dw + 2, dh + 1, PAL.ol); R(g, dx, dy, dw, dh, b.door);
  for (let yy = dy + 2; yy < dy + dh; yy += 3) R(g, dx, yy, dw, 1, shade(b.door, -0.22));
  R(g, dx, dy, dw, 1, shade(b.door, 0.3)); R(g, dx + (dw >> 1) - 2, dy + dh - 6, 4, 2, '#d9d9d9');
  for (let k = 0; k < 4; k++) P1(g, dx + Math.floor(hash(k, Y, 702) * dw), dy + Math.floor(hash(k, X, 703) * dh), '#9a6a3a');
  if (b.mini) sign(g, X + (W >> 1), Y + 2, 'КАРТОПЛЯ', '#6b4a2a', '#f3e3b5');
}
function garageDoorRect(b) { return { x: b.x * TS + 10, y: b.y * TS + 17, w: b.w * TS - 20, h: b.h * TS - 20 }; }
function drawGarageDoor(g, b, open, camX, camY) {
  const r = garageDoorRect(b), x = r.x - camX, y = r.y - camY;
  R(g, x, y, r.w, r.h, '#17130f');
  for (let yy = y + 2; yy < y + r.h; yy += 5) R(g, x, yy, r.w, 1, '#231c15');
  R(g, x + 3, y + 8, r.w - 6, 2, '#5a4128');
  for (let i = 0; i < 4; i++) R(g, x + 6 + i * 6, y + 4, 4, 4, ['#7e8a96', '#a47a3e', '#6f7a64', '#a47a3e'][i]);
  for (const [sx, sw] of [[4, 13], [16, 12], [r.w - 18, 14]]) {
    R(g, x + sx, y + r.h - 13, sw, 12, '#6b5434'); R(g, x + sx + 1, y + r.h - 14, sw - 2, 12, '#9c7a4a'); R(g, x + sx + 2, y + r.h - 13, 3, 9, '#b8935c');
    R(g, x + sx + (sw >> 1) - 2, y + r.h - 16, 4, 3, '#c9a86e');
  }
  R(g, x + 30, y + r.h - 10, 14, 9, '#7a5530'); R(g, x + 30, y + r.h - 10, 14, 1, '#a07040');
  for (let i = 0; i < 5; i++) R(g, x + 31 + i * 3, y + r.h - 12 + (i % 2), 3, 2, '#c99a58');
  R(g, x, y, r.w, 4, 'rgba(0,0,0,.45)');
  const dh = Math.round(r.h * (1 - open));
  if (dh > 0) {
    R(g, x, y, r.w, dh, b.door);
    for (let yy = y + 2; yy < y + dh; yy += 3) R(g, x, yy, r.w, 1, shade(b.door, -0.22));
    R(g, x, y + dh - 1, r.w, 1, shade(b.door, -0.45));
    if (open < 0.05) R(g, x + (r.w >> 1) - 2, y + dh - 6, 4, 2, '#d9d9d9');
  }
}
function drawFire(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS, tx = X + W - 16;
  R(g, tx - 1, Y - 26, 14, 34, PAL.ol); R(g, tx, Y - 25, 12, 33, '#e6dbc0'); R(g, tx + 9, Y - 25, 3, 33, '#cbbf9f');
  R(g, tx - 2, Y - 30, 16, 5, '#9a3a2c'); R(g, tx - 1, Y - 31, 14, 1, PAL.ol); R(g, tx + 3, Y - 20, 6, 6, '#3b3f4f'); R(g, tx + 4, Y - 19, 4, 4, '#d8453a');
  shell(g, X, Y, W, H, { over:6, roofH:24, roof:'#b04a38', wall:'#e6dbc0', base:'#938572' });
  sign(g, X + 40, Y + 26, 'ПОЖЕЖНА', '#b8382e', '#ffffff');
  for (const gx of [X + 6, X + 42]) {
    R(g, gx - 1, Y + 37, 32, H - 40, PAL.ol); R(g, gx, Y + 38, 30, H - 42, '#b8382e');
    for (let yy = Y + 44; yy < Y + H - 4; yy += 4) R(g, gx, yy, 30, 1, '#962a22');
    R(g, gx + 2, Y + 40, 26, 4, '#bfe2f2'); R(g, gx, Y + 38, 30, 1, '#e06a5a');
  }
  door(g, X + W - 14, Y + 50, 9, H - 54, '#6e5236'); win(g, X + W - 14, Y + 36, 9, 8);
}
function drawCouncil(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS, cx = X + (W >> 1);
  shell(g, X, Y, W, H, { over:6, roofH:26, roof:'#4f78a8', slate:true, wall:'#ecdcab', base:'#a29070' });
  for (const wy of [Y + 36, Y + 62]) for (let wx = X + 8; wx < X + W - 12; wx += 16) { if (wx > cx - 26 && wx < cx + 20) continue; win(g, wx, wy, 10, 13); }
  R(g, cx - 25, Y + 28, 50, 66, 'rgba(0,0,0,.12)');
  for (let j = 0; j < 12; j++) { const w = Math.round(26 * (j + 1) / 12); R(g, cx - w, Y + 12 + j, w * 2, 1, j === 0 ? PAL.ol : '#f3efe6'); P1(g, cx - w, Y + 12 + j, PAL.ol); P1(g, cx + w - 1, Y + 12 + j, PAL.ol); }
  R(g, cx - 27, Y + 24, 54, 8, PAL.ol); R(g, cx - 26, Y + 25, 52, 6, '#f3efe6');
  pixText(g, 'СІЛЬРАДА', cx - (pixTextWidth('СІЛЬРАДА') >> 1), Y + 25, '#3a3240');
  R(g, cx - 3, Y + 15, 6, 7, '#2f63c8'); R(g, cx - 1, Y + 16, 2, 5, '#f0c230'); R(g, cx - 2, Y + 17, 4, 1, '#f0c230');
  for (const px of [cx - 22, cx - 12, cx + 8, cx + 18]) { R(g, px - 1, Y + 32, 6, 60, PAL.ol); R(g, px, Y + 32, 4, 60, '#f3efe6'); R(g, px + 3, Y + 32, 1, 60, '#cbc2ae'); }
  door(g, cx - 6, Y + 66, 12, 26, '#6a4428'); win(g, cx - 4, Y + 42, 8, 12);
  R(g, cx - 26, Y + 92, 52, 4, '#d1cabb'); R(g, cx - 26, Y + 92, 52, 1, '#f5f2ea');
}
function drawKiosk(g, b) {
  const X = b.x * TS, Y = b.y * TS, W = b.w * TS, H = b.h * TS;
  R(g, X, Y - 5, W, H + 5, PAL.ol);
  R(g, X + 1, Y - 4, W - 2, 11, b.roof); R(g, X + 1, Y - 4, W - 2, 2, shade(b.roof, 0.3)); R(g, X + 1, Y + 5, W - 2, 2, shade(b.roof, -0.3));
  R(g, X + 1, Y + 7, W - 2, H - 8, b.wall); R(g, X + 1, Y + 7, W - 2, 2, 'rgba(0,0,0,.2)'); R(g, X + 1, Y + H - 3, W - 2, 2, shade(b.wall, -0.3));
  sign(g, X + (W >> 1), Y - 2, b.sign, shade(b.roof, -0.35), '#ffffff');
  const ww = W > 40 ? 24 : 14;
  win(g, X + 4, Y + 11, ww, 10, { cross:false });
  for (let i = 0; i < ww / 4 - 1; i++) R(g, X + 6 + i * 4, Y + 17, 2, 3, ['#f2c14e', '#e86a5a', '#8bc06a', '#f4f0e0', '#c88a4a'][i % 5]);
  R(g, X + 3, Y + 22, ww + 2, 2, shade(b.wall, -0.2));
  if (W > 40) door(g, X + W - 13, Y + 11, 9, H - 14, '#4f7fb0');
}
