import { reduce } from './reveal';

// Tela 04: o snippet é digitado sobre o próprio texto do <pre>. O texto inteiro fica sempre no DOM:
// o que falta digitar só fica invisível (visibility), então o layout não pula e nada é inventado.
const pre = document.querySelector<HTMLElement>('pre[data-snippet]');
const CPS = 300; // caracteres por segundo: termina em cerca de 2 s

if (pre && !reduce && pre.getBoundingClientRect().top > innerHeight) {
  const full = pre.textContent ?? '';
  const typed = document.createElement('span');
  const rest = document.createElement('span');
  rest.style.visibility = 'hidden';
  let raf = 0;

  const show = (n: number) => {
    typed.textContent = full.slice(0, n);
    rest.textContent = full.slice(n);
  };
  const finish = () => {
    cancelAnimationFrame(raf);
    prep.disconnect();
    go.disconnect();
    pre.textContent = full;
    pre.removeAttribute('data-typing');
    pre.removeAttribute('aria-busy');
  };

  // Prepara antes de aparecer (nunca à vista) e digita quando um terço do bloco já está na tela.
  const prep = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    prep.disconnect();
    show(0);
    pre.replaceChildren(typed, rest);
    pre.setAttribute('data-typing', '');
    pre.setAttribute('aria-busy', 'true');
  }, { rootMargin: '0px 0px 30% 0px' });

  const go = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    go.disconnect();
    const t0 = performance.now();
    const tick = (now: number) => {
      const n = Math.min(full.length, Math.floor(((now - t0) / 1000) * CPS));
      show(n);
      // o resto do snippet passa da altura visível do <pre> (ele rola): não há o que ver digitando
      if (n >= full.length || typed.getBoundingClientRect().bottom > pre.getBoundingClientRect().bottom) finish();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }, { threshold: 0.3 });

  prep.observe(pre);
  go.observe(pre);
  // Mexer no bloco (rolar, clicar, focar) entrega o código inteiro na hora.
  for (const t of ['pointerdown', 'wheel', 'focus', 'touchstart'] as const) pre.addEventListener(t, finish, { once: true, passive: true });
}
