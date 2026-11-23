// Gera public/og.png (1200x630): dupla da capa sobre #0F0F10 com o nome. Rodar uma vez da raiz: node scripts/og-image.mjs
import sharp from 'sharp'; // dependência transitiva do Astro; não declarada de propósito

const W = 1200, H = 630, BG = '#0F0F10';
const fig = async (f, h) => sharp(`src/assets/dupla/${f}.png`).resize({ height: h }).toBuffer();
const casual = await fig('casual', 540), terno = await fig('terno', 590);
const cw = (await sharp(casual).metadata()).width, tw = (await sharp(terno).metadata()).width;
const text = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="200"><text x="0" y="90" fill="#F5F5F4" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="80">Lucas Cruz</text></svg>`,
);
await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: text, left: 72, top: 230 },
    { input: casual, left: 560, top: H - 540 },
    { input: terno, left: 740, top: H - 590 },
  ])
  .png({ palette: true, quality: 90, compressionLevel: 9 }) // sem metadados por padrão
  .toFile('public/og.png');
