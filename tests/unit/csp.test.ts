import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { inlineScriptHashes, inlineStyleHashes, withScriptHashes, withStyleHashes } from '../../src/lib/csp';

const hash = (s: string) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;

describe('inlineScriptHashes', () => {
  it('hasheia só scripts sem src, sem duplicatas', () => {
    expect(inlineScriptHashes('<script>a()</script><script src="/x.js"></script><script>a()</script>')).toEqual([hash('a()')]);
  });
});

describe('withScriptHashes', () => {
  const h = "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'";
  it('insere os hashes após script-src self, sem unsafe', () => {
    const out = withScriptHashes(h, ["'sha256-AAA'"]);
    expect(out).toContain("script-src 'self' 'sha256-AAA';");
    expect(out).not.toContain('unsafe');
  });
  it('sem hashes devolve o texto igual', () => {
    expect(withScriptHashes(h, [])).toBe(h);
  });
});

describe('inlineStyleHashes', () => {
  it('hasheia cada <style> embutido, sem duplicatas', () => {
    expect(inlineStyleHashes('<style>a{}</style><link rel="stylesheet" href="/x.css"><style>a{}</style>')).toEqual([hash('a{}')]);
  });
});

describe('withStyleHashes', () => {
  const h = "Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-S'; style-src 'self'; img-src 'self'";
  it('insere os hashes após style-src self, sem unsafe e sem tocar no script-src', () => {
    const out = withStyleHashes(h, ["'sha256-BBB'"]);
    expect(out).toContain("style-src 'self' 'sha256-BBB';");
    expect(out).toContain("script-src 'self' 'sha256-S';");
    expect(out).not.toContain('unsafe');
  });
  it('sem hashes devolve o texto igual', () => {
    expect(withStyleHashes(h, [])).toBe(h);
  });
});
