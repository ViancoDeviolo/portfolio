import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkProject } from './evidence-check';

const root = resolve(__dirname, '../..');
const dir = `${root}/src/content/projects`;
const fichas = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')) : [];

describe('nenhum número sem origem', () => {
  for (const f of fichas) it(`ficha ${f}`, () => expect(checkProject(`${dir}/${f}`, root)).toEqual([]));

  it('reprova a ficha falsa com 539 contra o resumo do Analitic Blitz', () => {
    const errs = checkProject(`${root}/tests/unit/fixtures/ficha-falsa-539.yaml`, root);
    expect(errs).toContain('"539" não consta em evidencias/analitic-blitz-pytest-resumo.txt');
  });
});
