import { describe, expect, it } from 'vitest';

import { christmasCountdown, isDoorUnlocked } from './countdown';

describe('christmasCountdown', () => {
  it('counts down to December 25 of the same year before Christmas', () => {
    const countdown = christmasCountdown(new Date(2026, 10, 21, 12, 0, 0));
    expect(countdown.target.getFullYear()).toBe(2026);
    expect(countdown.target.getMonth()).toBe(11);
    expect(countdown.target.getDate()).toBe(25);
    expect(countdown.isChristmas).toBe(false);
    expect(countdown.days).toBe(33);
  });

  it('celebrates on Christmas Day and rolls to next year on the 26th', () => {
    const day = christmasCountdown(new Date(2026, 11, 25, 15, 0, 0));
    expect(day.isChristmas).toBe(true);
    expect(day.days).toBe(0);

    const after = christmasCountdown(new Date(2026, 11, 26, 8, 0, 0));
    expect(after.target.getFullYear()).toBe(2027);
    expect(after.isChristmas).toBe(false);
  });
});

describe('isDoorUnlocked', () => {
  const november = new Date(2026, 10, 21);
  const decemberFifth = new Date(2026, 11, 5, 9);

  it('locks every door outside December unless preview is on', () => {
    expect(isDoorUnlocked(1, november, false)).toBe(false);
    expect(isDoorUnlocked(1, november, true)).toBe(true);
  });

  it('unlocks doors up through today in December', () => {
    expect(isDoorUnlocked(5, decemberFifth, false)).toBe(true);
    expect(isDoorUnlocked(6, decemberFifth, false)).toBe(false);
    expect(isDoorUnlocked(1, decemberFifth, false)).toBe(true);
  });
});
