import type { Lang } from './i18n';

export const formatMonthYear = (d: Date, lang: Lang): string =>
  new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
