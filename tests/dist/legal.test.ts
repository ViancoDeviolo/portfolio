import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { load, text } from './html';

const LEGAL_MUST = {
  pt: ['Lucas Alves da Cruz', 'art. 7º', 'art. 18', 'Cloudflare', 'não usa cookies', 'Última atualização'],
  en: ['Lucas Alves da Cruz', 'Art. 7', 'Art. 18', 'Cloudflare', 'does not use', 'Last updated'],
};
const LEGAL = ['privacidade/index.html', 'en/privacy/index.html', 'termos/index.html', 'en/terms/index.html'];
const langOf = (f: string) => (f.startsWith('en/') ? 'en' : 'pt');
const allHtml = () =>
  (readdirSync('dist', { recursive: true }) as string[])
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replaceAll('\\', '/'));

describe('páginas legais', () => {
  it.each(['privacidade/index.html', 'en/privacy/index.html'])('política %s cobre os itens obrigatórios', (f) => {
    const t = text(load(f).html);
    for (const must of LEGAL_MUST[langOf(f)]) expect(t).toContain(must);
  });

  it.each(['termos/index.html', 'en/terms/index.html'])('termos %s', (f) => {
    const t = text(load(f).html);
    expect(t).toContain('Arapuca');
    expect(t).toContain('Lucas Alves da Cruz');
    expect(t).toContain(langOf(f) === 'pt' ? 'Última atualização' : 'Last updated');
  });

  it.each(LEGAL)('%s: um h1, e-mail anti-robô, links externos seguros, sem inline', (f) => {
    const $ = load(f);
    expect($('h1').length).toBe(1);
    expect($('html').attr('lang')).toBe(langOf(f) === 'pt' ? 'pt-BR' : 'en');
    for (const a of $('a[href]').nodes.filter((n) => /^https?:/.test(n.attrs.href))) expect(a.attrs.rel).toBe('noopener noreferrer');
    expect($.html).not.toMatch(/<style\b|\sstyle\s*=|<script\b(?![^>]*\bsrc=)/i);
  });

  it.each(['privacidade/index.html', 'en/privacy/index.html'])('%s: contato sem endereço completo no HTML', (f) => {
    const $ = load(f);
    expect($('a[data-user][data-domain]').length).toBe(1);
    expect($.html).not.toContain('lucascruzcorp@');
  });

  it('toda página linka privacidade e termos', () => {
    const pages = allHtml();
    expect(pages).toEqual(expect.arrayContaining(LEGAL));
    for (const f of pages) {
      const page = readFileSync(`dist/${f}`, 'utf8');
      expect(page).toMatch(/href="\/(en\/)?(privacidade|privacy)\/"/);
      expect(page).toMatch(/href="\/(en\/)?(termos|terms)\/"/);
    }
  });
});
