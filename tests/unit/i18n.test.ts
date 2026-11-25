import { expect, test } from 'vitest';
import { SECTION_IDS, langFromPath, switchHref } from '../../src/lib/i18n';

test('langFromPath', () => {
  expect(langFromPath('/en/')).toBe('en');
  expect(langFromPath('/privacidade/')).toBe('pt');
});

test('switchHref', () => {
  expect(switchHref('/', 'workflow', 'en')).toBe('/en/#workflow');
  expect(switchHref('/en/', 'ai', 'pt')).toBe('/#ai');
  expect(switchHref('/privacidade/', null, 'en')).toBe('/en/privacy/');
  expect(switchHref('/en/terms/', null, 'pt')).toBe('/termos/');
  expect(switchHref('/', 'hacked"><x', 'en')).toBe('/en/');
  expect(switchHref('/rota-inexistente/', 'workflow', 'en')).toBe('/en/');
});

test('SECTION_IDS na ordem das telas 02 a 06', () => {
  expect([...SECTION_IDS]).toEqual(['living', 'ai', 'fundamentals', 'workflow', 'contact']);
});
