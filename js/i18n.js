// Two languages. The markup is the English source; Croatian replaces it at startup.
// Strings used from JavaScript live in STR as [en, hr].

const KEY = 'tehneo:lang';

function detect() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'hr' || q === 'en') return q;
  try { const s = localStorage.getItem(KEY); if (s === 'hr' || s === 'en') return s; } catch {}
  return (navigator.languages || [navigator.language]).some((l) => /^(hr|bs|sr|sh)\b/i.test(l || '')) ? 'hr' : 'en';
}

export const lang = detect();
const I = lang === 'hr' ? 1 : 0;

const STR = {
  bootMsgs: [
    ['Initialising board', 'Routing traces', 'Reading inverter', 'Fetching day-ahead', 'Ready'],
    ['Pokretanje ploče', 'Usmjeravanje vodova', 'Čitanje invertera', 'Dohvat day-ahead cijena', 'Spremno'],
  ],
  grid: ['→ GRID', '→ MREŽA'],
  export: ['EXPORT', 'IZVOZ'],
  export100: ['Export 100%', 'Izvoz 100%'],
  layer: ['Layer', 'Sloj'],
  layers: [
    [['PV array', '50 kWp · 12 strings'], ['Inverter bus', 'Modbus TCP · 1 s poll'], ['Controller', 'Reads · decides · limits'],
      ['Price signal', 'ENTSO-E · 15-min day-ahead'], ['Portal', 'Savings in five seconds']],
    [['Solarna polja', '50 kWp · 12 stringova'], ['Veza s inverterom', 'Modbus TCP · očitanje 1 s'], ['Kontroler', 'Čita · odlučuje · ograničava'],
      ['Cjenovni signal', 'ENTSO-E · 15-min day-ahead'], ['Portal', 'Ušteda u pet sekundi']],
  ],
  states: [
    { off: ['No signal', 'Grid not reached'], fault: ['Fault', 'DC on the AC bus'], blind: ['Blind export', 'Selling at −€/MWh'], smart: ['Smart export', 'Limit 0% below €0'] },
    { off: ['Nema signala', 'Mreža nije spojena'], fault: ['Greška', 'DC na AC sabirnici'], blind: ['Izvoz naslijepo', 'Prodaja po −€/MWh'], smart: ['Pametan izvoz', 'Limit 0% ispod €0'] },
  ],
};
export const t = (key) => STR[key][I];

// Croatian copy for elements tagged with data-i18n (innerHTML).
const HR = {
  enter: '<span class="btn__dot"></span>Uđi',
  heroSub: 'Energija koja razmišlja.<br><span class="muted">Upravljanje solarom za tržište koje odlazi u minus.</span>',
  heroHint: '[ Klikni na ploču — pošalji signal ]',
  heroScroll: '<i></i>Skrolaj dalje',
  e1: '01 — Problem',
  signal: 'Solarne elektrane izvoze naslijepo. Čak i kad cijena padne <em>ispod nule.</em> Tehneo čita inverter, prati day-ahead tržište i spušta izvoz na <em>nulu</em> — točno u pravih petnaest minuta.',
  e2: '02 — Tržište',
  marketH: 'Povuci cijenu ispod nule.',
  marketSub: 'Uhvati zelenu liniju i povuci je. Tehneo ograničava izvoz gdje god cijena ode u minus.',
  saved: 'Izbjegnuti gubitak / dan',
  limited: 'Izvoz ograničen',
  controller: 'Kontroler',
  surplus: 'Podnevni višak',
  reset: 'Vrati',
  note: 'Simulacija · elektrana 50 kW · 15-min day-ahead',
  e3: '03 — Slojevi',
  stackH: 'Pet slojeva.<br>Jedna odluka.',
  layerNone: 'Sloj — / 04',
  e4: '04 — Spajanje',
  patchH: 'Spoji ga u liniju.',
  patchSub: 'Ova elektrana izvozi naslijepo. Prespoji kabele i provedi struju kroz Tehneo.',
  array: 'Paneli',
  grid: 'Mreža',
  priceLimit: 'Limit prema cijeni',
  e5: '05 — Kontakt',
  contactH: 'Spojimo vašu elektranu.',
  cta: 'Pošalji signal <span aria-hidden="true">→</span>',
  lgCompany: 'Tvrtka',
  lgFullName: 'za proizvodnju i usluge',
  lgSeat: 'Sjedište',
  lgCountry: 'Hrvatska',
  lgRegister: 'Podaci o tvrtki',
  lgCourt: 'Upisano u sudski registar Trgovačkog suda u Osijeku, MBS: 030268230',
  lgCapital: 'Temeljni kapital: 2.654,46 € (uplaćen u cijelosti)',
  lgContact: 'Kontakt',
  lgPrivacy: 'Politika privatnosti',
  lgRights: '© 2026 Tehneo d.o.o. Sva prava pridržana.',
  lgMade: 'Izrada web stranice: Tehneo d.o.o.',
};
const CURSOR = {
  'POWER ON': 'UKLJUČI', TOP: 'VRH', 'SEND SIGNAL': 'POŠALJI SIGNAL', 'DRAG PRICE': 'POVUCI CIJENU',
  SLIDE: 'POMAKNI', RESET: 'VRATI', MOVE: 'POMAKNI', PATCH: 'SPOJI', DISTURB: 'POREMETI', WRITE: 'PIŠI', READ: 'ČITAJ', LANGUAGE: 'JEZIK',
};
const LABEL = { Power: 'Pogon', Signal: 'Signal', Market: 'Tržište', Stack: 'Slojevi', Patch: 'Spajanje', Connect: 'Kontakt' };

export function applyLanguage() {
  document.documentElement.lang = lang;
  const sw = document.getElementById('lang');
  sw.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('is-on', b.dataset.lang === lang));
  sw.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === lang) return;
    try { localStorage.setItem(KEY, b.dataset.lang); sessionStorage.setItem('tehneo:skipboot', '1'); } catch {}
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    location.replace(url);
  });
  if (lang !== 'hr') return;

  document.title = 'Tehneo — Energija koja razmišlja';
  document.querySelector('meta[name="description"]').content =
    'Tehneo čita vaš inverter, prati day-ahead tržište i zaustavlja izvoz čim cijena struje padne u minus.';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = HR[el.dataset.i18n]; });
  document.querySelectorAll('[data-cursor]').forEach((el) => { el.dataset.cursor = CURSOR[el.dataset.cursor] ?? el.dataset.cursor; });
  document.querySelectorAll('[data-label]').forEach((el) => { el.dataset.label = LABEL[el.dataset.label] ?? el.dataset.label; });
}

/** True once, right after a language switch, so the reload skips the boot screen. */
export function consumeSkipBoot() {
  try {
    const v = sessionStorage.getItem('tehneo:skipboot');
    sessionStorage.removeItem('tehneo:skipboot');
    return v === '1';
  } catch { return false; }
}
