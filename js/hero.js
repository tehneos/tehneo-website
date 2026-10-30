// Progressive enhancement: the circuit board behind the homepage hero. The page is complete
// without it, so it loads only once the browser is idle and never on reduced motion.

const canvas = document.getElementById('board');
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));

if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('load', () => idle(async () => {
    const { initBoard } = await import('./board.js');
    const wide = innerWidth > 900;
    initBoard(canvas, { cx: wide ? 0.76 : 0.5, cy: wide ? 0.42 : 0.2, scale: wide ? 0.82 : 0.6 }).start();
    canvas.classList.add('is-on');
  }), { once: true });
}
