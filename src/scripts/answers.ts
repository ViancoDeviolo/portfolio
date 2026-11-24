import { reveal } from './reveal';

// Tela 05: as respostas aparecem uma a uma, como se cada IA respondesse em seguida; depois dá para destacar uma de cada vez.
const answers = [...document.querySelectorAll<HTMLElement>('[data-answer]')];
reveal(answers, { gap: 300, duration: 500 });

const pick = document.querySelector<HTMLElement>('[data-answer-pick]');
if (pick) {
  const buttons = [...pick.querySelectorAll('button')];
  const select = (i: number) => {
    buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    answers.forEach((a, j) => a.toggleAttribute('data-active', i === j));
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => select(i)));
  select(0);
  pick.hidden = false; // sem JS os botões não fariam nada: ficam escondidos
}
