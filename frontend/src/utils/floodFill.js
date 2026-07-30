// ============================================================
// Boundary-aware scanline flood fill (the "smart paint bucket")
//
// Fills a connected region on the PAINT layer, using the OUTLINE
// layer as walls so colour never leaks past the black line art.
// Runs on raw ImageData for speed (≈1M px in a few ms).
// ============================================================

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * @param {ImageData} paint    paint-layer pixels (mutated in place)
 * @param {ImageData} outline  outline-layer pixels (read-only wall mask)
 * @param {number} startX      fill origin (canvas px)
 * @param {number} startY
 * @param {string} hex         fill colour
 * @param {number} tolerance   0–100 colour tolerance
 * @returns {boolean} whether anything was filled
 */
export function floodFill(paint, outline, startX, startY, hex, tolerance = 24) {
  const { width, height, data } = paint;
  const od = outline.data;
  const [fr, fg, fb] = hexToRgb(hex);

  startX = Math.round(startX);
  startY = Math.round(startY);
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return false;

  const start = (startY * width + startX) * 4;
  // Clicking on a line does nothing.
  if (od[start + 3] > 60) return false;

  const sr = data[start], sg = data[start + 1], sb = data[start + 2], sa = data[start + 3];
  if (sr === fr && sg === fg && sb === fb && sa === 255) return false; // already this colour

  const tol = (tolerance / 100) * 255;
  const tolSq = tol * tol * 3;

  const isWall = (i) => od[i + 3] > 60;
  const matches = (i) => {
    if (isWall(i)) return false;
    const dr = data[i] - sr, dg = data[i + 1] - sg, db = data[i + 2] - sb;
    return dr * dr + dg * dg + db * db <= tolSq;
  };

  const stack = [startX, startY];
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    let idx = (y * width + x) * 4;

    // climb to the top of this vertical run
    let yy = y;
    while (yy >= 0 && matches(idx)) { yy--; idx -= width * 4; }
    yy++; idx += width * 4;

    let reachLeft = false;
    let reachRight = false;
    while (yy < height && matches(idx)) {
      data[idx] = fr; data[idx + 1] = fg; data[idx + 2] = fb; data[idx + 3] = 255;

      if (x > 0) {
        if (matches(idx - 4)) {
          if (!reachLeft) { stack.push(x - 1, yy); reachLeft = true; }
        } else reachLeft = false;
      }
      if (x < width - 1) {
        if (matches(idx + 4)) {
          if (!reachRight) { stack.push(x + 1, yy); reachRight = true; }
        } else reachRight = false;
      }
      yy++; idx += width * 4;
    }
  }
  return true;
}
