import { describe, expect, it } from 'vitest';
import { fibonacciSphere, frameTargets, globeSvg, particleCount, spin, stagePosition, unproject } from '../../src/lib/globe';

describe('fibonacciSphere', () => {
  it('gera n pontos de norma 1', () => {
    const p = fibonacciSphere(500);
    expect(p.length).toBe(1500);
    for (let i = 0; i < p.length; i += 3) {
      expect(Math.abs(Math.hypot(p[i], p[i + 1], p[i + 2]) - 1)).toBeLessThan(1e-6);
    }
  });
});

describe('particleCount', () => {
  it('reduz em toque ou tela estreita', () => {
    expect(particleCount({ coarsePointer: true, width: 1440 })).toBe(900);
    expect(particleCount({ coarsePointer: false, width: 700 })).toBe(900);
    expect(particleCount({ coarsePointer: false, width: 1440 })).toBe(2200);
  });
});

describe('frameTargets', () => {
  it('fica no contorno, com os quatro cantos e sem repetição', () => {
    const p = frameTargets(100, 50, 10);
    const keys = new Set<string>();
    for (let i = 0; i < p.length; i += 3) {
      expect(Math.abs(p[i]) === 50 || Math.abs(p[i + 1]) === 25).toBe(true);
      keys.add(`${p[i]},${p[i + 1]}`);
    }
    expect(keys.size).toBe(p.length / 3);
    for (const c of ['-50,-25', '50,-25', '50,25', '-50,25']) expect(keys.has(c)).toBe(true);
  });
});

describe('globeSvg', () => {
  const svg = globeSvg(300, 100, 0.35);
  it('é estático e só da frente', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('style=');
    expect(svg).toContain('aria-hidden="true"');
    const n = (svg.match(/<circle/g) ?? []).length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(300);
  });
});

describe('stagePosition', () => {
  it('capa enquanto nada começou; depois a parada anterior mais o progresso da última que começou', () => {
    expect(stagePosition([0, 0, 0])).toBe(0);
    expect(stagePosition([0, 0.25, 0])).toBe(0.25);
    expect(stagePosition([0, 1, 0])).toBe(1);
    expect(stagePosition([0, 1, 0.5])).toBe(1.5);
  });
});

describe('spin e unproject', () => {
  it('unproject devolve o ponto que spin leva de volta a (sx, sy), na frente', () => {
    for (const [sx, sy] of [[0.4, -0.3], [-0.6, 0.5], [0, 0]]) {
      const [x, y, z] = unproject(sx, sy, 0.4);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
      const [px, py, pz] = spin(x, y, z, 0, 0.4);
      expect(px).toBeCloseTo(sx, 6);
      expect(py).toBeCloseTo(sy, 6);
      expect(pz).toBeGreaterThan(0);
    }
  });
});
