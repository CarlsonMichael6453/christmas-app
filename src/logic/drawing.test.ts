import { describe, expect, it } from 'vitest';

import { BRUSH_SIZES, PENCIL_COLORS, smoothStrokePath } from '@/src/logic/drawing';

describe('smoothStrokePath', () => {
  it('returns an empty path when the finger has not touched down', () => {
    expect(smoothStrokePath([])).toBe('');
  });

  it('turns a tap into a short round-cap dash', () => {
    expect(smoothStrokePath([{ x: 10, y: 20 }])).toBe('M 10 20 L 10.1 20');
  });

  it('smooths a stroke with quadratic curves through the midpoints', () => {
    const path = smoothStrokePath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
      { x: 30, y: 10 },
    ]);
    expect(path.startsWith('M 0 0')).toBe(true);
    expect(path).toContain('Q 10 10 15 5');
    expect(path).toContain('Q 20 0 25 5');
    expect(path.endsWith('L 30 10')).toBe(true);
    expect(path).not.toContain('L 10 10');
  });
});

describe('drawing tools', () => {
  it('offers a winter palette and a range of pencil sizes', () => {
    expect(PENCIL_COLORS.length).toBeGreaterThanOrEqual(24);
    expect(BRUSH_SIZES.length).toBeGreaterThanOrEqual(6);
    expect(BRUSH_SIZES[0]).toBeLessThan(BRUSH_SIZES[BRUSH_SIZES.length - 1]!);
    expect(new Set(PENCIL_COLORS).size).toBe(PENCIL_COLORS.length);
  });
});
