import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml'; // transitiva (vem com o Astro); sem dependência nova

export type Evidence = { value: string | number; label?: { pt?: string; en?: string }; source: string };

// Tokens com dígito permitidos em prosa sem evidência: nomes de tecnologia.
export const ALLOWED_TOKENS = ['Java 17', 'Python 3', 'OAS 3.1'];

const NUM = /\d+(?:[.,]\d+)*/g;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Correspondência exata: o valor não pode ser pedaço de outro número.
const exact = (v: string) => new RegExp(`(?<![\\d.,])${esc(v)}(?!\\d|[.,]\\d)`);
// Vírgula ou ponto decimal: "0,63" na fonte PT é o mesmo número que "0.63" na prosa EN.
const norm = (n: string) => n.replace(/,/g, '.');

// Caminhos e URLs não são prosa: dígitos neles (".mp4", hash de commit) não são afirmações.
const NOT_PROSE = new Set(['src', 'poster', 'url', 'demo', 'source', 'file']);

const walk = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v);
  else if (typeof v === 'number') out.push(String(v));
  else if (Array.isArray(v)) v.forEach((x) => walk(x, out));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => NOT_PROSE.has(k) || walk(x, out));
  return out;
};

export const numbersIn = (texts: string[]): string[] =>
  texts
    .map((s) => ALLOWED_TOKENS.reduce((acc, t) => acc.replace(new RegExp(`\\b${esc(t)}\\b(?![.,]\\d)`, 'g'), ' '), s))
    .flatMap((s) => s.match(NUM) ?? []);

// Escopo: só as fichas de projeto; site.yaml e as páginas legais não são varridos.
// Números em texto PT/EN da ficha (fora de evidence, stack, order e da data `updated`).
export function numbersInProse(p: Record<string, any>): string[] {
  const { evidence, stack, updated, order, ...prose } = p;
  return numbersIn(walk(prose));
}

export function checkData(p: Record<string, any>, root: string): string[] {
  const md = readFileSync(`${root}/docs/EVIDENCIAS.md`, 'utf8').split('\n');
  const evs = (p.evidence ?? []) as Evidence[];
  const errs: string[] = [];
  const proven = new Set<string>();
  for (const e of evs) {
    const v = String(e.value);
    const file = `${root}/src/content/${e.source}`;
    // Trechos que provam a evidência: o .txt inteiro, ou cada linha da fonte em docs/EVIDENCIAS.md sem o próprio caminho.
    const proofs = e.source.startsWith('evidencias/')
      ? existsSync(file) ? [readFileSync(file, 'utf8')] : []
      : md.filter((l) => l.includes(e.source)).map((l) => l.split(e.source).join(' '));
    const inProof = (n: string) => proofs.some((t) => exact(n).test(t));
    if (e.source.split('/').includes('..')) errs.push(`origem inválida: ${e.source}`); // não sai da pasta de evidências
    else if (e.source.startsWith('evidencias/')) {
      if (!inProof(v)) errs.push(`"${v}" não consta em ${e.source}`);
    } else if (/^media\/[^/]+\/[^/]+\.webp$/.test(e.source) || /^https:\/\/github\.com\//.test(e.source)) {
      if (e.source.startsWith('media/') && !existsSync(`${root}/src/assets/${e.source}`)) errs.push(`falta src/assets/${e.source}`);
      // valor e fonte precisam estar na mesma linha de docs/EVIDENCIAS.md
      if (!inProof(v)) errs.push(`"${v}" e ${e.source} não estão na mesma linha de docs/EVIDENCIAS.md`);
    } else errs.push(`origem inválida: ${e.source}`);
    const own = new Set(numbersIn([v]));
    own.forEach((n) => proven.add(norm(n)));
    // Número no rótulo (ex.: "em 24 h") vale se estiver no valor ou no mesmo trecho que prova o valor.
    for (const n of numbersIn(walk(e.label ?? {}))) {
      if (own.has(n)) continue;
      if (inProof(n)) proven.add(norm(n));
      else errs.push(`número "${n}" no rótulo sem estar no valor "${v}" nem na fonte`);
    }
  }
  for (const n of numbersInProse(p)) if (!proven.has(norm(n))) errs.push(`número "${n}" na prosa sem evidência`);
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
