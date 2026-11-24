// Retícula da marca, gerada no build (src/pages/halftone.svg.ts): pontos laranja crescem sobre o amarelo,
// da esquerda para a direita, até se fundirem no laranja que começa na borda direita.
// Grade de colunas desencontradas (meio passo); com R_FULL o ponto cobre a célula inteira.
// É servida como arquivo para o cabeçalho e a capa usarem a mesma imagem, alinhada, sem degrau entre os dois.
const S = 14; // passo da grade, em unidades do viewBox
const N = 22; // colunas
const H = 2800; // alto o bastante para nunca faltar ponto
const R_FULL = S * 0.63; // 0,625·S fecha a grade desencontrada
const IA = '#ff5a1f'; // --c-ia: SVG usado como imagem não enxerga as variáveis CSS da página

export const halftoneSvg = (): string => {
  let defs = '';
  let body = '';
  for (let i = 0; i < N; i++) {
    const r = +(R_FULL * Math.sqrt((i + 1) / N)).toFixed(2); // a última coluna já fecha: sem degrau para o laranja
    // Ladrilho de 3·S com 3 pontos: o ponto maior que a célula invade as vizinhas sem ser cortado.
    const dots = [-S / 2, S / 2, 1.5 * S].map((cy) => `<circle cx="${1.5 * S}" cy="${cy}" r="${r}"/>`).join('');
    defs += `<pattern id="h${i}" patternUnits="userSpaceOnUse" x="${(i - 1) * S}" y="${(i % 2) * (S / 2)}" width="${3 * S}" height="${S}">${dots}</pattern>`;
    body += `<rect x="${(i - 1) * S}" y="${-S}" width="${3 * S}" height="${H + 2 * S}" fill="url(#h${i})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N * S} ${H}" width="${N * S}" height="${H}" fill="${IA}"><defs>${defs}</defs>${body}</svg>`;
};
