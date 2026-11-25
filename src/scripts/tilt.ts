// Tela 04: os cards inclinam seguindo o mouse, no máximo 4°. Só com ponteiro fino e sem movimento reduzido;
// a transição do CSS (Fundamentals.astro) suaviza cada passo do ponteiro.
const MAX = 4;

if (matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches)
  for (const card of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // −0,5 a 0,5
      const y = (e.clientY - r.top) / r.height - 0.5;
      // o lado sob o ponteiro vem para a frente: a borda cresce em vez de fugir do ponteiro (senão pointerleave pisca perto das bordas)
      card.style.transform = `perspective(60rem) rotateX(${(y * 2 * MAX).toFixed(2)}deg) rotateY(${(-x * 2 * MAX).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => (card.style.transform = ''));
  }
