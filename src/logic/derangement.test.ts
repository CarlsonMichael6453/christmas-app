import { describe, expect, it } from 'vitest';

import { drawNames, isForbidden, isValidDraw, type Exclusion } from './derangement';

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const family = ['michael', 'emma', 'lily', 'noah'];

describe('drawNames', () => {
  it('never lets anyone draw themselves and covers every person once', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const result = drawNames(family, [], mulberry32(seed));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(isValidDraw(family, [], result.pairs)).toBe(true);
      for (const pair of result.pairs) {
        expect(pair.giverId).not.toBe(pair.receiverId);
      }
    }
  });

  it('keeps couples from drawing each other, in either direction', () => {
    const exclusions: Exclusion[] = [{ a: 'michael', b: 'emma' }];
    for (let seed = 1; seed <= 25; seed += 1) {
      const result = drawNames(family, exclusions, mulberry32(seed));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(isValidDraw(family, exclusions, result.pairs)).toBe(true);
      for (const pair of result.pairs) {
        expect(isForbidden(pair.giverId, pair.receiverId, exclusions)).toBe(false);
        const blocked =
          (pair.giverId === 'michael' && pair.receiverId === 'emma') ||
          (pair.giverId === 'emma' && pair.receiverId === 'michael');
        expect(blocked).toBe(false);
      }
    }
  });

  it('is deterministic for a seeded generator', () => {
    const first = drawNames(family, [{ a: 'lily', b: 'noah' }], mulberry32(7));
    const second = drawNames(family, [{ a: 'noah', b: 'lily' }], mulberry32(7));
    expect(first).toEqual(second);
  });

  it('reports when two people are excluded from each other', () => {
    const result = drawNames(['michael', 'emma'], [{ a: 'emma', b: 'michael' }], mulberry32(1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('reports when one person is excluded from everyone else', () => {
    const exclusions: Exclusion[] = [
      { a: 'michael', b: 'emma' },
      { a: 'michael', b: 'lily' },
      { a: 'michael', b: 'noah' },
    ];
    const result = drawNames(family, exclusions, mulberry32(2));
    expect(result.ok).toBe(false);
  });

  it('reports an impossible triangle of exclusions', () => {
    const people = ['a', 'b', 'c'];
    const exclusions: Exclusion[] = [
      { a: 'a', b: 'b' },
      { a: 'b', b: 'c' },
      { a: 'a', b: 'c' },
    ];
    const result = drawNames(people, exclusions, mulberry32(3));
    expect(result.ok).toBe(false);
  });

  it('treats a couple plus one other person as impossible', () => {
    const result = drawNames(['a', 'b', 'c'], [{ a: 'a', b: 'b' }], mulberry32(4));
    expect(result.ok).toBe(false);
  });

  it('finds a draw for four people when one couple is excluded', () => {
    const people = ['a', 'b', 'c', 'd'];
    const exclusions: Exclusion[] = [{ a: 'a', b: 'b' }];
    const result = drawNames(people, exclusions, mulberry32(4));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isValidDraw(people, exclusions, result.pairs)).toBe(true);
  });

  it('rejects a single person and duplicate names', () => {
    expect(drawNames(['only'], []).ok).toBe(false);
    expect(drawNames([], []).ok).toBe(false);
    expect(drawNames(['a', 'a'], []).ok).toBe(false);
  });
});
