import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

for (const f of ['dist/lucas-cruz-cv.pdf', 'dist/lucas-cruz-cv-en.pdf']) {
  it(`${f} tem exatamente uma página`, () => {
    const buf = readFileSync(f);
    expect((buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1);
  });
}
