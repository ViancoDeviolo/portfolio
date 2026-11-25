import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Progresso de chegada em cada parada da cena (0 a 1), guiado pela rolagem.
 * A parada 0 (capa) não tem gatilho; a parada k começa quando o seu elemento entra por baixo
 * e termina quando o centro dele chega ao centro da tela.
 */
export function useScrollStage(anchors: Element[]) {
  const progress = useRef<number[]>(anchors.map(() => 0));
  useEffect(() => {
    progress.current = anchors.map(() => 0);
    const triggers = anchors.slice(1).map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'center center',
        onUpdate: (st) => (progress.current[i + 1] = st.progress),
        onRefresh: (st) => (progress.current[i + 1] = st.progress),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [anchors]);
  return progress;
}
