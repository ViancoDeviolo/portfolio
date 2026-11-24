import { createHash } from 'node:crypto';

const sha = (s: string) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const hashesOf = (html: string, re: RegExp) => [...new Set([...html.matchAll(re)].map((m) => sha(m[1])))];
const withHashes = (directive: string) => (headers: string, hashes: string[]): string =>
  hashes.length ? headers.replace(new RegExp(`(Content-Security-Policy:[^\n]*?${directive} 'self')`), `$1 ${hashes.join(' ')}`) : headers;

// Hash de cada <script> sem src, exatamente como está entre as tags; sem duplicatas.
export const inlineScriptHashes = (html: string): string[] => hashesOf(html, /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g);

// Hash de cada <style> embutido (ex.: o display:contents das ilhas do Astro), para o style-src.
export const inlineStyleHashes = (html: string): string[] => hashesOf(html, /<style[^>]*>([\s\S]*?)<\/style>/g);

export const withScriptHashes = withHashes('script-src');
export const withStyleHashes = withHashes('style-src');
