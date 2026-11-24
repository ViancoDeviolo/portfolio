/** A cena 3D só entra com WebGL e sem pedido de movimento reduzido; senão fica o globo estático. */
export const canAnimate = (o: { reducedMotion: boolean; webgl: boolean }): boolean => !o.reducedMotion && o.webgl;

export const hasWebGL = (): boolean => {
  const gl = document.createElement('canvas').getContext('webgl2');
  gl?.getExtension('WEBGL_lose_context')?.loseContext(); // só a sondagem: devolve o contexto na hora
  return !!gl;
};
