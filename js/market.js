// Market: a draggable day-ahead price curve over a solar production curve.
// Wherever the price goes negative, export is clipped at the zero line and the avoided loss is tallied.

import { onFrame } from './ticker.js';
import { sound } from './audio.js';
import { fit, clamp, damp, inView, onResize } from './util.js';

const N = 96;                 // quarter-hours in a day
const KW = 50;                // plant size
const PMIN = -220, PMAX = 260; // €/MWh axis
const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
const prod = (i) => { const x = (i / 4 - 6.2) / 13.6; return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 1.6; };
const hhmm = (i) => { const m = Math.round(i * 15) % 1440; return `${String((m / 60) | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

export function initMarket(section) {
  const canvas = section.querySelector('#market-canvas');
  const ctx = canvas.getContext('2d');
  const depthIn = section.querySelector('#m-depth');
  const outSaved = section.querySelector('#m-saved');
  const outTime = section.querySelector('#m-time');
  const outState = section.querySelector('#m-state');

  const off = new Float32Array(N);
  const price = new Float32Array(N);
  let depth = depthIn.value / 100;
  let W, H, dpr, visible = false;
  let drag = null, hoverI = -1, play = 0, shown = 0, lastNeg = false;
  const flow = [];
  let hatch;

  const pad = { l: 58, r: 22, t: 34, b: 42 };
  const cw = () => W - pad.l - pad.r, ch = () => H - pad.t - pad.b;
  const X = (i) => pad.l + (i / (N - 1)) * cw();
  const Yp = (p) => pad.t + ((PMAX - p) / (PMAX - PMIN)) * ch();
  const Ye = (v) => pad.t + ch() - v * ch() * 0.8;
  const I = (x) => clamp(((x - pad.l) / cw()) * (N - 1), 0, N - 1);

  function size() {
    ({ w: W, h: H, dpr } = fit(canvas, 2));
    pad.l = W < 600 ? 40 : 58;
    const p = document.createElement('canvas');
    p.width = p.height = 8 * dpr;
    const pc = p.getContext('2d');
    pc.scale(dpr, dpr);
    pc.strokeStyle = 'rgba(166,198,76,.55)'; pc.lineWidth = 1;
    pc.beginPath(); pc.moveTo(0, 8); pc.lineTo(8, 0); pc.moveTo(-2, 2); pc.lineTo(2, -2); pc.moveTo(6, 10); pc.lineTo(10, 6); pc.stroke();
    hatch = ctx.createPattern(p, 'repeat');
    hatch.setTransform(new DOMMatrix().scale(1 / dpr));
  }

  depthIn.addEventListener('input', () => { depth = depthIn.value / 100; sound.tick(0.6); });
  section.querySelector('#m-reset').addEventListener('click', () => { off.fill(0); depthIn.value = 55; depth = 0.55; sound.whoosh(); });

  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // touch uses the slider; the canvas scrolls
    const [x, y] = local(e);
    canvas.setPointerCapture(e.pointerId);
    drag = { i: I(x), y, base: Float32Array.from(off) };
    sound.toneStart();
  });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    hoverI = x > pad.l && x < W - pad.r ? I(x) : -1;
    if (!drag) return;
    const dp = (-(y - drag.y) / ch()) * (PMAX - PMIN);
    for (let j = 0; j < N; j++) off[j] = drag.base[j] + dp * gauss(j, drag.i, 7);
    sound.toneSet(clamp(240 + price[Math.round(drag.i)] * 1.4, 70, 900));
  });
  const end = () => { if (drag) { drag = null; sound.toneStop(); } };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { hoverI = -1; });

  onFrame((dt, t) => {
    if (!visible) return;
    // model
    let saved = 0, negCount = 0, first = -1, last = -1;
    for (let i = 0; i < N; i++) {
      const h = i / 4;
      const base = 92 + 46 * gauss(h, 8, 1.5) + 78 * gauss(h, 19.6, 1.7) - 26 * gauss(h, 3.5, 2)
        - depth * 250 * gauss(h, 13.1, 2.5) + Math.sin(h * 1.7 + t * 0.7) * 4 + Math.sin(h * 0.6 - t * 0.45) * 5;
      price[i] = clamp(base + off[i], PMIN + 8, PMAX - 8);
      if (price[i] < 0 && prod(i) > 0) {
        saved += (KW * prod(i) * -price[i] * 0.25) / 1000;
        negCount++; if (first < 0) first = i; last = i;
      }
    }
    shown += (saved - shown) * damp(6, dt);
    outSaved.textContent = `€${shown.toFixed(2)}`;
    outTime.textContent = `${(negCount * 15 / 60) | 0}h ${String((negCount * 15) % 60).padStart(2, '0')}m`;
    outState.textContent = negCount ? `Limit 0% ${hhmm(first)}–${hhmm(last + 1)}` : 'Export 100%';

    // playhead
    play = (play + dt * 4) % N;
    const head = hoverI >= 0 ? hoverI : play;
    const hi = Math.round(head) % N;
    const neg = price[hi] < 0 && prod(hi) > 0;
    if (neg !== lastNeg) { lastNeg = neg; if (neg) sound.blip(2, 0.5); }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    // grid
    for (let p = -200; p <= 200; p += 100) {
      const y = Yp(p);
      ctx.strokeStyle = p === 0 ? 'rgba(244,246,241,.22)' : 'rgba(244,246,241,.06)';
      ctx.setLineDash(p === 0 ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = p === 0 ? 'rgba(244,246,241,.7)' : 'rgba(244,246,241,.3)';
      ctx.textAlign = 'right'; ctx.fillText(String(p), pad.l - 10, y);
    }
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    for (let h = 0; h <= 24; h += 3) {
      const x = pad.l + (h / 24) * cw();
      ctx.fillStyle = 'rgba(244,246,241,.3)';
      ctx.fillText(String(h).padStart(2, '0'), x, H - pad.b + 20);
      ctx.strokeStyle = 'rgba(244,246,241,.04)';
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(244,246,241,.4)';
    ctx.fillText('€/MWh', 12, pad.t - 16);
    ctx.fillStyle = 'rgba(244,246,241,.4)';
    ctx.fillText('→ GRID', W - pad.r - 52, H - pad.b + 20);

    // production
    const bottom = pad.t + ch();
    ctx.beginPath(); ctx.moveTo(X(0), bottom);
    for (let i = 0; i < N; i++) ctx.lineTo(X(i), Ye(prod(i)));
    ctx.lineTo(X(N - 1), bottom); ctx.closePath();
    const pg = ctx.createLinearGradient(0, Ye(1), 0, bottom);
    pg.addColorStop(0, 'rgba(244,246,241,.12)'); pg.addColorStop(1, 'rgba(244,246,241,.01)');
    ctx.fillStyle = pg; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < N; i++) (i ? ctx.lineTo(X(i), Ye(prod(i))) : ctx.moveTo(X(i), Ye(prod(i))));
    ctx.strokeStyle = 'rgba(244,246,241,.55)'; ctx.lineWidth = 1.2; ctx.stroke();

    // curtailed columns
    ctx.fillStyle = hatch;
    for (let i = 0; i < N - 1; i++) {
      if (!(price[i] < 0 && prod(i) > 0)) continue;
      ctx.beginPath();
      ctx.moveTo(X(i), bottom); ctx.lineTo(X(i), Ye(prod(i))); ctx.lineTo(X(i + 1), Ye(prod(i + 1))); ctx.lineTo(X(i + 1), bottom);
      ctx.closePath(); ctx.fill();
    }

    // negative price fill
    const zy = Yp(0);
    ctx.beginPath(); ctx.moveTo(X(0), zy);
    for (let i = 0; i < N; i++) ctx.lineTo(X(i), Math.max(zy, Yp(price[i])));
    ctx.lineTo(X(N - 1), zy); ctx.closePath();
    ctx.fillStyle = 'rgba(166,198,76,.14)'; ctx.fill();

    // limit gate on the zero line
    if (negCount) {
      ctx.strokeStyle = '#a6c64c'; ctx.lineWidth = 3;
      ctx.shadowColor = '#a6c64c'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(X(first), zy); ctx.lineTo(X(last + 1), zy); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a6c64c'; ctx.textAlign = 'center';
      ctx.fillText('LIMIT 0%', (X(first) + X(last + 1)) / 2, zy - 14);
      ctx.textAlign = 'left';
    }

    // export flow: particles fall from the production curve to the grid; the gate stops them
    const spawn = W < 600 ? 1 : 2;
    for (let k = 0; k < spawn; k++) {
      const i = Math.random() * (N - 1);
      const v = prod(Math.round(i));
      if (v > 0.05 && Math.random() < v) flow.push({ i, y: Ye(v) + 2, vy: 30 + Math.random() * 40, life: 1, stop: false });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let k = flow.length - 1; k >= 0; k--) {
      const f = flow[k], ii = Math.round(f.i), x = X(f.i);
      const blocked = price[ii] < 0 && f.y < zy;
      if (!f.stop) {
        f.vy += 120 * dt; f.y += f.vy * dt;
        if (blocked && f.y >= zy - 2) { f.stop = true; f.y = zy - 2; }
      } else f.life -= dt * 2.2;
      if (f.y > bottom || f.life <= 0) { flow.splice(k, 1); continue; }
      ctx.fillStyle = f.stop ? `rgba(201,228,110,${f.life})` : 'rgba(244,246,241,.55)';
      ctx.fillRect(x - 0.8, f.y - (f.stop ? 0.8 : 3), 1.6, f.stop ? 1.6 : 6);
    }
    ctx.globalCompositeOperation = 'source-over';

    // price line
    ctx.beginPath();
    for (let i = 0; i < N; i++) (i ? ctx.lineTo(X(i), Yp(price[i])) : ctx.moveTo(X(i), Yp(price[i])));
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(166,198,76,.18)'; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#a6c64c'; ctx.lineWidth = 2; ctx.stroke();
    if (drag) {
      const di = Math.round(drag.i);
      ctx.fillStyle = '#f4f6f1';
      ctx.beginPath(); ctx.arc(X(di), Yp(price[di]), 6, 0, Math.PI * 2); ctx.fill();
    }

    // playhead + readout
    const hx = X(head);
    ctx.strokeStyle = 'rgba(244,246,241,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx, pad.t); ctx.lineTo(hx, bottom); ctx.stroke();
    ctx.fillStyle = '#a6c64c';
    ctx.beginPath(); ctx.arc(hx, Yp(price[hi]), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f6f1';
    ctx.beginPath(); ctx.arc(hx, Ye(prod(hi)), 3, 0, Math.PI * 2); ctx.fill();

    const lines = [hhmm(hi), `${price[hi].toFixed(0)} €/MWh`, `${(KW * prod(hi)).toFixed(1)} kW`, neg ? 'LIMIT 0%' : 'EXPORT'];
    const bw = 118, bh = 74;
    let bx = hx + 12; if (bx + bw > W - pad.r) bx = hx - 12 - bw;
    const by = pad.t + 6;
    ctx.fillStyle = 'rgba(11,13,15,.85)'; ctx.strokeStyle = neg ? 'rgba(166,198,76,.6)' : 'rgba(244,246,241,.18)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
    lines.forEach((s, i) => {
      ctx.fillStyle = i === 3 ? (neg ? '#a6c64c' : '#f4f6f1') : i === 0 ? 'rgba(244,246,241,.5)' : '#f4f6f1';
      ctx.fillText(s, bx + 12, by + 14 + i * 16);
    });
  });

  size();
  onResize(canvas, size);
  inView(section, (v) => (visible = v), '100px');
}
