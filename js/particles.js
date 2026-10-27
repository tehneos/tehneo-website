// Contact: the mark rebuilt from a few thousand charged particles. They assemble when the
// section arrives, part around the probe, scatter on click and are read by a scanning beam.

import { drawLogo2D } from './logo.js';
import { pointer, scroll, onFrame } from './ticker.js';
import { fit, damp, inView, onResize, reduced } from './util.js';

export function initParticles(section) {
  const canvas = section.querySelector('#particles');
  const ctx = canvas.getContext('2d');
  let W, H, dpr, pts = [], visible = false, formed = 0, seen = false;

  function build() {
    ({ w: W, h: H, dpr } = fit(canvas, 2));
    const mobile = W < 760;
    const L = Math.round(mobile ? Math.min(W * 0.7, H * 0.36) : Math.min(W * 0.34, H * 0.46, 480));
    const cx = W / 2, cy = H * (mobile ? 0.34 : 0.36);
    const off = document.createElement('canvas');
    off.width = off.height = L;
    const o = off.getContext('2d', { willReadFrequently: true });
    drawLogo2D(o, 0, 0, L);
    const data = o.getImageData(0, 0, L, L).data;
    const step = Math.max(3, Math.round(L / (mobile ? 85 : 120)));
    const old = pts;
    pts = [];
    for (let y = 0; y < L; y += step) for (let x = 0; x < L; x += step) {
      const i = (y * L + x) * 4;
      if (data[i + 3] < 128) continue;
      const green = data[i] < 200;
      const prev = old[pts.length];
      pts.push({
        hx: cx - L / 2 + x, hy: cy - L / 2 + y,
        x: prev ? prev.x : Math.random() * W, y: prev ? prev.y : Math.random() * H,
        vx: 0, vy: 0, green, seed: Math.random() * Math.PI * 2,
      });
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    for (const p of pts) {
      const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy) + 1;
      const f = 2600 / (d + 60);
      p.vx += (dx / d) * f * (0.6 + Math.random() * 0.8);
      p.vy += (dy / d) * f * (0.6 + Math.random() * 0.8);
    }
  });

  onFrame((dt, t) => {
    if (!visible) return;
    if (seen) formed += (1 - formed) * damp(1.4, dt);
    const r = canvas.getBoundingClientRect();
    const mx = pointer.x - r.left, my = pointer.y - r.top;
    const R = W < 760 ? 70 : 120, R2 = R * R;
    const k = 0.0016 + 0.05 * formed;
    const jitter = Math.min(6, Math.abs(scroll.v) * 0.004);
    const scanY = ((t * 0.22) % 1.4) * H - H * 0.2;
    const fr = Math.min(2, dt * 60);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const p of pts) {
      const hx = p.hx + Math.sin(t * 1.3 + p.seed) * 0.8, hy = p.hy + Math.cos(t * 1.1 + p.seed) * 0.8;
      p.vx += (hx - p.x) * k * fr; p.vy += (hy - p.y) * k * fr;
      if (!reduced) {
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.01, f = (1 - d / R) * 2.6 * fr;
          p.vx += (dx / d) * f - (dy / d) * f * 0.5; // a twist, like a field line
          p.vy += (dy / d) * f + (dx / d) * f * 0.5;
        }
        if (jitter) { p.vx += (Math.random() - 0.5) * jitter; p.vy += (Math.random() - 0.5) * jitter; }
      }
      const fric = Math.pow(0.86, fr);
      p.vx *= fric; p.vy *= fric;
      p.x += p.vx * fr; p.y += p.vy * fr;

      const scan = Math.max(0, 1 - Math.abs(p.y - scanY) / 26);
      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
      if (p.green || scan > 0.3) ctx.fillStyle = `rgba(166,198,76,${0.8 + scan * 0.2})`;
      else ctx.fillStyle = `rgba(244,246,241,${0.85 + sp * 0.15})`;
      const s = 2.2 + scan * 1.2 + sp;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';

    // scan beam
    const g = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    g.addColorStop(0, 'rgba(166,198,76,0)'); g.addColorStop(0.5, 'rgba(166,198,76,.06)'); g.addColorStop(1, 'rgba(166,198,76,0)');
    ctx.fillStyle = g; ctx.fillRect(0, scanY - 30, W, 60);
  });

  build();
  onResize(canvas, build);
  inView(section, (v) => {
    visible = v;
    if (v) seen = true;
  }, '-20% 0px');
}
