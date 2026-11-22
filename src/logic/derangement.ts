export type Exclusion = { a: string; b: string };

export type DrawPair = { giverId: string; receiverId: string };

export type DrawResult =
  | { ok: true; pairs: DrawPair[] }
  | { ok: false; reason: string };

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function isForbidden(giver: string, receiver: string, exclusions: Exclusion[]): boolean {
  if (giver === receiver) return true;
  const key = pairKey(giver, receiver);
  return exclusions.some((exclusion) => pairKey(exclusion.a, exclusion.b) === key);
}

function optionCount(person: string, people: string[], exclusions: Exclusion[]): number {
  return people.filter((receiver) => !isForbidden(person, receiver, exclusions)).length;
}

/**
 * Random derangement that respects undirected exclusions (couples, "not them").
 * Nobody is assigned themselves. Every person gives once and receives once.
 * Returns a clear reason when no such matching exists.
 */
export function drawNames(
  people: string[],
  exclusions: Exclusion[],
  rng: () => number = Math.random,
): DrawResult {
  if (people.length < 2) {
    return { ok: false, reason: 'Add at least 2 people before drawing names.' };
  }

  const unique = [...new Set(people)];
  if (unique.length !== people.length) {
    return { ok: false, reason: 'The same person is listed twice.' };
  }

  for (const person of unique) {
    if (optionCount(person, unique, exclusions) === 0) {
      return {
        ok: false,
        reason: 'Someone has nobody they are allowed to draw. Loosen the exclusions.',
      };
    }
  }

  const givers = [...unique].sort((a, b) => {
    const diff = optionCount(a, unique, exclusions) - optionCount(b, unique, exclusions);
    if (diff !== 0) return diff;
    return rng() - 0.5;
  });

  const assignment = new Map<string, string>();

  const receiverTaken = (receiver: string) => {
    for (const chosen of assignment.values()) {
      if (chosen === receiver) return true;
    }
    return false;
  };

  const shuffle = <T,>(list: T[]): T[] => {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      const current = copy[index]!;
      copy[index] = copy[swap]!;
      copy[swap] = current;
    }
    return copy;
  };

  const search = (index: number): boolean => {
    if (index === givers.length) return true;
    const giver = givers[index]!;
    const options = shuffle(
      unique.filter((receiver) => !receiverTaken(receiver) && !isForbidden(giver, receiver, exclusions)),
    );
    for (const receiver of options) {
      assignment.set(giver, receiver);
      if (search(index + 1)) return true;
      assignment.delete(giver);
    }
    return false;
  };

  if (!search(0)) {
    return {
      ok: false,
      reason:
        'No valid draw with these exclusions. A derangement is impossible — someone would be stuck with themselves or a blocked person.',
    };
  }

  const pairs = [...assignment.entries()].map(([giverId, receiverId]) => ({ giverId, receiverId }));
  return { ok: true, pairs };
}

export function isValidDraw(people: string[], exclusions: Exclusion[], pairs: DrawPair[]): boolean {
  if (pairs.length !== people.length) return false;
  const givers = new Set(pairs.map((pair) => pair.giverId));
  const receivers = new Set(pairs.map((pair) => pair.receiverId));
  if (givers.size !== people.length || receivers.size !== people.length) return false;
  for (const person of people) {
    if (!givers.has(person) || !receivers.has(person)) return false;
  }
  return pairs.every((pair) => !isForbidden(pair.giverId, pair.receiverId, exclusions));
}
