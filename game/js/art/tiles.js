'use strict';
// ============================================================
// Ground tiles for outdoor scenes. Painters read neighbours through ART (the scene being pre-rendered).
// ============================================================
let ART = null; // { K(x,y) -> kind, crop(x,y) -> crop name }
const AK = (x, y) => ART.K(x, y);
const isRoad = k => k === 'r' || k === 'k';
const isGreen = k => k === 'g' || k === 'm';

const PAL = {
  g0:'#5e9c40', g1:'#6fae4b', g2:'#4b8735', g3:'#8bc35c', gb:'#3d722c', gs:'#a9d277',
  m2:'#557f35', mt:'#bfd27e', ms:'#d6cf96',
  asph:'#76777c', asphL:'#88898e', asphD:'#626368', crack:'#4f5055', sand:'#b9a378',
  park:'#707176', curb:'#b8b8b4', curbD:'#5a5b60',
  pave:'#aaa59a', paveL:'#c4bfb3', paveD:'#8a857b',
  dirt:'#b48f5e', dirtD:'#957245', dirtL:'#cba874',
  soil:'#5a4030', soilL:'#6f5039', soilD:'#3f2c20',
  conc:'#b2b0a8', concD:'#95938b',
  ol:'#24202a',
};

function grassBase(g, X, Y) {
  R(g, X, Y, TS, TS, PAL.g0);
  for (let j = 0; j < TS; j += 2) for (let i = (j >> 1) % 2; i < TS; i += 2) {
    const n = vnoise(X + i, Y + j, 40, 3);
    if (n > 0.6) R(g, X + i, Y + j, 2, 2, PAL.g1); else if (n < 0.33) R(g, X + i, Y + j, 2, 2, PAL.g2);
  }
}
function paintGrass(g, X, Y, x, y) {
  grassBase(g, X, Y);
  const nb = 7 + Math.floor(hash(x, y, 2) * 5);
  for (let t = 0; t < nb; t++) {
    const a = Math.floor(hash(x, y, 10 + t) * 15), b = 2 + Math.floor(hash(x, y, 20 + t) * 13), h = 2 + Math.floor(hash(x, y, 30 + t) * 2);
    R(g, X + a, Y + b - h + 1, 1, h, t % 3 ? PAL.gb : PAL.g2); P1(g, X + a, Y + b - h, t % 2 ? PAL.g3 : PAL.gs);
  }
}
function paintMeadow(g, X, Y, x, y, dens) {
  grassBase(g, X, Y);
  for (let t = 0; t < 16; t++) {
    if (hash(x, y, 290 + t) > dens) continue;
    const a = Math.floor(hash(x, y, 200 + t) * 16), base = 4 + Math.floor(hash(x, y, 220 + t) * 12), h = 4 + Math.floor(hash(x, y, 240 + t) * 4);
    const lean = hash(x, y, 260 + t) > 0.5 ? 1 : 0;
    R(g, X + a, Y + base - h + 2, 1, h - 2, PAL.m2); if (a + lean < 16) R(g, X + a + lean, Y + base - h, 1, 2, t % 3 ? PAL.mt : PAL.ms);
  }
  if (hash(x, y, 280) > 0.7) { const a = 2 + Math.floor(hash(x, y, 281) * 11); P1(g, X + a, Y + 4, '#f2efe6'); P1(g, X + a + 1, Y + 5, '#f2efe6'); P1(g, X + a, Y + 5, '#e9c84a'); }
}
function paintRoad(g, X, Y, x, y, k) {
  const park = k === 'k';
  R(g, X, Y, TS, TS, park ? PAL.park : PAL.asph);
  for (let i = 0; i < 14; i++) { const a = Math.floor(hash(x, y, 70 + i) * 16), b = Math.floor(hash(x, y, 80 + i) * 16); P1(g, X + a, Y + b, i < 7 ? PAL.asphL : PAL.asphD); }
  if (!park && hash(x, y, 90) > 0.82) { const a = Math.floor(hash(x, y, 91) * 8), b = Math.floor(hash(x, y, 92) * 8); R(g, X + a, Y + b, 6 + (a & 3), 5, '#6b6c71'); R(g, X + a, Y + b, 6 + (a & 3), 1, '#5f6065'); }
  if (hash(x, y, 93) > 0.7) { let cx = X + Math.floor(hash(x, y, 94) * 12) + 2, cy = Y + 2; for (let s = 0; s < 9; s++) { P1(g, cx, cy, PAL.crack); cy++; cx += hash(x * 9 + s, y, 95) > 0.6 ? 1 : hash(x * 9 + s, y, 96) > 0.6 ? -1 : 0; } }
  const n = { t:AK(x, y - 1), b:AK(x, y + 1), l:AK(x - 1, y), r:AK(x + 1, y) };
  const hard = v => v === 'p' || v === 'c';
  const edge = side => {
    for (let i = 0; i < TS; i++) {
      const w = 2 + Math.floor(hash(x * 16 + i, y * 16, side.charCodeAt(0)) * 2);
      if (side === 't') { R(g, X + i, Y, 1, w, PAL.sand); P1(g, X + i, Y + w, PAL.asphD); }
      if (side === 'b') { R(g, X + i, Y + TS - w, 1, w, PAL.sand); P1(g, X + i, Y + TS - w - 1, PAL.asphD); }
      if (side === 'l') { R(g, X, Y + i, w, 1, PAL.sand); P1(g, X + w, Y + i, PAL.asphD); }
      if (side === 'r') { R(g, X + TS - w, Y + i, w, 1, PAL.sand); P1(g, X + TS - w - 1, Y + i, PAL.asphD); }
    }
  };
  const curb = side => {
    if (side === 't') { R(g, X, Y, TS, 2, PAL.curb); R(g, X, Y + 2, TS, 1, PAL.curbD); }
    if (side === 'b') { R(g, X, Y + 13, TS, 1, PAL.curbD); R(g, X, Y + 14, TS, 2, PAL.curb); }
    if (side === 'l') { R(g, X, Y, 2, TS, PAL.curb); R(g, X + 2, Y, 1, TS, PAL.curbD); }
    if (side === 'r') { R(g, X + 13, Y, 1, TS, PAL.curbD); R(g, X + 14, Y, 2, TS, PAL.curb); }
  };
  for (const s of ['t', 'b', 'l', 'r']) { const v = n[s]; if (v === null || isRoad(v)) continue; if (park || hard(v)) curb(s); else edge(s); }
}
function paintPaving(g, X, Y, x, y) {
  R(g, X, Y, TS, TS, PAL.pave);
  for (let r = 0; r < 4; r++) {
    const yy = Y + r * 4, off = ((y * 4 + r) % 2) ? 4 : 0;
    R(g, X, yy + 3, TS, 1, PAL.paveD);
    for (let c = off; c < TS + 8; c += 8) {
      if (c > 0 && c < TS) R(g, X + c, yy, 1, 3, PAL.paveD);
      if (c + 1 < TS) R(g, X + c + 1, yy, Math.min(2, TS - c - 1), 1, PAL.paveL);
      if (hash(x * 8 + c, y * 4 + r, 300) > 0.85 && c + 3 < TS) R(g, X + c + 2, yy + 1, 3, 2, '#9f9a8f');
    }
  }
  const e = v => isGreen(v) || v === 'd' || v === 'f';
  if (e(AK(x, y - 1))) R(g, X, Y, TS, 1, '#7d786e');
  if (e(AK(x, y + 1))) R(g, X, Y + 15, TS, 1, '#7d786e');
  if (e(AK(x - 1, y))) R(g, X, Y, 1, TS, '#7d786e');
  if (e(AK(x + 1, y))) R(g, X + 15, Y, 1, TS, '#7d786e');
}
function paintDirt(g, X, Y, x, y) {
  R(g, X, Y, TS, TS, PAL.dirt);
  for (let i = 0; i < 12; i++) { const a = Math.floor(hash(x, y, 90 + i) * 16), b = Math.floor(hash(x, y, 100 + i) * 16); R(g, X + a, Y + b, i % 3 ? 1 : 2, 1, i % 2 ? PAL.dirtD : PAL.dirtL); }
  const horiz = AK(x - 1, y) === 'd' || AK(x + 1, y) === 'd';
  if (horiz) { R(g, X, Y + 4, TS, 2, PAL.dirtD); R(g, X, Y + 10, TS, 2, PAL.dirtD); } else { R(g, X + 4, Y, 2, TS, PAL.dirtD); R(g, X + 10, Y, 2, TS, PAL.dirtD); }
  for (let i = 0; i < TS; i++) {
    const l = 1 + Math.floor(hash(x * 16 + i, y, 110) * 3);
    if (isGreen(AK(x, y - 1))) R(g, X + i, Y, 1, l, PAL.g0);
    if (isGreen(AK(x, y + 1))) R(g, X + i, Y + TS - l, 1, l, PAL.g0);
    if (isGreen(AK(x - 1, y))) R(g, X, Y + i, l, 1, PAL.g0);
    if (isGreen(AK(x + 1, y))) R(g, X + TS - l, Y + i, l, 1, PAL.g0);
  }
}
function paintField(g, X, Y, x, y) {
  const c = ART.crop(x, y) || 'bare';
  R(g, X, Y, TS, TS, PAL.soil);
  for (let r = 0; r < 4; r++) { R(g, X, Y + r * 4, TS, 2, PAL.soilL); R(g, X, Y + r * 4 + 3, TS, 1, PAL.soilD); }
  for (let i = 0; i < 10; i++) P1(g, X + Math.floor(hash(x, y, 400 + i) * 16), Y + Math.floor(hash(x, y, 410 + i) * 16), i % 2 ? '#7a5a40' : '#33241a');
  if (c === 'potato') for (let r = 0; r < 4; r++) for (let i = 1 + (r % 2) * 2; i < TS - 1; i += 4) { const yy = Y + r * 4; R(g, X + i - 1, yy, 3, 2, '#4f8a3a'); P1(g, X + i, yy - 1, '#78b04e'); P1(g, X + i - 1, yy, '#6aa046'); }
  if (c === 'onion') for (let r = 0; r < 4; r++) for (let i = 1; i < TS; i += 2) { const yy = Y + r * 4; R(g, X + i, yy - 2, 1, 3, '#6f9e78'); P1(g, X + i, yy - 2, '#9cc6a0'); }
}
function paintConcrete(g, X, Y, x, y) {
  R(g, X, Y, TS, TS, PAL.conc); R(g, X, Y + 15, TS, 1, PAL.concD); R(g, X + 15, Y, 1, TS, PAL.concD);
  if (hash(x, y, 120) > 0.5) { const a = 3 + Math.floor(hash(x, y, 121) * 9); R(g, X + a, Y + 4, 1, 3, PAL.concD); R(g, X + a + 1, Y + 7, 1, 2, PAL.concD); }
}
function paintFlowers(g, X, Y, x, y, n) {
  const cols = [['#e05a64', '#ffd0d0'], ['#f0cf48', '#fff4b8'], ['#f6f3ea', '#e8c040'], ['#9a74d4', '#e6d8ff']];
  for (let i = 0; i < 3; i++) {
    const [c1, c2] = cols[(n + i) % 4];
    const a = 2 + Math.floor(hash(x, y, 130 + i) * 11), b = 3 + Math.floor(hash(x, y, 140 + i) * 10);
    R(g, X + a, Y + b + 1, 1, 2, PAL.gb); P1(g, X + a - 1, Y + b, c1); P1(g, X + a + 1, Y + b, c1); P1(g, X + a, Y + b - 1, c1); P1(g, X + a, Y + b, c2);
  }
}
