// Page content per language. Each function returns the HTML of <main>.

import { SITE, esc, formatDate } from './lib.mjs';
import { ROUTES } from './routes.mjs';

const r = (key, lang) => ROUTES[key][lang];

export const META = {
  hr: {
    home: ['AI vidljivost za male firme u Hrvatskoj | Tehneo', 'Tehneo mjeri, popravlja i prati kako vašu firmu vide ChatGPT, Gemini, Perplexity i Google. Besplatna provjera vidljivosti za male firme u Hrvatskoj.'],
    experiment: ['Agent uživo: javni eksperiment AI vidljivosti | Tehneo', 'AI agent preuzima vidljivost Tehnea. Svaki tjedan mjerimo rezultat i objavljujemo stvarne zbirne brojke i dnevnik promjena.'],
    service: ['Usluga AI vidljivosti za male firme | Tehneo', 'Što radi Tehneo agent: mjeri vidljivost u AI odgovorima, popravlja web, piše sadržaj i izvještava. Suradnja počinje besplatnom provjerom.'],
    blog: ['Blog o AI vidljivosti | Tehneo', 'Savjeti i rezultati eksperimenata o tome kako male firme u Hrvatskoj postaju vidljive u odgovorima AI asistenata.'],
    about: ['O nama | Tehneo d.o.o.', 'Tehneo je hrvatska tehnološka tvrtka iz Osijeka specijalizirana za AI vidljivost malih firmi: da ih AI asistenti pronađu, razumiju i preporuče.'],
    contact: ['Besplatna provjera vidljivosti | Tehneo', 'Pošaljite nam web svoje firme i javit ćemo vam kako vas vide ChatGPT, Gemini, Perplexity i Google. Kontakt: info@tehneo.hr.'],
    thanks: ['Poruka je poslana | Tehneo', 'Vaša poruka je poslana. Javit ćemo vam se e-poštom.'],
    failed: ['Poruka nije poslana | Tehneo', 'Poruku nije bilo moguće poslati. Pišite nam izravno na info@tehneo.hr.'],
  },
  en: {
    home: ['AI visibility for small businesses in Croatia | Tehneo', 'Tehneo measures, fixes and tracks how ChatGPT, Gemini, Perplexity and Google see your business. Free visibility check for small businesses in Croatia.'],
    experiment: ['Live agent: a public AI visibility experiment | Tehneo', 'An AI agent takes over Tehneo\'s visibility. We measure the result every week and publish the real numbers and a change log.'],
    service: ['AI visibility service for small businesses | Tehneo', 'What the Tehneo agent does: measures visibility in AI answers, fixes your website, writes content and reports. Work starts with a free check.'],
    blog: ['Blog about AI visibility | Tehneo', 'Advice and experiment results on how small Croatian businesses become visible in the answers of AI assistants.'],
    about: ['About us | Tehneo d.o.o.', 'Tehneo is a Croatian technology company from Osijek specialising in AI visibility for small businesses: found, understood and recommended by AI assistants.'],
    contact: ['Free visibility check | Tehneo', 'Send us your business website and we will tell you how ChatGPT, Gemini, Perplexity and Google see you. Contact: info@tehneo.hr.'],
    thanks: ['Message sent | Tehneo', 'Your message has been sent. We will reply by email.'],
    failed: ['Message not sent | Tehneo', 'Your message could not be sent. Please write to info@tehneo.hr directly.'],
  },
};

const T = {
  hr: {
    h1: 'Vaša firma u odgovorima ChatGPT-a i Googlea',
    sub: 'AI asistenti sve češće odlučuju koje firme ljudi pronađu. Mi mjerimo, popravljamo i pratimo vašu vidljivost.',
    cta1: 'Besplatna provjera vidljivosti', cta2: 'Pogledajte eksperiment uživo',
    problemE: 'Problem', problemH: 'Ako vas AI ne spominje, kupac vas ne vidi.',
    problems: [
      ['Ljudi pitaju, a ne pretražuju.', 'Umjesto deset poveznica dobiju jedan odgovor s nekoliko imena. Ako vaše nije među njima, za tog kupca ne postojite.'],
      ['AI ne čita web kao čovjek.', 'Nejasan opis usluge, razbacani podaci ili tekst skriven iza JavaScripta znače da vas asistent ne razumije ili preskoči.'],
      ['Ne vidite što se događa.', 'Obična analitika ne pokazuje što AI govori o vama. Bez mjerenja ne znate jeste li u odgovorima i koga preporučuje umjesto vas.'],
    ],
    howE: 'Kako radimo', howH: 'Četiri koraka, svakog mjeseca.',
    steps: [
      ['Mjerimo', 'Postavljamo pitanja koja postavljaju vaši kupci i bilježimo gdje se pojavljujete u ChatGPT-u, Geminiju, Perplexityju i Googleu.'],
      ['Popravljamo', 'Ispravljamo ono što smeta: opis usluge, strukturirane podatke, tehničke prepreke i podatke u direktorijima.'],
      ['Pišemo', 'Pripremamo sadržaj koji odgovara na stvarna pitanja vaših kupaca. Čovjek ga pregleda prije objave.'],
      ['Izvještavamo', 'Jasno vam pokažemo što se promijenilo, što je napravljeno i što slijedi.'],
    ],
    whoE: 'Za koga', whoH: 'Za male firme u Hrvatskoj.',
    who: ['Male firme', 'Obrti', 'Webshopovi', 'OPG-ovi', 'Ordinacije'],
    expE: 'Eksperiment', expH: 'Prvi klijent smo mi sami.', expP: 'Naš AI agent radi na vlastitom webu, a svaki tjedan javno objavljujemo stvarne brojeve i popis svih promjena.', expCta: 'Agent uživo',
    blogE: 'Blog', blogH: 'Najnoviji tekstovi', blogAll: 'Svi tekstovi', blogEmpty: 'Prvi tekstovi stižu uskoro.',
  },
  en: {
    h1: 'Your business in the answers of ChatGPT and Google',
    sub: 'AI assistants increasingly decide which businesses people find. We measure, fix and track your visibility.',
    cta1: 'Free visibility check', cta2: 'See the live experiment',
    problemE: 'The problem', problemH: 'If AI does not mention you, the customer does not see you.',
    problems: [
      ['People ask instead of searching.', 'Instead of ten links they get one answer with a few names. If yours is not among them, you do not exist for that customer.'],
      ['AI does not read a website like a person.', 'A vague service description, scattered details or text hidden behind JavaScript mean the assistant misreads or skips you.'],
      ['You cannot see what is happening.', 'Regular analytics do not show what AI says about you. Without measuring, you cannot know whether you appear in answers or who is recommended instead.'],
    ],
    howE: 'How we work', howH: 'Four steps, every month.',
    steps: [
      ['Measure', 'We ask the questions your customers ask and record where you appear in ChatGPT, Gemini, Perplexity and Google.'],
      ['Fix', 'We correct what gets in the way: service descriptions, structured data, technical barriers and directory listings.'],
      ['Write', 'We prepare content that answers your customers\' real questions. A person reviews it before it is published.'],
      ['Report', 'We show you clearly what changed, what was done and what comes next.'],
    ],
    whoE: 'Who it is for', whoH: 'Small businesses in Croatia.',
    who: ['Small businesses', 'Sole traders', 'Webshops', 'Family farms', 'Medical and dental practices'],
    expE: 'Experiment', expH: 'Our first client is us.', expP: 'Our AI agent works on our own website, and every week we publish the real numbers and a list of every change.', expCta: 'Live agent',
    blogE: 'Blog', blogH: 'Latest articles', blogAll: 'All articles', blogEmpty: 'The first articles are coming soon.',
  },
};

const eyebrow = (s) => `<p class="mono eyebrow">${s}</p>`;
const aiNote = (text) => `<p class="ai-note mono"><span aria-hidden="true">◆</span> ${text}</p>`;

export function postCard(post, lang) {
  return `<li class="post-card">
      <a href="${post.path}">
        <p class="mono post-card__meta">${esc(post.category)} · <time datetime="${post.date}">${formatDate(post.date, lang)}</time>${post.draft ? ' · <b>NACRT</b>' : ''}</p>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.description)}</p>
      </a>
    </li>`;
}

export function home(lang, posts) {
  const t = T[lang];
  const latest = posts.slice(0, 3);
  return `<section class="hero">
  <canvas class="hero__board" id="board" aria-hidden="true"></canvas>
  <div class="hero__ui">
    <h1>${t.h1}</h1>
    <p class="hero__sub">${t.sub}</p>
    <p class="actions"><a class="btn btn--solid" href="${r('contact', lang)}">${t.cta1}</a><a class="btn" href="${r('experiment', lang)}">${t.cta2}</a></p>
  </div>
</section>
<section class="sec">
  ${eyebrow(t.problemE)}
  <h2>${t.problemH}</h2>
  <ul class="grid grid--3">${t.problems.map(([h, p]) => `<li class="panel"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ul>
</section>
<section class="sec">
  ${eyebrow(t.howE)}
  <h2>${t.howH}</h2>
  <ol class="grid grid--4 steps">${t.steps.map(([h, p]) => `<li class="panel"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>
</section>
<section class="sec">
  ${eyebrow(t.whoE)}
  <h2>${t.whoH}</h2>
  <ul class="chips mono">${t.who.map((w) => `<li>${w}</li>`).join('')}</ul>
</section>
<section class="sec">
  <div class="band">
    <div>${eyebrow(t.expE)}<h2>${t.expH}</h2><p>${t.expP}</p></div>
    <a class="btn btn--solid" href="${r('experiment', lang)}">${t.expCta}</a>
  </div>
</section>
<section class="sec">
  ${eyebrow(t.blogE)}
  <h2>${t.blogH}</h2>
  ${latest.length ? `<ul class="posts">${latest.map((p) => postCard(p, lang)).join('')}</ul><p class="actions"><a class="btn" href="${r('blog', lang)}">${t.blogAll}</a></p>` : `<p class="empty">${t.blogEmpty}</p>`}
</section>`;
}

const EXP = {
  hr: {
    h1: 'Agent uživo', lead: 'AI agent preuzima vidljivost Tehnea, a mi svaki tjedan mjerimo rezultat. Svi brojevi na ovoj stranici su stvarni.',
    note: 'Ovu stranicu i promjene u dnevniku stvara ili pomaže stvarati AI agent. Sve izmjene odobrava čovjek.',
    status: (w, done) => (w ? `Tjedan ${w}` : done ? 'Tjedan 0 – polazno mjerenje' : 'Tjedan 0 – mjerenje u tijeku'),
    engines: 'Rezultati po sustavu', engine: 'Sustav', measured: 'Izmjerenih odgovora', mentioned: 'Spominje Tehneo', ofQuestions: (n) => `od ${n} pitanja`,
    enginesNote: 'Mjerimo preko službenih API-ja s uključenim web pretraživanjem. Odgovori se mogu razlikovati od onoga što korisnik vidi u aplikaciji. ChatGPT je tek započet, a Gemini i Perplexity još nisu izmjereni.',
    updated: 'Zadnje ažuriranje', how: 'Kako eksperiment radi',
    howList: [
      ['Agent preuzima.', 'AI agent predlaže i priprema promjene na webu i sadržaju Tehnea.'],
      ['Čovjek odobrava.', 'Ništa se ne objavljuje bez ljudske potvrde.'],
      ['Tjedno mjerimo.', 'Ista pitanja postavljamo AI asistentima i pratimo Google pozicije te upite s weba.'],
      ['Objavljujemo rezultate.', 'I dobre i loše, zbirno, uz kratak popis svih promjena.'],
    ],
    limits: 'Ograničenja: odgovori AI asistenata razlikuju se od pokušaja do pokušaja, pa brojke pokazuju smjer, a ne točnu vrijednost. Objavljujemo broj i vrstu pitanja i zbirne rezultate, a ne točna pitanja, upute agentu ni sirove odgovore, pa mjerenje nije moguće izvana točno ponoviti.',
    metrics: { aiMentionShare: 'Udio AI odgovora koji spominju Tehneo', questions: 'Broj pitanja u testu', googlePosition: 'Prosječna Google pozicija', leads: 'Upiti s weba' },
    chart: 'Udio AI odgovora po tjednima', chartEmpty: 'Graf se pojavljuje nakon prvog mjerenja.', week: 'Tjedan',
    log: 'Dnevnik promjena', logDate: 'Datum', logChange: 'Što je agent promijenio', logEmpty: 'Još nema promjena.',
    cta: 'Želite li znati gdje stoji vaša firma?', ctaBtn: 'Besplatna provjera vidljivosti',
  },
  en: {
    h1: 'Live agent', lead: 'An AI agent takes over Tehneo\'s visibility and we measure the result every week. All numbers on this page are real.',
    note: 'This page and the changes in the log are created or assisted by an AI agent. A person approves every change.',
    status: (w, done) => (w ? `Week ${w}` : done ? 'Week 0 – baseline measurement' : 'Week 0 – measurement in progress'),
    engines: 'Results by system', engine: 'System', measured: 'Answers measured', mentioned: 'Mentions Tehneo', ofQuestions: (n) => `of ${n} questions`,
    enginesNote: 'We measure through official APIs with web search enabled. Answers can differ from what a user sees in the app. ChatGPT has only just started, and Gemini and Perplexity have not been measured yet.',
    updated: 'Last updated', how: 'How the experiment works',
    howList: [
      ['The agent takes over.', 'An AI agent proposes and prepares changes to Tehneo\'s website and content.'],
      ['A person approves.', 'Nothing is published without human confirmation.'],
      ['We measure weekly.', 'We ask AI assistants the same questions and track Google positions and website enquiries.'],
      ['We publish the results.', 'Good and bad alike, in aggregate, with a short list of every change.'],
    ],
    limits: 'Limitations: AI answers vary from one attempt to the next, so the numbers show a direction rather than an exact value. We publish the number and type of questions and aggregate results, not the exact questions, agent instructions or raw answers, so the measurement cannot be repeated exactly from outside.',
    metrics: { aiMentionShare: 'Share of AI answers mentioning Tehneo', questions: 'Questions in the test', googlePosition: 'Average Google position', leads: 'Website enquiries' },
    chart: 'Share of AI answers by week', chartEmpty: 'The chart appears after the first measurement.', week: 'Week',
    log: 'Change log', logDate: 'Date', logChange: 'What the agent changed', logEmpty: 'No changes yet.',
    cta: 'Want to know where your business stands?', ctaBtn: 'Free visibility check',
  },
};

function chart(points, t) {
  if (!points.length) return `<div class="chart chart--empty"><p class="mono">${t.chartEmpty}</p></div>`;
  const W = 800, H = 280, L = 44, B = 32, T_ = 14, R = 14;
  const max = Math.max(10, ...points.map((p) => p.aiMentionShare));
  const top = Math.ceil(max / 10) * 10;
  const x = (i) => L + (points.length < 2 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v) => H - B - (v / top) * (H - B - T_);
  const ticks = [0, top / 2, top];
  return `<figure class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.chart)}">
      ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join('')}
      <polyline points="${points.map((p, i) => `${x(i)},${y(p.aiMentionShare)}`).join(' ')}"/>
      ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.aiMentionShare)}" r="4"/><text x="${x(i)}" y="${H - 10}" text-anchor="middle">${p.week}</text>`).join('')}
    </svg>
    <figcaption class="mono">${t.chart} (${t.week.toLowerCase()} ${points[0].week}–${points.at(-1).week})</figcaption>
  </figure>`;
}

export function experiment(lang, data) {
  const t = EXP[lang];
  const fmt = { aiMentionShare: (v) => `${v}%`, questions: String, googlePosition: (v) => v.toLocaleString(lang === 'hr' ? 'hr-HR' : 'en-GB'), leads: String };
  const cards = Object.entries(t.metrics).map(([key, label]) => {
    const v = data.metrics[key];
    return `<li class="metric"><p class="metric__value">${v === null ? '—' : esc(fmt[key](v))}</p><p class="metric__label">${label}</p></li>`;
  }).join('');
  const engines = (data.engines || []).map((e) => `<tr><td>${esc(e.name)}</td><td>${e.measured} ${t.ofQuestions(data.metrics.questions)}</td><td>${e.mentioned}</td></tr>`).join('');
  const rows = [...data.changelog].reverse().map((c) => `<tr><td><time datetime="${esc(c.date)}">${formatDate(c.date, lang)}</time></td><td>${esc(c.change[lang] ?? c.change.hr)}</td></tr>`).join('')
    || `<tr><td colspan="2" class="empty">${t.logEmpty}</td></tr>`;
  return `<section class="sec sec--head">
  <h1>${t.h1}</h1>
  <p class="lead">${t.lead}</p>
  ${aiNote(t.note)}
</section>
<section class="sec">
  <p class="status mono"><i></i>${t.status(data.week, Boolean(data.updated))}${data.updated ? ` · ${t.updated}: ${formatDate(data.updated, lang)}` : ''}</p>
  <ul class="grid grid--4 metrics">${cards}</ul>
</section>
${engines ? `<section class="sec">
  <h2 class="h2--s">${t.engines}</h2>
  <div class="table"><table>
    <thead><tr><th scope="col">${t.engine}</th><th scope="col">${t.measured}</th><th scope="col">${t.mentioned}</th></tr></thead>
    <tbody>${engines}</tbody>
  </table></div>
  <p class="limits">${t.enginesNote}</p>
</section>
` : ''}<section class="sec">
  <h2 class="h2--s">${t.chart}</h2>
  ${chart(data.weekly, t)}
</section>
<section class="sec">
  <h2 class="h2--s">${t.log}</h2>
  <div class="table"><table>
    <thead><tr><th scope="col">${t.logDate}</th><th scope="col">${t.logChange}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</section>
<section class="sec">
  <h2 class="h2--s">${t.how}</h2>
  <ol class="grid grid--4 steps">${t.howList.map(([h, p]) => `<li class="panel"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>
  <p class="limits">${t.limits}</p>
</section>
<section class="sec"><div class="band"><h2 class="h2--s">${t.cta}</h2><a class="btn btn--solid" href="${r('contact', lang)}">${t.ctaBtn}</a></div></section>`;
}

const SVC = {
  hr: {
    h1: 'AI vidljivost za male firme', lead: 'Agent prati kako vas vide ChatGPT, Gemini, Perplexity i Google, a zatim popravlja ono što vas sprječava da budete pronađeni i preporučeni.',
    whatH: 'Što agent radi',
    what: [
      ['Mjeri', 'Redovito postavlja pitanja kakva postavljaju vaši kupci i bilježi spominju li vas odgovori, kako vas opisuju i koga preporučuju.'],
      ['Popravlja', 'Predlaže i priprema izmjene na webu: jasan opis usluga, strukturirane podatke, čitljivost za crawlere i usklađene podatke o firmi.'],
      ['Piše', 'Priprema tekstove koji odgovaraju na stvarna pitanja kupaca. Uz AI sadržaj stoji jasna oznaka, a čovjek ga pregleda prije objave.'],
      ['Izvještava', 'Jednom mjesečno dobivate pregled: što se promijenilo, što je napravljeno i što je sljedeće.'],
    ],
    whoH: 'Za koga', whoP: 'Za male firme, obrte, webshopove, OPG-ove i ordinacije u Hrvatskoj, kojima kupci dolaze preko interneta ili preporuke.',
    flowH: 'Kako izgleda suradnja',
    flow: [
      ['Besplatna provjera', 'Pošaljete nam web, a mi provjerimo kako vas vide AI asistenti i Google.'],
      ['Plan', 'Dobivate popis konkretnih problema i prijedlog što napraviti prvo.'],
      ['Mjesečno praćenje', 'Agent radi kroz plan, vi odobravate izmjene, a rezultate pratimo svaki mjesec.'],
    ],
    honestH: 'Što ne obećavamo', honestP: 'Nitko ne može jamčiti mjesto u odgovorima AI asistenata. Možemo jamčiti da ćemo mjeriti pošteno, raditi ono što je dokazivo korisno i pokazati vam stvarne brojeve.',
    priceH: 'Cijene', priceP: 'Cijene na upit.', cta: 'Besplatna provjera vidljivosti',
  },
  en: {
    h1: 'AI visibility for small businesses', lead: 'The agent tracks how ChatGPT, Gemini, Perplexity and Google see you, then fixes what keeps you from being found and recommended.',
    whatH: 'What the agent does',
    what: [
      ['Measures', 'It regularly asks the questions your customers ask and records whether answers mention you, how they describe you and who they recommend.'],
      ['Fixes', 'It proposes and prepares website changes: clear service descriptions, structured data, crawler readability and consistent business details.'],
      ['Writes', 'It prepares articles that answer real customer questions. AI content is clearly labelled and a person reviews it before publication.'],
      ['Reports', 'Once a month you get an overview of what changed, what was done and what comes next.'],
    ],
    whoH: 'Who it is for', whoP: 'Small businesses, sole traders, webshops, family farms and medical or dental practices in Croatia whose customers arrive through the internet or recommendations.',
    flowH: 'How working together looks',
    flow: [
      ['Free check', 'You send us your website and we check how AI assistants and Google see you.'],
      ['Plan', 'You get a list of concrete problems and a proposal for what to do first.'],
      ['Monthly tracking', 'The agent works through the plan, you approve the changes and we track results every month.'],
    ],
    honestH: 'What we do not promise', honestP: 'Nobody can guarantee a place in the answers of AI assistants. We can guarantee honest measurement, work that is demonstrably useful and real numbers.',
    priceH: 'Pricing', priceP: 'Pricing on request.', cta: 'Free visibility check',
  },
};

export function service(lang) {
  const t = SVC[lang];
  return `<section class="sec sec--head"><h1>${t.h1}</h1><p class="lead">${t.lead}</p></section>
<section class="sec"><h2 class="h2--s">${t.whatH}</h2><ul class="grid grid--4">${t.what.map(([h, p]) => `<li class="panel"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ul></section>
<section class="sec prose"><h2 class="h2--s">${t.whoH}</h2><p>${t.whoP}</p></section>
<section class="sec"><h2 class="h2--s">${t.flowH}</h2><ol class="grid grid--3 steps">${t.flow.map(([h, p]) => `<li class="panel"><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol></section>
<section class="sec prose"><h2 class="h2--s">${t.honestH}</h2><p>${t.honestP}</p></section>
<section class="sec"><div class="band"><div><h2 class="h2--s">${t.priceH}</h2><p>${t.priceP}</p></div><a class="btn btn--solid" href="${r('contact', lang)}">${t.cta}</a></div></section>`;
}

export const serviceSchema = (lang, orgId) => ({
  '@type': 'Service', name: SVC[lang].h1, serviceType: 'AI visibility', description: SVC[lang].lead,
  provider: { '@id': orgId }, areaServed: { '@type': 'Country', name: 'Croatia' }, url: `${SITE}${r('service', lang)}`, inLanguage: lang,
});

export function blog(lang, posts) {
  const hr = lang === 'hr';
  const empty = hr ? 'Prvi tekstovi stižu uskoro.' : `The first articles are coming soon. We publish in Croatian first, on the <a href="${r('blog', 'hr')}">Croatian blog</a>.`;
  return `<section class="sec sec--head"><h1>Blog</h1><p class="lead">${hr ? 'Rezultati našeg eksperimenta i praktični savjeti o AI vidljivosti.' : 'Results from our experiment and practical advice on AI visibility.'}</p></section>
<section class="sec">${posts.length ? `<ul class="posts">${posts.map((p) => postCard(p, lang)).join('')}</ul>` : `<p class="empty">${empty}</p>`}</section>`;
}

export function post(lang, p) {
  const label = p.category === 'Savjeti' ? 'Pripremljeno uz pomoć AI-ja, uredio Tehneo.' : 'Pisano uz pomoć AI-ja. Tekst je pregledao čovjek.';
  return `<article class="sec sec--head article">
  ${p.draft ? '<p class="draft mono">Nacrt – nije objavljeno</p>' : ''}
  <p class="mono post-card__meta">${esc(p.category)} · <time datetime="${p.date}">${formatDate(p.date, lang)}</time> · ${esc(p.author)}</p>
  <h1>${esc(p.title)}</h1>
  ${p.ai_assisted ? aiNote(label) : ''}
  <div class="prose">${p.html}</div>
</article>`;
}

export function about(lang) {
  if (lang === 'hr') return `<section class="sec sec--head prose">
  <h1>O nama</h1>
  <p class="lead">Tehneo je hrvatska tehnološka tvrtka iz Osijeka specijalizirana za AI vidljivost. Pomažemo malim firmama da ih ChatGPT, Gemini, Perplexity i Google pronađu, razumiju i preporuče.</p>
  <h2 class="h2--s">Zašto AI vidljivost</h2>
  <p>Način na koji ljudi traže firme mijenja se brže nego što ga većina firmi stigne pratiti. Sve više odluka počinje pitanjem postavljenim AI asistentu, a ne klasičnom pretragom. Velike tvrtke za to imaju timove i budžete, a mala firma obično ni ne zna što ti asistenti o njoj govore.</p>
  <p>Mi to mijenjamo: složenu tehnologiju pretvaramo u jasne korake i rezultate koje vlasnik firme može pratiti bez tehničkog predznanja.</p>
  <h2 class="h2--s">Kako radimo</h2>
  <p>Spajamo AI agente i ljudsku procjenu. Agenti neumorno mjere, uspoređuju i pripremaju izmjene, a čovjek odlučuje što se objavljuje. Tako dobivate brzinu automatizacije i sigurnost da svaka promjena ima smisla za vašu firmu.</p>
  <h2 class="h2--s">Dokazujemo na sebi</h2>
  <p>Ne tražimo da nam vjerujete na riječ. Uslugu smo prvo pustili na vlastiti web, a rezultate objavljujemo u javnom <a href="${r('experiment', lang)}">eksperimentu</a>, sa stvarnim brojevima.</p>
  <p>Tehneo razvija i autonomne sustave i AI data usluge.</p>
  <p><a class="btn btn--solid" href="${r('contact', lang)}">Kontaktirajte nas</a></p>
</section>`;
  return `<section class="sec sec--head prose">
  <h1>About us</h1>
  <p class="lead">Tehneo is a Croatian technology company from Osijek specialising in AI visibility. We help small businesses get found, understood and recommended by ChatGPT, Gemini, Perplexity and Google.</p>
  <h2 class="h2--s">Why AI visibility</h2>
  <p>The way people look for businesses is changing faster than most businesses can follow. More and more decisions start with a question to an AI assistant rather than a classic search. Large companies have teams and budgets for this, while a small business usually does not even know what those assistants say about it.</p>
  <p>We change that by turning complex technology into clear steps and results an owner can follow without technical knowledge.</p>
  <h2 class="h2--s">How we work</h2>
  <p>We combine AI agents with human judgement. Agents tirelessly measure, compare and prepare changes, and a person decides what gets published. You get the speed of automation and the confidence that every change makes sense for your business.</p>
  <h2 class="h2--s">We prove it on ourselves</h2>
  <p>We do not ask you to take our word for it. We ran the service on our own website first and publish the results in a public <a href="${r('experiment', lang)}">experiment</a>, with real numbers.</p>
  <p>Tehneo also develops autonomous systems and AI data services.</p>
  <p><a class="btn btn--solid" href="${r('contact', lang)}">Contact us</a></p>
</section>`;
}

const FORM = {
  hr: {
    h1: 'Besplatna provjera vidljivosti', lead: 'Pošaljite nam web svoje firme i javit ćemo vam kako vas vide AI asistenti i Google.',
    name: 'Ime', company: 'Firma', web: 'Web', email: 'E-pošta', message: 'Poruka', send: 'Pošalji',
    privacy: 'Podatke iz obrasca koristimo samo za odgovor na vaš upit. Više u <a href="/privatnost/">politici privatnosti</a>.',
    direct: 'Izravno', address: 'Adresa',
  },
  en: {
    h1: 'Free visibility check', lead: 'Send us your business website and we will tell you how AI assistants and Google see you.',
    name: 'Name', company: 'Company', web: 'Website', email: 'Email', message: 'Message', send: 'Send',
    privacy: 'We use the form details only to reply to your enquiry. More in the <a href="/privatnost/">privacy policy</a> (in Croatian).',
    direct: 'Directly', address: 'Address',
  },
};

export function contact(lang) {
  const t = FORM[lang];
  const field = (name, label, type, extra = '') => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${extra}></div>`;
  return `<section class="sec sec--head"><h1>${t.h1}</h1><p class="lead">${t.lead}</p></section>
<section class="sec contact">
  <form class="form" action="/api/contact/" method="post">
    <input type="hidden" name="lang" value="${lang}">
    <div class="field field--trap" aria-hidden="true"><label for="website2">Website 2</label><input id="website2" name="website2" tabindex="-1" autocomplete="off"></div>
    ${field('name', t.name, 'text', 'required maxlength="120" autocomplete="name"')}
    ${field('company', t.company, 'text', 'maxlength="160" autocomplete="organization"')}
    ${field('web', t.web, 'text', 'maxlength="200" inputmode="url" autocomplete="url"')}
    ${field('email', t.email, 'email', 'required maxlength="200" autocomplete="email"')}
    <div class="field"><label for="message">${t.message}</label><textarea id="message" name="message" rows="5" maxlength="4000"></textarea></div>
    <p class="form__note">${t.privacy}</p>
    <button class="btn btn--solid" type="submit">${t.send}</button>
  </form>
  <aside class="contact__side">
    <p class="mono eyebrow">${t.direct}</p>
    <p><a href="mailto:info@tehneo.hr">info@tehneo.hr</a></p>
    <p class="mono eyebrow">${t.address}</p>
    <p>Tehneo d.o.o.<br>Ulica Ivana Mažuranića 25<br>31220 Višnjevac</p>
  </aside>
</section>`;
}

export function notice(lang, key) {
  const copy = {
    hr: { thanks: ['Poruka je poslana.', 'Hvala. Javit ćemo vam se e-poštom.'], failed: ['Poruka nije poslana.', 'Nešto je pošlo po zlu. Pišite nam izravno na <a href="mailto:info@tehneo.hr">info@tehneo.hr</a>.'], back: 'Natrag na početnu' },
    en: { thanks: ['Message sent.', 'Thank you. We will reply by email.'], failed: ['Message not sent.', 'Something went wrong. Please write to <a href="mailto:info@tehneo.hr">info@tehneo.hr</a> directly.'], back: 'Back to home' },
  }[lang];
  return `<section class="sec sec--head prose"><h1>${copy[key][0]}</h1><p class="lead">${copy[key][1]}</p><p><a class="btn" href="${r('home', lang)}">${copy.back}</a></p></section>`;
}

export const notFound = () => `<section class="sec sec--head prose"><h1>Stranica nije pronađena</h1><p class="lead">Ova stranica ne postoji ili je premještena.</p><p><a class="btn" href="/">Natrag na početnu</a></p></section>`;
