import { describe, expect, it } from 'vitest';
import { buildMailto } from '../../src/lib/email';

describe('buildMailto', () => {
  it('monta o mailto', () => {
    expect(buildMailto('lucascruzcorp', 'gmail.com')).toBe('mailto:lucascruzcorp@gmail.com');
    expect(buildMailto('a.b+c', 'mail.my-host.com.br')).toBe('mailto:a.b+c@mail.my-host.com.br');
  });

  it.each([
    ['a b', 'gmail.com'],
    ['a@b', 'gmail.com'],
    ['', 'gmail.com'],
    ['lucas', 'gmail'],
    ['lucas', 'gm ail.com'],
    ['lucas', 'x@gmail.com'],
    ['lucas?cc=x', 'gmail.com'],
    ['lucas%0Abcc', 'gmail.com'],
    ['lucas', '-gmail.com'],
    ['lucas', 'gmail-.com'],
  ])('rejeita %j @ %j', (user, domain) => {
    expect(() => buildMailto(user, domain)).toThrow();
  });
});
