export const REVIEW_MIN_DAYS = 3;
export const REVIEW_MIN_WISHES = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewRecord = {
  firstOpenedAt: number;
  asked: boolean;
  wishlistAdds: number;
  santaDraws: number;
};

export function shouldAskForReview(
  record: ReviewRecord,
  now: number,
  options: { web: boolean; available: boolean },
): boolean {
  if (options.web || !options.available || record.asked) return false;
  if (now - record.firstOpenedAt < REVIEW_MIN_DAYS * DAY_MS) return false;
  return record.wishlistAdds >= REVIEW_MIN_WISHES || record.santaDraws >= 1;
}
