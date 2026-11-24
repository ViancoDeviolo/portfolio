const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** n pontos quase uniformes na esfera unitária, como [x, y, z, ...]. */
export const fibonacciSphere = (n: number): Float32Array => {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const ring = Math.sqrt(1 - y * y);
    const a = i * GOLDEN_ANGLE;
    out[i * 3] = Math.cos(a) * ring;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * ring;
  }
  return out;
};

export const particleCount = (o: { coarsePointer: boolean; width: number }): number =>
  o.coarsePointer || o.width < 768 ? 900 : 2200;

/** Contorno de um retângulo centrado na origem, como [x, y, 0, ...]; cantos incluídos, sem repetição. */
export const frameTargets = (w: number, h: number, step: number): Float32Array => {
  const hw = w / 2;
  const hh = h / 2;
  const pts: number[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const segs = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      pts.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0);
    }
  };
  edge(-hw, -hh, hw, -hh);
  edge(hw, -hh, hw, hh);
  edge(hw, hh, -hw, hh);
  edge(-hw, hh, -hw, -hh);
  return new Float32Array(pts);
};

const f = (v: number) => +v.toFixed(1);

/** Globo estático (hemisfério da frente, de trás para frente). Sem `style`; a cor vem de `currentColor`. */
export const globeSvg = (n: number, r: number, tilt: number): string => {
  const p = fibonacciSphere(n);
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const dots: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = p[i * 3];
    const y = p[i * 3 + 1];
    const z = p[i * 3 + 2];
    const zr = y * sin + z * cos;
    if (zr > 0) dots.push({ x, y: y * cos - z * sin, z: zr });
  }
  dots.sort((a, b) => a.z - b.z);
  const body = dots
    .map((d) => `<circle cx="${f(d.x * r)}" cy="${f(-d.y * r)}" r="${f(0.6 + d.z * 1.2)}"/>`)
    .join('');
  const pad = 3;
  const s = r + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s} ${-s} ${2 * s} ${2 * s}" fill="currentColor" aria-hidden="true">${body}</svg>`;
};
