import { describe, expect, it } from 'vitest';

import { emptyParty, openGift, startWhiteElephant, stealGift } from './party';

describe('white elephant steals', () => {
  it('locks a gift after the steal limit and blocks an immediate steal-back', () => {
    const base = emptyParty('g');
    base.players = ['Ada', 'Bea', 'Cal'];
    base.gifts = [
      { id: 'red', label: 'Red box', opened: false, holder: null, steals: 0 },
      { id: 'gold', label: 'Gold box', opened: false, holder: null, steals: 0 },
    ];
    base.maxSteals = 1;
    const started = startWhiteElephant(base, 1_000, () => 0);
    const first = started.activePlayer!;
    const opened = openGift(started, 'red', 1_000);
    const second = opened.activePlayer!;
    expect(second).not.toBe(first);
    const stolen = stealGift(opened, 'red', 2_000);
    expect(stolen.gifts.find((gift) => gift.id === 'red')?.steals).toBe(1);
    expect(stolen.activePlayer).toBe(first);
    expect(() => stealGift(stolen, 'red', 3_000)).toThrow(/right back|locked/);
  });
});
