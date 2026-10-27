// Hero: a procedurally auto-routed circuit board that is a real graph.
// Packets wander along it, the probe lights nearby copper, and a click injects a signal
// whose wavefront propagates through the traces (Dijkstra over the routing graph).
// In the middle, the brand mark floats as an extruded 3D object that tracks the pointer.

import { TRACES, NODES, STROKE, GREEN, WHITE, polyLength, pointAt } from './logo.js';
import { pointer, onFrame } from './ticker.js';
import { fit, rng, camera, clamp, damp, inView, onResize, reduced } from './util.js';

const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const M = 40;          // overscan around the viewport for parallax
const SPEED = 760;     // signal wavefront, px/s
const TAIL = 150;

export function initBoard(canvas) {
  const ctx = canvas.getContext('2d');
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');
  const logoLens = TRACES.map((t) => polyLength(t.pts));

  let W = 0, H = 0, dpr = 1, BW = 0, BH = 0;
  let verts = [], segs = [], adj = [];
  let packets = [], waves = [], flashes = [], ripples = [];
  const logo = { cx: 0, cy: 0, size: 0, s: 1 };
  let visible = true, started = false, t0 = 0, ambientAt = 0;
  let rx = 0, ry = 0, parX = 0, parY = 0, charge = 0, hover = 0;
  const tmp = [0, 0, 0], tmp2 = [0, 0, 0], pa = [0, 0];

  // ------------------------------------------------------------------ build
  function build() {
    ({ w: W, h: H, dpr } = fit(canvas, 2));
    const mobile = W < 720;
    const G = mobile ? 18 : 22;
    BW = W + M * 2; BH = H + M * 2;
    const cols = Math.floor(BW / G) + 1, rows = Math.floor(BH / G) + 1;
    const ox = (BW - (cols - 1) * G) / 2, oy = (BH - (rows - 1) * G) / 2;
    const occ = new Uint8Array(cols * rows);
    const rand = rng(1907);

    logo.size = mobile ? Math.min(W * 0.72, H * 0.42) : Math.min(W * 0.36, H * 0.52, 560);
    logo.s = logo.size / 512;
    logo.cx = W / 2;
    logo.cy = mobile ? H * 0.36 : H * 0.42;

    // keep the area behind the mark clear
    const half = logo.size * 0.6;
    const k0x = Math.floor((logo.cx + M - half - ox) / G), k1x = Math.ceil((logo.cx + M + half - ox) / G);
    const k0y = Math.floor((logo.cy + M - half - oy) / G), k1y = Math.ceil((logo.cy + M + half - oy) / G);
    for (let gy = Math.max(0, k0y); gy <= Math.min(rows - 1, k1y); gy++)
      for (let gx = Math.max(0, k0x); gx <= Math.min(cols - 1, k1x); gx++) occ[gy * cols + gx] = 1;

    const inB = (x, y) => x >= 1 && y >= 1 && x < cols - 1 && y < rows - 1;
    const free = (x, y, dx, dy) => {
      if (!inB(x + dx, y + dy) || occ[(y + dy) * cols + x + dx]) return false;
      // never cross another diagonal between cells
      if (dx && dy && occ[y * cols + x + dx] && occ[(y + dy) * cols + x]) return false;
      return true;
    };
    const lines = [];

    function walk(gx, gy, dir, maxSteps) {
      const pts = [[gx, gy]];
      occ[gy * cols + gx] = 1;
      let steps = 0, run = 2 + ((rand() * 6) | 0);
      while (steps < maxSteps) {
        let [dx, dy] = DIRS[dir];
        if (!free(gx, gy, dx, dy)) {
          const alt = (dir + (rand() < 0.5 ? 1 : 7)) % 8;
          [dx, dy] = DIRS[alt];
          if (!free(gx, gy, dx, dy)) break;
          const lp = pts[pts.length - 1];
          if (lp[0] !== gx || lp[1] !== gy) pts.push([gx, gy]);
          dir = alt; run = 2 + ((rand() * 5) | 0);
        }
        gx += dx; gy += dy; occ[gy * cols + gx] = 1; steps++;
        if (--run <= 0) {
          pts.push([gx, gy]);
          run = 2 + ((rand() * 7) | 0);
          if (rand() < 0.6) dir = (dir + (rand() < 0.5 ? 1 : 7)) % 8;
        }
      }
      const lp = pts[pts.length - 1];
      if (lp[0] !== gx || lp[1] !== gy) pts.push([gx, gy]);
      if (steps >= 3) lines.push(pts);
    }

    // chips with pins that sprout traces
    const chips = [];
    for (let i = 0, tries = 0; i < (mobile ? 3 : 7) && tries < 200; tries++) {
      const cw = 3 + ((rand() * 5) | 0), ch = 2 + ((rand() * 3) | 0);
      const x0 = 2 + ((rand() * (cols - cw - 4)) | 0), y0 = 3 + ((rand() * (rows - ch - 6)) | 0);
      let ok = true;
      for (let y = y0 - 2; y <= y0 + ch + 2 && ok; y++)
        for (let x = x0 - 1; x <= x0 + cw + 1; x++) if (occ[y * cols + x]) { ok = false; break; }
      if (!ok) continue;
      for (let y = y0 - 1; y <= y0 + ch + 1; y++) for (let x = x0; x <= x0 + cw; x++) occ[y * cols + x] = 1;
      chips.push({ x: ox + x0 * G - G * 0.3, y: oy + y0 * G, w: cw * G + G * 0.6, h: ch * G, cw, x0, y0, ch });
      i++;
    }
    for (const c of chips) {
      for (let x = c.x0; x <= c.x0 + c.cw; x++) {
        occ[(c.y0 - 1) * cols + x] = 0; occ[(c.y0 + c.ch + 1) * cols + x] = 0;
      }
      for (let x = c.x0; x <= c.x0 + c.cw; x++) {
        if (rand() < 0.7) walk(x, c.y0 - 1, 6, 8 + ((rand() * 30) | 0));
        if (rand() < 0.7) walk(x, c.y0 + c.ch + 1, 2, 8 + ((rand() * 30) | 0));
      }
    }

    // buses leaving the mark
    const edges = [
      [k0x - 1, null, 4], [k1x + 1, null, 0], [null, k0y - 1, 6], [null, k1y + 1, 2],
    ];
    for (const [ex, ey, dir] of edges) {
      const span = ex !== null ? [k0y + 2, k1y - 2] : [k0x + 2, k1x - 2];
      for (let p = span[0]; p <= span[1]; p += 2) {
        if (rand() < 0.35) continue;
        const gx = ex !== null ? ex : p, gy = ey !== null ? ey : p;
        if (inB(gx, gy) && !occ[gy * cols + gx]) walk(gx, gy, dir, 10 + ((rand() * 40) | 0));
      }
    }

    // fill the rest, half of it branching off existing corners so the graph stays connected
    const cap = Math.round((cols * rows) / (mobile ? 9 : 7.5));
    for (let i = 0; i < cap; i++) {
      if (lines.length && rand() < 0.5) {
        const l = lines[(rand() * lines.length) | 0];
        const [gx, gy] = l[(rand() * l.length) | 0];
        walk(gx, gy, (rand() * 8) | 0, 4 + ((rand() * 30) | 0));
      } else {
        const gx = 1 + ((rand() * (cols - 2)) | 0), gy = 1 + ((rand() * (rows - 2)) | 0);
        if (!occ[gy * cols + gx]) walk(gx, gy, ((rand() * 4) | 0) * 2, 4 + ((rand() * 34) | 0));
      }
    }

    // graph
    verts = []; segs = []; adj = [];
    const vmap = new Map();
    const vid = (gx, gy) => {
      const key = gy * cols + gx;
      let id = vmap.get(key);
      if (id === undefined) {
        id = verts.length; vmap.set(key, id);
        verts.push({ x: ox + gx * G, y: oy + gy * G, deg: 0, cap: 0 });
        adj.push([]);
      }
      return id;
    };
    for (const pts of lines) {
      for (let i = 1; i < pts.length; i++) {
        const a = vid(pts[i - 1][0], pts[i - 1][1]), b = vid(pts[i][0], pts[i][1]);
        if (a === b) continue;
        const A = verts[a], B = verts[b];
        const len = Math.hypot(B.x - A.x, B.y - A.y);
        const si = segs.length;
        segs.push({ a, b, len, mx: (A.x + B.x) / 2, my: (A.y + B.y) / 2, w: rand() < 0.08 ? 2.6 : 1.3 });
        adj[a].push({ to: b, seg: si }); adj[b].push({ to: a, seg: si });
        A.deg++; B.deg++;
      }
    }
    for (const v of verts) if (v.deg === 1) v.cap = rand() < 0.55 ? 1 : 2;

    // static layer
    layer.width = Math.round(BW * dpr); layer.height = Math.round(BH * dpr);
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = lctx.createRadialGradient(logo.cx + M, logo.cy + M, 0, logo.cx + M, logo.cy + M, Math.max(BW, BH) * 0.75);
    bg.addColorStop(0, '#171b1e'); bg.addColorStop(0.55, '#0e1113'); bg.addColorStop(1, '#0a0c0e');
    lctx.fillStyle = bg; lctx.fillRect(0, 0, BW, BH);

    lctx.fillStyle = 'rgba(244,246,241,.05)';
    for (let gy = 0; gy < rows; gy += 2) for (let gx = 0; gx < cols; gx += 2) lctx.fillRect(ox + gx * G - 0.5, oy + gy * G - 0.5, 1, 1);

    lctx.lineCap = 'round'; lctx.lineJoin = 'round';
    for (const s of segs) {
      const A = verts[s.a], B = verts[s.b];
      lctx.strokeStyle = s.w > 2 ? 'rgba(244,246,241,.06)' : 'rgba(244,246,241,.095)';
      lctx.lineWidth = s.w;
      lctx.beginPath(); lctx.moveTo(A.x, A.y); lctx.lineTo(B.x, B.y); lctx.stroke();
    }
    for (const v of verts) {
      if (v.cap === 1) { lctx.fillStyle = 'rgba(244,246,241,.16)'; lctx.beginPath(); lctx.arc(v.x, v.y, 2.4, 0, Math.PI * 2); lctx.fill(); }
      else if (v.cap === 2) { lctx.strokeStyle = 'rgba(244,246,241,.16)'; lctx.lineWidth = 1; lctx.beginPath(); lctx.arc(v.x, v.y, 3.6, 0, Math.PI * 2); lctx.stroke(); }
    }
    lctx.font = '500 8px "JetBrains Mono", monospace';
    chips.forEach((c, i) => {
      lctx.fillStyle = '#121518'; lctx.strokeStyle = 'rgba(244,246,241,.14)'; lctx.lineWidth = 1;
      lctx.beginPath(); lctx.roundRect(c.x, c.y, c.w, c.h, 3); lctx.fill(); lctx.stroke();
      lctx.fillStyle = 'rgba(244,246,241,.22)';
      for (let x = 0; x <= c.cw; x++) {
        lctx.fillRect(ox + (c.x0 + x) * G - 2, c.y - G + 4, 4, G - 6);
        lctx.fillRect(ox + (c.x0 + x) * G - 2, c.y + c.h + 2, 4, G - 6);
      }
      lctx.fillStyle = 'rgba(244,246,241,.25)';
      lctx.fillText(`TN-${String(i + 1).padStart(2, '0')}`, c.x + 6, c.y + 12);
      lctx.beginPath(); lctx.arc(c.x + 7, c.y + c.h - 7, 2, 0, Math.PI * 2); lctx.fill();
    });

    // packets
    const n = clamp(Math.round((W * H) / 22000), 16, 80);
    packets = Array.from({ length: n }, () => spawn({}));
    waves = []; flashes = [];
  }

  // ------------------------------------------------------------------ packets
  function spawn(p) {
    if (!verts.length) return p;
    let v = 0;
    for (let i = 0; i < 20; i++) { v = (Math.random() * verts.length) | 0; if (adj[v].length) break; }
    p.u = v; p.prev = -1; p.s = 0; p.speed = 50 + Math.random() * 130; p.green = Math.random() < 0.55;
    next(p);
    return p;
  }
  function next(p) {
    const opts = adj[p.u].filter((e) => e.to !== p.prev);
    if (!opts.length) return false;
    const e = opts[(Math.random() * opts.length) | 0];
    p.seg = e.seg; p.v = e.to;
    return true;
  }

  // ------------------------------------------------------------------ waves
  function nearestVertex(x, y) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < verts.length; i++) {
      if (!adj[i].length) continue;
      const d = (verts[i].x - x) ** 2 + (verts[i].y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return [best, Math.sqrt(bd)];
  }
  function dijkstra(src, offset) {
    const dist = new Float32Array(verts.length).fill(Infinity);
    dist[src] = offset;
    const heap = [[offset, src]];
    const push = (item) => {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0], end = heap.pop();
      if (heap.length) {
        heap[0] = end;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
      }
      return top;
    };
    let max = 0;
    while (heap.length) {
      const [d, u] = pop();
      if (d > dist[u]) continue;
      if (d > max) max = d;
      for (const { to, seg } of adj[u]) {
        const nd = d + segs[seg].len;
        if (nd < dist[to]) { dist[to] = nd; push([nd, to]); }
      }
    }
    return { dist, max };
  }
  function inject(bx, by, strength = 1) {
    if (!verts.length) return;
    const [v, off] = nearestVertex(bx, by);
    const { dist, max } = dijkstra(v, off);
    waves.push({ dist, max, t0: performance.now() / 1000, prevR: 0, strength });
    if (waves.length > 5) waves.shift();
    ripples.push({ x: bx, y: by, t0: performance.now() / 1000 });
  }

  // ------------------------------------------------------------------ input
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const onLogo = Math.hypot(sx - logo.cx, sy - logo.cy) < logo.size * 0.5;
    inject(sx + M - parX, sy + M - parY, onLogo ? 1.4 : 1);
    if (onLogo) charge = 1;
  });

  // ------------------------------------------------------------------ draw: the mark
  function drawMark(dt, t) {
    const intro = started ? clamp((t - t0) / 1.9, 0, 1) : 0;
    const tx = -pointer.ny * 0.42 + Math.sin(t * 0.5) * 0.06;
    const ty = pointer.nx * 0.62 + Math.cos(t * 0.37) * 0.08;
    rx += (tx - rx) * damp(3, dt); ry += (ty - ry) * damp(3, dt);
    charge = Math.max(0, charge - dt * 0.9);

    const s = logo.s;
    const proj = camera(rx, ry, 0, 1200, logo.cx, logo.cy);
    const depth = logo.size * (0.1 + charge * 0.25 + hover * 0.04);
    const slices = 14;

    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    const trace = (pts, z, frac, len) => {
      let remain = frac * len;
      ctx.beginPath();
      proj((pts[0][0] - 256) * s, (pts[0][1] - 256) * s, z, tmp);
      ctx.moveTo(tmp[0], tmp[1]);
      for (let i = 1; i < pts.length && remain > 0; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const l = Math.hypot(x1 - x0, y1 - y0), f = Math.min(1, remain / l);
        proj((x0 + (x1 - x0) * f - 256) * s, (y0 + (y1 - y0) * f - 256) * s, z, tmp);
        ctx.lineTo(tmp[0], tmp[1]);
        remain -= l;
      }
    };
    const disc = (n, z, scale) => {
      proj((n.x - 256) * s, (n.y - 256) * s, z, tmp);
      ctx.beginPath(); ctx.arc(tmp[0], tmp[1], Math.max(0.1, n.r * s * tmp[2] * scale), 0, Math.PI * 2);
    };
    const nodeScale = (i) => {
      const p = clamp((intro - 0.35 - i * 0.04) / 0.3, 0, 1);
      return p === 0 ? 0 : 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2; // easeOutBack
    };

    // extrusion
    for (let k = slices; k >= 1; k--) {
      const z = (-k * depth) / slices, f = 1 - k / slices;
      const a = (0.03 + 0.09 * f) * (0.6 + charge);
      ctx.strokeStyle = `rgba(166,198,76,${a})`;
      TRACES.forEach((tr, i) => {
        trace(tr.pts, z, intro, logoLens[i]);
        ctx.lineWidth = STROKE * s * tmp[2];
        ctx.stroke();
      });
      ctx.fillStyle = `rgba(166,198,76,${a})`;
      NODES.forEach((n, i) => { const sc = nodeScale(i); if (sc) { disc(n, z, sc); ctx.fill(); } });
    }

    // halo
    ctx.globalCompositeOperation = 'lighter';
    TRACES.forEach((tr, i) => {
      trace(tr.pts, 0, intro, logoLens[i]);
      ctx.lineWidth = STROKE * s * tmp[2] * 2.6;
      ctx.strokeStyle = tr.c === 'g' ? `rgba(166,198,76,${0.12 + charge * 0.3})` : `rgba(244,246,241,${0.04 + charge * 0.12})`;
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';

    // face
    TRACES.forEach((tr, i) => {
      trace(tr.pts, 0, intro, logoLens[i]);
      ctx.lineWidth = STROKE * s * tmp[2];
      ctx.strokeStyle = tr.c === 'g' ? GREEN : WHITE;
      ctx.stroke();
    });
    NODES.forEach((n, i) => {
      const sc = nodeScale(i);
      if (!sc) return;
      disc(n, 0, sc);
      ctx.fillStyle = n.c === 'g' ? GREEN : WHITE;
      ctx.fill();
    });

    // current running along the mark
    if (intro >= 1) {
      ctx.globalCompositeOperation = 'lighter';
      TRACES.forEach((tr, i) => {
        const len = logoLens[i];
        for (let j = 0; j < 2; j++) {
          const d = ((t * (110 + i * 17) + j * len * 0.5 + i * 90) % len);
          pointAt(tr.pts, d, pa);
          proj((pa[0] - 256) * s, (pa[1] - 256) * s, 1, tmp);
          const r = STROKE * s * tmp[2] * 0.42;
          const g = ctx.createRadialGradient(tmp[0], tmp[1], 0, tmp[0], tmp[1], r * 5);
          const col = tr.c === 'g' ? '244,246,241' : '166,198,76';
          g.addColorStop(0, `rgba(${col},.95)`); g.addColorStop(0.25, `rgba(${col},.35)`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(tmp[0], tmp[1], r * 5, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // ------------------------------------------------------------------ frame
  onFrame((dt, t) => {
    if (!visible || !verts.length) return;
    const r = canvas.getBoundingClientRect();
    parX += (-pointer.nx * 16 - parX) * damp(4, dt);
    parY += (-pointer.ny * 16 - parY) * damp(4, dt);
    const ox = -M + parX, oy = -M + parY;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, ox, oy, BW, BH);

    const mx = pointer.x - r.left - ox, my = pointer.y - r.top - oy;
    const sxp = pointer.x - r.left, syp = pointer.y - r.top;
    const target = Math.hypot(sxp - logo.cx, syp - logo.cy) < logo.size * 0.5 ? 1 : 0;
    hover += (target - hover) * damp(6, dt);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // probe: light copper near the pointer
    if (pointer.moved) {
      const R = 190;
      for (const s of segs) {
        if (Math.abs(s.mx - mx) > R + s.len || Math.abs(s.my - my) > R + s.len) continue;
        const A = verts[s.a], B = verts[s.b];
        const ex = B.x - A.x, ey = B.y - A.y;
        const u = clamp(((mx - A.x) * ex + (my - A.y) * ey) / (s.len * s.len), 0, 1);
        const d = Math.hypot(A.x + ex * u - mx, A.y + ey * u - my);
        if (d >= R) continue;
        const a = (1 - d / R) ** 2;
        ctx.strokeStyle = `rgba(166,198,76,${a * 0.6})`;
        ctx.lineWidth = s.w + 0.4;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
    }

    // signal wavefronts
    for (let wi = waves.length - 1; wi >= 0; wi--) {
      const w = waves[wi];
      const R = (t - w.t0) * SPEED;
      if (R - TAIL > w.max) { waves.splice(wi, 1); continue; }
      const fade = clamp(1 - R / (w.max + TAIL), 0, 1) * 0.6 + 0.4;
      for (const s of segs) {
        const da = w.dist[s.a], db = w.dist[s.b];
        if (da === Infinity) continue;
        const fromA = da <= db, lo = fromA ? da : db;
        const s1 = R - lo;
        if (s1 <= 0 || s1 - TAIL >= s.len) continue;
        const A = verts[fromA ? s.a : s.b], B = verts[fromA ? s.b : s.a];
        const f0 = clamp((s1 - TAIL) / s.len, 0, 1), f1 = clamp(s1 / s.len, 0, 1);
        const x0 = A.x + (B.x - A.x) * f0, y0 = A.y + (B.y - A.y) * f0;
        const x1 = A.x + (B.x - A.x) * f1, y1 = A.y + (B.y - A.y) * f1;
        ctx.strokeStyle = `rgba(166,198,76,${0.22 * fade * w.strength})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = `rgba(201,228,110,${0.9 * fade})`; ctx.lineWidth = s.w + 0.6;
        ctx.stroke();
        if (s1 < s.len) {
          ctx.fillStyle = `rgba(244,246,241,${fade})`;
          ctx.beginPath(); ctx.arc(x1, y1, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      // pads light up as the front reaches them
      for (let i = 0; i < verts.length; i++) {
        const d = w.dist[i];
        if (verts[i].deg === 1 && d >= w.prevR && d < R) { flashes.push({ x: verts[i].x, y: verts[i].y, t0: t }); }
      }
      w.prevR = R;
    }

    // ambient packets
    for (const p of packets) {
      const seg = segs[p.seg];
      if (!seg) { spawn(p); continue; }
      let A = verts[p.u], B = verts[p.v];
      const near = clamp(1 - Math.hypot(A.x - mx, A.y - my) / 220, 0, 1);
      p.s += p.speed * dt * (1 + near * 2.5);
      while (p.s >= segs[p.seg].len) {
        p.s -= segs[p.seg].len;
        p.prev = p.u; p.u = p.v;
        if (!next(p)) { const v = verts[p.u]; if (flashes.length < 120) flashes.push({ x: v.x, y: v.y, t0: t, soft: true }); spawn(p); break; }
      }
      A = verts[p.u]; B = verts[p.v];
      const L = segs[p.seg].len, f = p.s / L, back = Math.max(0, p.s - 26) / L;
      const hx = A.x + (B.x - A.x) * f, hy = A.y + (B.y - A.y) * f;
      const col = p.green ? '166,198,76' : '244,246,241';
      ctx.strokeStyle = `rgba(${col},.45)`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(A.x + (B.x - A.x) * back, A.y + (B.y - A.y) * back); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = `rgba(${col},.18)`;
      ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${col},.95)`;
      ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, Math.PI * 2); ctx.fill();
    }

    // pad flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i], age = t - f.t0, life = f.soft ? 0.5 : 0.9;
      if (age > life) { flashes.splice(i, 1); continue; }
      const k = 1 - age / life;
      ctx.strokeStyle = `rgba(166,198,76,${k * (f.soft ? 0.4 : 0.9)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, 3 + (1 - k) * (f.soft ? 8 : 16), 0, Math.PI * 2); ctx.stroke();
    }

    // click ripples (the probe tip)
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i], age = t - rp.t0;
      if (age > 0.8) { ripples.splice(i, 1); continue; }
      const k = 1 - age / 0.8;
      ctx.strokeStyle = `rgba(244,246,241,${k * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, (1 - k * k) * 60, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    drawMark(dt, t);

    // ambient signal every few seconds
    if (started && !reduced && t > ambientAt) {
      ambientAt = t + 6 + Math.random() * 4;
      const v = verts[(Math.random() * verts.length) | 0];
      if (v) {
        const [vi] = nearestVertex(v.x, v.y);
        const { dist, max } = dijkstra(vi, 0);
        waves.push({ dist, max, t0: t, prevR: 1e9, strength: 0.5 });
      }
    }

    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(11,13,15,0)'); vg.addColorStop(1, 'rgba(11,13,15,.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  });

  build();
  onResize(canvas, build);
  inView(canvas, (v) => (visible = v));

  return {
    start() {
      started = true;
      t0 = performance.now() / 1000;
      ambientAt = t0 + 2.4;
      setTimeout(() => { inject(logo.cx + M, logo.cy + M, 1.2); charge = 0.8; }, 1500);
    },
  };
}
