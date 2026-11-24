import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULES, blocked, capPerViewport, step, type Critter } from '../../src/lib/critters/behavior';
import { PROJECT_CRITTERS, SPRITES, spriteFrame1, spriteRects } from '../../src/lib/critters/sprites';

const base: Critter = { id: 'a', kind: 'projeto', x: 0, y: 0, vx: 0, vy: 0, frame: 0 };
const dist = (c: { x: number; y: number }, p: { x: number; y: number }) => Math.hypot(c.x - p.x, c.y - p.y);
const cursor = { x: 0, y: 0 };

describe('sprites', () => {
  it('spriteRects gera um retângulo por pixel preenchido', () => {
    const r = spriteRects(['#.', '.#'], 5);
    expect(r).toEqual([
      { x: 0, y: 0, w: 5, h: 5 },
      { x: 5, y: 5, w: 5, h: 5 },
    ]);
  });
  it('todo projectId existe em src/content/projects', () => {
    const dir = resolve(__dirname, '../../src/content/projects');
    const ids = readdirSync(dir).map((f) => f.replace(/\.yaml$/, ''));
    for (const id of Object.keys(PROJECT_CRITTERS)) expect(ids).toContain(id);
  });
  it('todo valor de PROJECT_CRITTERS resolve para um sprite', () => {
    for (const name of Object.values(PROJECT_CRITTERS)) expect(SPRITES[name]).toBeDefined();
    expect(Object.keys(PROJECT_CRITTERS)).toHaveLength(6);
  });
  it('quadro 1 difere do 0 e mantém as dimensões', () => {
    for (const grid of Object.values(SPRITES)) {
      const f1 = spriteFrame1(grid);
      expect(f1).not.toEqual(grid);
      expect(f1.length).toBe(grid.length);
      expect(f1.map((r) => r.length)).toEqual(grid.map((r) => r.length));
    }
  });
});

describe('step', () => {
  it('projeto a 300 px se aproxima do cursor', () => {
    const c = { ...base, x: 300 };
    expect(dist(step(c, cursor, 0.1, RULES), cursor)).toBeLessThan(300);
  });
  it('projeto a 40 px fica parado', () => {
    const n = step({ ...base, x: 40, vx: 40 }, cursor, 0.1, RULES);
    expect(n.vx).toBe(0);
    expect(n.vy).toBe(0);
  });
  it('figurante a 100 px foge', () => {
    const c = { ...base, kind: 'figurante' as const, x: 100 };
    expect(dist(step(c, cursor, 0.1, RULES), cursor)).toBeGreaterThan(100);
  });
  it('figurante a 200 px não reage', () => {
    const c = { ...base, kind: 'figurante' as const, x: 200 };
    expect(step(c, cursor, 0.1, RULES)).toMatchObject({ x: 200, y: 0 });
  });
  it('sem cursor anda e alterna o quadro', () => {
    let c = base;
    const frames = new Set<number>();
    for (let i = 0; i < 20; i++) {
      c = step(c, null, 0.1, RULES);
      frames.add(c.frame);
    }
    expect(c.x).toBeGreaterThan(0);
    expect(frames.size).toBe(2);
  });
  it('é determinístico', () => {
    expect(step(base, null, 0.1, RULES)).toEqual(step(base, null, 0.1, RULES));
  });
});

describe('blocked e capPerViewport', () => {
  it('blocked é true só com interseção', () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(blocked(box, [{ x: 5, y: 5, w: 10, h: 10 }])).toBe(true);
    expect(blocked(box, [{ x: 20, y: 20, w: 5, h: 5 }])).toBe(false);
  });
  it('capPerViewport devolve no máximo 3 projetos e 4 figurantes', () => {
    const mk = (kind: Critter['kind'], i: number): Critter => ({ ...base, kind, id: `${kind}${i}` });
    const list = [
      ...Array.from({ length: 5 }, (_, i) => mk('projeto', i)),
      ...Array.from({ length: 6 }, (_, i) => mk('figurante', i)),
    ];
    const out = capPerViewport(list);
    expect(out.filter((c) => c.kind === 'projeto')).toHaveLength(3);
    expect(out.filter((c) => c.kind === 'figurante')).toHaveLength(4);
  });
});
