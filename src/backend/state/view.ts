import { viewAssignments, viewItems, visibleSpending } from '@/src/logic/visibility';
import { emptyParty } from '@/src/logic/party';
import type { DB } from '@/src/model/types';

import type { AppMode } from '@/src/backend/state/runtime';

export function deriveView(db: DB | null, mode: AppMode) {
  const user = db?.users.find((entry) => entry.id === db.sessionUserId) ?? null;
  const group = db?.groups.find((entry) => entry.id === db.currentGroupId) ?? null;
  const groups =
    db && user
      ? db.groups.filter((entry) =>
          db.memberships.some((membership) => membership.groupId === entry.id && membership.userId === user.id),
        )
      : [];
  const members =
    db && group
      ? db.users.filter((entry) =>
          db.memberships.some((membership) => membership.groupId === group.id && membership.userId === entry.id),
        )
      : [];
  const groupItems = db && group ? db.items.filter((item) => item.groupId === group.id) : [];
  const groupClaims = db && group ? db.claims.filter((claim) => claim.groupId === group.id) : [];
  const items =
    user && group
      ? viewItems(groupItems, groupClaims, user.id).sort(
          (a, b) => b.priority - a.priority || a.title.localeCompare(b.title),
        )
      : [];
  const party = db && group ? (db.parties.find((entry) => entry.groupId === group.id) ?? emptyParty(group.id)) : null;
  const marksSource =
    db && user && group
      ? db.bingo.find((card) => card.groupId === group.id && card.userId === user.id)?.marks
      : undefined;
  const bingoMarks = Array.from({ length: 25 }, (_, index) => (index === 12 ? true : Boolean(marksSource?.[index])));

  return {
    user,
    group,
    groups,
    members,
    localUsers: mode === 'phone' ? (db?.users ?? []) : [],
    items,
    events: db && group ? db.events.filter((event) => event.groupId === group.id) : [],
    spending: user ? visibleSpending(groupItems, groupClaims, user.id) : [],
    budgetTotal:
      db && user && group
        ? (db.budgets.find((row) => row.groupId === group.id && row.userId === user.id)?.total ?? 0)
        : 0,
    letters: db && group ? db.letters.filter((letter) => letter.groupId === group.id) : [],
    sweaters: db && group ? db.sweaters.filter((sweater) => sweater.groupId === group.id) : [],
    lights: db && group ? db.lights.filter((light) => light.groupId === group.id) : [],
    cookies: db && group ? db.cookies.filter((cookie) => cookie.groupId === group.id) : [],
    cards:
      db && user && group
        ? db.cards.filter((card) => card.groupId === group.id && card.userId === user.id)
        : [],
    resolutions:
      db && user && group
        ? db.resolutions.filter(
            (resolution) =>
              resolution.groupId === group.id && (resolution.shared || resolution.authorId === user.id),
          )
        : [],
    party,
    bingoMarks,
    doorsOpen: db && user ? (db.advent.find((entry) => entry.userId === user.id)?.days ?? []) : [],
    previewAdvent: Boolean(db?.previewAdvent),
    nameOf: (userId: string) => db?.users.find((entry) => entry.id === userId)?.displayName ?? 'Someone',
    votesFor: (sweaterId: string) => ({
      count: db?.votes.filter((vote) => vote.sweaterId === sweaterId).length ?? 0,
      mine: Boolean(db?.votes.some((vote) => vote.sweaterId === sweaterId && vote.userId === user?.id)),
    }),
    myMatch: (eventId: string) => {
      if (!db || !user) return null;
      const assignment = viewAssignments(db.assignments, user.id, eventId)[0];
      if (!assignment) return null;
      const receiver = db.users.find((entry) => entry.id === assignment.receiverId);
      if (!receiver) return null;
      return { receiver, eventId };
    },
    slipSeen: (eventId: string) =>
      Boolean(db?.seenSlips.some((slip) => slip.userId === user?.id && slip.eventId === eventId)),
  };
}
