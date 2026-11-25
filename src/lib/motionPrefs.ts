/** A cena 3D só entra com WebGL e sem pedido de movimento reduzido; senão fica o globo estático. */
export const canAnimate = (o: { reducedMotion: boolean; webgl: boolean }): boolean => !o.reducedMotion && o.webgl;

// Sem loseContext(): o Firefox avisa "WebGL context was lost" no console; a sonda é coletada pelo GC.
export const hasWebGL = (): boolean => !!document.createElement('canvas').getContext('webgl2');
