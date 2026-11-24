import { expect, test } from 'vitest';
import { formatMonthYear, formatMonthYearShort } from '../../src/lib/date';

test('formatMonthYear', () => {
  expect(formatMonthYear(new Date('2026-11-15T12:00:00Z'), 'pt')).toBe('novembro de 2026');
  expect(formatMonthYear(new Date('2026-11-15T12:00:00Z'), 'en')).toBe('November 2026');
  expect(formatMonthYear(new Date('2026-12-01T02:00:00Z'), 'pt')).toBe('novembro de 2026');
});

test('formatMonthYearShort', () => {
  expect(formatMonthYearShort(new Date('2026-11-15T12:00:00Z'), 'pt')).toBe('nov 2026');
  expect(formatMonthYearShort(new Date('2026-11-15T12:00:00Z'), 'en')).toBe('Nov 2026');
  expect(formatMonthYearShort(new Date('2026-12-01T02:00:00Z'), 'pt')).toBe('nov 2026'); // fuso de São Paulo
});
