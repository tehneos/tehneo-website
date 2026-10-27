export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
/** Frame-rate independent easing factor. */
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Size a canvas backing store to its CSS box. Returns CSS size and dpr. */
export function fit(canvas, maxDpr = 2) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  return { w, h, dpr };
}

export function inView(el, cb, rootMargin = '0px') {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin });
  io.observe(el);
}

/** Call fn when an element's size changes meaningfully (ignores mobile URL-bar jitter). */
export function onResize(el, fn) {
  let w = 0, h = 0, timer;
  new ResizeObserver(([e]) => {
    const { width, height } = e.contentRect;
    if (Math.abs(width - w) < 1 && Math.abs(height - h) < 120) return;
    w = width; h = height;
    clearTimeout(timer); timer = setTimeout(fn, 120);
  }).observe(el);
}

/** Scroll progress through a tall section: 0 when its top hits the viewport top, 1 when its bottom hits the viewport bottom. */
export function sectionProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
}

/** Seeded PRNG (mulberry32). */
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Perspective camera. Rotates around Z (spin), then X (tilt), then Y (pan), z points at the viewer.
 * Returns project(x, y, z, out) → out = [screenX, screenY, scale].
 */
export function camera(rx, ry, rz, f, cx, cy) {
  const cX = Math.cos(rx), sX = Math.sin(rx), cY = Math.cos(ry), sY = Math.sin(ry), cZ = Math.cos(rz), sZ = Math.sin(rz);
  return (x, y, z, out = [0, 0, 0]) => {
    const x1 = x * cZ - y * sZ, y1 = x * sZ + y * cZ;
    const y2 = y1 * cX - z * sX, z2 = y1 * sX + z * cX;
    const x3 = x1 * cY + z2 * sY, z3 = -x1 * sY + z2 * cY;
    const k = f / (f - z3);
    out[0] = cx + x3 * k; out[1] = cy + y2 * k; out[2] = k;
    return out;
  };
}
