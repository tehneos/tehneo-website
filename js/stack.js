// Stack: the brand mark as an exploded 3D board. Scroll tilts the tile, splits it into
// five layers of the real system (PV → inverter bus → controller → price signal → portal),
// then folds it back into the logo, face-on.

import { TRACES, NODES, STROKE, polyLength, pointAt } from './logo.js';
import { pointer, onFrame } from './ticker.js';
import { t as tr } from './i18n.js';
import { fit, camera, clamp, smooth, damp, rng, inView, onResize, sectionProgress } from './util.js';

const LAYERS = tr('layers').map(([name, sub], i) => ({ id: `L${i}`, name, sub }));

function roundedSquare(half, r, seg = 6) {
  const pts = [];
  const corners = [[half - r, -half + r, -Math.PI / 2], [half - r, half - r, 0], [-half + r, half - r, Math.PI / 2], [-half + r, -half + r, Math.PI]];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}

export function initStack(section) {
  const canvas = section.querySelector('#stack-canvas');
  const ctx = canvas.getContext('2d');
  const readout = section.querySelector('#stack-layer');
  let W, H, dpr, visible = false;
  let mrx = 0, mry = 0, focus = -1;
  const o = [0, 0, 0], o2 = [0, 0, 0], pa = [0, 0];

  const tile = roundedSquare(256, 104);
  const lens = TRACES.map((t) => polyLength(t.pts));
  const C = (x, y) => [x - 256, y - 256];

  // L1: an orthogonal bus routed on a 32-unit grid
  const rand = rng(3);
  const bus = [];
  for (let i = 0; i < 16; i++) {
    let x = -224 + ((rand() * 15) | 0) * 32, y = -224 + ((rand() * 15) | 0) * 32;
    const pts = [[x, y]];
    let horiz = rand() < 0.5;
    for (let k = 0; k < 3; k++) {
      const d = (((rand() * 6) | 0) + 2) * 32 * (rand() < 0.5 ? -1 : 1);
      if (horiz) x = clamp(x + d, -224, 224); else y = clamp(y + d, -224, 224);
      pts.push([x, y]); horiz = !horiz;
    }
    bus.push({ pts, len: polyLength(pts) });
  }

  function size() { ({ w: W, h: H, dpr } = fit(canvas, 2)); }

  onFrame((dt, t) => {
    if (!visible) return;
    const p = sectionProgress(section);
    const mobile = W < 760;
    const tilt = smooth(0, 0.22, p) * (1 - smooth(0.8, 0.97, p));
    const ex = smooth(0.12, 0.4, p) * (1 - smooth(0.72, 0.9, p));
    mrx += (pointer.ny * 0.14 - mrx) * damp(3, dt);
    mry += (pointer.nx * 0.3 - mry) * damp(3, dt);

    // phones: reserve a column on the right for the layer names and fit the stack beside it
    ctx.font = `500 ${mobile ? 9 : 10}px "JetBrains Mono", monospace`;
    const labelW = mobile ? 26 + Math.max(...LAYERS.map((L) => ctx.measureText(L.name.toUpperCase()).width)) : 0;
    const labelX = mobile ? W - 14 - labelW : 0;
    const room = labelX - 30;
    const size = mobile ? Math.min(room / 1.3, H * 0.32) : Math.min(W * 0.34, H * 0.46);
    const S = size / 512;
    const cx = mobile ? 10 + room / 2 : W * 0.56, cy = H * (mobile ? 0.58 : 0.56);
    const proj = camera(tilt * 1.02 + mrx * tilt, mry * (0.3 + tilt), -tilt * 0.62 + (p - 0.5) * 0.3 * tilt, 1400, cx, cy);
    const gap = ex * size * (mobile ? 0.3 : 0.24);
    const zOf = (i) => (i - 2) * gap;
    const contentA = 0.08 + 0.92 * ex;

    // which layer is in focus while exploded
    const f = ex > 0.9 ? Math.min(4, Math.floor(smooth(0.4, 0.7, p) * 5)) : -1;
    if (f !== focus) {
      focus = f;
      readout.textContent = `${tr('layer')} ${f < 0 ? '—' : String(f).padStart(2, '0')} / 04${f < 0 ? '' : ` — ${LAYERS[f].name}`}`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const path = (pts, z, close) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        proj(pts[i][0] * S, pts[i][1] * S, z, o);
        i ? ctx.lineTo(o[0], o[1]) : ctx.moveTo(o[0], o[1]);
      }
      if (close) ctx.closePath();
    };
    const disc = (x, y, r, z) => {
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        proj((x + Math.cos(a) * r) * S, (y + Math.sin(a) * r) * S, z, o);
        i ? ctx.lineTo(o[0], o[1]) : ctx.moveTo(o[0], o[1]);
      }
    };
    const logoTrace = (tr, z) => path(tr.pts.map(([x, y]) => C(x, y)), z);
    const dim = (i) => (focus < 0 || focus === i ? 1 : 0.35);

    // floor shadow
    const sh = proj(0, 0, zOf(0) - size * 0.08, o2);
    const sg = ctx.createRadialGradient(sh[0], sh[1] + size * 0.1, 0, sh[0], sh[1] + size * 0.1, size * 0.9);
    sg.addColorStop(0, `rgba(166,198,76,${0.08 * tilt})`); sg.addColorStop(1, 'rgba(166,198,76,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

    ctx.lineJoin = 'miter';

    // L0 · PV array (the tile itself)
    {
      const z = zOf(0), a = dim(0);
      for (let k = 6; k >= 1; k--) {
        path(tile, z - k * 2.2 * (0.3 + tilt), true);
        ctx.fillStyle = `rgba(14,16,18,${a})`; ctx.fill();
      }
      path(tile, z, true);
      ctx.fillStyle = '#1d2023'; ctx.globalAlpha = a; ctx.fill();
      ctx.strokeStyle = `rgba(244,246,241,${0.06 + 0.14 * ex})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(244,246,241,${0.07 * ex * a})`;
      for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
        const x = -204 + c * 70, y = -204 + r * 70;
        path([[x, y], [x + 62, y], [x + 62, y + 62], [x, y + 62]], z, true); ctx.stroke();
      }
    }

    // L1 · inverter bus
    {
      const z = zOf(1), a = dim(1) * contentA;
      if (ex > 0.02) { path(tile, z, true); ctx.strokeStyle = `rgba(244,246,241,${0.12 * ex})`; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.lineWidth = Math.max(1, 3 * S * 2); ctx.strokeStyle = `rgba(166,198,76,${0.4 * a})`;
      for (const b of bus) { path(b.pts, z); ctx.stroke(); }
      ctx.fillStyle = `rgba(201,228,110,${0.9 * a})`;
      bus.forEach((b, i) => {
        pointAt(b.pts, (t * 60 + i * 47) % b.len, pa);
        proj(pa[0] * S, pa[1] * S, z, o);
        ctx.beginPath(); ctx.arc(o[0], o[1], 2, 0, Math.PI * 2); ctx.fill();
      });
    }

    // L2 · controller (white mark)
    {
      const z = zOf(2), a = dim(2);
      if (ex > 0.02) { path(tile, z, true); ctx.strokeStyle = `rgba(244,246,241,${0.12 * ex})`; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle = `rgba(244,246,241,${a})`;
      TRACES.forEach((tr) => { if (tr.c !== 'w') return; logoTrace(tr, z); proj(0, 0, z, o); ctx.lineWidth = STROKE * S * o[2]; ctx.stroke(); });
      ctx.fillStyle = `rgba(244,246,241,${a})`;
      NODES.forEach((n) => { if (n.c !== 'w') return; const [x, y] = C(n.x, n.y); disc(x, y, n.r, z); ctx.fill(); });
    }

    // L3 · price signal (green mark)
    {
      const z = zOf(3), a = dim(3);
      if (ex > 0.02) { path(tile, z, true); ctx.strokeStyle = `rgba(166,198,76,${0.2 * ex})`; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalCompositeOperation = 'lighter';
      TRACES.forEach((tr) => { if (tr.c !== 'g') return; logoTrace(tr, z); proj(0, 0, z, o); ctx.lineWidth = STROKE * S * o[2] * 2.6; ctx.strokeStyle = `rgba(166,198,76,${0.18 * a})`; ctx.stroke(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(166,198,76,${a})`;
      TRACES.forEach((tr) => { if (tr.c !== 'g') return; logoTrace(tr, z); proj(0, 0, z, o); ctx.lineWidth = STROKE * S * o[2]; ctx.stroke(); });
      ctx.fillStyle = `rgba(166,198,76,${a})`;
      NODES.forEach((n) => { if (n.c !== 'g') return; const [x, y] = C(n.x, n.y); disc(x, y, n.r, z); ctx.fill(); });
    }

    // L4 · portal glass
    if (ex > 0.02) {
      const z = zOf(4), a = dim(4) * ex;
      path(tile, z, true);
      ctx.fillStyle = `rgba(244,246,241,${0.035 * a})`; ctx.fill();
      ctx.strokeStyle = `rgba(244,246,241,${0.4 * a})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = `rgba(244,246,241,${0.5 * a})`;
      for (let i = 0; i < 12; i++) {
        const h = 30 + 110 * Math.abs(Math.sin(i * 1.3 + 0.4));
        const x = -170 + i * 30;
        path([[x, 170], [x, 170 - h]], z); ctx.lineWidth = 6 * S * 2; ctx.stroke();
      }
      ctx.lineWidth = 1;
      path([[-180, -170], [-40, -170]], z); ctx.stroke();
      path([[-180, -140], [-100, -140]], z); ctx.strokeStyle = `rgba(166,198,76,${0.8 * a})`; ctx.stroke();
    }

    // vias: current climbing through the stack
    if (ex > 0.05) {
      [NODES[0], NODES[5], NODES[7], NODES[8]].forEach((n, i) => {
        const [x, y] = C(n.x, n.y);
        proj(x * S, y * S, zOf(0), o); proj(x * S, y * S, zOf(4), o2);
        ctx.strokeStyle = `rgba(244,246,241,${0.16 * ex})`; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(o2[0], o2[1]); ctx.stroke(); ctx.setLineDash([]);
        const k = (t * 0.45 + i * 0.27) % 1;
        ctx.fillStyle = `rgba(201,228,110,${ex})`;
        ctx.beginPath(); ctx.arc(o[0] + (o2[0] - o[0]) * k, o[1] + (o2[1] - o[1]) * k, 2.4, 0, Math.PI * 2); ctx.fill();
      });
    }

    // leader-line labels (phones: name only, in the reserved column)
    if (ex > 0.05) {
      const colX = mobile ? labelX : Math.min(cx + size * 0.95, W - 230);
      ctx.font = `500 ${mobile ? 9 : 10}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'middle';
      LAYERS.forEach((L, i) => {
        let ax = -Infinity, ay = 0;
        for (const [x, y] of [[-256, -256], [256, -256], [256, 256], [-256, 256]]) {
          proj(x * S, y * S, zOf(i), o);
          if (o[0] > ax) { ax = o[0]; ay = o[1]; }
        }
        const on = focus === i;
        const a = ex * (focus < 0 ? 0.8 : on ? 1 : 0.35);
        ctx.strokeStyle = on ? `rgba(166,198,76,${a})` : `rgba(244,246,241,${a * 0.4})`;
        ctx.lineWidth = 1;
        const lx = colX;
        if (lx - 8 > ax + 6) { ctx.beginPath(); ctx.moveTo(ax + 6, ay); ctx.lineTo(lx - 8, ay); ctx.stroke(); }
        ctx.fillStyle = on ? '#a6c64c' : `rgba(244,246,241,${a})`;
        ctx.beginPath(); ctx.arc(ax + 6, ay, 2, 0, Math.PI * 2); ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = on ? `rgba(166,198,76,${a})` : `rgba(166,198,76,${a * 0.7})`;
        ctx.fillText(L.id, lx, ay - (mobile ? 0 : 7));
        ctx.fillStyle = `rgba(244,246,241,${a})`;
        ctx.fillText(L.name.toUpperCase(), lx + 26, ay - (mobile ? 0 : 7));
        if (!mobile) { ctx.fillStyle = `rgba(125,133,138,${a})`; ctx.fillText(L.sub.toUpperCase(), lx, ay + 9); }
      });
    }
  });

  size();
  onResize(canvas, size);
  inView(section, (v) => (visible = v));
}
