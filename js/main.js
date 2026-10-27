import { logoSVG } from './logo.js';
import { setSound, onSound, soundOn, sound } from './audio.js';
import { initCursor } from './cursor.js';
import { initBoard } from './board.js';
import { initReveals, initSignalText, initSpine, scramble } from './text.js';
import { initMarket } from './market.js';
import { initStack } from './stack.js';
import { initPatch } from './patch.js';
import { initParticles } from './particles.js';
import { reduced } from './util.js';

const $ = (s) => document.querySelector(s);

$('#boot-logo').innerHTML = logoSVG();
$('#hud-mark').innerHTML = logoSVG();
$('#mod-logo').innerHTML = logoSVG();

initCursor();
const board = initBoard($('#board'));
initSignalText($('#signal'), $('#signal-text'));
initMarket($('#market'));
initStack($('#stack'));
initPatch($('#bay'));
initParticles($('#contact'));
initSpine($('.spine'), [...document.querySelectorAll('main > section')]);

// sound toggle
const toggle = $('#sound');
toggle.addEventListener('click', () => setSound(!soundOn()));
onSound((on) => toggle.setAttribute('aria-pressed', String(on)));

// boot: count up while the mark draws itself, then ask how to enter
const boot = $('#boot'), pct = $('#boot-pct'), bar = $('#boot-bar'), msg = $('#boot-msg');
const MSGS = ['Initialising board', 'Routing traces', 'Reading inverter', 'Fetching day-ahead', 'Ready'];
const start = performance.now(), DURATION = reduced ? 200 : 1500;
(function count(now) {
  const p = Math.min(1, (now - start) / DURATION);
  const e = 1 - (1 - p) ** 3;
  pct.textContent = String(Math.round(e * 100)).padStart(3, '0');
  bar.style.transform = `scaleX(${e})`;
  msg.textContent = MSGS[Math.min(MSGS.length - 1, Math.floor(e * (MSGS.length - 1) + 0.001))];
  if (p < 1) requestAnimationFrame(count);
  else document.fonts.ready.then(() => { boot.classList.add('is-ready'); boot.querySelector('[data-enter]').focus({ preventScroll: true }); });
})(start);

boot.addEventListener('click', (e) => {
  const b = e.target.closest('[data-enter]');
  if (!b) return;
  if (b.dataset.enter === 'sound') { setSound(true); sound.power(); }
  boot.classList.add('is-done');
  document.body.classList.remove('is-booting');
  board.start();
  scramble($('.hero__title [data-scramble]'), 1200);
  setTimeout(initReveals, 350);
  setTimeout(() => boot.remove(), 1400);
});
