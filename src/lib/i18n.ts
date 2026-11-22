export type Lang = 'pt' | 'en';

export const SECTION_IDS = ['fundamentals', 'ai', 'workflow', 'stack', 'about', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const ROUTES: Record<'home' | 'privacy' | 'terms', Record<Lang, string>> = {
  home: { pt: '/', en: '/en/' },
  privacy: { pt: '/privacidade/', en: '/en/privacy/' },
  terms: { pt: '/termos/', en: '/en/terms/' },
};

export const langFromPath = (path: string): Lang => (path.startsWith('/en/') || path === '/en' ? 'en' : 'pt');

export function switchHref(path: string, section: string | null, to: Lang): string {
  const route = (Object.keys(ROUTES) as (keyof typeof ROUTES)[]).find((k) => path === ROUTES[k].pt || path === ROUTES[k].en);
  if (!route) return ROUTES.home[to];
  const hash = route === 'home' && SECTION_IDS.includes(section as SectionId) ? `#${section}` : '';
  return ROUTES[route][to] + hash;
}
