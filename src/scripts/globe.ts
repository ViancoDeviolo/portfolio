import { canAnimate, hasWebGL } from '../lib/motionPrefs';

// Porta da cena 3D (sem React): React, three, R3F e GSAP só são baixados por import() dinâmico depois do load,
// na primeira interação (rolar, mover o ponteiro, tocar, teclar), se canAnimate e com alguma tela do globo perto da viewport.
// Assim nada da cena disputa a rede ou a CPU com a capa (LCP/TBT no celular). Sem isso, fica o globo estático.
const INTERACTIONS = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown'] as const;
const stage = document.getElementById('globe-stage');

const start = () => {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import('../components/islands/GlobeScene').then((m) => m.mount(stage!));
    },
    { rootMargin: '50% 0px' },
  );
  for (const el of document.querySelectorAll('#top, #living, #ai')) io.observe(el);
};

const onInteract = () => {
  for (const t of INTERACTIONS) removeEventListener(t, onInteract);
  // a sonda de WebGL é cara no celular: só roda aqui, depois da interação
  if (canAnimate({ reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, webgl: hasWebGL() })) start();
};

const arm = () => {
  for (const t of INTERACTIONS) addEventListener(t, onInteract, { passive: true });
};

if (stage && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if (document.readyState === 'complete') arm();
  else addEventListener('load', arm, { once: true });
}
