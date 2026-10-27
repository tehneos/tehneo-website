// Patch bay: draggable modules and cables. The grid module reports what the wiring means:
// PV → inverter → grid exports blind; route it through Tehneo and export becomes price-aware.

import { onFrame } from './ticker.js';
import { sound } from './audio.js';
import { clamp, inView } from './util.js';

const STATES = {
  off: ['No signal', 'Grid not reached'],
  fault: ['Fault', 'DC on the AC bus'],
  blind: ['Blind export', 'Selling at −€/MWh'],
  smart: ['Smart export', 'Limit 0% below €0'],
};

export function initPatch(bay) {
  const svg = bay.querySelector('#cables');
  const statusEl = bay.querySelector('#grid-status');
  const noteEl = bay.querySelector('#grid-note');
  const meter = [...bay.querySelectorAll('#grid-meter i')];
  const mods = Object.fromEntries([...bay.querySelectorAll('.mod')].map((m) => [m.dataset.mod, m]));
  const links = new Map([['inv:in', 'pv:out'], ['grid:in', 'inv:out']]); // in-port → out-port
  let drag = null, armed = null, state = '', visible = false, chain = new Set();

  const port = (key) => bay.querySelector(`[data-port="${key}"]`);
  const modOf = (key) => key.split(':')[0];
  const center = (el, br) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - br.left, r.top + r.height / 2 - br.top]; };

  // ------------------------------------------------------------------ logic
  function evaluate() {
    // walk back from the grid to find the chain feeding it
    const seen = []; let cur = 'grid';
    for (;;) {
      const src = links.get(`${cur}:in`);
      if (!src) break;
      cur = modOf(src);
      if (seen.includes(cur)) break;
      seen.push(cur);
      if (cur === 'pv') break;
    }
    const reached = seen[seen.length - 1] === 'pv';
    const next = !reached ? 'off' : !seen.includes('inv') ? 'fault' : seen.includes('tehneo') ? 'smart' : 'blind';
    chain = new Set(reached ? ['grid', ...seen] : []);

    // modules fed from the array, wherever they lead
    const live = new Set(['pv']);
    for (let changed = true; changed;) {
      changed = false;
      for (const [inp, out] of links) if (live.has(modOf(out)) && !live.has(modOf(inp))) { live.add(modOf(inp)); changed = true; }
    }
    for (const [id, el] of Object.entries(mods)) el.classList.toggle('is-live', live.has(id));
    bay.querySelectorAll('.port').forEach((p) => {
      const k = p.dataset.port;
      p.classList.toggle('is-live', k.endsWith(':in') ? links.has(k) && live.has(modOf(k)) : [...links.values()].includes(k) && live.has(modOf(k)));
    });

    if (next === state) return;
    const first = !state;
    state = next;
    bay.dataset.state = next;
    statusEl.textContent = STATES[next][0];
    noteEl.textContent = STATES[next][1];
    meter.forEach((m, i) => { m.style.height = next === 'off' || next === 'fault' ? '20%' : `${30 + Math.abs(Math.sin(i * 1.7)) * 70}%`; });
    if (first) return;
    if (next === 'smart') sound.chord(); else if (next === 'off') sound.tick(); else sound.buzz();
  }

  // ------------------------------------------------------------------ cables
  function route(a, b, others) {
    const [x1, y1] = a, [x2, y2] = b, stub = 22;
    const direct = [[x1, y1], [(x1 + x2) / 2, y1], [(x1 + x2) / 2, y2], [x2, y2]];
    if (x2 > x1 + 8) {
      const mx = (x1 + x2) / 2;
      const hits = others.some((r) =>
        (y1 > r.top && y1 < r.bottom && Math.max(x1, mx) > r.left && Math.min(x1, mx) < r.right) ||
        (y2 > r.top && y2 < r.bottom && Math.max(mx, x2) > r.left && Math.min(mx, x2) < r.right) ||
        (mx > r.left && mx < r.right && Math.max(y1, y2) > r.top && Math.min(y1, y2) < r.bottom));
      if (!hits) return direct;
    }
    const lane = Math.max(...others.map((r) => r.bottom), y1, y2) + 26;
    return [[x1, y1], [x1 + stub, y1], [x1 + stub, lane], [x2 - stub, lane], [x2 - stub, y2], [x2, y2]];
  }

  function rounded(pts, r) {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1);
      if (l1 < 0.5 || l2 < 0.5) continue;
      const rr = Math.min(r, l1 / 2, l2 / 2);
      d += `L${(x1 + ((x0 - x1) / l1) * rr).toFixed(1)},${(y1 + ((y0 - y1) / l1) * rr).toFixed(1)}`;
      d += `Q${x1.toFixed(1)},${y1.toFixed(1)} ${(x1 + ((x2 - x1) / l2) * rr).toFixed(1)},${(y1 + ((y2 - y1) / l2) * rr).toFixed(1)}`;
    }
    const e = pts[pts.length - 1];
    return d + `L${e[0].toFixed(1)},${e[1].toFixed(1)}`;
  }

  function cable(d, color, flow, t) {
    return `<path class="cable-shadow" d="${d}"/><path class="cable-core" d="${d}" stroke="${color}" stroke-opacity="${flow ? 0.55 : 0.35}"/>` +
      (flow ? `<path class="cable-flow" d="${d}" stroke="${color}" stroke-dashoffset="${(-t * 46).toFixed(1)}"/>` : '');
  }

  // ------------------------------------------------------------------ input
  function connect(inKey, outKey) {
    if (modOf(inKey) === modOf(outKey)) return;
    links.set(inKey, outKey);
    const el = port(inKey);
    el.classList.remove('is-spark'); void el.offsetWidth; el.classList.add('is-spark');
    sound.tick(1.2);
    evaluate();
  }

  bay.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.port');
    const head = e.target.closest('.mod__head');
    if (p) {
      e.preventDefault();
      const key = p.dataset.port;
      if (key.endsWith(':in')) {
        if (armed) { connect(key, armed); port(armed).classList.remove('is-armed'); armed = null; return; }
        if (!links.has(key)) return;
        drag = { from: links.get(key), x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
        links.delete(key); evaluate(); sound.tick(0.7);
      } else {
        if (armed) port(armed).classList.remove('is-armed');
        armed = null;
        drag = { from: key, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
      }
      return;
    }
    if (head && innerWidth > 760) {
      const m = head.closest('.mod'), br = bay.getBoundingClientRect(), mr = m.getBoundingClientRect();
      drag = { mod: m, dx: e.clientX - mr.left, dy: e.clientY - mr.top, br };
      m.classList.add('is-dragging');
      head.setPointerCapture(e.pointerId);
    }
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (drag.mod) {
      const br = bay.getBoundingClientRect(), m = drag.mod;
      const x = clamp(e.clientX - br.left - drag.dx, 0, br.width - m.offsetWidth);
      const y = clamp(e.clientY - br.top - drag.dy, 0, br.height - m.offsetHeight);
      m.style.setProperty('--x', `${x}px`); m.style.setProperty('--y', `${y}px`);
    }
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    if (drag.mod) { drag.mod.classList.remove('is-dragging'); drag = null; return; }
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.port--in');
    if (target && bay.contains(target)) connect(target.dataset.port, drag.from);
    else if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) {
      armed = drag.from; port(armed).classList.add('is-armed'); sound.tick(0.6); // tap-to-connect
    }
    drag = null;
  });

  // ------------------------------------------------------------------ frame
  onFrame((dt, t) => {
    if (!visible) return;
    const br = bay.getBoundingClientRect();
    const rects = Object.fromEntries(Object.entries(mods).map(([k, m]) => {
      const r = m.getBoundingClientRect();
      return [k, { left: r.left - br.left - 4, right: r.right - br.left + 4, top: r.top - br.top - 4, bottom: r.bottom - br.top + 4 }];
    }));
    let html = '';
    for (const [inp, out] of links) {
      const a = center(port(out), br), b = center(port(inp), br);
      const others = Object.entries(rects).filter(([k]) => k !== modOf(inp) && k !== modOf(out)).map(([, r]) => r);
      const d = rounded(route(a, b, others), 14);
      const inChain = chain.has(modOf(inp)) && chain.has(modOf(out));
      const color = state === 'smart' && inChain ? '#a6c64c' : '#f4f6f1';
      html += cable(d, color, bay.querySelector(`.mod[data-mod="${modOf(out)}"]`).classList.contains('is-live'), t);
    }
    if (drag && drag.from) {
      const a = center(port(drag.from), br);
      const b = [drag.x - br.left, drag.y - br.top];
      const mx = Math.max(a[0] + 22, (a[0] + b[0]) / 2);
      html += cable(rounded([a, [mx, a[1]], [mx, b[1]], b], 14), '#a6c64c', true, t);
      html += `<circle cx="${b[0]}" cy="${b[1]}" r="5" fill="#a6c64c"/>`;
    }
    svg.innerHTML = html;
  });

  evaluate();
  inView(bay, (v) => (visible = v), '100px');
}
