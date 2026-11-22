import type { PartyState, WeGift } from '@/src/model/types';

export function emptyParty(groupId: string): PartyState {
  return {
    groupId,
    players: [],
    gifts: [],
    phase: 'setup',
    currentIndex: 0,
    activePlayer: null,
    responding: false,
    stealBanId: null,
    maxSteals: 3,
    turnSeconds: 60,
    turnEndsAt: null,
    log: [],
    passPlayers: [],
    passHolding: 0,
    passOut: [],
    passEndsAt: null,
    passRunning: false,
    passSeconds: 12,
    passLog: [],
  };
}

export function shuffleNames(names: string[], rng: () => number = Math.random): string[] {
  const copy = [...names];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    const current = copy[index]!;
    copy[index] = copy[swap]!;
    copy[swap] = current;
  }
  return copy;
}

function touchTurn(party: PartyState, now: number): PartyState {
  return { ...party, turnEndsAt: now + party.turnSeconds * 1000 };
}

function advanceSeat(party: PartyState, line: string, now: number): PartyState {
  const nextIndex = party.currentIndex + 1;
  const log = [...party.log, line];
  if (nextIndex >= party.players.length) {
    return {
      ...party,
      phase: 'done',
      activePlayer: null,
      responding: false,
      stealBanId: null,
      turnEndsAt: null,
      log: [...log, 'All turns are done. Peek at what you ended up with.'],
    };
  }
  const next = party.players[nextIndex]!;
  return touchTurn(
    {
      ...party,
      currentIndex: nextIndex,
      activePlayer: next,
      responding: false,
      stealBanId: null,
      log: [...log, `${next}'s turn.`],
    },
    now,
  );
}

export function startWhiteElephant(party: PartyState, now = Date.now(), rng: () => number = Math.random): PartyState {
  if (party.players.length < 2) throw new Error('Add at least two players.');
  if (party.gifts.length < 1) throw new Error('Add at least one wrapped gift.');
  const players = shuffleNames(party.players, rng);
  const gifts: WeGift[] = party.gifts.map((gift) => ({ ...gift, opened: false, holder: null, steals: 0 }));
  return touchTurn(
    {
      ...party,
      players,
      gifts,
      phase: 'playing',
      currentIndex: 0,
      activePlayer: players[0]!,
      responding: false,
      stealBanId: null,
      log: [`${players[0]} goes first. Unwrap something.`],
    },
    now,
  );
}

export function openGift(party: PartyState, giftId: string, now = Date.now()): PartyState {
  if (party.phase !== 'playing' || !party.activePlayer) throw new Error('Start the game first.');
  const gift = party.gifts.find((entry) => entry.id === giftId);
  if (!gift) throw new Error('That gift is not in the pile.');
  if (gift.opened) throw new Error('That one is already open.');
  const gifts = party.gifts.map((entry) =>
    entry.id === giftId ? { ...entry, opened: true, holder: party.activePlayer } : entry,
  );
  return advanceSeat({ ...party, gifts }, `${party.activePlayer} opened “${gift.label}”.`, now);
}

export function stealGift(party: PartyState, giftId: string, now = Date.now()): PartyState {
  if (party.phase !== 'playing' || !party.activePlayer) throw new Error('Start the game first.');
  const gift = party.gifts.find((entry) => entry.id === giftId);
  if (!gift || !gift.opened) throw new Error('Unwrap a gift before anyone can steal it.');
  if (gift.holder === party.activePlayer) throw new Error('You already have that one.');
  if (gift.steals >= party.maxSteals) throw new Error('That gift is locked. No more steals.');
  if (party.stealBanId === gift.id) throw new Error('No stealing it right back.');
  const victim = gift.holder;
  if (!victim) throw new Error('That gift has nobody holding it.');
  const gifts = party.gifts.map((entry) =>
    entry.id === gift.id ? { ...entry, holder: party.activePlayer, steals: entry.steals + 1 } : entry,
  );
  return touchTurn(
    {
      ...party,
      gifts,
      activePlayer: victim,
      responding: true,
      stealBanId: gift.id,
      log: [...party.log, `${party.activePlayer} stole “${gift.label}” from ${victim}.`],
    },
    now,
  );
}

export function timeoutTurn(party: PartyState, now = Date.now()): PartyState {
  if (party.phase !== 'playing' || !party.activePlayer) return party;
  const unopened = party.gifts.find((gift) => !gift.opened);
  if (unopened) return openGift(party, unopened.id, now);
  return advanceSeat(party, `${party.activePlayer} ran out of time.`, now);
}

export function startPass(party: PartyState, now = Date.now()): PartyState {
  if (party.passPlayers.length < 2) throw new Error('Add at least two players.');
  return {
    ...party,
    passOut: [],
    passHolding: 0,
    passRunning: true,
    passEndsAt: now + party.passSeconds * 1000,
    passLog: ['Music is playing. Pass the present!'],
  };
}

export function passToNext(party: PartyState): PartyState {
  const alive = party.passPlayers.filter((name) => !party.passOut.includes(name));
  if (alive.length <= 1) return party;
  let index = party.passHolding;
  for (let step = 0; step < party.passPlayers.length; step += 1) {
    index = (index + 1) % party.passPlayers.length;
    if (!party.passOut.includes(party.passPlayers[index]!)) break;
  }
  const from = party.passPlayers[party.passHolding];
  return {
    ...party,
    passHolding: index,
    passLog: [...party.passLog, `${from} passed it on.`],
  };
}

export function passTimerEnded(party: PartyState, now = Date.now(), rng: () => number = Math.random): PartyState {
  if (!party.passRunning) return party;
  const holder = party.passPlayers[party.passHolding];
  if (!holder) return party;
  const passOut = party.passOut.includes(holder) ? party.passOut : [...party.passOut, holder];
  const alive = party.passPlayers.filter((name) => !passOut.includes(name));
  if (alive.length <= 1) {
    const winner = alive[0];
    return {
      ...party,
      passOut,
      passRunning: false,
      passEndsAt: null,
      passLog: [
        ...party.passLog,
        `Time! ${holder} is out.`,
        winner ? `${winner} wins the present.` : 'Everyone is out.',
      ],
    };
  }
  const nextName = alive[Math.floor(rng() * alive.length)]!;
  const seconds = 5 + Math.floor(rng() * Math.max(1, party.passSeconds - 4));
  return {
    ...party,
    passOut,
    passHolding: party.passPlayers.indexOf(nextName),
    passRunning: true,
    passEndsAt: now + seconds * 1000,
    passLog: [...party.passLog, `Time! ${holder} is out.`, `${nextName} has the present.`],
  };
}
