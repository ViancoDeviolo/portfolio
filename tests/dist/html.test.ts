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
