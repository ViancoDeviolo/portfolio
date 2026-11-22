import { expect, test } from 'vitest';
import { langFromPath, switchHref } from '../../src/lib/i18n';

test('langFromPath', () => {
  expect(langFromPath('/en/')).toBe('en');
  expect(langFromPath('/privacidade/')).toBe('pt');
});

test('switchHref', () => {
  expect(switchHref('/', 'about', 'en')).toBe('/en/#about');
  expect(switchHref('/en/', 'ai', 'pt')).toBe('/#ai');
  expect(switchHref('/privacidade/', null, 'en')).toBe('/en/privacy/');
  expect(switchHref('/en/terms/', null, 'pt')).toBe('/termos/');
  expect(switchHref('/', 'hacked"><x', 'en')).toBe('/en/');
  expect(switchHref('/rota-inexistente/', 'about', 'en')).toBe('/en/');
});
