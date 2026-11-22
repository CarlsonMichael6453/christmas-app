export type Countdown = {
  target: Date;
  isChristmas: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Next December 25 at local midnight. On Christmas Day the countdown stays on today. */
export function christmasCountdown(now: Date): Countdown {
  const month = now.getMonth();
  const date = now.getDate();
  let year = now.getFullYear();
  const isChristmas = month === 11 && date === 25;
  if (month === 11 && date > 25) year += 1;
  const target = new Date(year, 11, 25, 0, 0, 0, 0);
  const remaining = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    target,
    isChristmas,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function isDoorUnlocked(day: number, now: Date, preview: boolean): boolean {
  if (day < 1 || day > 24) return false;
  if (preview) return true;
  return now.getMonth() === 11 && now.getDate() >= day;
}
