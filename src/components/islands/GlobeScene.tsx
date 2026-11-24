import { useEffect, useState, type ComponentType } from 'react';
import { canAnimate, hasWebGL } from '../../lib/motionPrefs';

// Ilha leve (client:only): decide se a cena entra e só então baixa three/R3F/GSAP por import() dinâmico,
// depois do load, com o navegador ocioso e alguma tela do globo perto da viewport. Fora disso, nada é baixado.
export default function GlobeScene() {
  const [Scene, setScene] = useState<ComponentType | null>(null);

  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canAnimate({ reducedMotion, webgl: hasWebGL() })) return;
    let alive = true;
    let io: IntersectionObserver | undefined;
    const start = () => {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          import('./GlobeCanvas').then((m) => alive && setScene(() => m.default));
        },
        { rootMargin: '50% 0px' },
      );
      for (const el of document.querySelectorAll('#top, #living, #ai')) io.observe(el);
    };
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 200));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
    return () => {
      alive = false;
      io?.disconnect();
      removeEventListener('load', idle);
    };
  }, []);

  return Scene ? <Scene /> : null;
}
