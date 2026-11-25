import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

for (const f of ['dist/lucas-cruz-cv.pdf', 'dist/lucas-cruz-cv-en.pdf']) {
  it(`${f} tem exatamente uma página`, () => {
    const buf = readFileSync(f);
    expect((buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1);
    // uma página em branco (CSS de impressão escondendo tudo) tem poucos KB; o currículo com as fontes estáticas da Inter mede ~34 KB (PT 35173 B, EN 33955 B), então o piso é cerca de metade
    expect(buf.length).toBeGreaterThan(17_000);
  });
}
