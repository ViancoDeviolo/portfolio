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

  it('não tem script, style nem atributo style inline', () => {
    for (const file of ['index.html', 'en/index.html']) {
      const { html } = load(file);
      expect(html).not.toMatch(/<style\b/i);
      expect(html).not.toMatch(/\sstyle\s*=/i);
      expect(html).not.toMatch(/<script\b(?![^>]*\bsrc=)/i);
    }
  });
});
