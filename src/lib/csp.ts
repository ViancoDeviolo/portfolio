import { createHash } from 'node:crypto';

// Hash de cada <script> sem src, exatamente como está entre as tags; sem duplicatas.
export function inlineScriptHashes(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g))
    out.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  return [...out];
}

export function withScriptHashes(headers: string, hashes: string[]): string {
  if (!hashes.length) return headers;
  return headers.replace(/(Content-Security-Policy:[^\n]*?script-src 'self')/, `$1 ${hashes.join(' ')}`);
}
