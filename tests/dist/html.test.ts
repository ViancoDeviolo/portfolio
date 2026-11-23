import { describe, expect, it } from 'vitest';
import { parse } from './html';

describe('helper de HTML', () => {
  const $ = parse('<div class="a"><p>um <b>dois</b></p><p>três</p></div><p class="fora">quatro</p>');

  it('text() devolve só o texto do próprio elemento', () => {
    expect($('div').text()).toBe('um dois três');
    expect($('b').text()).toBe('dois');
  });

  it('seletor descendente fica dentro do ancestral', () => {
    expect($('.a p').length).toBe(2);
    expect($('p').length).toBe(3);
  });
});

describe('combinador filho', () => {
  const $ = parse('<main><img src="x"><section id="a"><section id="b"></section></section></main><section id="c"></section>');

  it('só filhos diretos', () => {
    expect($('main > section').nodes.map((n) => n.attrs.id)).toEqual(['a']);
    expect($('main section').length).toBe(2);
  });
});

describe('combinador filho depois de descendente', () => {
  const $ = parse('<ol><li><p><a id="x"></a></p></li></ol><ul><li><a id="y"></a></li></ul><div><ol><li><a id="z"></a></li></ol></div>');

  it('"a > b c" mede o ">" a partir de b, não de c', () => {
    expect($('ol > li a').nodes.map((n) => n.attrs.id)).toEqual(['x', 'z']);
    expect($('div > ol a').nodes.map((n) => n.attrs.id)).toEqual(['z']);
    expect($('ul > li a').nodes.map((n) => n.attrs.id)).toEqual(['y']);
  });

  it('ordem entre ancestrais conta e sem repetidos', () => {
    expect($('li ol a').length).toBe(0);
    expect($('ol li a').length).toBe(2);
  });
});
