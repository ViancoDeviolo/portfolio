import type { Box } from './sprites';

export type Critter = {
  id: string;
  kind: 'projeto' | 'figurante';
  projectId?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  frame: 0 | 1;
};
export type Rules = { followStop: 48; fleeRadius: 120; speed: 40; fleeSpeed: 160 };
export const RULES: Rules = { followStop: 48, fleeRadius: 120, speed: 40, fleeSpeed: 160 };

const STRIDE = 8; // px andados por troca de quadro

/** Determinística: sem cursor, mantém a velocidade (ou começa a andar para a direita). */
export function step(c: Critter, cursor: { x: number; y: number } | null, dt: number, rules: Rules): Critter {
  let { vx, vy } = c;
  const d = cursor ? Math.hypot(cursor.x - c.x, cursor.y - c.y) : Infinity;
  if (cursor && c.kind === 'projeto') {
    const dx = cursor.x - c.x;
    const dy = cursor.y - c.y;
    if (d <= rules.followStop) [vx, vy] = [0, 0];
    else [vx, vy] = [(dx / d) * rules.speed, (dy / d) * rules.speed];
  } else if (cursor && c.kind === 'figurante' && d < rules.fleeRadius) {
    // em cima do cursor (d === 0): foge para a esquerda
    [vx, vy] = d === 0 ? [-rules.fleeSpeed, 0] : [((c.x - cursor.x) / d) * rules.fleeSpeed, ((c.y - cursor.y) / d) * rules.fleeSpeed];
  } else {
    // passeio: mantém a direção, volta à velocidade normal; parado, começa pela direita
    const m = Math.hypot(vx, vy);
    [vx, vy] = m === 0 ? [rules.speed, 0] : [(vx / m) * rules.speed, (vy / m) * rules.speed];
  }
  const x = c.x + vx * dt;
  const y = c.y + vy * dt;
  const moving = vx !== 0 || vy !== 0;
  const frame = moving ? ((Math.floor(Math.abs(x + y) / STRIDE) % 2) as 0 | 1) : c.frame;
  return { ...c, x, y, vx, vy, frame };
}

export function blocked(box: Box, exclusions: Box[]): boolean {
  return exclusions.some((e) => box.x < e.x + e.w && box.x + box.w > e.x && box.y < e.y + e.h && box.y + box.h > e.y);
}

export function capPerViewport(list: Critter[]): Critter[] {
  const left = { projeto: 3, figurante: 4 };
  return list.filter((c) => left[c.kind]-- > 0);
}
