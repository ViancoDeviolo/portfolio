import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, MathUtils, ShaderMaterial, setConsoleFunction } from 'three';
import { gsap } from 'gsap';
import { fibonacciSphere, frameTargets, particleCount, spin, stagePosition, unproject } from '../../lib/globe';
import { useScrollStage } from './useScrollStage';

const TILT = 0.4; // a mesma inclinação do globo estático (GlobeStatic.astro)
const IN_BOX = 160 / 163; // raio do globo dentro da caixa do SVG estático
const TAG_R = 0.8; // as etiquetas giram numa esfera um pouco menor: na borda do globo a pílula sairia da tela
const SPIN = 0.08; // rad/s: uma volta a cada ~80 s, devagar
const STAGGER = 0.35; // fração da passagem em que as partículas saem em tempos diferentes (o globo "se desmonta")
const FRAME_STEP = 12; // px entre os pontos da moldura
const DOT_FRAME = 5; // px
const DOT_GLOBE = 0.022; // × raio, ponto da frente do globo
const ease = gsap.parseEase('power3.inOut'); // movimento na tela: entra e sai devagar

type Stop = { name: string; el: Element; frame: boolean };
type Tag = { li: HTMLElement; a: HTMLElement; px: number; py: number; p: [number, number, number] };

const vertexShader = /* glsl */ `
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float d = position.z * 0.5 + 0.5; // 0 atrás, 1 na frente
    vAlpha = 0.2 + 0.8 * d;
    gl_PointSize = uSize * (0.45 + 0.55 * d);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, 0.0, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(0.0588, 0.0588, 0.0627, vAlpha); // #0f0f10
  }
`;

// shortcut: o R3F 9.8 ainda cria um THREE.Clock, obsoleto desde o three r183; cala só esse aviso
// (os outros seguem para o console). Remover quando o R3F passar a usar THREE.Timer.
setConsoleFunction((level: 'log' | 'warn' | 'error', msg: string, ...rest: unknown[]) => {
  if (!msg.startsWith('THREE.Clock:')) console[level](msg, ...rest);
});

const html = document.documentElement;
const desktop = matchMedia('(min-width: 64rem)'); // abaixo disso as etiquetas ficam em lista, fora do globo
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

function Particles() {
  const { size, viewport } = useThree();
  const stops = useMemo<Stop[]>(
    () => [
      { name: 'hero', el: document.querySelector('[data-hero] [data-globe-static]')!, frame: false },
      { name: 'living', el: document.querySelector('#living [data-globe-static]')!, frame: false },
      ...[...document.querySelectorAll('[data-ai-screen]')].map((a) => ({
        name: `frame:${a.id.slice(2)}`,
        el: a.querySelector('[data-media-frame]')!,
        frame: true,
      })),
    ],
    [],
  );
  const anchors = useMemo(() => stops.map((s) => s.el), [stops]);
  const progress = useScrollStage(anchors);

  const n = useMemo(() => particleCount({ coarsePointer: matchMedia('(pointer: coarse)').matches, width: innerWidth }), []);
  const sphere = useMemo(() => fibonacciSphere(n), [n]);
  const delay = useMemo(() => Float32Array.from({ length: n }, (_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * STAGGER), [n]);
  const turned = useMemo(() => new Float32Array(n * 3), [n]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  const material = useMemo(
    () => new ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uSize: { value: 4 } }, transparent: true, depthTest: false, depthWrite: false }),
    [],
  );
  const frames = useRef(new Map<string, Float32Array>());

  // Etiquetas da tela 02: o ponto da esfera onde cada uma está no esboço (posição do CSS, lida antes de mexer).
  const tags = useMemo<Tag[]>(() => {
    const box = document.querySelector<HTMLElement>('#living .tags');
    if (!box || !desktop.matches) return []; // shortcut: decide uma vez na montagem; mudar de largura depois só volta à lista
    return [...box.querySelectorAll<HTMLElement>(':scope > li')].map((li) => {
      const px = li.offsetLeft / box.offsetWidth;
      const py = li.offsetTop / box.offsetHeight;
      return { li, a: li.querySelector('a')!, px, py, p: unproject(((px - 0.5) * 2) / (IN_BOX * TAG_R), (-(py - 0.5) * 2) / (IN_BOX * TAG_R), TILT) };
    });
  }, []);

  const s = useRef({ angle: 0, speed: SPIN, yaw: 0, tilt: TILT, mx: 0, my: 0, paused: false, u: -1, state: '', frameEl: null as Element | null });

  useEffect(() => {
    const st = s.current;
    const move = (e: PointerEvent) => {
      if (!finePointer.matches) return;
      st.mx = (e.clientX / innerWidth) * 2 - 1;
      st.my = (e.clientY / innerHeight) * 2 - 1;
    };
    const pause = () => (st.paused = true);
    const resume = () => (st.paused = false);
    addEventListener('pointermove', move, { passive: true });
    const box = document.querySelector('#living .tags');
    box?.addEventListener('focusin', pause);
    box?.addEventListener('focusout', resume);
    for (const t of document.querySelectorAll('[data-living-tag]')) {
      t.addEventListener('pointerenter', pause);
      t.addEventListener('pointerleave', resume);
    }
    return () => {
      removeEventListener('pointermove', move);
      box?.removeEventListener('focusin', pause);
      box?.removeEventListener('focusout', resume);
      for (const t of document.querySelectorAll('[data-living-tag]')) {
        t.removeEventListener('pointerenter', pause);
        t.removeEventListener('pointerleave', resume);
      }
      for (const t of tags) t.li.style.cssText = '';
      html.removeAttribute('data-globe-state');
      st.frameEl?.removeAttribute('data-globe-frame');
    };
  }, [tags]);

  // Onde cada parada está agora na tela, em px a partir do centro do canvas (y para cima).
  const place = (stop: Stop) => {
    const r = stop.el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - size.width / 2;
    const cy = size.height / 2 - (r.top + r.height / 2);
    if (!stop.frame) {
      const R = (Math.min(r.width, r.height) / 2) * IN_BOX;
      return { cx, cy, R, dot: R * DOT_GLOBE, pts: null };
    }
    const key = `${Math.round(r.width)}x${Math.round(r.height)}`;
    let pts = frames.current.get(key);
    if (!pts) frames.current.set(key, (pts = frameTargets(r.width - 4, r.height - 4, FRAME_STEP)));
    return { cx, cy, R: 0, dot: DOT_FRAME, pts };
  };

  useFrame((_, delta) => {
    const st = s.current;
    const dt = Math.min(delta, 0.1);
    st.speed = MathUtils.damp(st.speed, st.paused ? 0 : SPIN, 6, dt); // pausa no hover sem tranco
    st.angle += st.speed * dt;
    st.yaw = MathUtils.damp(st.yaw, st.mx * 0.3, 3, dt); // segue o mouse com atraso, como uma mola
    st.tilt = MathUtils.damp(st.tilt, TILT + st.my * 0.12, 3, dt);

    const target = stagePosition(progress.current);
    st.u = st.u < 0 ? target : MathUtils.damp(st.u, target, 10, dt); // suaviza os degraus da roda do mouse
    const last = stops.length - 1;
    const from = Math.min(Math.floor(st.u), last);
    const to = Math.min(from + 1, last);
    const t = from === last ? 0 : st.u - from;
    const A = place(stops[from]);
    const B = to === from ? A : place(stops[to]);

    const angle = st.angle + st.yaw;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = spin(sphere[i * 3], sphere[i * 3 + 1], sphere[i * 3 + 2], angle, st.tilt);
      turned[i * 3] = x;
      turned[i * 3 + 1] = y;
      turned[i * 3 + 2] = z;
    }
    const pos = geometry.attributes.position.array as Float32Array;
    const at = (P: ReturnType<typeof place>, i: number, k: number) => {
      if (!P.pts) return k === 2 ? turned[i * 3 + 2] : (k ? P.cy : P.cx) + turned[i * 3 + k] * P.R;
      const j = (i % (P.pts.length / 3)) * 3;
      return k === 2 ? 1 : (k ? P.cy : P.cx) + P.pts[j + k];
    };
    for (let i = 0; i < n; i++) {
      const e = ease(MathUtils.clamp((t - delay[i]) / (1 - STAGGER), 0, 1));
      for (let k = 0; k < 3; k++) pos[i * 3 + k] = MathUtils.lerp(at(A, i, k), at(B, i, k), e);
    }
    geometry.attributes.position.needsUpdate = true;
    const te = ease(t);
    material.uniforms.uSize.value = MathUtils.lerp(A.dot, B.dot, te) * viewport.dpr;

    // Estado nomeado (hero, living, frame:<id>) e a moldura que as partículas ocupam.
    const cur = stops[te < 0.5 ? from : to];
    if (cur.name !== st.state) {
      st.state = cur.name;
      html.dataset.globeState = cur.name;
      st.frameEl?.removeAttribute('data-globe-frame');
      st.frameEl = cur.frame ? cur.el : null;
      st.frameEl?.setAttribute('data-globe-frame', '');
    }

    // Etiquetas presas ao globo da tela 02: maiores na frente, somem atrás e fora da tela 02.
    const w = from === 1 ? 1 - te : to === 1 ? te : 0;
    if (tags.length) {
      const box = tags[0].li.parentElement!;
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      const R = (bw / 2) * IN_BOX * TAG_R;
      for (const tag of tags) {
        if (!desktop.matches) {
          tag.li.style.cssText = '';
          continue;
        }
        const [x, y, z] = spin(tag.p[0], tag.p[1], tag.p[2], angle, st.tilt);
        const dx = bw / 2 + x * R - tag.px * bw;
        const dy = bh / 2 - y * R - tag.py * bh;
        const o = MathUtils.smoothstep(z, -0.15, 0.3) * w;
        tag.li.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(0.85 + 0.15 * Math.max(z, 0)).toFixed(3)})`;
        tag.li.style.opacity = o.toFixed(3);
        tag.li.style.zIndex = String(Math.round(5 + 4 * z)); // 1 a 9: a da frente por cima, sempre sob o cabeçalho (10)
        tag.li.style.pointerEvents = o < 0.3 ? 'none' : '';
      }
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export default function GlobeScene() {
  const [hidden, setHidden] = useState(document.hidden);
  const [away, setAway] = useState(false); // nenhuma tela do globo perto da viewport: as seguintes, opacas, cobrem o canvas
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    const near = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? near.add(e.target) : near.delete(e.target);
        setAway(near.size === 0);
      },
      { rootMargin: '25% 0px' },
    );
    for (const el of document.querySelectorAll('#top, #living, #ai')) io.observe(el);
    return () => {
      document.removeEventListener('visibilitychange', on);
      io.disconnect();
      html.removeAttribute('data-globe-live');
      html.removeAttribute('data-globe-paused');
    };
  }, []);
  const paused = hidden || away;
  useEffect(() => void html.toggleAttribute('data-globe-paused', paused), [paused]);
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 5], near: 0.1, far: 10 }}
      onCreated={() => html.setAttribute('data-globe-live', '')}
      aria-hidden="true"
    >
      <Particles />
    </Canvas>
  );
}

/** Monta a cena em #globe-stage. Chamado só por scripts/globe.ts, depois das checagens. */
export const mount = (stage: HTMLElement) => createRoot(stage).render(<GlobeScene />);
