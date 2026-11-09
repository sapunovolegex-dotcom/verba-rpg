// Small image helper for cutting sprites out of the user's sprite sheets (WIC decodes WebP on Windows).
// Used from tools/cut_moto.ps1 via Add-Type. Not part of the game runtime.
using System;
using System.IO;
using System.Collections.Generic;
using System.Windows.Media;
using System.Windows.Media.Imaging;

public class Img {
  public int W, H; public byte[] P; // BGRA
  public static Img Load(string path) {
    var d = BitmapDecoder.Create(new Uri(path), BitmapCreateOptions.None, BitmapCacheOption.OnLoad);
    BitmapSource f = new FormatConvertedBitmap(d.Frames[0], PixelFormats.Bgra32, null, 0);
    var im = new Img { W = f.PixelWidth, H = f.PixelHeight };
    im.P = new byte[im.W * im.H * 4];
    f.CopyPixels(im.P, im.W * 4, 0);
    return im;
  }
  public Img(int w, int h) { W = w; H = h; P = new byte[w * h * 4]; }
  public Img() {}
  public void Save(string path) {
    var bs = BitmapSource.Create(W, H, 96, 96, PixelFormats.Bgra32, null, P, W * 4);
    var e = new PngBitmapEncoder(); e.Frames.Add(BitmapFrame.Create(bs));
    using (var fs = File.Create(path)) e.Save(fs);
  }
  public Img Crop(int x, int y, int w, int h) {
    var o = new Img(w, h);
    for (int j = 0; j < h; j++) Array.Copy(P, ((y + j) * W + x) * 4, o.P, j * w * 4, w * 4);
    return o;
  }
  public Img Scale(int k) { // nearest-neighbour enlarge, for inspection
    var o = new Img(W * k, H * k);
    for (int y = 0; y < o.H; y++) for (int x = 0; x < o.W; x++) Array.Copy(P, ((y / k) * W + x / k) * 4, o.P, (y * o.W + x) * 4, 4);
    return o;
  }
  // distance of a pixel to an RGB colour
  public int Dist(int x, int y, int r, int g, int b) {
    int i = (y * W + x) * 4; return Math.Abs(P[i + 2] - r) + Math.Abs(P[i + 1] - g) + Math.Abs(P[i] - b);
  }
  // make the panel background transparent: flood fill from the crop border through pixels close to the bg colour
  public void KeyOutFlood(int r, int g, int b, int tol) {
    var seen = new bool[W * H]; var st = new Stack<int>();
    for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
    for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
    while (st.Count > 0) {
      int p = st.Pop(); if (p < 0 || p >= W * H || seen[p]) continue;
      int x = p % W, y = p / W;
      if (Dist(x, y, r, g, b) > tol) continue;
      seen[p] = true; P[p * 4 + 3] = 0;
      if (x > 0) st.Push(p - 1); if (x < W - 1) st.Push(p + 1); if (y > 0) st.Push(p - W); if (y < H - 1) st.Push(p + W);
    }
  }
  // flood from the border through any light, low-saturation pixel (panel background + soft drop shadows)
  public void KeyOutLight(int minLum, int maxSat) {
    var seen = new bool[W * H]; var st = new Stack<int>();
    for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
    for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
    while (st.Count > 0) {
      int p = st.Pop(); if (p < 0 || p >= W * H || seen[p]) continue;
      int i = p * 4, r = P[i + 2], g = P[i + 1], b = P[i];
      int mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b)), lum = (r * 3 + g * 6 + b) / 10;
      if (lum < minLum || mx - mn > maxSat) continue;
      seen[p] = true; P[i + 3] = 0;
      int x = p % W, y = p / W;
      if (x > 0) st.Push(p - 1); if (x < W - 1) st.Push(p + 1); if (y > 0) st.Push(p - W); if (y < H - 1) st.Push(p + W);
    }
  }
  // second pass: grow transparency into soft bluish-grey drop shadows (stops at the black sprite outline)
  public void KeyOutShadow(int minLum, int maxLum, int maxSat) {
    var st = new Stack<int>(); var seen = new bool[W * H];
    for (int p = 0; p < W * H; p++) if (P[p * 4 + 3] == 0) { seen[p] = true; st.Push(p); }
    while (st.Count > 0) {
      int p = st.Pop(), x = p % W, y = p / W;
      foreach (int q in new int[] { p - 1, p + 1, p - W, p + W }) {
        if (q < 0 || q >= W * H || seen[q]) continue; if ((q == p - 1 && x == 0) || (q == p + 1 && x == W - 1)) continue;
        int i = q * 4, r = P[i + 2], g = P[i + 1], b = P[i];
        int mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b)), lum = (r * 3 + g * 6 + b) / 10;
        if (lum < minLum || lum > maxLum || mx - mn > maxSat) continue;
        seen[q] = true; P[i + 3] = 0; st.Push(q);
      }
    }
  }
  // connected components of opaque pixels: list of {x,y,w,h,area}
  public List<int[]> Components(int minArea) {
    var lab = new int[W * H]; var res = new List<int[]>(); int id = 0;
    for (int s = 0; s < W * H; s++) {
      if (lab[s] != 0 || P[s * 4 + 3] == 0) continue;
      id++; var st = new Stack<int>(); st.Push(s); lab[s] = id;
      int x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
      while (st.Count > 0) {
        int p = st.Pop(), x = p % W, y = p / W; area++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        foreach (int q in new int[] { p - 1, p + 1, p - W, p + W }) {
          if (q < 0 || q >= W * H) continue; if ((q == p - 1 && x == 0) || (q == p + 1 && x == W - 1)) continue;
          if (lab[q] == 0 && P[q * 4 + 3] != 0) { lab[q] = id; st.Push(q); }
        }
      }
      if (area >= minArea) res.Add(new int[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1, area });
    }
    return res;
  }
  // remove leftover warm cream background trapped between the legs (below yFrom); white sneakers are neutral, not warm
  public int KeyWarmLight(int yFrom) {
    int n = 0;
    int yTo = H - (int)(H * 0.11); // keep the sneakers (bottom ~11% of the pose) untouched
    for (int y = Math.Max(0, yFrom); y < yTo; y++) for (int x = 0; x < W; x++) {
      int i = (y * W + x) * 4; if (P[i + 3] == 0) continue;
      int r = P[i + 2], g = P[i + 1], b = P[i], lum = (r * 3 + g * 6 + b) / 10;
      if (lum > 185 && r - b > 18 && r - b < 70) { P[i + 3] = 0; n++; }
    }
    return n;
  }
  // average x of opaque pixels in the top `frac` of the image (head centre) — stable anchor for walk frames
  public double HeadCenterX(double frac) {
    double sx = 0; int n = 0; int yTo = (int)(H * frac);
    for (int y = 0; y < yTo; y++) for (int x = 0; x < W; x++) if (P[(y * W + x) * 4 + 3] > 0) { sx += x; n++; }
    return n > 0 ? sx / n : W / 2.0;
  }
  // opaque width of the bottom `frac` rows (smaller = feet together)
  public int FootSpan(double frac) {
    int x0 = W, x1 = -1;
    for (int y = (int)(H * (1 - frac)); y < H; y++) for (int x = 0; x < W; x++) if (P[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    return x1 - x0 + 1;
  }
  // paste this image into a bigger transparent canvas at (dx, dy)
  public Img Place(int w, int h, int dx, int dy) {
    var o = new Img(w, h);
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
      int nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      Array.Copy(P, (y * W + x) * 4, o.P, (ny * w + nx) * 4, 4);
    }
    return o;
  }
  // centre the image on a square canvas filled with a solid colour (portrait tiles → square frame)
  public Img PadSquare(byte r, byte g, byte b) {
    int s = Math.Max(W, H); var o = new Img(s, s);
    for (int i = 0; i < o.P.Length; i += 4) { o.P[i] = b; o.P[i + 1] = g; o.P[i + 2] = r; o.P[i + 3] = 255; }
    int dx = (s - W) / 2, dy = (s - H) / 2;
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) { int i = (y * W + x) * 4; if (P[i + 3] > 0) Array.Copy(P, i, o.P, ((y + dy) * s + x + dx) * 4, 4); }
    return o;
  }
  // per-row opaque runs: "y: x0-x1 x0-x1 ..." (used to find where the legs start)
  public string RowRuns(int step) {
    var sb = new System.Text.StringBuilder();
    for (int y = 0; y < H; y += step) {
      sb.Append(y).Append(':'); bool on = false; int s = 0;
      for (int x = 0; x <= W; x++) {
        bool a = x < W && P[(y * W + x) * 4 + 3] > 0;
        if (a && !on) { s = x; on = true; } else if (!a && on) { sb.Append(' ').Append(s).Append('-').Append(x - 1); on = false; }
      }
      sb.Append('\n');
    }
    return sb.ToString();
  }
  // Walk-cycle frame from a standing pose: legs below hipY are split at splitX.
  //  stride>0 (side view): left part shears back and right part forward, growing towards the feet (legs apart).
  //  lift>0 (front/back view): the leg on liftSide (-1 left, +1 right) is raised by lift px; its pixels pushed above the hip are dropped.
  //  bob: whole sprite moved down by bob px (canvas grows by |bob| at the bottom so feet stay anchored when bob=0).
  public Img Step(int hipY, int splitX, int stride, int lift, int liftSide, int bob) {
    int pad = Math.Max(stride, 0) + 2;
    var o = new Img(W + pad * 2, H + 2);
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
      int i = (y * W + x) * 4; if (P[i + 3] == 0) continue;
      int nx = x + pad, ny = y + bob;
      if (y >= hipY) {
        double t = (double)(y - hipY) / Math.Max(1, H - 1 - hipY);
        bool leftSide = x < splitX;
        if (stride > 0) nx += (int)Math.Round((leftSide ? -1 : 1) * stride * t);
        if (lift > 0 && (leftSide ? -1 : 1) == liftSide) { ny -= lift; if (ny < hipY + bob) continue; }
      }
      if (ny < 0 || ny >= o.H || nx < 0 || nx >= o.W) continue;
      int k = (ny * o.W + nx) * 4;
      // body pixels win over leg pixels that were pushed into them
      if (o.P[k + 3] != 0 && y >= hipY) continue;
      Array.Copy(P, i, o.P, k, 4);
    }
    // the legs got new edges (inside the stride / under a lifted foot): give them the sheet's dark outline
    if (stride > 0 || lift > 0) {
      var src = (byte[])o.P.Clone();
      for (int y = hipY + bob; y < o.H; y++) for (int x = 0; x < o.W; x++) {
        int k = (y * o.W + x) * 4; if (src[k + 3] == 0) continue;
        int lum = (src[k + 2] * 3 + src[k + 1] * 6 + src[k]) / 10; if (lum < 70) continue;
        bool edge = false;
        foreach (var d in new int[][] { new[] { -1, 0 }, new[] { 1, 0 }, new[] { 0, 1 } }) {
          int nx = x + d[0], ny = y + d[1];
          if (nx < 0 || nx >= o.W || ny >= o.H || src[(ny * o.W + nx) * 4 + 3] == 0) { edge = true; break; }
        }
        if (edge) { o.P[k] = 28; o.P[k + 1] = 21; o.P[k + 2] = 22; }
      }
    }
    return o;
  }
  // bounding box of opaque pixels
  public int[] Bounds() {
    int x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) if (P[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return new int[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1 };
  }
  // area-average downscale to exactly wÃ—h (alpha-weighted), then hard alpha so edges stay crisp
  public Img Downscale(int w, int h, int alphaCut) {
    var o = new Img(w, h);
    double sx = (double)W / w, sy = (double)H / h;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      double r = 0, g = 0, b = 0, a = 0, n = 0;
      int xa = (int)(x * sx), xb = Math.Max(xa + 1, (int)((x + 1) * sx)), ya = (int)(y * sy), yb = Math.Max(ya + 1, (int)((y + 1) * sy));
      for (int yy = ya; yy < yb && yy < H; yy++) for (int xx = xa; xx < xb && xx < W; xx++) {
        int i = (yy * W + xx) * 4; double al = P[i + 3] / 255.0;
        r += P[i + 2] * al; g += P[i + 1] * al; b += P[i] * al; a += al; n++;
      }
      int k = (y * w + x) * 4;
      if (a > 0 && a / n * 255 >= alphaCut) { o.P[k + 2] = (byte)(r / a); o.P[k + 1] = (byte)(g / a); o.P[k] = (byte)(b / a); o.P[k + 3] = 255; }
    }
    return o;
  }
}

