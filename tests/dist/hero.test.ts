import { describe, expect, it } from 'vitest';
import { load } from './html';
import { formatMonthYear } from '../../src/lib/date';

describe('capa', () => {
  it.each([
    ['index.html', 'pt', 'Fundamentos', 'Engenharia com IA'],
    ['en/index.html', 'en', 'Fundamentals', 'AI engineering'],
  ] as const)('%s', (file, lang, fund, ai) => {
    const $ = load(file);
    const links = $('.hero a');
    expect(links.nodes.map((n) => n.attrs.href)).toEqual(['#fundamentals', '#ai']); // casual → terno
    expect($('.hero a[href=#fundamentals]').text()).toContain(fund);
    expect($('.hero a[href=#ai]').text()).toContain(ai);
    // só a imagem de LCP (casual) tem prioridade; o plano previa 2, mas 1 é melhor para o LCP
    expect($('.hero img[fetchpriority=high]').length).toBe(1);
    expect($('img[fetchpriority=high]').length).toBe(1); // nenhuma outra
    const imgs = $('.hero img').nodes;
    expect(imgs.length).toBe(2);
    expect(imgs.every((i) => (i.attrs.alt ?? '').length > 10)).toBe(true);
    expect(imgs[0].attrs.src).toContain('casual');
    expect(imgs[1].attrs.src).toContain('terno');
    expect($('.hero source[type=image/avif]').length).toBe(2);
    expect($('.hero source[type=image/webp]').length).toBe(2);
    expect($('.hero h1').length).toBe(1);
    expect($('h1').length).toBe(1);
    expect($('main section.hero').length + $('main header').length).toBe(0);
    const note = $('.living-note').text();
    expect(note).toContain(formatMonthYear(new Date(), lang));
    expect(note).not.toContain('{date}');
  });
});
