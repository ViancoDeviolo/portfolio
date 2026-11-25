import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

describe('contrastRatio', () => {
  it('preto sobre amarelo, laranja e papel sobre preto passam AA', () => {
    expect(contrastRatio('#0f0f10', '#ffc83d')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0f0f10', '#ff5a1f')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#edebe6', '#0f0f10')).toBeGreaterThanOrEqual(4.5);
  });
  it('branco sobre amarelo falha (por isso é proibido)', () => {
    expect(contrastRatio('#ffffff', '#ffc83d')).toBeLessThan(4.5);
  });
});
