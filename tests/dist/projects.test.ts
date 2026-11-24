import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml'; // transitiva (vem com o Astro)
import { ids, load } from './html';
import { formatMonthYear } from '../../src/lib/date';

const dir = 'src/content/projects';
const projects = readdirSync(dir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ id: f.replace(/\.yaml$/, ''), ...parse(readFileSync(`${dir}/${f}`, 'utf8')) }))
  .sort((a, b) => a.order - b.order);
const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const site = parse(readFileSync('src/content/site.yaml', 'utf8')).site;
const ia = projects.filter((p) => p.side === 'ia');

describe('projetos', () => {
  it.each([
    ['index.html', 'pt', 'repositório privado'],
    ['en/index.html', 'en', 'private repository'],
  ] as const)('%s', (file, lang, privateLabel) => {
    const $ = load(file);

    // tela 02: uma etiqueta por projeto, com status, levando ao projeto
    for (const p of projects) {
      const tag = $(`[data-living-tag][data-project-id=${p.id}]`);
      expect(tag.length, p.id).toBe(1);
      expect(tag.nodes[0].tag).toBe('a');
      expect(tag.attr('href')).toBe(`#p-${p.id}`);
      expect(tag.attr('data-side')).toBe(p.side);
      expect(tag.text()).toContain(p.title[lang]);
      expect(tag.text()).toContain(site.statusLabels[p.status][lang]);
      expect($(`#p-${p.id}`).length, `alvo #p-${p.id}`).toBe(1);
    }
    expect($('[data-living-tag]').length).toBe(projects.length);
    expect($('#living [data-living-tag]').length).toBe(projects.length);

    // tela 03: uma tela por projeto de IA, com contador e "próximo"
    expect(ids($('#ai article[data-ai-screen]'))).toEqual(ia.map((p) => `p-${p.id}`));
    ia.forEach((p, i) => {
      const s = `#p-${p.id}`;
      expect($(`${s} [data-media-frame]`).length, p.id).toBe(1);
      expect($(`${s} [data-counter]`).text()).toBe(`${String(i + 1).padStart(2, '0')} / ${String(ia.length).padStart(2, '0')}`);
      expect($(`${s} a[data-next]`).attr('href')).toBe(i < ia.length - 1 ? `#p-${ia[i + 1].id}` : '#fundamentals');
      for (const b of ['problem', 'iDecided', 'aiDid', 'evidence']) expect($(`${s} [data-block=${b}]`).length, `${p.id} ${b}`).toBe(1);
      expect($(`${s} [data-block=iDecided]`).text()).toContain(p.iDecided[lang]);
      expect($(`${s} [data-block=iDecided]`).text()).toContain(p.iDecidedLabel?.[lang] ?? (lang === 'pt' ? 'O que eu decidi' : 'What I decided'));
      expect($(`${s} [data-block=aiDid]`).text()).toContain(p.aiDid[lang]);
      expect($(`${s} [data-block=problem]`).text()).toContain(p.problem[lang]);
    });

    // tela 04: cards à mão; o Banco é preto (laranja é a cor da IA)
    expect(ids($('#fundamentals article'))).toEqual(['p-banco-java', 'p-calculadoras']);
    expect($('#p-banco-java[data-tone=ink]').length).toBe(1);
    expect($('#p-calculadoras[data-tone=mao]').length).toBe(1);
    for (const p of projects.filter((x) => x.side === 'fund')) expect($(`#p-${p.id}`).text()).toContain(p.proves[lang]);

    expect($('#p-nfe-hub').text()).toContain(privateLabel);
    expect($('#p-renovacao-apolices').text()).toContain(privateLabel);
    expect($('#p-easyfood').text()).not.toContain(privateLabel);
    expect($('#p-arapuca').text()).toContain(byId.arapuca.team.role[lang]);

    for (const p of projects) {
      const card = $(`#p-${p.id}`).text();
      expect(card).toContain(site.statusLabels[p.status][lang]);
      expect(card).toContain(formatMonthYear(new Date(`${p.updated}-15T12:00:00Z`), lang));
      for (const s of p.nextSteps ?? []) expect(card).toContain(s[lang]);
      if (p.repo.url) expect($(`#p-${p.id} a[href=${p.repo.url}]`).length).toBe(1);
      for (const r of p.repo.links ?? []) expect($(`#p-${p.id} a[href=${r.url}]`).text()).toContain(r.label[lang]);
      for (const e of p.evidence) expect(card).toContain(e.label[lang]);
    }

    // toda mídia de toda ficha aparece: a primeira na moldura (tela 03) ou no card (tela 04), as outras na fileira compacta
    for (const p of projects) {
      expect($(`#p-${p.id} figure.media`).length, p.id).toBe(p.media.length);
      if (p.side === 'ia') expect($(`#p-${p.id} [data-media-frame] figure.media`).length, p.id).toBe(1);
      const videos = $(`#p-${p.id} video`).nodes.map((v) => v.attrs);
      const alts = $(`#p-${p.id} img`).nodes.map((i) => i.attrs.alt);
      for (const m of p.media) {
        if (m.kind === 'video') expect(videos.some((v) => v.src === m.src && v['aria-label'] === m.alt[lang]), m.src).toBe(true);
        else expect(alts, m.src).toContain(m.alt[lang]);
      }
    }

    // decimal no formato do idioma; nenhum valor de evidência em português na página em inglês
    expect($('#p-calculadoras dd').text()).toBe(lang === 'pt' ? '0,63 0,62' : '0.63 0.62');
    expect($('#p-analitic-blitz dd').text()).toContain(lang === 'pt' ? '2021 a 2025' : '2021 to 2025');
    if (lang === 'en') expect($('.evidence dd').text()).not.toMatch(/\b(a|em)\b|\d,\d/);

    const videos = $('video').nodes;
    expect(videos.length).toBeGreaterThan(0);
    expect(videos.every((v) => 'muted' in v.attrs && 'loop' in v.attrs && 'playsinline' in v.attrs && 'controls' in v.attrs
      && v.attrs.preload === 'none' && !v.attrs.poster && 'data-autoplay' in v.attrs && v.attrs['aria-label'])).toBe(true);
    // pôster é <img> lazy sob o vídeo (o atributo poster baixaria todos de imediato); funciona sem JS
    const posters = $('.frame img.poster').nodes;
    expect(posters.length).toBe(videos.length);
    expect(posters.every((i) => /-poster\.webp$/.test(i.attrs.src) && i.attrs.loading === 'lazy' && i.attrs.alt === '' && i.attrs.width && i.attrs.height)).toBe(true);
    expect($('video[autoplay]').length).toBe(0); // autoplay só via JS
    expect($('button[aria-pressed]').length).toBe(videos.length);
    expect($('button.video-toggle[aria-label] .glyph[aria-hidden=true]').length).toBe(videos.length);

    // prints responsivos: AVIF + WebP gerados pelo Astro, nunca o arquivo original
    const prints = $('figure.media img').nodes.filter((i) => i.attrs.class !== 'poster');
    expect(prints.length).toBeGreaterThan(0);
    expect(prints.every((i) => i.attrs.src.startsWith('/_astro/') && /\b400w\b/.test(i.attrs.srcset ?? '') && i.attrs.alt)).toBe(true);
    expect($('figure.media picture source[type=image/avif]').length).toBe(prints.length);

    // nomes de tecnologia e saída de terminal não passam pelo tradutor automático
    expect($('ul.stack[translate=no]').length).toBe(projects.length);
    expect($('pre.terminal[translate=no]').length).toBe($('pre.terminal').length);
    expect($('pre.terminal').length).toBe(projects.filter((p) => p.terminal).length);
    expect($('pre.terminal[tabindex=0][role=region]').length).toBe($('pre.terminal').length);

    const external = $('main a').nodes.filter((a) => /^https?:/.test(a.attrs.href ?? ''));
    expect(external.length).toBeGreaterThan(0);
    expect(external.every((a) => a.attrs.rel === 'noopener noreferrer')).toBe(true);
  });
});
