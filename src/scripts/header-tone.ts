// O cabeçalho fixo copia o tom da tela que passa por baixo dele: observa uma faixa de 2 px logo abaixo da borda dele.
const siteHeader = document.querySelector<HTMLElement>('.site-header');
const zones = document.querySelectorAll<HTMLElement>('main > [data-tone], footer[data-tone]'); // só as telas, não os cards
let toneWatch: IntersectionObserver | undefined;

const watchTone = () => {
  if (!siteHeader) return;
  toneWatch?.disconnect();
  const h = siteHeader.offsetHeight;
  toneWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) siteHeader.dataset.tone = (e.target as HTMLElement).dataset.tone;
    },
    { rootMargin: `${-(h - 1)}px 0px ${-Math.max(0, innerHeight - h - 1)}px 0px` },
  );
  for (const z of zones) toneWatch.observe(z);
};

// Só depois do load: offsetHeight força o layout da página inteira, e antes do LCP isso vira uma tarefa longa no celular.
// Até lá o cabeçalho fica com o tom do HTML (o da capa), que é o certo para quem ainda está no topo.
if (siteHeader && zones.length) {
  const arm = () => {
    watchTone();
    addEventListener('resize', watchTone);
  };
  if (document.readyState === 'complete') arm();
  else addEventListener('load', arm, { once: true });
}
