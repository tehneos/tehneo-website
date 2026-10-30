// Contact form: sends each enquiry to info@tehneo.hr through Brevo, which already sends our mail.
// Works without JavaScript: a plain form POST answered with a redirect to a thank-you or error page.
// Env: BREVO_API_KEY, CONTACT_FROM (a sender verified in Brevo).

const PAGES = {
  hr: { ok: '/kontakt/hvala/', fail: '/kontakt/greska/' },
  en: { ok: '/en/contact/thanks/', fail: '/en/contact/error/' },
};

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').end();

  const b = req.body || {};
  const pages = PAGES[b.lang] || PAGES.hr;
  const go = (to) => res.writeHead(303, { Location: to }).end();

  if (b.website2) return go(pages.ok); // honeypot: bots fill it, people never see it

  const name = clean(b.name, 120), email = clean(b.email, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return go(pages.fail);

  const text = [
    `Ime: ${name}`, `Firma: ${clean(b.company, 160)}`, `Web: ${clean(b.web, 200)}`, `E-pošta: ${email}`,
    '', clean(b.message, 4000),
  ].join('\n');

  try {
    const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Tehneo web', email: process.env.CONTACT_FROM },
        to: [{ email: 'info@tehneo.hr' }],
        replyTo: { email, name },
        subject: `Upit s weba: ${name}`,
        textContent: text,
      }),
    });
    return go(sent.ok ? pages.ok : pages.fail);
  } catch {
    return go(pages.fail);
  }
}
