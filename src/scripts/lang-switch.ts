import { SECTION_IDS, switchHref } from '../lib/i18n';

// Antes de navegar, reescreve o href com a seção visível (a última cujo topo passou de 40% da viewport).
document.querySelector<HTMLAnchorElement>('a[data-lang-switch]')?.addEventListener('click', (e) => {
  const link = e.currentTarget as HTMLAnchorElement;
  const line = innerHeight * 0.4;
  const id = SECTION_IDS.findLast((s) => (document.getElementById(s)?.getBoundingClientRect().top ?? Infinity) < line);
  link.href = switchHref(location.pathname, id ?? null, link.hreflang.startsWith('en') ? 'en' : 'pt');
});
