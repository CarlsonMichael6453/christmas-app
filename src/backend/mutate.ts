import type {
  Assignment,
  BingoCard,
  CardTask,
  Claim,
  CookieSignup,
  DB,
  EventInput,
  Exclusion,
  Group,
  ItemInput,
  Letter,
  LightPin,
  Membership,
  PartyState,
  Resolution,
  SantaEvent,
  Sweater,
  User,
  WishItem,
} from '@/src/model/types';
import { drawNames } from '@/src/logic/derangement';
import { hashPassword, makeJoinCode, nowIso, uid } from '@/src/logic/format';
import { emptyParty } from '@/src/logic/party';
import { applyBought, applyClaim, applyRelease } from '@/src/logic/visibility';

export type { EventInput, ItemInput };

export function emptyDB(): DB {
  return {
    users: [],
    sessionUserId: null,
    groups: [],
    memberships: [],
    currentGroupId: null,
    items: [],
    claims: [],
    events: [],
    assignments: [],
    letters: [],
    sweaters: [],
    votes: [],
    lights: [],
    cookies: [],
    cards: [],
    bingo: [],
    resolutions: [],
    parties: [],
    budgets: [],
    advent: [],
    previewAdvent: false,
    seenSlips: [],
    recordIds: { bingo: {}, budget: {}, votes: {}, adventId: null },
  };
}

export function sessionUser(db: DB): User {
  const user = db.users.find((entry) => entry.id === db.sessionUserId);
  if (!user) throw new Error('Sign in first.');
  return user;
}

export function currentGroup(db: DB): Group {
  const group = db.groups.find((entry) => entry.id === db.currentGroupId);
  if (!group) throw new Error('Create or join a group first.');
  return group;
}

function assertMember(db: DB, groupId: string, userId: string) {
  if (!db.memberships.some((membership) => membership.groupId === groupId && membership.userId === userId)) {
    throw new Error('You are not in that group.');
  }
}

function adopt(db: DB, userId: string) {
  db.sessionUserId = userId;
  const mine = db.memberships.filter((membership) => membership.userId === userId);
  if (!mine.some((membership) => membership.groupId === db.currentGroupId)) {
    db.currentGroupId = mine[0]?.groupId ?? null;
  }
}

export function signInWithName(db: DB, name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Use at least 2 letters so your family knows who you are.');
  const existing = db.users.find((user) => !user.email && user.displayName.toLowerCase() === clean.toLowerCase());
  if (existing) {
    adopt(db, existing.id);
    return;
  }
  const user: User = { id: uid(), displayName: clean, createdAt: nowIso() };
  db.users.push(user);
  adopt(db, user.id);
}

export function signInWithEmail(db: DB, email: string, password: string, name?: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.split('@')[1]?.includes('.')) {
    throw new Error('That email does not look right.');
  }
  if (password.length < 6) throw new Error('Use at least 6 characters for the password.');
  const existing = db.users.find((user) => user.email === cleanEmail);
  const passwordHash = hashPassword(password);
  if (existing) {
    if (existing.passwordHash !== passwordHash) throw new Error('That password does not match.');
    if (name?.trim()) existing.displayName = name.trim();
    adopt(db, existing.id);
    return;
  }
  const user: User = {
    id: uid(),
    displayName: name?.trim() || cleanEmail.split('@')[0] || 'Guest',
    email: cleanEmail,
    passwordHash,
    createdAt: nowIso(),
  };
  db.users.push(user);
  adopt(db, user.id);
}

export function signOut(db: DB) {
  db.sessionUserId = null;
  db.currentGroupId = null;
}

export function switchUser(db: DB, userId: string) {
  if (!db.users.some((user) => user.id === userId)) throw new Error('That person is not on this phone.');
  adopt(db, userId);
}

export function updateName(db: DB, name: string) {
  const user = sessionUser(db);
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Use at least 2 letters.');
  user.displayName = clean;
}

export function createGroup(db: DB, name: string) {
  const user = sessionUser(db);
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Give the group a name.');
  let joinCode = makeJoinCode();
  while (db.groups.some((group) => group.joinCode === joinCode)) joinCode = makeJoinCode();
  const group: Group = { id: uid(), name: clean, joinCode, ownerId: user.id, createdAt: nowIso() };
  db.groups.push(group);
  const membership: Membership = { groupId: group.id, userId: user.id, role: 'owner', joinedAt: nowIso() };
  db.memberships.push(membership);
  db.currentGroupId = group.id;
  if (!db.parties.some((party) => party.groupId === group.id)) db.parties.push(emptyParty(group.id));
}

export function joinGroup(db: DB, code: string) {
  const user = sessionUser(db);
  const group = db.groups.find((entry) => entry.joinCode.toLowerCase() === code.trim().toLowerCase());
  if (!group) throw new Error('No group uses that code.');
  if (!db.memberships.some((membership) => membership.groupId === group.id && membership.userId === user.id)) {
    db.memberships.push({ groupId: group.id, userId: user.id, role: 'member', joinedAt: nowIso() });
  }
  db.currentGroupId = group.id;
  if (!db.parties.some((party) => party.groupId === group.id)) db.parties.push(emptyParty(group.id));
}

export function selectGroup(db: DB, groupId: string) {
  const user = sessionUser(db);
  assertMember(db, groupId, user.id);
  db.currentGroupId = groupId;
}

function groupItem(db: DB, itemId: string): WishItem {
  const group = currentGroup(db);
  const item = db.items.find((entry) => entry.id === itemId && entry.groupId === group.id);
  if (!item) throw new Error('That gift is not on a list in this group.');
  return item;
}

export function addItem(db: DB, input: ItemInput) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const title = input.title.trim();
  if (!title) throw new Error('Name the gift.');
  db.items.push({
    id: uid(),
    groupId: group.id,
    ownerId: user.id,
    title,
    link: input.link.trim(),
    price: input.price,
    notes: input.notes.trim(),
    priority: input.priority,
    createdAt: nowIso(),
  });
}

export function updateItem(db: DB, itemId: string, input: ItemInput) {
  const user = sessionUser(db);
  const item = groupItem(db, itemId);
  if (item.ownerId !== user.id) throw new Error('You can only edit gifts on your own list.');
  const title = input.title.trim();
  if (!title) throw new Error('Name the gift.');
  item.title = title;
  item.link = input.link.trim();
  item.price = input.price;
  item.notes = input.notes.trim();
  item.priority = input.priority;
}

export function deleteItem(db: DB, itemId: string) {
  const user = sessionUser(db);
  const item = groupItem(db, itemId);
  if (item.ownerId !== user.id) throw new Error('You can only remove gifts from your own list.');
  db.items = db.items.filter((entry) => entry.id !== itemId);
  db.claims = db.claims.filter((claim) => claim.itemId !== itemId);
}

export function claimItem(db: DB, itemId: string) {
  const user = sessionUser(db);
  const item = groupItem(db, itemId);
  const claim: Claim = {
    id: uid(),
    itemId: item.id,
    groupId: item.groupId,
    claimerId: user.id,
    status: 'claimed',
    pricePaid: null,
    updatedAt: nowIso(),
  };
  db.claims = applyClaim(db.claims, item, user.id, claim);
}

export function markBought(db: DB, itemId: string, pricePaid: number | null) {
  const user = sessionUser(db);
  const item = groupItem(db, itemId);
  db.claims = applyBought(db.claims, item, user.id, pricePaid, nowIso());
}

export function releaseClaim(db: DB, itemId: string) {
  const user = sessionUser(db);
  const item = groupItem(db, itemId);
  db.claims = applyRelease(db.claims, item, user.id);
}

export function createEvent(db: DB, input: EventInput) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const event = normalizeEvent(db, group.id, user.id, input);
  db.events.push(event);
}

export function updateEvent(db: DB, eventId: string, input: EventInput) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const event = db.events.find((entry) => entry.id === eventId && entry.groupId === group.id);
  if (!event) throw new Error('That drawing is gone.');
  if (event.organizerId !== user.id) throw new Error('Only the organizer can change this drawing.');
  if (event.drawn) throw new Error('Reset the draw before changing the rules.');
  const next = normalizeEvent(db, group.id, user.id, input, event.id, event.createdAt);
  Object.assign(event, next);
}

function normalizeEvent(
  db: DB,
  groupId: string,
  organizerId: string,
  input: EventInput,
  id = uid(),
  createdAt = nowIso(),
): SantaEvent {
  const name = input.name.trim() || 'Secret Santa';
  const participantIds = [...new Set(input.participantIds)];
  if (participantIds.length < 2) throw new Error('Pick at least 2 people.');
  for (const personId of participantIds) assertMember(db, groupId, personId);
  const exclusions = cleanExclusions(input.exclusions, participantIds);
  if (!Number.isFinite(input.budget) || input.budget < 0) throw new Error('Enter a budget of zero or more.');
  return {
    id,
    groupId,
    name,
    budget: input.budget,
    exchangeDate: input.exchangeDate,
    organizerId,
    participantIds,
    exclusions,
    drawn: false,
    createdAt,
  };
}

function cleanExclusions(exclusions: Exclusion[], participantIds: string[]): Exclusion[] {
  const allowed = new Set(participantIds);
  const seen = new Set<string>();
  const clean: Exclusion[] = [];
  for (const exclusion of exclusions) {
    if (!allowed.has(exclusion.a) || !allowed.has(exclusion.b) || exclusion.a === exclusion.b) continue;
    const key = [exclusion.a, exclusion.b].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({ a: exclusion.a, b: exclusion.b });
  }
  return clean;
}

export function runDraw(db: DB, eventId: string): { ok: true } | { ok: false; reason: string } {
  const user = sessionUser(db);
  const event = db.events.find((entry) => entry.id === eventId);
  if (!event) return { ok: false, reason: 'That drawing is gone.' };
  if (event.organizerId !== user.id) return { ok: false, reason: 'Only the organizer can run the draw.' };
  const result = drawNames(event.participantIds, event.exclusions);
  if (!result.ok) return result;
  db.assignments = db.assignments.filter((assignment) => assignment.eventId !== event.id);
  const stored: Assignment[] = result.pairs.map((pair) => ({
    id: uid(),
    eventId: event.id,
    giverId: pair.giverId,
    receiverId: pair.receiverId,
  }));
  db.assignments.push(...stored);
  event.drawn = true;
  db.seenSlips = db.seenSlips.filter((slip) => slip.eventId !== event.id);
  return { ok: true };
}

export function resetDraw(db: DB, eventId: string) {
  const user = sessionUser(db);
  const event = db.events.find((entry) => entry.id === eventId);
  if (!event) throw new Error('That drawing is gone.');
  if (event.organizerId !== user.id) throw new Error('Only the organizer can reset the draw.');
  db.assignments = db.assignments.filter((assignment) => assignment.eventId !== event.id);
  event.drawn = false;
  db.seenSlips = db.seenSlips.filter((slip) => slip.eventId !== event.id);
}

export function markSlipSeen(db: DB, eventId: string) {
  const user = sessionUser(db);
  if (db.seenSlips.some((slip) => slip.userId === user.id && slip.eventId === eventId)) return;
  db.seenSlips.push({ userId: user.id, eventId });
}

export function setPreview(db: DB, value: boolean) {
  db.previewAdvent = value;
}

export function markDoorOpen(db: DB, day: number) {
  const user = sessionUser(db);
  let row = db.advent.find((entry) => entry.userId === user.id);
  if (!row) {
    row = { userId: user.id, days: [] };
    db.advent.push(row);
  }
  if (!row.days.includes(day)) row.days.push(day);
}

export function setBudget(db: DB, total: number) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!Number.isFinite(total) || total < 0) throw new Error('Enter a budget of zero or more.');
  const row = db.budgets.find((entry) => entry.groupId === group.id && entry.userId === user.id);
  if (row) row.total = total;
  else db.budgets.push({ groupId: group.id, userId: user.id, total });
}

export function saveLetter(db: DB, letter: Letter) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (letter.groupId !== group.id) throw new Error('That letter is for another group.');
  if (!letter.title.trim() && !letter.body.trim() && letter.strokes.length === 0) {
    throw new Error('Write or draw something first.');
  }
  const existing = db.letters.find((entry) => entry.id === letter.id);
  if (existing && existing.authorId !== user.id) throw new Error('You can only edit your own letter.');
  const next = { ...letter, authorId: existing?.authorId ?? user.id, title: letter.title.trim() || 'Dear Santa' };
  if (existing) Object.assign(existing, next);
  else db.letters.push(next);
}

export function deleteLetter(db: DB, id: string) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const letter = db.letters.find((entry) => entry.id === id && entry.groupId === group.id);
  if (!letter) return;
  if (letter.authorId !== user.id) throw new Error('You can only remove your own letter.');
  db.letters = db.letters.filter((entry) => entry.id !== id);
}

export function saveSweater(db: DB, sweater: Sweater) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!sweater.name.trim()) throw new Error('Name your sweater.');
  const existing = db.sweaters.find((entry) => entry.id === sweater.id);
  if (existing && existing.designerId !== user.id) throw new Error('You can only edit your own sweater.');
  const next = { ...sweater, groupId: group.id, designerId: existing?.designerId ?? user.id, name: sweater.name.trim() };
  if (existing) Object.assign(existing, next);
  else db.sweaters.push(next);
}

export function deleteSweater(db: DB, id: string) {
  const user = sessionUser(db);
  const sweater = db.sweaters.find((entry) => entry.id === id);
  if (!sweater) return;
  if (sweater.designerId !== user.id) throw new Error('You can only remove your own sweater.');
  db.sweaters = db.sweaters.filter((entry) => entry.id !== id);
  db.votes = db.votes.filter((vote) => vote.sweaterId !== id);
}

export function toggleVote(db: DB, sweaterId: string) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const sweater = db.sweaters.find((entry) => entry.id === sweaterId && entry.groupId === group.id);
  if (!sweater) throw new Error('That sweater is gone.');
  const existing = db.votes.find((vote) => vote.sweaterId === sweaterId && vote.userId === user.id);
  if (existing) db.votes = db.votes.filter((vote) => vote !== existing);
  else db.votes.push({ sweaterId, userId: user.id, groupId: group.id });
}

export function saveLight(db: DB, light: LightPin) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!light.title.trim()) throw new Error('Name the light display.');
  const existing = db.lights.find((entry) => entry.id === light.id);
  if (existing && existing.userId !== user.id) throw new Error('You can only edit a pin you added.');
  const next = { ...light, groupId: group.id, userId: existing?.userId ?? user.id, title: light.title.trim() };
  if (existing) Object.assign(existing, next);
  else db.lights.push(next);
}

export function deleteLight(db: DB, id: string) {
  const user = sessionUser(db);
  const light = db.lights.find((entry) => entry.id === id);
  if (!light) return;
  if (light.userId !== user.id) throw new Error('You can only remove a pin you added.');
  db.lights = db.lights.filter((entry) => entry.id !== id);
}

export function saveCookie(db: DB, cookie: CookieSignup) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!cookie.name.trim()) throw new Error('Name the cookies.');
  const existing = db.cookies.find((entry) => entry.id === cookie.id);
  if (existing && existing.bakerId !== user.id) throw new Error('You can only edit your own signup.');
  const next = {
    ...cookie,
    groupId: group.id,
    bakerId: existing?.bakerId ?? user.id,
    name: cookie.name.trim(),
    dozens: Math.max(1, Math.round(cookie.dozens || 1)),
  };
  if (existing) Object.assign(existing, next);
  else db.cookies.push(next);
}

export function deleteCookie(db: DB, id: string) {
  const user = sessionUser(db);
  const cookie = db.cookies.find((entry) => entry.id === id);
  if (!cookie) return;
  if (cookie.bakerId !== user.id) throw new Error('You can only remove your own signup.');
  db.cookies = db.cookies.filter((entry) => entry.id !== id);
}

export function saveCard(db: DB, card: CardTask) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!card.recipient.trim()) throw new Error('Who is the card for?');
  const existing = db.cards.find((entry) => entry.id === card.id);
  if (existing && existing.userId !== user.id) throw new Error('That card list belongs to someone else.');
  const next = { ...card, groupId: group.id, userId: user.id, recipient: card.recipient.trim() };
  if (existing) Object.assign(existing, next);
  else db.cards.push(next);
}

export function deleteCard(db: DB, id: string) {
  const user = sessionUser(db);
  db.cards = db.cards.filter((card) => !(card.id === id && card.userId === user.id));
}

export function toggleBingo(db: DB, index: number) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (index === 12) return;
  const card = ensureBingo(db, group.id, user.id);
  card.marks[index] = !card.marks[index];
  card.marks[12] = true;
}

export function resetBingo(db: DB) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const card = ensureBingo(db, group.id, user.id);
  card.marks = freshMarks();
}

function freshMarks(): boolean[] {
  const marks = Array.from({ length: 25 }, () => false);
  marks[12] = true;
  return marks;
}

function ensureBingo(db: DB, groupId: string, userId: string): BingoCard {
  let card = db.bingo.find((entry) => entry.groupId === groupId && entry.userId === userId);
  if (!card) {
    card = { groupId, userId, marks: freshMarks() };
    db.bingo.push(card);
  }
  if (card.marks.length !== 25) card.marks = freshMarks();
  card.marks[12] = true;
  return card;
}

export function saveResolution(db: DB, resolution: Resolution) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  if (!resolution.title.trim()) throw new Error('Name the resolution.');
  const existing = db.resolutions.find((entry) => entry.id === resolution.id);
  if (existing && existing.authorId !== user.id) throw new Error('You can only edit your own resolution.');
  const next: Resolution = {
    ...resolution,
    groupId: group.id,
    authorId: existing?.authorId ?? user.id,
    title: resolution.title.trim(),
    progress: clampProgress(resolution.progress),
    cheerIds: existing?.cheerIds ?? resolution.cheerIds ?? [],
  };
  if (existing) Object.assign(existing, next);
  else db.resolutions.push(next);
}

export function deleteResolution(db: DB, id: string) {
  const user = sessionUser(db);
  const resolution = db.resolutions.find((entry) => entry.id === id);
  if (!resolution) return;
  if (resolution.authorId !== user.id) throw new Error('You can only remove your own resolution.');
  db.resolutions = db.resolutions.filter((entry) => entry.id !== id);
}

export function setProgress(db: DB, id: string, progress: number) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const resolution = db.resolutions.find((entry) => entry.id === id && entry.groupId === group.id);
  if (!resolution) throw new Error('That resolution is gone.');
  if (resolution.authorId !== user.id && !resolution.shared) throw new Error('That goal is private.');
  resolution.progress = clampProgress(progress);
}

export function cheer(db: DB, id: string) {
  const user = sessionUser(db);
  const group = currentGroup(db);
  const resolution = db.resolutions.find((entry) => entry.id === id && entry.groupId === group.id);
  if (!resolution || !resolution.shared) throw new Error('Cheer for a shared goal.');
  if (resolution.cheerIds.includes(user.id)) {
    resolution.cheerIds = resolution.cheerIds.filter((cheerId) => cheerId !== user.id);
  } else resolution.cheerIds.push(user.id);
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function saveParty(db: DB, party: PartyState) {
  const group = currentGroup(db);
  sessionUser(db);
  const next = { ...party, groupId: group.id };
  const index = db.parties.findIndex((entry) => entry.groupId === group.id);
  if (index === -1) db.parties.push(next);
  else db.parties[index] = next;
}

export function replaceDB(db: DB, next: DB) {
  const fresh = emptyDB();
  (Object.keys(fresh) as (keyof DB)[]).forEach((key) => {
    (db[key] as DB[keyof DB]) = next[key] as DB[keyof DB];
  });
}
