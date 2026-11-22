import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import sharp from 'sharp'; // transitiva (vem com o Astro); sem dependência nova
import { describe, expect, it } from 'vitest';
import { allProjectMedia } from './evidence-check';

const ls = (dir: string, ext: string) =>
  existsSync(dir) ? readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`) : [];
const probe = (f: string) =>
  JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], { encoding: 'utf8' }));

const videos = ls('public/media', '.mp4');
const images = [...ls('public/media', '.webp'), ...ls('src/assets/dupla', '.png')];

describe('mídia publicada', () => {
  it('existem vídeos e imagens (script rodou)', () => {
    expect(videos.length).toBe(6);
    expect(images.length).toBeGreaterThan(0);
    expect(existsSync('src/assets/dupla/casual.png') && existsSync('src/assets/dupla/terno.png')).toBe(true);
  });
  it('não publica o vídeo completo do Banco Java', () => {
    expect(existsSync('public/media/banco-java/banco-java-completo.mp4')).toBe(false);
  });
  it.each(videos)('%s: <= 2 MB, sem áudio, sem metadados, com pôster', (v) => {
    expect(statSync(v).size).toBeLessThanOrEqual(2 * 1024 * 1024);
    const p = probe(v);
    expect(p.streams.map((s: any) => s.codec_type)).not.toContain('audio');
    // brands do contêiner são estruturais; o resto (creation_time, encoder, title...) não pode existir
    expect(Object.keys(p.format.tags ?? {}).filter((k) => !['major_brand', 'minor_version', 'compatible_brands'].includes(k))).toEqual([]);
    for (const s of p.streams) expect(Object.keys(s.tags ?? {}).filter((k) => !['handler_name', 'vendor_id', 'language', 'encoder'].includes(k))).toEqual([]);
    expect(existsSync(v.replace(/\.mp4$/, '-poster.webp'))).toBe(true);
  });
  it.each(images)('%s: sem EXIF nem XMP', async (img) => {
    const m = await sharp(img).metadata();
    expect(m.exif).toBeUndefined();
    expect(m.xmp).toBeUndefined();
  });
  it('toda mídia das fichas existe', () => {
    for (const m of allProjectMedia()) {
      expect(existsSync(`public${m.src}`), m.src).toBe(true);
      if (m.kind === 'video') expect(existsSync(`public${m.poster}`), m.poster).toBe(true);
    }
  });
});
