// Entrada única com a rolagem (spec 5): o texto sobe e aparece uma vez e depois fica parado.
// Só esconde o que ainda está abaixo da dobra quando o script roda; o que já está à vista nunca pisca.
// Sem JS ou com movimento reduzido, nada é escondido: o HTML estático já é o estado final.
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'; // o mesmo --ease-out de tokens.css

// Monta os momentos só depois do load e com a CPU livre: nada disputa com a pintura da foto da capa (LCP).
export const whenIdle = (fn: () => void) => {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
};

export const reveal = (els: Iterable<HTMLElement>, { gap = 60, duration = 600 } = {}) => {
  if (reduce) return;
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0; // atraso só entre os que entram juntos
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        el.animate([{ opacity: 0, translate: '0 1rem' }, { opacity: 1, translate: '0 0' }], {
          duration,
          delay: i++ * gap,
          easing: EASE_OUT,
          fill: 'backwards',
        });
        el.style.opacity = '';
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const el of els)
    if (el.getBoundingClientRect().top > innerHeight) {
      el.style.opacity = '0';
      io.observe(el);
    }
};
