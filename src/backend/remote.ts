import type {
  Assignment,
  BingoCard,
  BudgetRow,
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
  SeenSlip,
  Sweater,
  User,
  Vote,
  WishItem,
} from '@/src/model/types';
import { uid } from '@/src/logic/format';
import { emptyParty } from '@/src/logic/party';
import { emptyDB } from '@/src/backend/mutate';
import { supabase } from '@/src/backend/supabase';

type Row = Record<string, unknown>;

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function raise(error: { message: string; code?: string } | null) {
  if (error) throw new Error(authMessage(error));
}

function authMessage(error: { message: string; code?: string }) {
  const code = error.code ?? '';
  const message = error.message ?? 'Something went wrong.';
  if (code === 'anonymous_provider_disabled' || /anonymous/i.test(message)) {
    return 'Name-only sign-in is off in Supabase. Enable Anonymous under Authentication, or use email and a password.';
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {
    return 'Check your email to confirm the account. For a family test, turn off Confirm email in the Supabase dashboard.';
  }
  return message;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asObject<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as T;
}

async function ensureProfile(name?: string) {
  const db = client();
  const { data, error } = await db.auth.getUser();
  raise(error);
  const user = data.user;
  if (!user) throw new Error('Sign in failed.');
  const display =
    name?.trim() ||
    asString(user.user_metadata?.display_name) ||
    user.email?.split('@')[0] ||
    'Guest';
  const { error: profileError } = await db.from('profiles').upsert({ id: user.id, display_name: display });
  raise(profileError);
  return user;
}

export async function remoteSignInName(name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Use at least 2 letters so your family knows who you are.');
  const db = client();
  const { error } = await db.auth.signInAnonymously({ options: { data: { display_name: clean } } });
  if (error) throw new Error(authMessage(error));
  await ensureProfile(clean);
}

export async function remoteSignInEmail(email: string, password: string, name?: string) {
  const cleanEmail = email.trim();
  if (!cleanEmail.includes('@') || !cleanEmail.split('@')[1]?.includes('.')) {
    throw new Error('That email does not look right.');
  }
  if (password.length < 6) throw new Error('Use at least 6 characters for the password.');
  const db = client();
  const existing = await db.auth.signInWithPassword({ email: cleanEmail, password });
  if (!existing.error && existing.data.session) {
    await ensureProfile(name);
    return;
  }
  const wrongPassword =
    existing.error?.code === 'invalid_credentials' || /invalid login credentials/i.test(existing.error?.message ?? '');
  if (existing.error && !wrongPassword) throw new Error(authMessage(existing.error));
  const created = await db.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { display_name: name?.trim() || cleanEmail.split('@')[0] } },
  });
  if (created.error) {
    const combined = `${created.error.code ?? ''} ${created.error.message}`;
    if (/already registered|already been registered|user_already_exists/i.test(combined)) {
      throw new Error('That email already has an account. Check the password.');
    }
    throw new Error(authMessage(created.error));
  }
  if (!created.data.session) {
    throw new Error(
      'Check your email to confirm the account. For a family test, turn off Confirm email in the Supabase dashboard.',
    );
  }
  await ensureProfile(name);
}

export async function remoteSignOut() {
  const { error } = await client().auth.signOut();
  raise(error);
}

export async function remoteUpdateName(name: string) {
  const user = await ensureProfile(name);
  const { error } = await client().auth.updateUser({ data: { display_name: name.trim() } });
  raise(error);
  return user.id;
}

export async function remoteCreateGroup(name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Give the group a name.');
  const { data, error } = await client().rpc('create_group', { group_name: clean });
  raise(error);
  const row = (Array.isArray(data) ? data[0] : data) as Row | null;
  const id = asString(row?.id);
  if (!id) throw new Error('The group was not created.');
  return id;
}

export async function remoteJoinGroup(code: string) {
  const clean = code.trim();
  if (clean.length < 4) throw new Error('Enter the group code.');
  const { data, error } = await client().rpc('join_group', { join_code_input: clean });
  raise(error);
  const row = (Array.isArray(data) ? data[0] : data) as Row | null;
  const id = asString(row?.id);
  if (!id) throw new Error('No group uses that code.');
  return id;
}

export async function remoteAddItem(groupId: string, userId: string, input: ItemInput) {
  const { error } = await client().from('wish_items').insert({
    id: uid(),
    group_id: groupId,
    owner_id: userId,
    title: input.title.trim(),
    link: input.link.trim() || null,
    price: input.price,
    notes: input.notes.trim() || null,
    priority: input.priority,
  });
  raise(error);
}

export async function remoteUpdateItem(itemId: string, input: ItemInput) {
  const { error } = await client()
    .from('wish_items')
    .update({
      title: input.title.trim(),
      link: input.link.trim() || null,
      price: input.price,
      notes: input.notes.trim() || null,
      priority: input.priority,
    })
    .eq('id', itemId);
  raise(error);
}

export async function remoteDeleteItem(itemId: string) {
  const { error } = await client().from('wish_items').delete().eq('id', itemId);
  raise(error);
}

export async function remoteClaim(groupId: string, userId: string, itemId: string) {
  const { error } = await client().from('claims').insert({
    id: uid(),
    item_id: itemId,
    group_id: groupId,
    claimer_id: userId,
    status: 'claimed',
    price_paid: null,
  });
  raise(error);
}

export async function remoteMarkBought(itemId: string, pricePaid: number | null) {
  const { error } = await client()
    .from('claims')
    .update({ status: 'bought', price_paid: pricePaid, updated_at: new Date().toISOString() })
    .eq('item_id', itemId);
  raise(error);
}

export async function remoteRelease(itemId: string) {
  const { error } = await client().from('claims').delete().eq('item_id', itemId);
  raise(error);
}

export async function remoteSaveEvent(groupId: string, userId: string, event: SantaEvent) {
  const { error } = await client().from('santa_events').upsert({
    id: event.id,
    group_id: groupId,
    name: event.name,
    budget: event.budget,
    exchange_date: event.exchangeDate || null,
    organizer_id: userId,
    participant_ids: event.participantIds,
    exclusions: event.exclusions,
    drawn: event.drawn,
  });
  raise(error);
}

export async function remoteDraw(eventId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data, error } = await client().rpc('draw_secret_santa', { p_event: eventId });
  raise(error);
  const result = data as { ok?: boolean; reason?: string } | null;
  if (result?.ok) return { ok: true };
  return { ok: false, reason: result?.reason || 'The draw did not finish.' };
}

export async function remoteResetDraw(eventId: string) {
  const { error } = await client().rpc('reset_secret_santa', { p_event: eventId });
  raise(error);
}

async function saveRecord(groupId: string, authorId: string, kind: string, id: string, payload: unknown) {
  const { error } = await client().from('group_records').upsert({
    id,
    group_id: groupId,
    author_id: authorId,
    kind,
    payload,
    updated_at: new Date().toISOString(),
  });
  raise(error);
}

async function deleteRecord(id: string) {
  const { error } = await client().from('group_records').delete().eq('id', id);
  raise(error);
}

export async function remoteSaveLetter(groupId: string, userId: string, letter: Letter) {
  await saveRecord(groupId, letter.authorId || userId, 'letter', letter.id, { ...letter, groupId, authorId: letter.authorId || userId });
}

export async function remoteDeleteLetter(id: string) {
  await deleteRecord(id);
}

export async function remoteSaveSweater(groupId: string, userId: string, sweater: Sweater) {
  await saveRecord(groupId, sweater.designerId || userId, 'sweater', sweater.id, {
    ...sweater,
    groupId,
    designerId: sweater.designerId || userId,
  });
}

export async function remoteDeleteSweater(id: string) {
  await deleteRecord(id);
  const { error } = await client().from('group_records').delete().eq('kind', 'vote').contains('payload', { sweaterId: id });
  raise(error);
}

export async function remoteToggleVote(groupId: string, userId: string, sweaterId: string, existingVoteId: string | null) {
  if (existingVoteId) {
    await deleteRecord(existingVoteId);
    return;
  }
  const vote: Vote = { sweaterId, userId, groupId };
  await saveRecord(groupId, userId, 'vote', uid(), vote);
}

export async function remoteSaveLight(groupId: string, userId: string, light: LightPin) {
  await saveRecord(groupId, light.userId || userId, 'light', light.id, { ...light, groupId, userId: light.userId || userId });
}

export async function remoteDeleteLight(id: string) {
  await deleteRecord(id);
}

export async function remoteSaveCookie(groupId: string, userId: string, cookie: CookieSignup) {
  await saveRecord(groupId, cookie.bakerId || userId, 'cookie', cookie.id, {
    ...cookie,
    groupId,
    bakerId: cookie.bakerId || userId,
  });
}

export async function remoteDeleteCookie(id: string) {
  await deleteRecord(id);
}

export async function remoteSaveCard(groupId: string, userId: string, card: CardTask) {
  await saveRecord(groupId, userId, 'card', card.id, { ...card, groupId, userId });
}

export async function remoteDeleteCard(id: string) {
  await deleteRecord(id);
}

export async function remoteSaveBingo(groupId: string, userId: string, card: BingoCard, recordId: string) {
  await saveRecord(groupId, userId, 'bingo', recordId, card);
}

export async function remoteSaveResolution(groupId: string, userId: string, resolution: Resolution) {
  await saveRecord(groupId, resolution.authorId || userId, 'resolution', resolution.id, {
    ...resolution,
    groupId,
    authorId: resolution.authorId || userId,
  });
}

export async function remoteDeleteResolution(id: string) {
  await deleteRecord(id);
}

export async function remoteSaveParty(groupId: string, userId: string, party: PartyState) {
  await saveRecord(groupId, userId, 'party', groupId, { ...party, groupId });
}

export async function remoteSaveBudget(groupId: string, userId: string, total: number, recordId: string) {
  const row: BudgetRow = { groupId, userId, total };
  await saveRecord(groupId, userId, 'budget', recordId, row);
}

export async function remoteSaveAdvent(groupId: string, userId: string, days: number[], recordId: string) {
  await saveRecord(groupId, userId, 'advent', recordId, { userId, days });
}

export async function pullRemote(preferredGroupId: string | null, seenSlips: SeenSlip[], previewAdvent: boolean): Promise<DB> {
  const db = client();
  const { data: authData, error: authError } = await db.auth.getUser();
  raise(authError);
  const authUser = authData.user;
  if (!authUser) return emptyDB();

  const [profiles, groups, memberships, items, claims, events, assignments, records] = await Promise.all([
    db.from('profiles').select('*'),
    db.from('groups').select('*'),
    db.from('memberships').select('*'),
    db.from('wish_items').select('*'),
    db.from('claims').select('*'),
    db.from('santa_events').select('*'),
    db.from('santa_assignments').select('*'),
    db.from('group_records').select('*'),
  ]);
  for (const result of [profiles, groups, memberships, items, claims, events, assignments, records]) {
    raise(result.error);
  }

  const next = emptyDB();
  next.previewAdvent = previewAdvent;
  next.seenSlips = seenSlips;
  next.sessionUserId = authUser.id;
  next.users = ((profiles.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    displayName: asString(row.display_name, 'Someone'),
    email: row.id === authUser.id ? authUser.email ?? undefined : undefined,
    createdAt: asString(row.created_at, new Date().toISOString()),
  }));
  if (!next.users.some((user) => user.id === authUser.id)) {
    next.users.push({
      id: authUser.id,
      displayName: asString(authUser.user_metadata?.display_name, authUser.email?.split('@')[0] || 'Guest'),
      email: authUser.email ?? undefined,
      createdAt: new Date().toISOString(),
    });
  }

  next.groups = ((groups.data ?? []) as Row[]).map(
    (row): Group => ({
      id: asString(row.id),
      name: asString(row.name, 'Family'),
      joinCode: asString(row.join_code),
      ownerId: asString(row.owner_id),
      createdAt: asString(row.created_at),
    }),
  );
  next.memberships = ((memberships.data ?? []) as Row[]).map(
    (row): Membership => ({
      groupId: asString(row.group_id),
      userId: asString(row.user_id),
      role: row.role === 'owner' ? 'owner' : 'member',
      joinedAt: asString(row.joined_at),
    }),
  );
  const mine = next.memberships.filter((membership) => membership.userId === authUser.id);
  next.currentGroupId = mine.some((membership) => membership.groupId === preferredGroupId)
    ? preferredGroupId
    : (mine[0]?.groupId ?? null);

  next.items = ((items.data ?? []) as Row[]).map(
    (row): WishItem => ({
      id: asString(row.id),
      groupId: asString(row.group_id),
      ownerId: asString(row.owner_id),
      title: asString(row.title),
      link: asString(row.link),
      price: asNumberOrNull(row.price),
      notes: asString(row.notes),
      priority: (asNumber(row.priority, 2) as 1 | 2 | 3) || 2,
      createdAt: asString(row.created_at),
    }),
  );
  next.claims = ((claims.data ?? []) as Row[]).map(
    (row): Claim => ({
      id: asString(row.id),
      itemId: asString(row.item_id),
      groupId: asString(row.group_id),
      claimerId: asString(row.claimer_id),
      status: row.status === 'bought' ? 'bought' : 'claimed',
      pricePaid: asNumberOrNull(row.price_paid),
      updatedAt: asString(row.updated_at),
    }),
  );
  next.events = ((events.data ?? []) as Row[]).map(
    (row): SantaEvent => ({
      id: asString(row.id),
      groupId: asString(row.group_id),
      name: asString(row.name, 'Secret Santa'),
      budget: asNumber(row.budget),
      exchangeDate: asString(row.exchange_date).slice(0, 10),
      organizerId: asString(row.organizer_id),
      participantIds: Array.isArray(row.participant_ids) ? row.participant_ids.map((id) => asString(id)) : [],
      exclusions: Array.isArray(row.exclusions) ? (row.exclusions as Exclusion[]) : [],
      drawn: Boolean(row.drawn),
      createdAt: asString(row.created_at),
    }),
  );
  next.assignments = ((assignments.data ?? []) as Row[]).map(
    (row): Assignment => ({
      id: asString(row.id),
      eventId: asString(row.event_id),
      giverId: asString(row.giver_id),
      receiverId: asString(row.receiver_id),
    }),
  );

  const recordRows = (records.data ?? []) as Row[];
  const adventDays = new Map<string, number[]>();
  let adventId: string | null = null;
  for (const row of recordRows) {
    const kind = asString(row.kind);
    const payload = row.payload;
    if (kind === 'letter') {
      const letter = asObject<Letter>(payload);
      if (letter?.id) next.letters.push(letter);
    } else if (kind === 'sweater') {
      const sweater = asObject<Sweater>(payload);
      if (sweater?.id) next.sweaters.push(sweater);
    } else if (kind === 'vote') {
      const vote = asObject<Vote>(payload);
      if (vote?.sweaterId && vote.userId) {
        next.votes.push(vote);
        next.recordIds.votes[`${vote.sweaterId}:${vote.userId}`] = asString(row.id);
      }
    } else if (kind === 'light') {
      const light = asObject<LightPin>(payload);
      if (light?.id) next.lights.push(light);
    } else if (kind === 'cookie') {
      const cookie = asObject<CookieSignup>(payload);
      if (cookie?.id) next.cookies.push(cookie);
    } else if (kind === 'resolution') {
      const resolution = asObject<Resolution>(payload);
      if (resolution?.id) next.resolutions.push(resolution);
    } else if (kind === 'party') {
      const party = asObject<PartyState>(payload);
      if (party?.groupId) next.parties.push({ ...emptyParty(party.groupId), ...party });
    } else if (kind === 'card') {
      const card = asObject<CardTask>(payload);
      if (card?.id) next.cards.push(card);
    } else if (kind === 'bingo') {
      const card = asObject<BingoCard>(payload);
      if (card?.groupId && card.userId) {
        next.bingo.push(card);
        next.recordIds.bingo[`${card.groupId}:${card.userId}`] = asString(row.id);
      }
    } else if (kind === 'budget') {
      const budget = asObject<BudgetRow>(payload);
      if (budget?.groupId && budget.userId) {
        next.budgets.push(budget);
        next.recordIds.budget[`${budget.groupId}:${budget.userId}`] = asString(row.id);
      }
    } else if (kind === 'advent') {
      const advent = asObject<{ userId: string; days: number[] }>(payload);
      if (advent?.userId) {
        const prior = adventDays.get(advent.userId) ?? [];
        adventDays.set(advent.userId, [...new Set([...prior, ...(advent.days ?? [])])]);
        if (advent.userId === authUser.id && !adventId) adventId = asString(row.id);
      }
    }
  }
  next.recordIds.adventId = adventId;
  for (const [userId, days] of adventDays) next.advent.push({ userId, days });
  return next;
}
