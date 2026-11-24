import type { Lang } from './i18n';

export const formatMonthYear = (d: Date, lang: Lang): string =>
  new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d);

/** "nov 2026" / "Nov 2026", para o selo da capa. */
export const formatMonthYearShort = (d: Date, lang: Lang): string => {
  const parts = new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('month').replace('.', '')} ${get('year')}`;
};
