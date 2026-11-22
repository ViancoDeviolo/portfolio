import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml'; // transitiva (vem com o Astro); sem dependência nova

export type Evidence = { value: string; source: string };

// Tokens com dígito permitidos em prosa sem evidência: nomes de tecnologia.
export const ALLOWED_TOKENS = ['Java 17', 'Python 3', 'OAS 3.1'];

const walk = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => walk(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, out));
  return out;
};

// Números em texto PT/EN da ficha (fora de evidence e stack), sem anos de `updated` nem ALLOWED_TOKENS.
export function numbersInProse(p: Record<string, any>): string[] {
  const { evidence, stack, updated, ...prose } = p;
  const year = String(updated ?? '').slice(0, 4);
  return walk(prose)
    .map((s) => ALLOWED_TOKENS.reduce((acc, t) => acc.split(t).join(' '), s))
    .flatMap((s) => s.match(/\d+(?:[.,]\d+)*/g) ?? [])
    .filter((n) => n !== year);
}

export function checkProject(file: string, root: string): string[] {
  const p = parse(readFileSync(file, 'utf8'));
  const md = readFileSync(`${root}/docs/EVIDENCIAS.md`, 'utf8');
  const errs: string[] = [];
  for (const e of (p.evidence ?? []) as Evidence[]) {
    if (e.source.startsWith('evidencias/')) {
      const f = `${root}/src/content/${e.source}`;
      if (!existsSync(f) || !readFileSync(f, 'utf8').includes(e.value)) errs.push(`"${e.value}" não consta em ${e.source}`);
    } else if (/^media\/[^/]+\/[^/]+\.webp$/.test(e.source)) {
      if (!existsSync(`${root}/public/${e.source}`)) errs.push(`falta public/${e.source}`);
      if (!md.includes(e.source)) errs.push(`${e.source} fora de docs/EVIDENCIAS.md`);
    } else if (/^https:\/\/github\.com\//.test(e.source)) {
      if (!md.includes(e.source)) errs.push(`${e.source} fora de docs/EVIDENCIAS.md`);
    } else errs.push(`origem inválida: ${e.source}`);
  }
  const all = ((p.evidence ?? []) as Evidence[]).map((e) => e.value).join(' ');
  for (const n of numbersInProse(p)) if (!all.includes(n)) errs.push(`número "${n}" na prosa sem evidência`);
  return errs;
}
