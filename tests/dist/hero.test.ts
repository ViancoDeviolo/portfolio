import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml'; // transitiva (vem com o Astro)
import { load } from './html';
import { formatMonthYearShort } from '../../src/lib/date';

const { heroAlt, heroLabels, heroBadge } = parse(readFileSync('src/content/site.yaml', 'utf8')).site;

describe('capa', () => {
  it.each([
    ['index.html', 'pt'],
    ['en/index.html', 'en'],
  ] as const)('%s', (file, lang) => {
    const $ = load(file);
    expect($('main section#top[data-hero]').length).toBe(1);

    // nome em dupla tipográfica
    const h1 = $('[data-hero] h1');
    expect(h1.length).toBe(1);
    expect($('h1').length).toBe(1);
    expect($('h1[data-hero-name] span.t-mao').text()).toBe('Lucas');
    expect($('h1[data-hero-name] span.t-ia').text()).toBe('Cruz');
    expect(h1.text()).toMatch(/Lucas\s+Cruz/); // leitor de tela ouve duas palavras

    // marcas de pontos e ponto de montagem do 3D
    expect($('[data-hero] [data-globe-static] svg').length).toBe(1);
    expect($('[data-hero] [data-halftone]').length).toBe(1);
    expect($('[data-hero] #globe-stage').length).toBe(1);
    expect($.html).toMatch(/<div[^>]*id="globe-stage"[^>]*><\/div>/); // vazio no HTML

    // fotos: casual antes do terno, alt do site.yaml, só a do LCP com prioridade
    const imgs = $('[data-hero] img').nodes;
    expect(imgs.length).toBe(2);
    expect(imgs.map((i) => i.attrs.alt)).toEqual([heroAlt.casual[lang], heroAlt.terno[lang]]);
    expect(imgs[0].attrs.src).toContain('casual');
    expect(imgs[1].attrs.src).toContain('terno');
    expect($('img[fetchpriority=high]').length).toBe(1);
    expect(imgs[0].attrs.fetchpriority).toBe('high');
    expect($('[data-hero] source[type=image/avif]').length).toBe(2);
    expect($('[data-hero] source[type=image/webp]').length).toBe(2);

    // rótulos vêm do heroLabels e levam às seções; nenhuma IA listada na capa
    const hero = $('[data-hero]').text();
    for (const side of ['mao', 'ia'] as const) {
      expect(hero).toContain(heroLabels[side].title[lang]);
      expect(hero).toContain(heroLabels[side].sub[lang]);
    }
    expect($('[data-hero] a[href=#fundamentals]').text()).toContain(heroLabels.mao.title[lang]);
    expect($('[data-hero] a[href=#ai]').text()).toContain(heroLabels.ia.title[lang]);
    for (const ai of ['Claude', 'GPT', 'Gemini', 'Copilot']) expect(hero).not.toContain(ai);

    // selo "portfólio vivo · projetos em evolução · nov 2026" (spec §4)
    const note = $('[data-hero] [data-living-note]').text();
    expect(note).toBe(`${heroBadge[lang]} · ${formatMonthYearShort(new Date(), lang)}`);
  });

  it('retícula servida como arquivo gerado no build, compartilhada por cabeçalho e capa', () => {
    const svg = readFileSync('dist/halftone.svg', 'utf8');
    expect(svg).toMatch(/^<svg[^>]*viewBox=/);
    const radii = [...svg.matchAll(/<pattern[^>]*>.*?r="([\d.]+)"/g)].map((m) => +m[1]);
    expect(radii.length).toBe(22);
    expect(radii).toEqual([...radii].sort((a, b) => a - b)); // os pontos só crescem: sem virada no meio
    expect(radii.at(-1)!).toBeGreaterThanOrEqual(14 * 0.625); // a última coluna fecha em laranja sólido
  });
});
