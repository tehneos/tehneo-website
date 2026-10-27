// Custom cursor: a probe whose trail is auto-routed like a PCB trace (45° and 90° only),
// with vias at every bend. Also drives magnetic elements and the HUD coordinate readout.

import { pointer, onFrame } from './ticker.js';
import { sound } from './audio.js';
import { fit, damp, reduced } from './util.js';

const LIFE = 0.75;    // seconds a trace segment survives
const COMMIT = 46;    // px before the router commits a bend

export function initCursor() {
  const xy = document.getElementById('hud-xy');
  let lastXY = '';
  onFrame(() => {
    const s = `X ${String(Math.round(pointer.x)).padStart(4, '0')} · Y ${String(Math.round(pointer.y + scrollY)).padStart(4, '0')}`;
    if (s !== lastXY) { xy.textContent = s; lastXY = s; }
  });

  initMagnets();
  if (!pointer.fine) return;

  document.documentElement.classList.add('has-cursor');
  const el = document.querySelector('.cursor');
  const dot = el.querySelector('.cursor__dot');
  const ring = el.querySelector('.cursor__ring');
  const label = el.querySelector('.cursor__label');
  const cv = document.getElementById('trail');
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const size = () => ({ w: W, h: H, dpr } = fit(cv, 2));
  size(); addEventListener('resize', size);

  // hover state
  let hoverEl = null;
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, input, [data-cursor]');
    if (t === hoverEl) return;
    hoverEl = t;
    el.classList.toggle('is-hover', !!t);
    label.textContent = t ? (t.dataset.cursor || '') : '';
    if (t && (t.matches('a, button'))) sound.tick(0.8);
  });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => (el.style.opacity = '0'));
  document.addEventListener('mouseenter', () => (el.style.opacity = '1'));

  // routed trail
  const verts = []; // { x, y, t }
  let rx = pointer.x, ry = pointer.y;

  onFrame((dt, t) => {
    rx += (pointer.x - rx) * damp(18, dt);
    ry += (pointer.y - ry) * damp(18, dt);
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    label.style.transform = `translate3d(${rx + 22}px, ${ry + 18}px, 0)`;

    if (reduced) return;
    while (verts.length && t - verts[0].t > LIFE) verts.shift();
    if (!verts.length) verts.push({ x: pointer.x, y: pointer.y, t });

    const h = verts[verts.length - 1];
    const dx = pointer.x - h.x, dy = pointer.y - h.y;
    if (Math.hypot(dx, dy) > COMMIT) {
      const d = Math.min(Math.abs(dx), Math.abs(dy));
      const cx = h.x + Math.sign(dx) * d, cy = h.y + Math.sign(dy) * d;
      if (Math.hypot(cx - h.x, cy - h.y) > 2) verts.push({ x: cx, y: cy, t });
      verts.push({ x: pointer.x, y: pointer.y, t });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (verts.length < 2 && pointer.speed < 20) return;

    // live leg from last committed vertex to the pointer, routed diagonal-then-straight
    const last = verts[verts.length - 1];
    const ldx = pointer.x - last.x, ldy = pointer.y - last.y;
    const ld = Math.min(Math.abs(ldx), Math.abs(ldy));
    const pts = [...verts, { x: last.x + Math.sign(ldx) * ld, y: last.y + Math.sign(ldy) * ld, t }, { x: pointer.x, y: pointer.y, t }];

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const a = Math.max(0, 1 - (t - pts[i - 1].t) / LIFE);
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(166,198,76,${a * 0.18})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      ctx.strokeStyle = `rgba(166,198,76,${a * 0.85})`; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (let i = 1; i < verts.length; i++) {
      const a = Math.max(0, 1 - (t - verts[i].t) / LIFE);
      ctx.strokeStyle = `rgba(244,246,241,${a * 0.7})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(verts[i].x, verts[i].y, 3, 0, Math.PI * 2); ctx.stroke();
    }
  });
}

function initMagnets() {
  const items = [...document.querySelectorAll('[data-magnetic]')].map((el) => ({ el, x: 0, y: 0 }));
  if (!items.length || !pointer.fine) return;
  onFrame((dt) => {
    for (const m of items) {
      const r = m.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) continue;
      const cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
      const dx = pointer.x - cx, dy = pointer.y - cy;
      const near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 70;
      const tx = near ? dx * 0.35 : 0, ty = near ? dy * 0.45 : 0;
      m.x += (tx - m.x) * damp(10, dt); m.y += (ty - m.y) * damp(10, dt);
      m.el.style.transform = `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0)`;
    }
  });
}
