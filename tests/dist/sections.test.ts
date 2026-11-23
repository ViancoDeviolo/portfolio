import { describe, expect, it } from 'vitest';
import { ids, load } from './html';

describe.each([
  ['index.html', '/lucas-cruz-cv.pdf', 'lucascruzcorp [arroba] gmail.com'],
  ['en/index.html', '/lucas-cruz-cv-en.pdf', 'lucascruzcorp [at] gmail.com'],
] as const)('seções %s', (file, cv, noscript) => {
  const $ = load(file);

  it('seções na ordem do §5.4', () => {
    expect(ids($('main > section'))).toEqual(['fundamentals', 'ai', 'workflow', 'stack', 'about', 'contact']);
  });

  it('fluxo em 3 passos, sem logos, passo 3 aponta para Fundamentos', () => {
    expect($('#workflow ol > li').length).toBe(3);
    expect($('#workflow img').length).toBe(0);
    expect($('#workflow ol > li').nodes.length).toBe(3);
    const third = $('#workflow ol > li').nodes[2];
    expect($('#workflow a[href=#fundamentals]').nodes.some((a) => a.start > third.start)).toBe(true);
  });

  it('stack sem barras de nível nem logos', () => {
    expect($('#stack img').length + $('#stack progress').length + $('#stack meter').length).toBe(0);
    expect($('#stack').text()).toContain('Java');
  });

  it('e-mail sem literal no HTML', () => {
    expect($.html).not.toContain('lucascruzcorp@gmail.com');
    expect($.html).not.toMatch(/mailto:/i);
    const mail = $('#contact a[data-user=lucascruzcorp]');
    expect(mail.length).toBe(1);
    expect(mail.attr('data-domain')).toBe('gmail.com');
    expect(mail.attr('href')).toBeUndefined();
    expect($('#contact noscript').text()).toBe(noscript);
  });

  it('links externos e CV', () => {
    expect($('#contact a[href="https://www.linkedin.com/in/lucas-alves-cruz/"]').attr('rel')).toBe('noopener noreferrer');
    expect($('#contact a[href="https://github.com/ViancoDeviolo"]').attr('rel')).toBe('noopener noreferrer');
    expect($(`#contact a[href="${cv}"]`).length).toBe(1);
  });
});
