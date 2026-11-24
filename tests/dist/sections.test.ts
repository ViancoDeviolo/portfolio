import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml'; // transitiva (vem com o Astro)
import { ids, load, text } from './html';
import { SECTION_IDS } from '../../src/lib/i18n';

const site = parse(readFileSync('src/content/site.yaml', 'utf8')).site;
const snippet = readFileSync('src/content/snippets/calculadora-ideiaV1.py', 'utf8');
const AIS = ['Claude', 'GPT', 'Gemini', 'Copilot'] as const;

describe.each([
  ['index.html', 'pt', '/lucas-cruz-cv.pdf', 'lucascruzcorp [arroba] gmail.com'],
  ['en/index.html', 'en', '/lucas-cruz-cv-en.pdf', 'lucascruzcorp [at] gmail.com'],
] as const)('seções %s', (file, lang, cv, noscript) => {
  const $ = load(file);

  it('telas na ordem de SECTION_IDS, cada uma com h2; sem Stack nem Sobre', () => {
    expect(ids($('main > section'))).toEqual(['top', ...SECTION_IDS]);
    for (const id of SECTION_IDS) expect($(`section#${id} h2`).length, id).toBeGreaterThan(0);
    expect($('#stack').length).toBe(0);
    expect($('#about').length).toBe(0);
  });

  it('navegação aponta para Projetos (#living), Como eu uso IA, Fundamentos e Contato', () => {
    const hrefs = $('header nav a').nodes.map((a) => a.attrs.href.replace(/^.*#/, '#'));
    expect(hrefs).toEqual(['#living', '#workflow', '#fundamentals', '#contact']);
  });

  it('tela 04 mostra o snippet inteiro, sem edição', () => {
    expect($('#fundamentals pre').length).toBe(1);
    expect($('#fundamentals pre').text()).toBe(text(snippet));
    // quebras de linha preservadas: o <pre> traz o arquivo tal como está
    const raw = $.html.match(/<pre[^>]*data-snippet[^>]*>([\s\S]*?)<\/pre>/)?.[1] ?? '';
    expect(raw.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')).toBe(snippet.trimEnd());
  });

  it('tela 05: método, pedido, respostas reais e evolução; nenhuma IA sem resposta', () => {
    const wf = $('#workflow').text();
    expect($('#workflow ol.method > li').length).toBe(3);
    for (const m of site.method) expect(wf).toContain(m[lang]);
    expect(wf).toContain(site.comparison.prompt[lang]);
    const answered = site.comparison.answers.map((a: { ai: string }) => a.ai);
    expect([...answered].sort()).toEqual(['Copilot', 'GPT', 'Gemini']); // hoje: sem Claude
    for (const ai of AIS) expect(wf.includes(ai), ai).toBe(answered.includes(ai));
    expect($('#workflow [data-answer]').length).toBe(answered.length >= 3 ? answered.length : 0);
    for (const e of site.evolution) expect(wf).toContain(e.label[lang]);
    expect($('#workflow img').length).toBe(0);
  });

  it('tela 06: estudando agora e o texto curto sobre mim', () => {
    const c = $('#contact').text();
    expect(site.studyingNow).toHaveLength(3);
    for (const s of site.studyingNow) expect(c).toContain(s[lang]);
    expect(c).toContain(site.about[lang]);
  });

  it('e-mail sem literal no HTML', () => {
    expect($.html).not.toContain('lucascruzcorp@gmail.com');
    expect($.html).not.toMatch(/mailto:/i);
    const mail = $('#contact a[data-user=lucascruzcorp]');
    expect(mail.length).toBe(1);
    expect(mail.attr('data-domain')).toBe('gmail.com');
    expect(mail.attr('href')).toBeUndefined();
    expect($('#contact noscript').text()).toBe(noscript);
  });

  it('links externos e CV', () => {
    expect($('#contact a[href="https://www.linkedin.com/in/lucas-alves-cruz/"]').attr('rel')).toBe('noopener noreferrer');
    expect($('#contact a[href="https://github.com/ViancoDeviolo"]').attr('rel')).toBe('noopener noreferrer');
    expect($(`#contact a[href="${cv}"]`).length).toBe(1);
  });
});
