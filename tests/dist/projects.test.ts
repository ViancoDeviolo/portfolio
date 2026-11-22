import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml'; // transitiva (vem com o Astro)
import { ids, load } from './html';
import { formatMonthYear } from '../../src/lib/date';

const dir = 'src/content/projects';
const projects = readdirSync(dir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ id: f.replace(/\.yaml$/, ''), ...parse(readFileSync(`${dir}/${f}`, 'utf8')) }));
const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const site = parse(readFileSync('src/content/site.yaml', 'utf8')).site;

describe('cards de projeto', () => {
  it.each([
    ['index.html', 'pt', 'repositório privado'],
    ['en/index.html', 'en', 'private repository'],
  ] as const)('%s', (file, lang, privateLabel) => {
    const $ = load(file);
    const cardsIn = (sel: string) => ids($(`${sel} article.project-card`));

    const sections = ids($('main section'));
    expect(sections).toEqual(expect.arrayContaining(['fundamentals', 'ai']));
    expect(sections.indexOf('fundamentals')).toBeLessThan(sections.indexOf('ai'));
    expect($('section#ai[data-side=ia]').length).toBe(1);

    expect(cardsIn('#fundamentals')).toEqual(['banco-java', 'calculadoras']);
    expect(cardsIn('#ai')).toEqual(['arapuca', 'easyfood', 'analitic-blitz', 'nfe-hub', 'renovacao-apolices']);
    expect($('#banco-java.anchor').length).toBe(1);

    expect($('#fundamentals .building-card').length).toBe(1);
    for (const s of site.studyingNow) expect($('#fundamentals .building-card').text()).toContain(s[lang]);

    expect($('#nfe-hub').text()).toContain(privateLabel);
    expect($('#renovacao-apolices').text()).toContain(privateLabel);
    expect($('#easyfood').text()).not.toContain(privateLabel);
    expect($('#arapuca').text()).toContain(byId.arapuca.team.role[lang]);

    for (const p of projects) {
      const card = $(`#${p.id}`).text();
      expect(card).toContain(p.problem[lang]);
      expect(card).toContain(site.statusLabels[p.status][lang]);
      expect(card).toContain(formatMonthYear(new Date(`${p.updated}-15T12:00:00Z`), lang));
      for (const s of p.nextSteps ?? []) expect(card).toContain(s[lang]);
      if (p.side === 'ia') {
        expect(card).toContain(p.iDecided[lang]);
        expect(card).toContain(p.iDecidedLabel?.[lang] ?? (lang === 'pt' ? 'O que eu decidi' : 'What I decided'));
      }
      else expect(card).toContain(p.proves[lang]);
      if (p.repo.url) expect($(`#${p.id} a[href=${p.repo.url}]`).length).toBe(1);
    }

    const videos = $('video').nodes;
    expect(videos.length).toBeGreaterThan(0);
    expect(videos.every((v) => 'muted' in v.attrs && 'loop' in v.attrs && 'playsinline' in v.attrs && 'controls' in v.attrs
      && v.attrs.preload === 'none' && v.attrs.poster && 'data-autoplay' in v.attrs)).toBe(true);
    expect($('video[autoplay]').length).toBe(0); // autoplay só via JS
    expect($('button[aria-pressed]').length).toBe(videos.length);
    expect($('button.video-toggle[aria-label] .glyph[aria-hidden=true]').length).toBe(videos.length);

    // prints responsivos: AVIF + WebP gerados pelo Astro, nunca o arquivo original
    const prints = $('.project-card img').nodes;
    expect(prints.length).toBeGreaterThan(0);
    expect(prints.every((i) => i.attrs.src.startsWith('/_astro/') && /\b400w\b/.test(i.attrs.srcset ?? ''))).toBe(true);
    expect($('.project-card picture source[type=image/avif]').length).toBe(prints.length);

    expect($('pre.terminal').length).toBe(projects.filter((p) => p.terminal).length);
    expect($('pre.terminal[tabindex=0][role=region]').length).toBe($('pre.terminal').length);

    const external = $('main a').nodes.filter((a) => /^https?:/.test(a.attrs.href ?? ''));
    expect(external.length).toBeGreaterThan(0);
    expect(external.every((a) => a.attrs.rel === 'noopener noreferrer')).toBe(true);
  });
});
