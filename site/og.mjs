// Renders the 1200×630 OpenGraph images with headless Chrome into assets/og/. Run locally
// after changing a page title; the PNGs are committed, so the Vercel build does not need Chrome.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { esc } from './lib.mjs';
import { META } from './pages.mjs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets/og');
const tmp = mkdtempSync(join(tmpdir(), 'tehneo-og-'));
mkdirSync(out, { recursive: true });

const logo = pathToFileURL(join(root, 'assets/favicon.svg')).href;
for (const lang of ['hr', 'en']) for (const key of ['home', 'experiment', 'service', 'blog', 'about', 'contact']) {
  const title = META[lang][key][0].split(' | ')[0];
  const html = join(tmp, `${lang}-${key}.html`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=JetBrains+Mono&display=block">
<style>*{margin:0}body{width:1200px;height:630px;box-sizing:border-box;padding:64px;display:flex;flex-direction:column;justify-content:space-between;color:#f4f6f1;font-family:Archivo,sans-serif;
background:#0b0d0f linear-gradient(rgba(244,246,241,.07) 1px,transparent 1px) 0 0/64px 64px,#0b0d0f}
.b{display:flex;align-items:center;gap:16px;font-weight:800;font-stretch:125%;font-size:30px;letter-spacing:.06em}.b img{width:56px;height:56px}
h1{font-size:76px;line-height:1.04;font-weight:800;font-stretch:112%;letter-spacing:-.02em;max-width:1040px}
p{font-family:'JetBrains Mono',monospace;font-size:22px;color:#a6c64c;letter-spacing:.06em}</style>
<div class="b"><img src="${logo}" alt="">TEHNEO</div><h1>${esc(title)}</h1><p>www.tehneo.hr</p>`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=4000',
    `--screenshot=${join(out, `${lang}-${key}.png`)}`, pathToFileURL(html).href], { stdio: 'ignore' });
}
console.log('OG images written to assets/og/');
