import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type {
  BingoCard,
  CardTask,
  CookieSignup,
  DB,
  EventInput,
  ItemInput,
  Letter,
  LightPin,
  PartyState,
  Resolution,
  SantaEvent,
  Sweater,
  User,
} from '@/src/model/types';
import { viewAssignments, viewItems, visibleSpending } from '@/src/logic/visibility';
import { clone, uid } from '@/src/logic/format';
import { emptyParty } from '@/src/logic/party';
import {
  addItem as addItemMut,
  claimItem,
  createEvent as createEventMut,
  createGroup as createGroupMut,
  deleteCard,
  deleteCookie,
  deleteItem as deleteItemMut,
  deleteLetter,
  deleteLight,
  deleteResolution,
  deleteSweater,
  cheer as cheerMut,
  joinGroup as joinGroupMut,
  markBought as markBoughtMut,
  markDoorOpen as markDoorMut,
  markSlipSeen,
  releaseClaim,
  resetDraw as resetDrawMut,
  runDraw,
  saveCard,
  saveCookie,
  saveLetter,
  saveLight,
  saveParty,
  saveResolution,
  saveSweater,
  selectGroup as selectGroupMut,
  sessionUser,
  setBudget,
  setPreview,
  setProgress as setProgressMut,
  signInWithEmail,
  signInWithName,
  signOut as signOutMut,
  switchUser as switchUserMut,
  toggleBingo as toggleBingoMut,
  toggleVote,
  updateEvent as updateEventMut,
  updateItem as updateItemMut,
  updateName as updateNameMut,
  resetBingo as resetBingoMut,
  currentGroup,
} from '@/src/backend/mutate';
import {
  pullRemote,
  remoteAddItem,
  remoteClaim,
  remoteCreateGroup,
  remoteDeleteCard,
  remoteDeleteCookie,
  remoteDeleteItem,
  remoteDeleteLetter,
  remoteDeleteLight,
  remoteDeleteResolution,
  remoteDeleteSweater,
  remoteDraw,
  remoteJoinGroup,
  remoteMarkBought,
  remoteRelease,
  remoteResetDraw,
  remoteSaveAdvent,
  remoteSaveBingo,
  remoteSaveBudget,
  remoteSaveCard,
  remoteSaveCookie,
  remoteSaveEvent,
  remoteSaveLetter,
  remoteSaveLight,
  remoteSaveParty,
  remoteSaveResolution,
  remoteSaveSweater,
  remoteSignInEmail,
  remoteSignInName,
  remoteSignOut,
  remoteToggleVote,
  remoteUpdateItem,
  remoteUpdateName,
} from '@/src/backend/remote';
import { notePositiveUse } from '@/src/feedback/reviewStore';
import { demoDatabase } from '@/src/backend/seed';
import { loadLocal, loadPrefs, saveLocal, savePrefs, type Prefs } from '@/src/backend/storage';
import { supabase, supabaseConfigured } from '@/src/backend/supabase';

function problem(error: unknown, fallback = 'Something went wrong.') {
  return error instanceof Error ? error.message : fallback;
}

type Match = { receiver: User; eventId: string };

type AppApi = {
  ready: boolean;
  mode: 'phone' | 'supabase';
  user: User | null;
  group: DB['groups'][number] | null;
  groups: DB['groups'];
  members: User[];
  error: string | null;
  clearError: () => void;
  signInName: (name: string) => Promise<boolean>;
  signInEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadDemo: () => Promise<boolean>;
  switchUser: (userId: string) => Promise<boolean>;
  localUsers: User[];
  updateName: (name: string) => Promise<boolean>;
  createGroup: (name: string) => Promise<boolean>;
  joinGroup: (code: string) => Promise<boolean>;
  selectGroup: (id: string) => Promise<boolean>;
  items: ReturnType<typeof viewItems>;
  addItem: (input: ItemInput) => Promise<boolean>;
  updateItem: (id: string, input: ItemInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  claim: (itemId: string) => Promise<boolean>;
  markBought: (itemId: string, price: number | null) => Promise<boolean>;
  release: (itemId: string) => Promise<boolean>;
  events: SantaEvent[];
  createEvent: (input: EventInput) => Promise<boolean>;
  updateEvent: (id: string, input: EventInput) => Promise<boolean>;
  draw: (eventId: string) => Promise<{ ok: boolean; reason?: string }>;
  resetDraw: (eventId: string) => Promise<boolean>;
  myMatch: (eventId: string) => Match | null;
  slipSeen: (eventId: string) => boolean;
  markSlipSeen: (eventId: string) => void;
  doorsOpen: number[];
  previewAdvent: boolean;
  setPreviewAdvent: (value: boolean) => Promise<void>;
  markDoorOpen: (day: number) => Promise<void>;
  budgetTotal: number;
  setBudgetTotal: (total: number) => Promise<boolean>;
  spending: ReturnType<typeof visibleSpending>;
  letters: Letter[];
  saveLetter: (letter: Letter) => Promise<boolean>;
  deleteLetter: (id: string) => Promise<boolean>;
  sweaters: Sweater[];
  saveSweater: (sweater: Sweater) => Promise<boolean>;
  deleteSweater: (id: string) => Promise<boolean>;
  votesFor: (sweaterId: string) => { count: number; mine: boolean };
  toggleVote: (sweaterId: string) => Promise<boolean>;
  lights: LightPin[];
  saveLight: (light: LightPin) => Promise<boolean>;
  deleteLight: (id: string) => Promise<boolean>;
  cookies: CookieSignup[];
  saveCookie: (cookie: CookieSignup) => Promise<boolean>;
  deleteCookie: (id: string) => Promise<boolean>;
  cards: CardTask[];
  saveCard: (card: CardTask) => Promise<boolean>;
  deleteCard: (id: string) => Promise<boolean>;
  bingoMarks: boolean[];
  toggleBingo: (index: number) => Promise<boolean>;
  resetBingo: () => Promise<boolean>;
  resolutions: Resolution[];
  saveResolution: (resolution: Resolution) => Promise<boolean>;
  deleteResolution: (id: string) => Promise<boolean>;
  setProgress: (id: string, progress: number) => Promise<boolean>;
  cheer: (id: string) => Promise<boolean>;
  party: PartyState | null;
  saveParty: (party: PartyState) => Promise<boolean>;
  nameOf: (userId: string) => string;
};

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localDemo, setLocalDemo] = useState(false);
  const dbRef = useRef<DB | null>(null);
  const prefsRef = useRef<Prefs>({ currentGroupId: null, previewAdvent: false, seenSlips: [], localDemo: false });
  const mode: 'phone' | 'supabase' = supabaseConfigured && !localDemo ? 'supabase' : 'phone';

  const refreshRemote = useCallback(async () => {
    const prefs = prefsRef.current;
    const next = await pullRemote(prefs.currentGroupId, prefs.seenSlips, prefs.previewAdvent);
    dbRef.current = next;
    setDb(next);
    await saveLocal(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const prefs = await loadPrefs();
      prefsRef.current = prefs;
      if (supabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          prefsRef.current = { ...prefsRef.current, localDemo: false };
          if (!cancelled) setLocalDemo(false);
          try {
            await refreshRemote();
          } catch (loadError) {
            const cached = await loadLocal();
            if (!cancelled) {
              dbRef.current = cached.sessionUserId ? cached : dbRef.current;
              setDb(dbRef.current);
              setError(problem(loadError, 'Could not reach Supabase. Showing the last saved copy.'));
            }
          }
        } else if (prefs.localDemo) {
          const local = await loadLocal();
          if (!cancelled && local.sessionUserId) {
            setLocalDemo(true);
            dbRef.current = local;
            setDb(local);
          } else if (!cancelled) {
            const empty = (await import('@/src/backend/mutate')).emptyDB();
            prefsRef.current = { ...prefsRef.current, localDemo: false };
            setLocalDemo(false);
            dbRef.current = empty;
            setDb(empty);
          }
        } else if (!cancelled) {
          const empty = (await import('@/src/backend/mutate')).emptyDB();
          setLocalDemo(false);
          dbRef.current = empty;
          setDb(empty);
        }
      } else {
        const local = await loadLocal();
        if (!cancelled) {
          dbRef.current = local;
          setDb(local);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshRemote]);

  const groupId = db?.currentGroupId;
  useEffect(() => {
    const client = supabase;
    if (!client || mode !== 'supabase' || !groupId) return;
    const channel = client
      .channel(`christmas-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_items', filter: `group_id=eq.${groupId}` }, () => {
        void refreshRemote().catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `group_id=eq.${groupId}` }, () => {
        void refreshRemote().catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'santa_events', filter: `group_id=eq.${groupId}` }, () => {
        void refreshRemote().catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'santa_assignments' }, () => {
        void refreshRemote().catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_records', filter: `group_id=eq.${groupId}` }, () => {
        void refreshRemote().catch(() => undefined);
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [groupId, mode, refreshRemote]);

  function commit(mut: (draft: DB) => void): boolean {
    const current = dbRef.current;
    if (!current) return false;
    const next = clone(current);
    try {
      mut(next);
    } catch (mutError) {
      setError(problem(mutError));
      return false;
    }
    dbRef.current = next;
    setDb(next);
    void saveLocal(next);
    setError(null);
    return true;
  }

  async function afterRemote(work: () => Promise<void>): Promise<boolean> {
    try {
      await work();
      await refreshRemote();
      setError(null);
      return true;
    } catch (remoteError) {
      setError(problem(remoteError));
      return false;
    }
  }

  function requireIds(): { userId: string; groupId: string } {
    const current = dbRef.current;
    if (!current?.sessionUserId || !current.currentGroupId) throw new Error('Create or join a group first.');
    return { userId: current.sessionUserId, groupId: current.currentGroupId };
  }

  const api = useMemo<AppApi>(() => {
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
      ready,
      mode,
      user,
      group,
      groups,
      members,
      error,
      clearError: () => setError(null),
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
      markSlipSeen: (eventId: string) => {
        const current = dbRef.current;
        const userId = current?.sessionUserId;
        if (!current || !userId) return;
        if (!prefsRef.current.seenSlips.some((slip) => slip.userId === userId && slip.eventId === eventId)) {
          prefsRef.current = {
            ...prefsRef.current,
            seenSlips: [...prefsRef.current.seenSlips, { userId, eventId }],
          };
          void savePrefs(prefsRef.current);
        }
        const next = clone(current);
        markSlipSeen(next, eventId);
        dbRef.current = next;
        setDb(next);
        if (mode === 'phone') void saveLocal(next);
      },
      signInName: async (name) => {
        if (supabaseConfigured) {
          prefsRef.current = { ...prefsRef.current, localDemo: false };
          await savePrefs(prefsRef.current);
          setLocalDemo(false);
          return afterRemote(() => remoteSignInName(name.trim()));
        }
        return commit((draft) => signInWithName(draft, name));
      },
      signInEmail: async (email, password, name) => {
        if (supabaseConfigured) {
          prefsRef.current = { ...prefsRef.current, localDemo: false };
          await savePrefs(prefsRef.current);
          setLocalDemo(false);
          return afterRemote(() => remoteSignInEmail(email, password, name));
        }
        return commit((draft) => signInWithEmail(draft, email, password, name));
      },
      signOut: async () => {
        if (supabaseConfigured && !prefsRef.current.localDemo) {
          await remoteSignOut();
          const { emptyDB } = await import('@/src/backend/mutate');
          const empty = emptyDB();
          dbRef.current = empty;
          setDb(empty);
          return;
        }
        prefsRef.current = { ...prefsRef.current, localDemo: false };
        await savePrefs(prefsRef.current);
        setLocalDemo(false);
        commit((draft) => signOutMut(draft));
      },
      loadDemo: async () => {
        const next = demoDatabase();
        dbRef.current = next;
        setDb(next);
        await saveLocal(next);
        prefsRef.current = { ...prefsRef.current, localDemo: true, currentGroupId: next.currentGroupId };
        await savePrefs(prefsRef.current);
        setLocalDemo(true);
        setError(null);
        return true;
      },
      switchUser: async (userId) => {
        if (mode !== 'phone') {
          setError('On Supabase, sign out and sign in as the other person.');
          return false;
        }
        return commit((draft) => switchUserMut(draft, userId));
      },
      updateName: async (name) => {
        if (mode === 'supabase') return afterRemote(async () => {
          await remoteUpdateName(name);
        });
        return commit((draft) => updateNameMut(draft, name));
      },
      createGroup: async (name) => {
        if (mode === 'phone') return commit((draft) => createGroupMut(draft, name));
        return afterRemote(async () => {
          const id = await remoteCreateGroup(name);
          prefsRef.current = { ...prefsRef.current, currentGroupId: id };
          await savePrefs(prefsRef.current);
        });
      },
      joinGroup: async (code) => {
        if (mode === 'phone') return commit((draft) => joinGroupMut(draft, code));
        return afterRemote(async () => {
          const id = await remoteJoinGroup(code);
          prefsRef.current = { ...prefsRef.current, currentGroupId: id };
          await savePrefs(prefsRef.current);
        });
      },
      selectGroup: async (id) => {
        if (mode === 'phone') return commit((draft) => selectGroupMut(draft, id));
        const current = dbRef.current;
        if (!current) return false;
        const next = clone(current);
        try {
          selectGroupMut(next, id);
        } catch (selectError) {
          setError(problem(selectError));
          return false;
        }
        prefsRef.current = { ...prefsRef.current, currentGroupId: id };
        await savePrefs(prefsRef.current);
        dbRef.current = next;
        setDb(next);
        setError(null);
        return true;
      },
      addItem: async (input) => {
        const saved = mode === 'phone'
          ? commit((draft) => addItemMut(draft, input))
          : await afterRemote(async () => {
              const ids = requireIds();
              await remoteAddItem(ids.groupId, ids.userId, input);
            });
        if (saved) void notePositiveUse('wish');
        return saved;
      },
      updateItem: async (id, input) => {
        if (mode === 'phone') return commit((draft) => updateItemMut(draft, id, input));
        return afterRemote(() => remoteUpdateItem(id, input));
      },
      deleteItem: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteItemMut(draft, id));
        return afterRemote(() => remoteDeleteItem(id));
      },
      claim: async (itemId) => {
        if (mode === 'phone') return commit((draft) => claimItem(draft, itemId));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteClaim(ids.groupId, ids.userId, itemId);
        });
      },
      markBought: async (itemId, price) => {
        if (mode === 'phone') return commit((draft) => markBoughtMut(draft, itemId, price));
        return afterRemote(() => remoteMarkBought(itemId, price));
      },
      release: async (itemId) => {
        if (mode === 'phone') return commit((draft) => releaseClaim(draft, itemId));
        return afterRemote(() => remoteRelease(itemId));
      },
      createEvent: async (input) => {
        if (mode === 'phone') return commit((draft) => createEventMut(draft, input));
        const current = dbRef.current;
        if (!current) return false;
        const draft = clone(current);
        try {
          createEventMut(draft, input);
          const event = draft.events[draft.events.length - 1];
          const ids = requireIds();
          if (!event) throw new Error('Could not create the drawing.');
          await remoteSaveEvent(ids.groupId, ids.userId, event);
          await refreshRemote();
          setError(null);
          return true;
        } catch (eventError) {
          setError(problem(eventError));
          return false;
        }
      },
      updateEvent: async (id, input) => {
        if (mode === 'phone') return commit((draft) => updateEventMut(draft, id, input));
        const current = dbRef.current;
        if (!current) return false;
        const draft = clone(current);
        try {
          updateEventMut(draft, id, input);
          const event = draft.events.find((entry) => entry.id === id);
          const ids = requireIds();
          if (!event) throw new Error('That drawing is gone.');
          await remoteSaveEvent(ids.groupId, ids.userId, event);
          await refreshRemote();
          setError(null);
          return true;
        } catch (eventError) {
          setError(problem(eventError));
          return false;
        }
      },
      draw: async (eventId) => {
        const finish = (result: { ok: boolean; reason?: string }) => {
          if (result.ok) void notePositiveUse('draw');
          return result;
        };
        if (mode === 'phone') {
          let result: { ok: true } | { ok: false; reason: string } = { ok: false, reason: 'Not ready.' };
          const saved = commit((draft) => {
            result = runDraw(draft, eventId);
          });
          if (!saved) return { ok: false, reason: error ?? 'Could not draw names.' };
          return finish(result.ok ? { ok: true } : result);
        }
        try {
          const result = await remoteDraw(eventId);
          await refreshRemote();
          return finish(result.ok ? { ok: true } : result);
        } catch (drawError) {
          return { ok: false, reason: problem(drawError) };
        }
      },
      resetDraw: async (eventId) => {
        if (mode === 'phone') return commit((draft) => resetDrawMut(draft, eventId));
        return afterRemote(() => remoteResetDraw(eventId));
      },
      setPreviewAdvent: async (value) => {
        prefsRef.current = { ...prefsRef.current, previewAdvent: value };
        await savePrefs(prefsRef.current);
        const current = dbRef.current;
        if (!current) return;
        const next = clone(current);
        setPreview(next, value);
        dbRef.current = next;
        setDb(next);
        if (mode === 'phone') await saveLocal(next);
      },
      markDoorOpen: async (day) => {
        if (mode === 'phone') {
          commit((draft) => markDoorMut(draft, day));
          return;
        }
        const current = dbRef.current;
        if (!current) return;
        const draft = clone(current);
        try {
          markDoorMut(draft, day);
          const ids = requireIds();
          const days = draft.advent.find((entry) => entry.userId === ids.userId)?.days ?? [day];
          const recordId = draft.recordIds.adventId ?? uid();
          await remoteSaveAdvent(ids.groupId, ids.userId, days, recordId);
          await refreshRemote();
        } catch (doorError) {
          setError(problem(doorError));
        }
      },
      setBudgetTotal: async (total) => {
        if (mode === 'phone') return commit((draft) => setBudget(draft, total));
        const current = dbRef.current;
        if (!current) return false;
        const draft = clone(current);
        try {
          setBudget(draft, total);
          const ids = requireIds();
          const recordId = draft.recordIds.budget[`${ids.groupId}:${ids.userId}`] ?? uid();
          await remoteSaveBudget(ids.groupId, ids.userId, total, recordId);
          await refreshRemote();
          setError(null);
          return true;
        } catch (budgetError) {
          setError(problem(budgetError));
          return false;
        }
      },
      saveLetter: async (letter) => {
        if (mode === 'phone') return commit((draft) => saveLetter(draft, letter));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveLetter(ids.groupId, ids.userId, { ...letter, groupId: ids.groupId });
        });
      },
      deleteLetter: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteLetter(draft, id));
        return afterRemote(() => remoteDeleteLetter(id));
      },
      saveSweater: async (sweater) => {
        if (mode === 'phone') return commit((draft) => saveSweater(draft, sweater));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveSweater(ids.groupId, ids.userId, { ...sweater, groupId: ids.groupId });
        });
      },
      deleteSweater: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteSweater(draft, id));
        return afterRemote(() => remoteDeleteSweater(id));
      },
      toggleVote: async (sweaterId) => {
        if (mode === 'phone') return commit((draft) => toggleVote(draft, sweaterId));
        return afterRemote(async () => {
          const ids = requireIds();
          const existing = dbRef.current?.recordIds.votes[`${sweaterId}:${ids.userId}`] ?? null;
          await remoteToggleVote(ids.groupId, ids.userId, sweaterId, existing);
        });
      },
      saveLight: async (light) => {
        if (mode === 'phone') return commit((draft) => saveLight(draft, light));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveLight(ids.groupId, ids.userId, { ...light, groupId: ids.groupId });
        });
      },
      deleteLight: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteLight(draft, id));
        return afterRemote(() => remoteDeleteLight(id));
      },
      saveCookie: async (cookie) => {
        if (mode === 'phone') return commit((draft) => saveCookie(draft, cookie));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveCookie(ids.groupId, ids.userId, { ...cookie, groupId: ids.groupId });
        });
      },
      deleteCookie: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteCookie(draft, id));
        return afterRemote(() => remoteDeleteCookie(id));
      },
      saveCard: async (card) => {
        if (mode === 'phone') return commit((draft) => saveCard(draft, card));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveCard(ids.groupId, ids.userId, { ...card, groupId: ids.groupId, userId: ids.userId });
        });
      },
      deleteCard: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteCard(draft, id));
        return afterRemote(() => remoteDeleteCard(id));
      },
      toggleBingo: async (index) => saveBingo((draft) => toggleBingoMut(draft, index)),
      resetBingo: async () => saveBingo((draft) => resetBingoMut(draft)),
      saveResolution: async (resolution) => {
        if (mode === 'phone') return commit((draft) => saveResolution(draft, resolution));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveResolution(ids.groupId, ids.userId, { ...resolution, groupId: ids.groupId });
        });
      },
      deleteResolution: async (id) => {
        if (mode === 'phone') return commit((draft) => deleteResolution(draft, id));
        return afterRemote(() => remoteDeleteResolution(id));
      },
      setProgress: async (id, progress) => {
        if (mode === 'phone') return commit((draft) => setProgressMut(draft, id, progress));
        return saveChangedResolution(id, (draft) => setProgressMut(draft, id, progress));
      },
      cheer: async (id) => {
        if (mode === 'phone') return commit((draft) => cheerMut(draft, id));
        return saveChangedResolution(id, (draft) => cheerMut(draft, id));
      },
      saveParty: async (nextParty) => {
        if (mode === 'phone') return commit((draft) => saveParty(draft, nextParty));
        return afterRemote(async () => {
          const ids = requireIds();
          await remoteSaveParty(ids.groupId, ids.userId, { ...nextParty, groupId: ids.groupId });
        });
      },
    };

    async function saveBingo(mut: (draft: DB) => void): Promise<boolean> {
      if (mode === 'phone') return commit(mut);
      const current = dbRef.current;
      if (!current) return false;
      const draft = clone(current);
      try {
        mut(draft);
        const ids = requireIds();
        const userRow = sessionUser(draft);
        const groupRow = currentGroup(draft);
        const card = draft.bingo.find((entry) => entry.groupId === groupRow.id && entry.userId === userRow.id);
        if (!card) throw new Error('No bingo card yet.');
        const recordId = draft.recordIds.bingo[`${groupRow.id}:${userRow.id}`] ?? uid();
        await remoteSaveBingo(groupRow.id, userRow.id, card satisfies BingoCard, recordId);
        await refreshRemote();
        setError(null);
        return true;
      } catch (bingoError) {
        setError(problem(bingoError));
        return false;
      }
    }

    async function saveChangedResolution(id: string, mut: (draft: DB) => void): Promise<boolean> {
      const current = dbRef.current;
      if (!current) return false;
      const draft = clone(current);
      try {
        mut(draft);
        const resolution = draft.resolutions.find((entry) => entry.id === id);
        const ids = requireIds();
        if (!resolution) throw new Error('That resolution is gone.');
        await remoteSaveResolution(ids.groupId, ids.userId, resolution);
        await refreshRemote();
        setError(null);
        return true;
      } catch (resolutionError) {
        setError(problem(resolutionError));
        return false;
      }
    }
  }, [db, error, mode, ready, refreshRemote]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
