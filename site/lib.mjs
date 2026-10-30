// Small helpers for the static generator: escaping, front matter and a Markdown subset
// (headings, paragraphs, lists, quotes, bold, italics, code and links). No dependencies.

export const SITE = 'https://www.tehneo.hr';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function frontMatter(src) {
  const m = src.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Missing front matter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    meta[key] = value;
  }
  return { meta, body: m[2] };
}

function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[PODACI\]/g, '<mark>[PODACI]</mark>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
}

export function markdown(src) {
  const out = [];
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    const list = /^\d+\.\s/.test(line) ? ['ol', /^\d+\.\s+/] : /^-\s/.test(line) ? ['ul', /^-\s+/] : null;
    if (list) {
      const items = [];
      while (i < lines.length && list[1].test(lines[i])) items.push(`<li>${inline(lines[i++].replace(list[1], ''))}</li>`);
      out.push(`<${list[0]}>${items.join('')}</${list[0]}>`);
      continue;
    }
    const block = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|-\s|\d+\.\s)/.test(lines[i])) block.push(lines[i++]);
    if (block[0].startsWith('>')) out.push(`<blockquote><p>${inline(block.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`);
    else out.push(`<p>${inline(block.join(' '))}</p>`);
  }
  return out.join('\n');
}

export const formatDate = (iso, lang) => new Intl.DateTimeFormat(lang === 'hr' ? 'hr-HR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
