import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_URL } from '../../astro.config.mjs';

// shortcut: regex over Astro's predictable output; simple selectors (tag, #id, .class, [attr=value]) plus the descendant and child (>) combinators.
// Selectors split on whitespace, so an attribute value with a space ([alt="a b"]) is unsupported; move to a real parser if a test needs one.
type Node = { tag: string; attrs: Record<string, string>; start: number; end: number; selfClosing?: boolean };

const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function parseAttrs(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(ATTR)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

function matches(n: Node, sel: string): boolean {
  const m = sel.match(/^([a-z][\w-]*)?((?:[#.][\w-]+)*)((?:\[[^\]]+\])*)$/i);
  if (!m) throw new Error(`unsupported selector: ${sel}`);
  const [, tag, idcls, attrs] = m;
  if (tag && n.tag !== tag.toLowerCase()) return false;
  for (const [, kind, name] of idcls.matchAll(/([#.])([\w-]+)/g)) {
    if (kind === '#' && n.attrs.id !== name) return false;
    if (kind === '.' && !(n.attrs.class ?? '').split(/\s+/).includes(name)) return false;
  }
  for (const [, name, val] of attrs.matchAll(/\[([\w:-]+)(?:=["']?([^"'\]]*)["']?)?\]/g)) {
    if (!(name in n.attrs)) return false;
    if (val !== undefined && n.attrs[name] !== val) return false;
  }
  return true;
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function closeOf(html: string, tag: string, from: number): number {
  const re = new RegExp(String.raw`<(/?)${tag}\b[^>]*>`, 'gi');
  re.lastIndex = from;
  let depth = 1;
  for (let m; (m = re.exec(html)); ) if ((depth += m[1] ? -1 : 1) === 0) return m.index;
  return html.length;
}

export const text = (html: string): string =>
  html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#39|#x27|quot|lt|gt|amp);/g, (_, e: string) => ENT[e])
    .replace(/\s+/g, ' ')
    .trim();

const ENT: Record<string, string> = { '#39': "'", '#x27': "'", quot: '"', lt: '<', gt: '>', amp: '&' };

export const load = (file: string) => parse(readFileSync(join('dist', file), 'utf8'));

export function parse(source: string) {
  const html = source.replace(/<!--[\s\S]*?-->/g, '');
  const nodes: Node[] = [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map((m) => ({
    tag: m[1].toLowerCase(),
    attrs: parseAttrs(m[2]),
    start: m.index! + m[0].length,
    end: -1,
    selfClosing: m[2].trimEnd().endsWith('/'), // SVG: <circle ... />
  }));
  const end = (n: Node) =>
    n.end < 0 ? (n.end = VOID.has(n.tag) || n.selfClosing ? n.start : closeOf(html, n.tag, n.start)) : n.end;
  const inside = (a: Node, c: Node) => a.start < c.start && c.start < end(a);
  const parentOf = (c: Node) => nodes.findLast((a) => a.start < c.start && inside(a, c));
  const $ = (sel: string) => {
    const [last, ...outer] = sel.trim().split(/\s*(>)\s*|\s+/).filter(Boolean).reverse();
    // each candidate carries an anchor: the element a child combinator is measured from
    let pairs = nodes.filter((n) => matches(n, last)).map((n) => [n, n] as const);
    for (let i = 0; i < outer.length; i++) {
      const s = outer[i];
      if (s === '>') {
        const ps = outer[++i];
        pairs = pairs.flatMap(([c, a]) => {
          const p = parentOf(a);
          return p && matches(p, ps) ? [[c, p] as const] : [];
        });
      } else {
        // a descendant step moves the anchor up to each matching ancestor, so "a > b c" measures ">" from b
        const scopes = nodes.filter((n) => matches(n, s));
        pairs = pairs.flatMap(([c, a]) => scopes.filter((sc) => inside(sc, a)).map((sc) => [c, sc] as const));
      }
    }
    const found = [...new Set(pairs.map(([c]) => c))];
    return {
      length: found.length,
      attr: (name: string) => found[0]?.attrs[name.toLowerCase()],
      text: () => found.map((n) => text(html.slice(n.start, end(n)))).join(' '),
      nodes: found,
    };
  };
  $.html = html;
  return $;
}

export const ids = (found: { nodes: Node[] }): string[] => found.nodes.map((n) => n.attrs.id).filter(Boolean);

export const tags = (html: string, tag: string) =>
  [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(new RegExp(String.raw`<${tag}\b([^>]*)>`, 'gi'))].map((m) => parseAttrs(m[1]));

// URLs de recursos carregados (src, srcset, poster, link href). `rels` limita os <link> a esses rel e ignora o resto.
export function resourceUrls(html: string, rels?: string[]): string[] {
  const out: string[] = [];
  const split = (s: string) => s.split(',').map((p) => p.trim().split(/\s+/)[0]).filter(Boolean);
  for (const a of tags(html, 'link')) {
    const rel = (a.rel ?? '').toLowerCase();
    if (a.href && (rels ? rels.includes(rel) : !['canonical', 'alternate'].includes(rel))) out.push(a.href);
  }
  if (rels) return out;
  for (const t of ['script', 'img', 'source', 'video', 'audio', 'iframe', 'embed', 'track'])
    for (const a of tags(html, t)) {
      if (a.src) out.push(a.src);
      if (a.srcset) out.push(...split(a.srcset));
      if (a.poster) out.push(a.poster);
    }
  return out;
}

// <a> com href absoluto http(s) para outra origem que o próprio site.
export function externalLinks(html: string, site = SITE_URL): { href: string; rel?: string }[] {
  return tags(html, 'a')
    .filter((a) => /^https?:\/\//i.test(a.href ?? '') && URL.parse(a.href)?.origin !== new URL(site).origin) // URL inválida conta como externa
    .map((a) => ({ href: a.href, rel: a.rel }));
}
