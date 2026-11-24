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
  if (cursor) {
    const dx = cursor.x - c.x;
    const dy = cursor.y - c.y;
    const d = Math.hypot(dx, dy);
    if (c.kind === 'projeto') {
      if (d <= rules.followStop) [vx, vy] = [0, 0];
      else [vx, vy] = [(dx / d) * rules.speed, (dy / d) * rules.speed];
    } else if (d < rules.fleeRadius) {
      const s = d === 0 ? 1 : d; // em cima do cursor: foge para a esquerda
      [vx, vy] = d === 0 ? [-rules.fleeSpeed, 0] : [(-dx / s) * rules.fleeSpeed, (-dy / s) * rules.fleeSpeed];
    }
  } else if (vx === 0 && vy === 0) {
    vx = rules.speed;
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
