import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// shortcut: regex over Astro's predictable output; simple selectors (tag, #id, .class, [attr=value]) plus the descendant combinator only
// ("a b c" checks each outer part is some ancestor; order between ancestors is not enforced).
type Node = { tag: string; attrs: Record<string, string>; start: number; end: number };

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
  }));
  const end = (n: Node) => (n.end < 0 ? (n.end = closeOf(html, n.tag, n.start)) : n.end);
  const $ = (sel: string) => {
    const [last, ...outer] = sel.trim().split(/\s+/).reverse();
    const found = outer.reduce(
      (acc, s) => {
        const scopes = nodes.filter((n) => matches(n, s));
        return acc.filter((c) => scopes.some((a) => a.start < c.start && c.start < end(a)));
      },
      nodes.filter((n) => matches(n, last)),
    );
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
