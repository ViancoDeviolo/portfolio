import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { load } from './html';
import { SITE_URL } from '../../astro.config.mjs';

describe('layout base', () => {
  it.each([
    ['index.html', 'pt-BR', '/en/'],
    ['en/index.html', 'en', '/'],
  ])('%s', (file, lang, alt) => {
    const $ = load(file);
    expect($('html').attr('lang')).toBe(lang);
    expect($('link[rel=alternate][hreflang=pt-BR]').attr('href')).toBe(`${SITE_URL}/`);
    expect($('link[rel=alternate][hreflang=en]').attr('href')).toBe(`${SITE_URL}/en/`);
    expect($('link[rel=alternate][hreflang=x-default]').length).toBe(1);
    expect($('link[rel=alternate][hreflang=x-default]').attr('href')).toBe(`${SITE_URL}/`);
    expect($('link[rel=canonical]').attr('href')).toMatch(/^https:\/\//);
    expect($('a.skip-link').attr('href')).toBe('#main');
    expect($('header').length).toBe(1);
    expect($('main#main').length).toBe(1);
    expect($('footer').length).toBe(1);
    expect($('h1').length).toBe(1);
    expect($('meta[name=description]').attr('content')).toBeTruthy();
    expect($('a[data-lang-switch]').attr('href')).toBe(alt);
  });

  // Script e style embutidos (runtime das ilhas do Astro) são permitidos só com hash na CSP: ver security.test.ts.
  it('não tem atributo style inline', () => {
    for (const file of ['index.html', 'en/index.html']) expect(load(file).html).not.toMatch(/\sstyle\s*=/i);
  });
});

describe('fontes', () => {
  const fontes = [
    'instrument-serif-italic-latin',
    'archivo-900-latin',
    'inter-400-latin',
    'inter-500-latin',
    'inter-600-latin',
  ];
  const css = () =>
    readdirSync('dist/_astro')
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(`dist/_astro/${f}`, 'utf8'))
      .join('\n');

  it.each(fontes)('%s existe em dist/fonts e é usada no CSS', (nome) => {
    expect(existsSync(`dist/fonts/${nome}.woff2`)).toBe(true);
    expect(css()).toContain(`/fonts/${nome}.woff2`);
  });

  it('não usa URL externa de fonte', () => {
    expect(css()).not.toMatch(/url\(\s*['"]?(https?:)?\/\//);
    expect(load('index.html').html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});
