import { SECTION_IDS, switchHref } from '../lib/i18n';

// Reescreve o href com a seção visível (a última cujo topo passou de 40% da viewport).
// pointerdown e focus cobrem clique do meio / nova aba, que não passam por "click".
const rewrite = (link: HTMLAnchorElement) => {
  const line = innerHeight * 0.4;
  const id = SECTION_IDS.findLast((s) => (document.getElementById(s)?.getBoundingClientRect().top ?? Infinity) < line);
  link.href = switchHref(location.pathname, id ?? null, link.hreflang.startsWith('en') ? 'en' : 'pt');
};
for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-lang-switch]'))
  for (const ev of ['pointerdown', 'focus', 'click']) a.addEventListener(ev, () => rewrite(a));
