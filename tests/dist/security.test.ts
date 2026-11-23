import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { externalLinks, load, resourceUrls, tags } from './html';
import { SITE_URL } from '../../astro.config.mjs';

const SITE_ORIGIN = new URL(SITE_URL).origin;
const PAGES = ['index.html', 'en/index.html', 'privacidade/index.html', 'en/privacy/index.html', 'termos/index.html', 'en/terms/index.html'];

const totalJsBytes = (dir: string) =>
  readdirSync(dir).filter((f) => f.endsWith('.js')).reduce((n, f) => n + statSync(join(dir, f)).size, 0);

describe.each(PAGES)('superfície %s', (file) => {
  const { html } = load(file);
  it('sem script inline nem style', () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).not.toMatch(/<style[\s>]|\sstyle="/);
  });
  it('nenhum recurso de terceiros', () => {
    const own = (u: string) => new URL(u, SITE_URL).origin === SITE_ORIGIN;
    expect(resourceUrls(html).filter((u) => !own(u))).toEqual([]);
  });
  it('canonical e alternate só apontam para o próprio site', () => {
    for (const u of resourceUrls(html, ['canonical', 'alternate'])) expect(new URL(u, SITE_URL).origin).toBe(SITE_ORIGIN);
  });
  it('links externos com noopener noreferrer', () => {
    for (const a of externalLinks(html)) expect(a.rel, a.href).toBe('noopener noreferrer');
  });
});

it('o matcher enxerga elementos (não passa vazio)', () => {
  const { html } = load('index.html');
  expect(tags(html, 'a').length).toBeGreaterThan(0);
  expect(tags(html, 'script').length).toBeGreaterThan(0);
  expect(resourceUrls(html).length).toBeGreaterThan(0);
  expect(externalLinks(html).length).toBeGreaterThan(0);
});

it('JS total abaixo de 15 KB', () => {
  expect(totalJsBytes('dist/_astro')).toBeLessThan(15 * 1024);
});

it('o build publica o _headers com a CSP', () => {
  expect(readFileSync('dist/_headers', 'utf8')).toContain('Content-Security-Policy');
});

it('404.html existe, com noindex e links para as duas home', () => {
  const { html } = load('404.html');
  expect(html).toContain('<meta name="robots" content="noindex"');
  const hrefs = tags(html, 'a').map((a) => a.href);
  expect(hrefs).toContain('/');
  expect(hrefs).toContain('/en/');
  expect(tags(html, 'h1')).toHaveLength(1);
});

describe.each(['index.html', 'en/index.html', 'privacidade/index.html', 'en/privacy/index.html', 'termos/index.html', 'en/terms/index.html'])('Open Graph %s', (file) => {
  const { html } = load(file);
  const og = (p: string) => html.match(new RegExp(`<meta (?:property|name)="${p}" content="([^"]*)"`))?.[1];
  it('tags completas, URLs absolutas e do próprio site', () => {
    for (const p of ['og:title', 'og:description', 'og:url', 'og:locale', 'og:locale:alternate', 'og:image', 'og:image:alt']) expect(og(p), p).toBeTruthy();
    expect(og('og:type')).toBe('website');
    expect(og('twitter:card')).toBe('summary_large_image');
    for (const p of ['og:url', 'og:image']) expect(new URL(og(p)!).origin, p).toBe(SITE_ORIGIN);
    expect(og('og:url')).toBe(resourceUrls(html, ['canonical'])[0]);
  });
});
