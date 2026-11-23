// O Firefox não rola um foco que já aparece em parte (sob o cabeçalho fixo ou cortado no rodapé da tela)
// e ignora o scroll-padding. Aqui o elemento cabe na área livre, então é trazido inteiro para ela.
const header = document.querySelector<HTMLElement>('.site-header');
addEventListener('focusin', (e) => {
  const t = e.target;
  if (!header || !(t instanceof Element) || header.contains(t)) return;
  // Só foco de teclado: um clique não deve rolar a página. O <video> entra porque, com o foco nos controles nativos, o host não acende :focus-visible.
  if (!t.matches(':focus-visible, video')) return;
  const r = t.getBoundingClientRect();
  const h = header.offsetHeight;
  if ((r.top < h || r.bottom > innerHeight) && r.height <= innerHeight - h) t.scrollIntoView({ block: 'nearest' });
});
