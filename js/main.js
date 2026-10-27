import { logoSVG } from './logo.js';
import { t, applyLanguage, consumeSkipBoot } from './i18n.js';
import { initCursor } from './cursor.js';
import { initBoard } from './board.js';
import { initReveals, initSignalText, initSpine, scramble } from './text.js';
import { initMarket } from './market.js';
import { initStack } from './stack.js';
import { initPatch } from './patch.js';
import { initParticles } from './particles.js';
import { reduced } from './util.js';

const $ = (s) => document.querySelector(s);

applyLanguage();

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

// boot: count up while the mark draws itself, then show the Enter button
const boot = $('#boot'), pct = $('#boot-pct'), bar = $('#boot-bar'), msg = $('#boot-msg');
const MSGS = t('bootMsgs');
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

function enter() {
  boot.classList.add('is-done');
  document.body.classList.remove('is-booting');
  board.start();
  scramble($('.hero__title [data-scramble]'), 1200);
  setTimeout(initReveals, 350);
  setTimeout(() => boot.remove(), 1400);
}
boot.addEventListener('click', (e) => { if (e.target.closest('[data-enter]')) enter(); });
// after a language switch the page reloads straight into the site
if (consumeSkipBoot()) { boot.style.transition = 'none'; enter(); }
