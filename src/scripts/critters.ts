// Bichinhos em pixel art (spec 6): SVG numa camada sobre as telas, fora da cena 3D.
// Projeto = link para a ficha (segue o mouse de longe); figurante = decorativo (foge do mouse).
// Nunca passam por texto, links ou mídia; no toque andam só pelas bordas; com movimento reduzido ficam parados.
import { RULES, step, blocked, capPerViewport, type Critter } from '../lib/critters/behavior';
import { SPRITES, EXTRA_NAMES, PROJECT_CRITTERS, spriteRects, spriteFrame1, type Box } from '../lib/critters/sprites';
import { reduce } from './reveal';

const AVOID = ':is(h1, h2, h3, p, li, pre, td, th, dt, dd, summary, a, button, img, video, [data-critter-avoid]):not([data-critter])';
const STAGES = '#top, #living, [data-ai-screen], #fundamentals, #workflow, #contact';
const PAD = 8; // folga em volta do que é evitado
const FOLLOW = 320; // o de projeto só segue um cursor que chegou perto
const FRAME_MS = 300;
const MAX_DT = 0.05; // aba que volta do fundo não teletransporta ninguém
const EDGE = 4; // no toque, encostado na borda
const INKS = ['mao', 'ia', 'paper']; // tela 06 (fundo preto)

type Live = Critter & {
  el: HTMLElement;
  path: SVGPathElement;
  d: [string, string];
  w: number;
  h: number;
  stage: HTMLElement;
  bounds: Box;
  ex: Box[];
  off: boolean;
  phase: number;
  shown: 0 | 1;
  left: boolean;
  tf: string;
};

const pathOf = (grid: string[], px: number) =>
  spriteRects(grid, px)
    .map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`)
    .join('');

const boxOf = (c: { x: number; y: number; w: number; h: number }): Box => ({ x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h });

export function start(layer: HTMLElement) {
  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ids = Object.keys(PROJECT_CRITTERS);
  const list: Live[] = [];

  [...document.querySelectorAll<HTMLElement>(STAGES)].forEach((stage, i) => {
    let pid = ids[i % ids.length];
    if (stage.id === `p-${pid}`) pid = ids[(i + 1) % ids.length]; // nunca aponta para a própria tela
    const title = document.getElementById(`p-${pid}-title`)?.textContent?.trim();
    const specs: [Critter['kind'], string][] = [
      ['projeto', PROJECT_CRITTERS[pid]],
      ['figurante', EXTRA_NAMES[(2 * i) % EXTRA_NAMES.length]],
      ['figurante', EXTRA_NAMES[(2 * i + 1) % EXTRA_NAMES.length]],
    ];
    const made = specs.flatMap(([kind, name], j): Live[] => {
      if (kind === 'projeto' && !title) return [];
      const px = kind === 'projeto' ? 5 : 3;
      const grid = SPRITES[name];
      const w = grid[0].length * px;
      const h = grid.length * px;
      const el = document.createElement(kind === 'projeto' ? 'a' : 'span');
      el.dataset.critter = '';
      el.dataset.kind = kind;
      if (stage.id === 'contact') el.dataset.ink = INKS[(i + j) % INKS.length];
      if (kind === 'projeto') {
        (el as HTMLAnchorElement).href = `#p-${pid}`;
        el.setAttribute('aria-label', title!);
      } else el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path/></svg>`;
      el.hidden = true;
      const d: [string, string] = [pathOf(grid, px), pathOf(spriteFrame1(grid), px)];
      const path = el.querySelector('path')!;
      const bounds = { x: 0, y: 0, w: 0, h: 0 };
      const phase = Math.random() * FRAME_MS * 2;
      return [{ id: `${stage.id}-${j}`, kind, projectId: kind === 'projeto' ? pid : undefined, x: 0, y: 0, vx: 0, vy: 0, frame: 0, el, path, d, w, h, stage, bounds, ex: [], off: true, phase, shown: 0, left: false, tf: '' }];
    });
    for (const c of capPerViewport(made) as Live[]) {
      layer.append(c.el);
      list.push(c);
    }
  });

  let origin = { x: 0, y: 0 };
  const inside = (c: Live, b: Box) =>
    b.x >= c.bounds.x && b.y >= c.bounds.y && b.x + b.w <= c.bounds.x + c.bounds.w && b.y + b.h <= c.bounds.y + c.bounds.h;
  const free = (c: Live, b: Box) => inside(c, b) && !blocked(b, c.ex);

  // Só escreve no DOM o que mudou: o quadro troca a cada 300 ms e a posição anda em pixels inteiros.
  const draw = (c: Live) => {
    const d = c.d[c.shown];
    if (c.path.getAttribute('d') !== d) c.path.setAttribute('d', d);
    const b = boxOf(c);
    const tf = `translate(${Math.round(b.x - origin.x)}px, ${Math.round(b.y - origin.y)}px)${c.left ? ' scaleX(-1)' : ''}`;
    if (c.tf !== tf) c.el.style.transform = c.tf = tf;
  };

  // Lugar livre na tela do bichinho; no toque, só nas bordas e andando na vertical.
  const spawn = (c: Live) => {
    const vw = document.documentElement.clientWidth;
    for (let t = 0; t < 80; t++) {
      const side = Math.random() < 0.5;
      const x = touch ? (side ? EDGE + c.w / 2 : vw - EDGE - c.w / 2) : c.bounds.x + c.w / 2 + Math.random() * (c.bounds.w - c.w);
      const y = c.bounds.y + c.h / 2 + Math.random() * (c.bounds.h - c.h);
      if (!free(c, boxOf({ ...c, x, y }))) continue;
      const dir = side ? 1 : -1;
      Object.assign(c, { x, y, vx: touch ? 0 : dir * RULES.speed, vy: touch ? dir * RULES.speed : 0, off: false, left: !touch && dir < 0 });
      return;
    }
    c.off = true;
  };

  // Recalcula o que evitar e onde cada um pode andar; quem ficou em cima de algo muda de lugar.
  const layout = () => {
    const r = layer.getBoundingClientRect();
    origin = { x: r.x + scrollX, y: r.y + scrollY };
    const vw = document.documentElement.clientWidth;
    const ex: Box[] = [];
    for (const e of document.querySelectorAll(AVOID)) {
      const b = e.getBoundingClientRect();
      if (b.width && b.height) ex.push({ x: b.x + scrollX - PAD, y: b.y + scrollY - PAD, w: b.width + 2 * PAD, h: b.height + 2 * PAD });
    }
    for (const c of list) {
      const s = c.stage.getBoundingClientRect();
      // na horizontal, a tela inteira (as fichas da tela 03 têm margem lateral, onde também dá para andar)
      c.bounds = { x: scrollX, y: s.y + scrollY + PAD, w: vw, h: s.height - 2 * PAD };
      c.ex = ex.filter((e) => blocked(e, [c.bounds]));
      if (c.off || !free(c, boxOf(c))) spawn(c);
      c.el.hidden = c.off;
      if (!c.off) draw(c);
    }
    wake();
  };

  let cursor: { x: number; y: number } | null = null; // na tela (client), convertido a cada quadro
  let raf = 0;
  let last = 0;

  const onScreen = (c: Live) => !c.off && c.bounds.y < scrollY + innerHeight && c.bounds.y + c.bounds.h > scrollY;

  const move = (c: Live, p: { x: number; y: number } | null, dt: number) => {
    const n = step(c, p, dt, RULES);
    if (free(c, boxOf({ ...c, x: n.x, y: n.y }))) return Object.assign(c, n);
    if (p) {
      // seguindo ou fugindo: desliza por um eixo só, ou espera
      if (free(c, boxOf({ ...c, x: n.x }))) return Object.assign(c, n, { y: c.y });
      if (free(c, boxOf({ ...c, y: n.y }))) return Object.assign(c, n, { x: c.x });
      return Object.assign(c, { vx: n.vx, vy: n.vy });
    }
    // passeando: dá meia-volta; no desktop, às vezes vira para cima ou para baixo
    const turns = touch ? [[0, -Math.sign(c.vy)]] : [[-Math.sign(c.vx), 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
    for (const [ux, uy] of turns) {
      const t = { ...c, vx: ux * RULES.speed, vy: uy * RULES.speed };
      if (free(c, boxOf(step(t, null, dt, RULES) as Live))) return Object.assign(c, { vx: t.vx, vy: t.vy });
    }
  };

  const tick = (t: number) => {
    raf = 0;
    if (document.hidden) return;
    const dt = last ? Math.min((t - last) / 1000, MAX_DT) : 0;
    last = t;
    const on = list.filter(onScreen);
    if (!on.length) return void (last = 0);
    const p = cursor && { x: cursor.x + scrollX, y: cursor.y + scrollY };
    // só o de projeto mais perto do cursor segue
    let lead: Live | null = null;
    let best = FOLLOW;
    if (p)
      for (const c of on) {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (c.kind === 'projeto' && d < best) [lead, best] = [c, d];
      }
    for (const c of on) {
      if (c.el === document.activeElement) continue; // com foco, fica parado onde o anel apareceu
      const [x0, y0] = [c.x, c.y];
      move(c, c === lead || c.kind === 'figurante' ? p : null, dt);
      const moving = c.x !== x0 || c.y !== y0;
      if (moving) c.shown = (Math.floor((t + c.phase) / FRAME_MS) % 2) as 0 | 1;
      if (c.vx) c.left = c.vx < 0;
      draw(c);
    }
    raf = requestAnimationFrame(tick);
  };

  function wake() {
    if (reduce || raf || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  if (!touch) {
    addEventListener('pointermove', (e) => ((cursor = { x: e.clientX, y: e.clientY }), wake()), { passive: true });
    document.documentElement.addEventListener('pointerleave', () => (cursor = null));
  }
  addEventListener('scroll', wake, { passive: true });
  document.addEventListener('visibilitychange', wake);
  new ResizeObserver(layout).observe(document.body);
  document.fonts.ready.then(layout);
}
