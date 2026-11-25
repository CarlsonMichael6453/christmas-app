import { describe, expect, it } from 'vitest';

import { REVIEW_MIN_DAYS, REVIEW_MIN_WISHES, shouldAskForReview, type ReviewRecord } from '@/src/logic/reviewPrompt';

const day = 24 * 60 * 60 * 1000;
const opened = 1_700_000_000_000;

function record(partial: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    firstOpenedAt: opened,
    asked: false,
    wishlistAdds: 0,
    santaDraws: 0,
    ...partial,
  };
}

describe('shouldAskForReview', () => {
  const ready = { web: false, available: true };
  const later = opened + (REVIEW_MIN_DAYS + 1) * day;

  it('never asks on the web or when the store cannot show a review', () => {
    const used = record({ wishlistAdds: 5, santaDraws: 1 });
    expect(shouldAskForReview(used, later, { web: true, available: true })).toBe(false);
    expect(shouldAskForReview(used, later, { web: false, available: false })).toBe(false);
  });

  it('waits a few days and asks only after real use, once', () => {
    expect(shouldAskForReview(record({ wishlistAdds: REVIEW_MIN_WISHES }), opened + day, ready)).toBe(false);
    expect(shouldAskForReview(record({ wishlistAdds: REVIEW_MIN_WISHES - 1 }), later, ready)).toBe(false);
    expect(shouldAskForReview(record({ wishlistAdds: REVIEW_MIN_WISHES }), later, ready)).toBe(true);
    expect(shouldAskForReview(record({ santaDraws: 1 }), later, ready)).toBe(true);
    expect(shouldAskForReview(record({ wishlistAdds: 5, asked: true }), later, ready)).toBe(false);
  });
});
