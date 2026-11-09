'use strict';
// ============================================================
// Core helpers shared by every module (classic scripts share one global scope).
// ============================================================
const TS = 16, VW = 384, VH = 240;
const FONT = "'Pixelify Sans', ui-monospace, monospace";
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const OPP = { up:'down', down:'up', left:'right', right:'left' };

function hash(x, y, s = 0) {
  let v = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}
function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function P1(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function ellipse(g, cx, cy, rx, ry, col, cond) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    if (nx * nx + ny * ny <= 1 && (!cond || cond(x, y))) P1(g, x, y, col);
  }
}

// tiny pixel font for painted signboards (3–5 px wide, 5 px tall)
const GLYPH = {
  'М':['#...#','##.##','#.#.#','#...#','#...#'], 'А':['.#.','#.#','###','#.#','#.#'], 'Г':['###','#..','#..','#..','#..'],
  'З':['##.','..#','.#.','..#','##.'], 'И':['#..#','#..#','#.##','##.#','#..#'], 'Н':['#.#','#.#','###','#.#','#.#'],
  'Л':['.##','#.#','#.#','#.#','#.#'], 'Р':['##.','#.#','##.','#..','#..'], 'Ь':['#..','#..','##.','#.#','##.'],
  'О':['.#.','#.#','#.#','#.#','.#.'], 'К':['#.#','#.#','##.','#.#','#.#'], 'П':['###','#.#','#.#','#.#','#.#'],
  'Ж':['#.#.#','#.#.#','.###.','#.#.#','#.#.#'], 'Е':['###','#..','##.','#..','###'], 'С':['.##','#..','#..','#..','.##'],
  'І':['#','#','#','#','#'], 'Д':['.##.','.#.#','.#.#','####','#..#'], 'Т':['###','.#.','.#.','.#.','.#.'],
  'Я':['.##','#.#','.##','.##','#.#'], 'Х':['#.#','#.#','.#.','#.#','#.#'], 'Б':['###','#..','##.','#.#','##.'],
  'В':['##.','#.#','##.','#.#','##.'], 'У':['#.#','#.#','.##','..#','##.'], ' ':['..','..','..','..','..'],
};
function pixTextWidth(s) { let w = 0; for (const ch of s) w += (GLYPH[ch] || GLYPH[' '])[0].length + 1; return w - 1; }
function pixText(g, s, x, y, col) {
  g.fillStyle = col;
  for (const ch of s) {
    const gl = GLYPH[ch] || GLYPH[' '];
    gl.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(x + i, y + j, 1, 1); });
    x += gl[0].length + 1;
  }
}
// word-wrap helper for canvas text
function wrapText(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
