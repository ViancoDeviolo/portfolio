import { describe, expect, it } from 'vitest';
import { projectSchema, siteSchema } from '../../src/lib/schema';

const L = { pt: 'x', en: 'x' };
const base = () => ({
  order: 1,
  title: L,
  problem: L,
  stack: ['Astro'],
  media: [{ kind: 'image', src: '/media/x.webp', alt: L }],
  evidence: [{ value: '1', label: L, source: 'evidencias/x.txt' }],
  repo: { private: true },
  status: 'concluido',
  updated: '2026-11',
});
const validFund = () => ({ ...base(), side: 'fund', proves: L });
const validIa = () => ({ ...base(), side: 'ia', aiDid: L, iDecided: L });
const bad = (o: object) => expect(projectSchema.safeParse(o).success).toBe(false);

describe('projectSchema', () => {
  it('aceita fichas válidas', () => {
    expect(projectSchema.safeParse(validIa()).success).toBe(true);
    expect(projectSchema.safeParse(validFund()).success).toBe(true);
  });
  it('rejeita EN ausente ou vazio', () => {
    bad({ ...validIa(), title: { pt: 'X' } });
    bad({ ...validIa(), title: { pt: 'X', en: '  ' } });
  });
  it('exige campos do lado', () => {
    bad({ ...validIa(), aiDid: undefined });
    bad({ ...validIa(), iDecided: undefined });
    bad({ ...validFund(), proves: undefined });
  });
  it('aceita iDecidedLabel opcional no lado IA, com PT e EN', () => {
    const r = projectSchema.safeParse({ ...validIa(), iDecidedLabel: { pt: 'O que eu aprovei e defendi', en: 'What I approved and defended' } });
    expect(r.success && r.data.side === 'ia' && r.data.iDecidedLabel?.pt).toBe('O que eu aprovei e defendi');
    expect(projectSchema.safeParse(validIa()).success).toBe(true);
    bad({ ...validIa(), iDecidedLabel: { pt: 'X' } });
  });
  it('aceita mais de um repositório com rótulo PT e EN', () => {
    const links = [{ label: { pt: 'Java', en: 'Java' }, url: 'https://github.com/a/j' }, { label: { pt: 'Python', en: 'Python' }, url: 'https://github.com/a/p' }];
    expect(projectSchema.safeParse({ ...validFund(), repo: { links } }).success).toBe(true);
    bad({ ...validFund(), repo: { links: [links[0]] } });
    bad({ ...validFund(), repo: { links: [{ ...links[0], label: { pt: 'Java' } }, links[1]] } });
  });
  it('rejeita equipe sem papel, vídeo incompleto, data e nextSteps inválidos', () => {
    bad({ ...validIa(), team: { size: 5 } });
    bad({ ...validIa(), media: [{ kind: 'video', src: '/media/x.mp4', alt: L }] });
    bad({ ...validIa(), updated: '2026-13' });
    bad({ ...validIa(), nextSteps: [L, L, L, L] });
  });
});

describe('lastChange', () => {
  it('é opcional e exige PT e EN quando presente', () => {
    expect(projectSchema.safeParse(validIa()).success).toBe(true);
    expect(projectSchema.safeParse({ ...validIa(), lastChange: L }).success).toBe(true);
    bad({ ...validIa(), lastChange: { pt: 'x' } });
  });
});

describe('siteSchema: telas novas', () => {
  const site = () => ({
    name: 'x', tagline: L, heroAlt: { casual: L, terno: L }, heroBadge: L,
    sections: Object.fromEntries(['living', 'ai', 'fundamentals', 'workflow', 'contact'].map((k) => [k, { kicker: L, title: L }])),
    studyingNow: [L], about: L,
    ui: {
      legend: { mao: L, ia: L }, next: L, result: L, codeBy: L, nextCard: { kicker: L, title: L, body: L },
      request: L, answerOf: L, highlight: L, evolution: { title: L, before: L, after: L }, studying: L, cv: L, footerNote: L, navLabel: L,
    },
    contact: { emailUser: 'a', emailDomain: 'b.c', linkedin: 'https://a.b', github: 'https://a.b' },
    statusLabels: { concluido: L, 'em-evolucao': L, 'em-desenvolvimento': L },
    heroLabels: { mao: { title: L, sub: L }, ia: { title: L, sub: L } },
    nav: [{ id: 'ai', label: L }],
    method: [L, L, L],
    comparison: { prompt: L, answers: [{ ai: 'Gemini', excerpt: L }, { ai: 'Copilot', excerpt: L }, { ai: 'GPT', excerpt: L }] },
    evolution: [{ label: L, before: L, after: L }],
  });
  const badSite = (o: object) => expect(siteSchema.safeParse(o).success).toBe(false);
  it('aceita comparação com 3 respostas e sem conclusion', () => {
    expect(siteSchema.safeParse(site()).error?.issues).toBeUndefined();
  });
  it('rejeita IA desconhecida e IA repetida', () => {
    const s = site();
    badSite({ ...s, comparison: { ...s.comparison, answers: [{ ai: 'Bard', excerpt: L }] } });
    badSite({ ...s, comparison: { ...s.comparison, answers: [{ ai: 'GPT', excerpt: L }, { ai: 'GPT', excerpt: L }] } });
  });
  it('rejeita method com 2 itens e evolution vazia', () => {
    badSite({ ...site(), method: [L, L] });
    badSite({ ...site(), evolution: [] });
  });
});
