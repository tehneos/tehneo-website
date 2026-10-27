// Brand mark geometry, traced from the logo in a 512 × 512 space.
// Every visual (SVG, hero 3D, exploded stack, particles) reads from here.

export const GREEN = '#a6c64c';
export const WHITE = '#f4f6f1';
export const SLATE = '#1d2023';
export const STROKE = 15;

export const TRACES = [
  { c: 'w', pts: [[92, 118], [112, 98], [425, 98]] },
  { c: 'w', pts: [[133, 152], [240, 152], [240, 368], [283, 368], [283, 152], [378, 152]] },
  { c: 'w', pts: [[428, 205], [313, 205], [313, 418]] },
  { c: 'g', pts: [[83, 205], [200, 205], [200, 420]] },
];

export const NODES = [
  { x: 425, y: 97, r: 17, c: 'w' },
  { x: 80, y: 152, r: 14, c: 'w' },
  { x: 133, y: 152, r: 16, c: 'g' },
  { x: 378, y: 152, r: 16, c: 'g' },
  { x: 432, y: 152, r: 15, c: 'g' },
  { x: 428, y: 205, r: 17, c: 'w' },
  { x: 83, y: 205, r: 16, c: 'g' },
  { x: 200, y: 205, r: 19, c: 'g' },
  { x: 313, y: 418, r: 19, c: 'g' },
  { x: 198, y: 420, r: 19, c: 'w' },
];

export const colorOf = (c) => (c === 'g' ? GREEN : WHITE);

export function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

/** Point at distance d along a polyline. */
export function pointAt(pts, d, out = [0, 0]) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const l = Math.hypot(x1 - x0, y1 - y0);
    if (d <= l || i === pts.length - 1) {
      const t = l ? Math.min(1, d / l) : 0;
      out[0] = x0 + (x1 - x0) * t; out[1] = y0 + (y1 - y0) * t;
      return out;
    }
    d -= l;
  }
  return out;
}

export function logoSVG({ tile = true } = {}) {
  const traces = TRACES.map((t, i) =>
    `<polyline class="lg-trace" style="--i:${i}" pathLength="1" points="${t.pts.join(' ')}" stroke="${colorOf(t.c)}"/>`).join('');
  const nodes = NODES.map((n, i) =>
    `<circle class="lg-node" style="--i:${i}" cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${colorOf(n.c)}"/>`).join('');
  return `<svg viewBox="0 0 512 512" aria-hidden="true">${tile ? `<rect width="512" height="512" rx="104" fill="${SLATE}"/>` : ''}` +
    `<g fill="none" stroke-width="${STROKE}" stroke-linejoin="miter">${traces}</g>${nodes}</svg>`;
}

/** Flat 2D render at the given size, top-left at (x, y). */
export function drawLogo2D(ctx, x, y, size) {
  const s = size / 512;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineWidth = STROKE; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  for (const t of TRACES) {
    ctx.strokeStyle = colorOf(t.c);
    ctx.beginPath();
    t.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  }
  for (const n of NODES) {
    ctx.fillStyle = colorOf(n.c);
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
