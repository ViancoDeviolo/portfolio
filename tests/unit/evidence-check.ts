import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml'; // transitiva (vem com o Astro); sem dependência nova

export type Evidence = { value: string | number; label?: { pt?: string; en?: string }; source: string };

// Tokens com dígito permitidos em prosa sem evidência: nomes de tecnologia.
export const ALLOWED_TOKENS = ['Java 17', 'Python 3', 'OAS 3.1'];

const NUM = /\d+(?:[.,]\d+)*/g;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Correspondência exata: o valor não pode ser pedaço de outro número.
const exact = (v: string) => new RegExp(`(?<![\\d.,])${esc(v)}(?!\\d|[.,]\\d)`);

const walk = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v);
  else if (typeof v === 'number') out.push(String(v));
  else if (Array.isArray(v)) v.forEach((x) => walk(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, out));
  return out;
};

export const numbersIn = (texts: string[]): string[] =>
  texts
    .map((s) => ALLOWED_TOKENS.reduce((acc, t) => acc.replace(new RegExp(`\\b${esc(t)}\\b`, 'g'), ' '), s))
    .flatMap((s) => s.match(NUM) ?? []);

// Números em texto PT/EN da ficha (fora de evidence, stack e order), sem o ano de `updated`.
export function numbersInProse(p: Record<string, any>): string[] {
  const { evidence, stack, updated, order, ...prose } = p;
  const year = String(updated ?? '').slice(0, 4);
  return numbersIn(walk(prose)).filter((n) => n !== year);
}

export function checkData(p: Record<string, any>, root: string): string[] {
  const md = readFileSync(`${root}/docs/EVIDENCIAS.md`, 'utf8').split('\n');
  const evs = (p.evidence ?? []) as Evidence[];
  const errs: string[] = [];
  for (const e of evs) {
    const v = String(e.value);
    if (e.source.startsWith('evidencias/')) {
      const f = `${root}/src/content/${e.source}`;
      if (!existsSync(f) || !exact(v).test(readFileSync(f, 'utf8'))) errs.push(`"${v}" não consta em ${e.source}`);
    } else if (/^media\/[^/]+\/[^/]+\.webp$/.test(e.source) || /^https:\/\/github\.com\//.test(e.source)) {
      if (e.source.startsWith('media/') && !existsSync(`${root}/public/${e.source}`)) errs.push(`falta public/${e.source}`);
      // valor e fonte precisam estar na mesma linha de docs/EVIDENCIAS.md
      if (!md.some((l) => l.includes(e.source) && exact(v).test(l.split(e.source).join(' ')))) errs.push(`"${v}" e ${e.source} não estão na mesma linha de docs/EVIDENCIAS.md`);
    } else errs.push(`origem inválida: ${e.source}`);
    const own = new Set(numbersIn([v]));
    for (const n of numbersIn(walk(e.label ?? {}))) if (!own.has(n)) errs.push(`número "${n}" no rótulo sem estar no valor "${v}"`);
  }
  const all = new Set(numbersIn(evs.map((e) => String(e.value))));
  for (const n of numbersInProse(p)) if (!all.has(n)) errs.push(`número "${n}" na prosa sem evidência`);
  return errs;
}

export const checkProject = (file: string, root: string) => checkData(parse(readFileSync(file, 'utf8')), root);

// Mídia declarada nas fichas (src/content/projects/*.yaml).
export function allProjectMedia(root = process.cwd()): { kind: string; src: string; poster?: string }[] {
  const dir = `${root}/src/content/projects`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .flatMap((f) => parse(readFileSync(`${dir}/${f}`, 'utf8')).media ?? []);
}
