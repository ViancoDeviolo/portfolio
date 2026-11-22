import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/lib/schema';

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
  it('rejeita equipe sem papel, vídeo incompleto, data e nextSteps inválidos', () => {
    bad({ ...validIa(), team: { size: 5 } });
    bad({ ...validIa(), media: [{ kind: 'video', src: '/media/x.mp4', alt: L }] });
    bad({ ...validIa(), updated: '2026-13' });
    bad({ ...validIa(), nextSteps: [L, L, L, L] });
  });
});
