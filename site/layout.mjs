// The page shell: head metadata, structured data, header and the legal footer.

import { SITE, esc } from './lib.mjs';
import { ROUTES, NAV } from './routes.mjs';

const UI = {
  hr: {
    skip: 'Preskoči na sadržaj', nav: 'Glavna navigacija', home: 'Početna', crumbs: 'Putanja',
    labels: { experiment: 'Eksperiment', service: 'Usluga', blog: 'Blog', about: 'O nama', contact: 'Kontakt' },
    company: 'Tvrtka', fullName: 'za proizvodnju i usluge', seat: 'Sjedište', country: 'Hrvatska',
    register: 'Podaci o tvrtki', court: 'Upisano u sudski registar Trgovačkog suda u Osijeku, MBS: 030268230',
    capital: 'Temeljni kapital: 2.654,46 € (uplaćen u cijelosti)', contact: 'Kontakt', privacy: 'Politika privatnosti',
    rights: '© 2026 Tehneo d.o.o. Sva prava pridržana.', made: 'Izrada web stranice: Tehneo d.o.o.',
  },
  en: {
    skip: 'Skip to content', nav: 'Main navigation', home: 'Home', crumbs: 'Breadcrumb',
    labels: { experiment: 'Experiment', service: 'Service', blog: 'Blog', about: 'About', contact: 'Contact' },
    company: 'Company', fullName: 'za proizvodnju i usluge', seat: 'Registered office', country: 'Croatia',
    register: 'Company details', court: 'Registered with the Commercial Court in Osijek, MBS: 030268230',
    capital: 'Share capital: €2,654.46 (paid in full)', contact: 'Contact', privacy: 'Privacy policy (in Croatian)',
    rights: '© 2026 Tehneo d.o.o. All rights reserved.', made: 'Website made by Tehneo d.o.o.',
  },
};

export const ORG_ID = `${SITE}/#organization`;

export const organization = {
  '@type': 'Organization', '@id': ORG_ID, name: 'Tehneo', legalName: 'Tehneo d.o.o.', url: `${SITE}/`,
  logo: `${SITE}/assets/favicon-512.png`, email: 'info@tehneo.hr', taxID: '84386741609',
  address: { '@type': 'PostalAddress', streetAddress: 'Ulica Ivana Mažuranića 25', postalCode: '31220', addressLocality: 'Višnjevac', addressCountry: 'HR' },
};

const website = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Tehneo', publisher: { '@id': ORG_ID }, inLanguage: ['hr', 'en'] };

/** page: { lang, path, title, description, body, crumbs?, schema?, alternates?, noindex?, og?, script?, bodyClass? } */
export function layout(page) {
  const { lang, path, title, description, body, crumbs = [], schema = [], alternates = {}, noindex = false, og, script } = page;
  const ui = UI[lang];
  const homePath = ROUTES.home[lang];
  const image = `${SITE}${og || `/assets/og/${lang}-home.png`}`;

  const trail = crumbs.length ? [{ name: ui.home, path: homePath }, ...crumbs] : [];
  const breadcrumb = trail.length ? {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE}${c.path}` })),
  } : null;
  const graph = { '@context': 'https://schema.org', '@graph': [organization, website, ...schema, ...(breadcrumb ? [breadcrumb] : [])] };

  const hreflang = Object.entries(alternates).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${SITE}${p}">`);
  if (alternates.hr) hreflang.push(`<link rel="alternate" hreflang="x-default" href="${SITE}${alternates.hr}">`);

  const other = lang === 'hr' ? 'en' : 'hr';
  const switchTo = alternates[other] || ROUTES.blog[other];
  const langSwitch = ['hr', 'en'].map((l) => (l === lang
    ? `<span aria-current="true">${l.toUpperCase()}</span>`
    : `<a href="${switchTo}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`)).join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${SITE}${path}">
${hreflang.join('\n')}
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="Tehneo">
<meta property="og:locale" content="${lang === 'hr' ? 'hr_HR' : 'en_GB'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0d0f">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/css/site.css">
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
${script ? `<script type="module" src="${script}"></script>\n` : ''}</head>
<body>
<a class="skip" href="#sadrzaj">${ui.skip}</a>
<header class="top">
  <a class="top__brand" href="${homePath}"><img src="/assets/favicon.svg" alt="" width="28" height="28"><span>TEHNEO</span></a>
  <nav class="top__nav mono" aria-label="${ui.nav}">
    ${NAV.map((key) => `<a href="${ROUTES[key][lang]}"${page.nav === key ? ' aria-current="page"' : ''}>${ui.labels[key]}</a>`).join('\n    ')}
  </nav>
  <div class="top__lang mono">${langSwitch}</div>
</header>
<main id="sadrzaj">
${trail.length ? `<nav class="crumbs mono" aria-label="${ui.crumbs}"><ol>${trail.map((c, i) => (i < trail.length - 1 ? `<li><a href="${c.path}">${esc(c.name)}</a></li>` : `<li aria-current="page">${esc(c.name)}</li>`)).join('')}</ol></nav>\n` : ''}${body}
</main>
<footer class="legal">
  <div class="legal__grid">
    <div>
      <p class="mono legal__label">${ui.company}</p>
      <p><b>Tehneo d.o.o.</b> ${ui.fullName}</p>
      <p>${ui.seat}: Ulica Ivana Mažuranića 25, 31220 Višnjevac, ${ui.country}</p>
    </div>
    <div>
      <p class="mono legal__label">${ui.register}</p>
      <p>OIB: 84386741609</p>
      <p>${ui.court}</p>
      <p>${ui.capital}</p>
    </div>
    <div>
      <p class="mono legal__label">${ui.contact}</p>
      <p><a href="mailto:info@tehneo.hr">info@tehneo.hr</a></p>
      <p><a href="/privatnost/">${ui.privacy}</a></p>
    </div>
  </div>
  <div class="legal__bar mono"><span>${ui.rights}</span><span>${ui.made}</span></div>
</footer>
</body>
</html>
`;
}
