// One requestAnimationFrame loop for the whole site, plus shared pointer and scroll state.

export const pointer = {
  x: innerWidth / 2, y: innerHeight / 2, // raw, viewport px
  nx: 0, ny: 0,                          // smoothed, -1..1 across the viewport
  speed: 0,                              // smoothed px/s
  down: false, moved: false,
  fine: matchMedia('(pointer: fine)').matches,
};
export const scroll = { y: scrollY, v: 0 };

addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; }, { passive: true });
addEventListener('pointerdown', (e) => { pointer.down = true; pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
addEventListener('pointercancel', () => { pointer.down = false; }, { passive: true });

const subs = new Set();
export const onFrame = (fn) => { subs.add(fn); return () => subs.delete(fn); };

let last = performance.now(), px = pointer.x, py = pointer.y, sy = scrollY;
const failed = new Set();
function loop() {
  // performance.now(), not the rAF timestamp: event handlers stamp times with
  // performance.now(), and the rAF timestamp can be slightly earlier than those.
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
  last = now;
  const k = 1 - Math.exp(-dt * 5);
  // a hidden or resizing window can report a zero size; a NaN here would stick forever
  if (innerWidth > 0 && innerHeight > 0) {
    pointer.nx += ((pointer.x / innerWidth) * 2 - 1 - pointer.nx) * k;
    pointer.ny += ((pointer.y / innerHeight) * 2 - 1 - pointer.ny) * k;
  }
  if (!Number.isFinite(pointer.nx) || !Number.isFinite(pointer.ny)) pointer.nx = pointer.ny = 0;
  const v = Math.hypot(pointer.x - px, pointer.y - py) / dt;
  pointer.speed += (v - pointer.speed) * (1 - Math.exp(-dt * 10));
  px = pointer.x; py = pointer.y;
  scroll.v += ((scrollY - sy) / dt - scroll.v) * (1 - Math.exp(-dt * 8));
  scroll.y = sy = scrollY;
  const t = now / 1000;
  for (const fn of subs) {
    // one failing effect must never stop the loop (and with it the cursor)
    try { fn(dt, t); } catch (err) { if (!failed.has(fn)) { failed.add(fn); console.error(err); } }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
