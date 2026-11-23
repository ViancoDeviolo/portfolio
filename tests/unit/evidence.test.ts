import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkData, checkProject } from './evidence-check';

const root = resolve(__dirname, '../..');
const dir = `${root}/src/content/projects`;
const fichas = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')) : [];
const TXT = 'evidencias/analitic-blitz-pytest-resumo.txt';
const l = (s: string) => ({ pt: s, en: s });
const ficha = (prose: string, evidence: any[]) => ({ order: 1, title: l('x'), problem: l(prose), evidence });

describe('nenhum número sem origem', () => {
  for (const f of fichas) it(`ficha ${f}`, () => expect(checkProject(`${dir}/${f}`, root)).toEqual([]));

  it('reprova a ficha falsa com 539 contra o resumo do Analitic Blitz', () => {
    const errs = checkProject(`${root}/tests/unit/fixtures/ficha-falsa-539.yaml`, root);
    expect(errs).toContain(`"539" não consta em ${TXT}`);
  });

  it('aceita valor exato do arquivo', () => {
    expect(checkData(ficha('Cobertura de 98%', [{ value: '98%', label: l('98%'), source: TXT }]), root)).toEqual([]);
  });

  it('reprova valor que é pedaço de outro número no .txt (53 vs 537)', () => {
    expect(checkData(ficha('x', [{ value: '53', label: l('x'), source: TXT }]), root)).toContain(`"53" não consta em ${TXT}`);
  });

  it('reprova número da prosa que é pedaço de valor de evidência (5 vs 98%)', () => {
    const errs = checkData(ficha('5 testes', [{ value: '98%', label: l('cobertura'), source: TXT }]), root);
    expect(errs).toContain('número "5" na prosa sem evidência');
  });

  it('reprova número no rótulo diferente do valor (539 testes vs 537)', () => {
    const errs = checkData(ficha('x', [{ value: '537', label: l('539 testes'), source: TXT }]), root);
    expect(errs).toContain('número "539" no rótulo sem estar no valor "537" nem na fonte');
  });

  it('aceita número do rótulo que está na mesma fonte e o conta para a prosa (537 em 158.83s)', () => {
    const ev = [{ value: '537', label: l('testes em 158.83s'), source: TXT }];
    expect(checkData(ficha('537 testes em 158.83s', ev), root)).toEqual([]);
    expect(checkData(ficha('537 testes em 159s', ev), root)).toContain('número "159" na prosa sem evidência');
  });

  it('aceita rótulo com número da linha da fonte em EVIDENCIAS.md (164 em 24 h), mas não de outra linha', () => {
    const src = 'media/arapuca/arapuca-ataques-reais.webp';
    expect(checkData(ficha('164 em 24 horas', [{ value: '164', label: l('em 24 h'), source: src }]), root)).toEqual([]);
    expect(checkData(ficha('x', [{ value: '164', label: l('em 25 h'), source: src }]), root)).toContain(
      'número "25" no rótulo sem estar no valor "164" nem na fonte',
    );
  });

  it('versão de tecnologia só é liberada inteira (Python 3, não Python 3.13)', () => {
    expect(checkData(ficha('Python 3 e Java 17', []), root)).toEqual([]);
    expect(checkData(ficha('Python 3.13', []), root)).toContain('número "3.13" na prosa sem evidência');
  });

  it('ano de `updated` na prosa também precisa de evidência', () => {
    expect(checkData({ ...ficha('feito em 2026', []), updated: '2026-11' }, root)).toContain('número "2026" na prosa sem evidência');
  });

  it("reprova fonte que sai da pasta com '..'", () => {
    const src = 'evidencias/../../package.json';
    expect(checkData(ficha('x', [{ value: '1', label: l('x'), source: src }]), root)).toContain(`origem inválida: ${src}`);
  });

  it('vírgula e ponto decimal são o mesmo número (0.63 na prosa EN, 0,63 na fonte)', () => {
    const src = 'media/calculadoras/calculadoras-lado-a-lado.webp';
    const ev = [{ value: '0,63', label: l('Java'), source: src }];
    expect(checkData({ ...ficha('x', ev), problem: { pt: 'dá 0,63', en: 'prints 0.63' } }, root)).toEqual([]);
    expect(checkData({ ...ficha('x', ev), problem: { pt: 'dá 0,63', en: 'prints 0.64' } }, root)).toContain(
      'número "0.64" na prosa sem evidência',
    );
  });

  it('numérico no YAML não quebra e é verificado (valor e team.size)', () => {
    const errs = checkData({ ...ficha('x', [{ value: 539, label: l('x'), source: TXT }]), team: { size: 5 } }, root);
    expect(errs).toContain(`"539" não consta em ${TXT}`);
    expect(errs).toContain('número "5" na prosa sem evidência');
  });

  it('ignora dígitos em caminhos e URLs, mas não no alt', () => {
    const media = [{ kind: 'video', src: '/media/x/y.mp4', poster: '/media/x/y2.webp', alt: l('x') }];
    expect(checkData({ ...ficha('x', []), media, repo: { url: 'https://github.com/a/b2' } }, root)).toEqual([]);
    expect(checkData({ ...ficha('x', []), media: [{ ...media[0], alt: l('9 telas') }] }, root)).toContain('número "9" na prosa sem evidência');
  });

  it('reprova mídia cujo valor não está na linha da fonte em EVIDENCIAS.md', () => {
    const src = 'media/analitic-blitz/analitic-backtest-2021-2025.webp';
    const errs = checkData(ficha('x', [{ value: '999', label: l('x'), source: src }]), root);
    expect(errs).toContain(`"999" e ${src} não estão na mesma linha de docs/EVIDENCIAS.md`);
  });

  it('reprova valor que só aparece dentro da própria fonte (hash do commit, caminho)', () => {
    const gh = 'https://github.com/ViancoDeviolo/arapuca-honeyant/tree/f5e8c838c4638232c725d69202f0e0c6e90d5559/docs/adr';
    const media = 'media/analitic-blitz/analitic-ao-vivo.webp';
    for (const [value, src] of [['5', gh], ['webp', media]]) {
      expect(checkData(ficha('x', [{ value, label: l('x'), source: src }]), root)).toContain(
        `"${value}" e ${src} não estão na mesma linha de docs/EVIDENCIAS.md`,
      );
    }
  });

  it('reprova URL do GitHub cujo valor não está na linha da fonte', () => {
    const src = 'https://github.com/ViancoDeviolo/arapuca-honeyant/tree/f5e8c838c4638232c725d69202f0e0c6e90d5559/docs/adr';
    const errs = checkData(ficha('x', [{ value: '12', label: l('x'), source: src }]), root);
    expect(errs).toContain(`"12" e ${src} não estão na mesma linha de docs/EVIDENCIAS.md`);
    expect(checkData(ficha('11 ADRs', [{ value: '11', label: l('11 ADRs'), source: src }]), root)).toEqual([]);
  });
});
