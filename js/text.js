// Text effects: decode-on-reveal headings, scroll-powered words, reveal-on-view.

import { onFrame } from './ticker.js';
import { sound } from './audio.js';
import { sectionProgress, smooth, reduced } from './util.js';

const GLYPHS = '01<>/\\_-+=#*[]';

export function scramble(el, duration = 1000) {
  const final = el.dataset.text ?? (el.dataset.text = el.textContent);
  if (reduced) { el.textContent = final; return; }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      const k = p * (final.length + 8) - i;
      out += ch === ' ' ? ' ' : k > 8 ? ch : k > 0 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ' ';
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initReveals() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);
      el.classList.add('is-in');
      if (el.hasAttribute('data-scramble') && !el.closest('.hero')) scramble(el);
    }
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-reveal], [data-scramble]').forEach((el) => {
    if (el.hasAttribute('data-scramble')) el.dataset.text = el.textContent;
    io.observe(el);
  });
}

/** Words light up one by one as the section scrolls, like current reaching each word. */
export function initSignalText(section, el) {
  const words = [];
  const frag = document.createDocumentFragment();
  const add = (text, em) => {
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(' '); continue; }
      const s = document.createElement('span');
      s.className = em ? 'w em' : 'w';
      s.textContent = part;
      frag.append(s); words.push(s);
    }
  };
  for (const node of [...el.childNodes]) add(node.textContent, node.nodeName === 'EM');
  el.replaceChildren(frag);

  let lit = -1;
  onFrame(() => {
    const p = sectionProgress(section);
    const n = Math.floor(smooth(0.04, 0.8, p) * (words.length + 0.999));
    if (n === lit) return;
    if (n > lit && lit >= 0) sound.tick(0.5);
    lit = n;
    words.forEach((w, i) => {
      w.classList.toggle('on', i < n);
      w.classList.toggle('live', i === n && n < words.length && p > 0.02);
    });
  });
}

/** Section spine: a fixed trace on the left that fills with scroll, one via per section. */
export function initSpine(nav, sections) {
  const list = nav.querySelector('#spine-list');
  const fill = nav.querySelector('#spine-fill');
  const items = sections.map((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button data-cursor="GO"><span class="mono">${String(i).padStart(2, '0')} ${s.dataset.label}</span></button>`;
    li.querySelector('button').addEventListener('click', () => s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
    list.append(li);
    return li;
  });
  const layout = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    sections.forEach((s, i) => { items[i].style.top = `${Math.min(100, (s.offsetTop / max) * 100)}%`; });
  };
  layout();
  addEventListener('resize', layout);
  addEventListener('load', layout);

  let active = -1;
  onFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.transform = `scaleY(${Math.min(1, scrollY / max)})`;
    let a = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= scrollY + innerHeight * 0.5) a = i; });
    if (a !== active) {
      items[active]?.classList.remove('is-active');
      items[a].classList.add('is-active');
      active = a;
    }
  });
}
