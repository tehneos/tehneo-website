// Static generator: writes the whole site to dist/ as plain HTML, with no client-side rendering.
//   node site/build.mjs            production build, drafts excluded
//   node site/build.mjs --drafts   includes drafts (noindex, marked) for local review
// EXPERIMENT_FILE points to another data file, used to test the page with sample numbers.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, frontMatter, markdown } from './lib.mjs';
import { ROUTES } from './routes.mjs';
import { ORG_ID, layout } from './layout.mjs';
import * as P from './pages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const withDrafts = process.argv.includes('--drafts');
const experimentData = JSON.parse(readFileSync(process.env.EXPERIMENT_FILE || join(root, 'data/experiment.json'), 'utf8'));

// A post is Croatian unless its front matter says otherwise. Translations share a slug-free `hr` key later.
const posts = readdirSync(join(root, 'content/blog')).filter((f) => f.endsWith('.md')).map((file) => {
  const { meta, body } = frontMatter(readFileSync(join(root, 'content/blog', file), 'utf8'));
  const lang = meta.lang || 'hr';
  return { ...meta, lang, path: `${ROUTES.blog[lang]}${meta.slug}/`, html: markdown(body) };
}).filter((p) => withDrafts || !p.draft).sort((a, b) => b.date.localeCompare(a.date));
const postsIn = (lang) => posts.filter((p) => p.lang === lang);

const sitemap = [];
function write(path, html) {
  const dir = join(dist, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

function page(key, lang, body, extra = {}) {
  const [title, description] = P.META[lang][key];
  const path = ROUTES[key][lang];
  const alternates = ROUTES[key];
  const noindex = key === 'thanks' || key === 'failed';
  const labels = { experiment: ['Eksperiment', 'Experiment'], service: ['Usluga', 'Service'], blog: ['Blog', 'Blog'], about: ['O nama', 'About'], contact: ['Kontakt', 'Contact'] };
  const crumbs = labels[key] ? [{ name: labels[key][lang === 'hr' ? 0 : 1], path }] : [];
  write(path, layout({ lang, path, title, description, body, crumbs, alternates, noindex, nav: key, og: noindex ? undefined : `/assets/og/${lang}-${key}.png`, ...extra }));
  if (!noindex) sitemap.push({ path, alternates });
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);

for (const lang of ['hr', 'en']) {
  page('home', lang, P.home(lang, postsIn(lang)), { script: '/js/hero.js' });
  page('experiment', lang, P.experiment(lang, experimentData));
  page('service', lang, P.service(lang), { schema: [P.serviceSchema(lang, ORG_ID), P.faqSchema(lang)] });
  page('blog', lang, P.blog(lang, postsIn(lang)));
  page('about', lang, P.about(lang));
  page('contact', lang, P.contact(lang));
  page('thanks', lang, P.notice(lang, 'thanks'));
  page('failed', lang, P.notice(lang, 'failed'));
}

for (const p of posts) {
  const url = `${SITE}${p.path}`;
  const ogFile = `/assets/og/post-${p.slug}.png`;
  const og = existsSync(join(root, ogFile)) ? ogFile : `/assets/og/${p.lang}-blog.png`;
  const article = {
    '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, inLanguage: p.lang,
    mainEntityOfPage: url, url, image: `${SITE}${og}`, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID },
  };
  write(p.path, layout({
    lang: p.lang, path: p.path, title: `${p.title} | Tehneo`, description: p.description, body: P.post(p.lang, p), og, ogType: 'article',
    nav: 'blog', noindex: Boolean(p.draft), alternates: { [p.lang]: p.path }, schema: [article],
    crumbs: [{ name: 'Blog', path: ROUTES.blog[p.lang] }, { name: p.title, path: p.path }],
  }));
  if (!p.draft) sitemap.push({ path: p.path, alternates: { [p.lang]: p.path } });
}

writeFileSync(join(dist, '404.html'), layout({ lang: 'hr', path: '/404', title: 'Stranica nije pronađena | Tehneo', description: 'Ova stranica ne postoji.', body: P.notFound(), noindex: true, alternates: ROUTES.home }));

writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap.map(({ path, alternates }) => `  <url>
    <loc>${SITE}${path}</loc>
${Object.entries(alternates).map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${p}"/>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`);

writeFileSync(join(dist, 'robots.txt'), `${['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Googlebot'].map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n')}
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);

writeFileSync(join(dist, 'llms.txt'), `# Tehneo

> Tehneo d.o.o. je hrvatska tvrtka iz Višnjevca kraj Osijeka koja malim firmama pomaže da ih AI asistenti (ChatGPT, Gemini, Perplexity) i Google pronađu i preporuče.

Usluga: AI vidljivost (GEO) za male firme, obrte, webshopove, OPG-ove i ordinacije u Osijeku, Slavoniji i cijeloj Hrvatskoj. Mjerimo vidljivost, popravljamo web, pišemo sadržaj i izvještavamo. Suradnja počinje besplatnom provjerom. Cijene na upit.

Tehneo je vlastiti prvi klijent: AI agent mjeri vidljivost i priprema izmjene, sve izmjene odobrava čovjek, a rezultate objavljujemo javno.

## Ključne stranice

- [Početna](${SITE}/): pregled usluge
- [Eksperiment](${SITE}/eksperiment/): javni rezultati i dnevnik promjena
- [Usluga](${SITE}/usluga/): što agent radi, kako izgleda suradnja i česta pitanja
- [Blog](${SITE}/blog/): savjeti i rezultati
- [O nama](${SITE}/o-nama/): o tvrtki
- [Kontakt](${SITE}/kontakt/): besplatna provjera vidljivosti, info@tehneo.hr

## English

- [Home](${SITE}/en/)
- [Experiment](${SITE}/en/experiment/)
- [Service](${SITE}/en/service/)
- [About](${SITE}/en/about/)
- [Contact](${SITE}/en/contact/)
`);

// static files; the old coming-soon sources stay out of dist/
mkdirSync(join(dist, 'js'));
mkdirSync(join(dist, 'css'));
for (const f of ['hero', 'board', 'logo', 'ticker', 'util']) cpSync(join(root, `js/${f}.js`), join(dist, `js/${f}.js`));
cpSync(join(root, 'css/site.css'), join(dist, 'css/site.css'));
cpSync(join(root, 'privatnost'), join(dist, 'privatnost'), { recursive: true });
mkdirSync(join(dist, 'assets'));
for (const f of ['favicon.svg', 'favicon-32.png', 'favicon-192.png', 'favicon-512.png']) cpSync(join(root, 'assets', f), join(dist, 'assets', f));
cpSync(join(root, 'assets/email'), join(dist, 'assets/email'), { recursive: true }); // e-mail signatures link here
if (existsSync(join(root, 'assets/og'))) cpSync(join(root, 'assets/og'), join(dist, 'assets/og'), { recursive: true });

console.log(`Built ${sitemap.length} indexed pages, ${posts.length} posts${withDrafts ? ' (drafts included)' : ''}.`);
