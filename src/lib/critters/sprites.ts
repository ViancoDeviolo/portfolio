import data from './bichinhos-sprites.json';

export type Box = { x: number; y: number; w: number; h: number };

/** Todos os sprites (projetos e figurantes) por nome, como no JSON. */
export const SPRITES: Record<string, string[]> = { ...data.projetos, ...data.figurantes };
export const EXTRA_NAMES = Object.keys(data.figurantes);

/** projectId → nome do sprite (chave do JSON). */
export const PROJECT_CRITTERS: Record<string, string> = {
  arapuca: 'formiga · Arapuca HoneyAnt',
  easyfood: 'marmita · EasyFood',
  'analitic-blitz': 'candle · Analitic Blitz',
  'nfe-hub': 'nota fiscal · NFE Hub',
  'banco-java': 'moeda · Banco em Java',
  'renovacao-apolices': 'robô · Renovação (CrewAI)',
};

/** Um retângulo por pixel preenchido, em unidades de `px`. */
export function spriteRects(grid: string[], px: number): Box[] {
  const out: Box[] = [];
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '#') out.push({ x: x * px, y: y * px, w: px, h: px });
    }),
  );
  return out;
}

/** Quadro 1 da caminhada: a fileira de baixo (patas) desliza 1 px; o desenho é o mesmo. */
export function spriteFrame1(grid: string[]): string[] {
  const last = grid.length - 1;
  return grid.map((row, i) => (i === last ? '.' + row.slice(0, -1) : row));
}
