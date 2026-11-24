import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml'; // transitiva (vem com o Astro); sem dependência nova
import { projectSchema, siteSchema } from '../../src/lib/schema';

const root = resolve(__dirname, '../..');
const dir = `${root}/src/content/projects`;
const read = (f: string) => parse(readFileSync(f, 'utf8'));
const projects = (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')) : [])
  .map((f) => ({ id: f.replace(/\.yaml$/, ''), ...read(`${dir}/${f}`) }))
  .sort((a, b) => a.order - b.order);
const siteFile = `${root}/src/content/site.yaml`;
const site = existsSync(siteFile) ? read(siteFile).site : undefined;

describe('conteúdo do site', () => {
  it('fichas na ordem do §5.4, por lado', () => {
    expect(projects.filter((p) => p.side === 'fund').map((p) => p.id)).toEqual(['banco-java', 'calculadoras']);
    expect(projects.filter((p) => p.side === 'ia').map((p) => p.id)).toEqual(['arapuca', 'easyfood', 'analitic-blitz', 'nfe-hub', 'renovacao-apolices']);
  });

  it('Calculadoras aponta para os dois repositórios', () => {
    const calc = projects.find((p) => p.id === 'calculadoras');
    expect(calc.repo.links.map((r: { url: string }) => r.url)).toEqual([
      'https://github.com/ViancoDeviolo/calculadora-java',
      'https://github.com/ViancoDeviolo/calculadora-python',
    ]);
  });

  it('site.yaml e fichas passam nos esquemas', () => {
    expect(siteSchema.safeParse(site).error?.issues).toBeUndefined();
    expect(site.livingNote.pt).toContain('{date}');
    expect(site.livingNote.en).toContain('{date}');
    expect(projects).toHaveLength(7);
    for (const { id, ...p } of projects) expect(projectSchema.safeParse(p).error?.issues, id).toBeUndefined();
  });

  it('texto novo tem PT e EN; trechos da comparação cabem em 220 caracteres', () => {
    const texts = [
      site.about, site.comparison.prompt,
      ...site.method,
      ...Object.values<{ title: object; sub: object }>(site.heroLabels).flatMap((h) => [h.title, h.sub]),
      ...site.comparison.answers.map((a: { excerpt: object }) => a.excerpt),
      ...site.evolution.flatMap((e: { label: object; before: object; after: object }) => [e.label, e.before, e.after]),
    ] as { pt: string; en: string }[];
    for (const t of texts) {
      expect(t.pt?.trim().length).toBeGreaterThan(0);
      expect(t.en?.trim().length).toBeGreaterThan(0);
    }
    for (const a of site.comparison.answers) expect(a.excerpt.pt.length).toBeLessThanOrEqual(220);
  });
});
