import { reduce } from './reveal';

// Antes da tela 06, a página escurece até o preto: a camada preta da tela 05 acompanha a rolagem,
// de transparente (topo do #contact na base da janela) a opaca (topo do #contact no topo).
const dusk = document.querySelector<HTMLElement>('[data-dusk]');
const contact = document.getElementById('contact');

if (dusk && contact && !reduce) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = 1 - contact.getBoundingClientRect().top / innerHeight;
    dusk.style.opacity = String(Math.min(1, Math.max(0, p)));
  };
  addEventListener('scroll', () => (raf ||= requestAnimationFrame(update)), { passive: true });
  addEventListener('resize', update);
  update();
}
