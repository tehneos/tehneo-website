// Every page and its path per language. Croatian lives at the root, English under /en/.

export const ROUTES = {
  home: { hr: '/', en: '/en/' },
  experiment: { hr: '/eksperiment/', en: '/en/experiment/' },
  service: { hr: '/usluga/', en: '/en/service/' },
  blog: { hr: '/blog/', en: '/en/blog/' },
  about: { hr: '/o-nama/', en: '/en/about/' },
  contact: { hr: '/kontakt/', en: '/en/contact/' },
  thanks: { hr: '/kontakt/hvala/', en: '/en/contact/thanks/' },
  failed: { hr: '/kontakt/greska/', en: '/en/contact/error/' },
};

export const NAV = ['experiment', 'service', 'blog', 'about', 'contact'];
