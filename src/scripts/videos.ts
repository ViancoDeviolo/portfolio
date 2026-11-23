// Autoplay só quando visível e sem reduced-motion; pausa manual não volta sozinha.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const visible = new Set<HTMLVideoElement>();
const sys = new WeakSet<HTMLVideoElement>(); // pausas feitas por este script, não pelo usuário

const halt = (v: HTMLVideoElement) => {
  if (v.paused) return;
  sys.add(v);
  v.pause();
};
// Com o foco nos controles nativos, tocar faz o Chromium escondê-los e o foco cai para o <body>.
const auto = (v: HTMLVideoElement) => {
  if (!reduce.matches && !v.dataset.held && !v.matches(':focus')) v.play().catch(() => {});
};

const io = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      const v = target as HTMLVideoElement;
      if (isIntersecting) {
        visible.add(v);
        auto(v);
      } else {
        visible.delete(v);
        halt(v);
      }
    }
  },
  { threshold: 0.5 },
);

reduce.addEventListener('change', () => {
  for (const v of visible) {
    if (reduce.matches) halt(v);
    else auto(v);
  }
});

for (const v of document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')) {
  const btn = v.closest('figure')?.querySelector<HTMLButtonElement>('.video-toggle');
  v.addEventListener('play', () => {
    delete v.dataset.held;
    btn?.setAttribute('aria-pressed', 'false');
  });
  v.addEventListener('pause', () => {
    if (sys.has(v)) sys.delete(v);
    else v.dataset.held = '1';
    btn?.setAttribute('aria-pressed', 'true');
  });
  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', () => (v.paused ? v.play().catch(() => {}) : v.pause()));
  }
  io.observe(v);
}
