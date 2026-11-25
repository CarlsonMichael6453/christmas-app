import { clone, uid } from '@/src/logic/format';
import {
  cheer as cheerMut,
  currentGroup,
  deleteCard,
  deleteCookie,
  deleteLetter,
  deleteLight,
  deleteResolution,
  deleteSweater,
  resetBingo as resetBingoMut,
  saveCard,
  saveCookie,
  saveLetter,
  saveLight,
  saveParty,
  saveResolution,
  saveSweater,
  sessionUser,
  setProgress as setProgressMut,
  toggleBingo as toggleBingoMut,
  toggleVote,
} from '@/src/backend/mutate';
import {
  remoteDeleteCard,
  remoteDeleteCookie,
  remoteDeleteLetter,
  remoteDeleteLight,
  remoteDeleteResolution,
  remoteDeleteSweater,
  remoteSaveBingo,
  remoteSaveCard,
  remoteSaveCookie,
  remoteSaveLetter,
  remoteSaveLight,
  remoteSaveParty,
  remoteSaveResolution,
  remoteSaveSweater,
  remoteToggleVote,
} from '@/src/backend/remote';
import type { BingoCard, CardTask, CookieSignup, DB, Letter, LightPin, PartyState, Resolution, Sweater } from '@/src/model/types';

import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';

export function seasonActions(runtime: AppRuntime) {
  const { mode, dbRef, commit, afterRemote, requireIds, refreshRemote, setError } = runtime;

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

  return {
    saveLetter: async (letter: Letter) => {
      if (mode === 'phone') return commit((draft) => saveLetter(draft, letter));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveLetter(ids.groupId, ids.userId, { ...letter, groupId: ids.groupId });
      });
    },
    deleteLetter: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteLetter(draft, id));
      return afterRemote(() => remoteDeleteLetter(id));
    },
    saveSweater: async (sweater: Sweater) => {
      if (mode === 'phone') return commit((draft) => saveSweater(draft, sweater));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveSweater(ids.groupId, ids.userId, { ...sweater, groupId: ids.groupId });
      });
    },
    deleteSweater: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteSweater(draft, id));
      return afterRemote(() => remoteDeleteSweater(id));
    },
    toggleVote: async (sweaterId: string) => {
      if (mode === 'phone') return commit((draft) => toggleVote(draft, sweaterId));
      return afterRemote(async () => {
        const ids = requireIds();
        const existing = dbRef.current?.recordIds.votes[`${sweaterId}:${ids.userId}`] ?? null;
        await remoteToggleVote(ids.groupId, ids.userId, sweaterId, existing);
      });
    },
    saveLight: async (light: LightPin) => {
      if (mode === 'phone') return commit((draft) => saveLight(draft, light));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveLight(ids.groupId, ids.userId, { ...light, groupId: ids.groupId });
      });
    },
    deleteLight: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteLight(draft, id));
      return afterRemote(() => remoteDeleteLight(id));
    },
    saveCookie: async (cookie: CookieSignup) => {
      if (mode === 'phone') return commit((draft) => saveCookie(draft, cookie));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveCookie(ids.groupId, ids.userId, { ...cookie, groupId: ids.groupId });
      });
    },
    deleteCookie: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteCookie(draft, id));
      return afterRemote(() => remoteDeleteCookie(id));
    },
    saveCard: async (card: CardTask) => {
      if (mode === 'phone') return commit((draft) => saveCard(draft, card));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveCard(ids.groupId, ids.userId, { ...card, groupId: ids.groupId, userId: ids.userId });
      });
    },
    deleteCard: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteCard(draft, id));
      return afterRemote(() => remoteDeleteCard(id));
    },
    toggleBingo: async (index: number) => saveBingo((draft) => toggleBingoMut(draft, index)),
    resetBingo: async () => saveBingo((draft) => resetBingoMut(draft)),
    saveResolution: async (resolution: Resolution) => {
      if (mode === 'phone') return commit((draft) => saveResolution(draft, resolution));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveResolution(ids.groupId, ids.userId, { ...resolution, groupId: ids.groupId });
      });
    },
    deleteResolution: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteResolution(draft, id));
      return afterRemote(() => remoteDeleteResolution(id));
    },
    setProgress: async (id: string, progress: number) => {
      if (mode === 'phone') return commit((draft) => setProgressMut(draft, id, progress));
      return saveChangedResolution(id, (draft) => setProgressMut(draft, id, progress));
    },
    cheer: async (id: string) => {
      if (mode === 'phone') return commit((draft) => cheerMut(draft, id));
      return saveChangedResolution(id, (draft) => cheerMut(draft, id));
    },
    saveParty: async (nextParty: PartyState) => {
      if (mode === 'phone') return commit((draft) => saveParty(draft, nextParty));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteSaveParty(ids.groupId, ids.userId, { ...nextParty, groupId: ids.groupId });
      });
    },
  };
}
