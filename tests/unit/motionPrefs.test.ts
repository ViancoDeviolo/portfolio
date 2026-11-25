import { describe, expect, it } from 'vitest';
import { canAnimate } from '../../src/lib/motionPrefs';

describe('canAnimate', () => {
  it('só anima com WebGL e sem movimento reduzido', () => {
    expect(canAnimate({ reducedMotion: false, webgl: true })).toBe(true);
    expect(canAnimate({ reducedMotion: true, webgl: true })).toBe(false);
    expect(canAnimate({ reducedMotion: false, webgl: false })).toBe(false);
    expect(canAnimate({ reducedMotion: true, webgl: false })).toBe(false);
  });
});
