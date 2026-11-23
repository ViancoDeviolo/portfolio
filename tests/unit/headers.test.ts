import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Parser mínimo do formato do Cloudflare Pages: linha sem recuo = caminho; linha recuada = "Nome: valor".
function parseHeaders(src: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  let path = '';
  for (const line of src.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) out[(path = line.trim())] = {};
    else {
      const i = line.indexOf(':');
      out[path][line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

describe('public/_headers', () => {
  const h = parseHeaders(readFileSync('public/_headers', 'utf8'));
  it('segurança em todas as rotas', () => {
    expect(h['/*']['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests");
    expect(h['/*']['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload');
    expect(h['/*']['X-Content-Type-Options']).toBe('nosniff');
    expect(h['/*']['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(h['/*']['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
  });
  it('cache imutável só nos assets com hash', () => {
    expect(h['/_astro/*']['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(h['/fonts/*']?.['Cache-Control'] ?? '').not.toContain('immutable');
  });
});
