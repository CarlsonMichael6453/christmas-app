import { clone } from '@/src/logic/format';
import {
  createEvent as createEventMut,
  markSlipSeen,
  resetDraw as resetDrawMut,
  runDraw,
  updateEvent as updateEventMut,
} from '@/src/backend/mutate';
import { remoteDraw, remoteResetDraw, remoteSaveEvent } from '@/src/backend/remote';
import { saveLocal, savePrefs } from '@/src/backend/storage';
import type { EventInput } from '@/src/model/types';

import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';

export function santaActions(runtime: AppRuntime) {
  const { mode, error, dbRef, prefsRef, setDb, setError, commit, refreshRemote, requireIds } = runtime;
  return {
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
    createEvent: async (input: EventInput) => {
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
    updateEvent: async (id: string, input: EventInput) => {
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
    draw: async (eventId: string) => {
      if (mode === 'phone') {
        let result: { ok: true } | { ok: false; reason: string } = { ok: false, reason: 'Not ready.' };
        const saved = commit((draft) => {
          result = runDraw(draft, eventId);
        });
        if (!saved) return { ok: false, reason: error ?? 'Could not draw names.' };
        return result.ok ? { ok: true } : result;
      }
      try {
        const result = await remoteDraw(eventId);
        await refreshRemote();
        return result.ok ? { ok: true } : result;
      } catch (drawError) {
        return { ok: false, reason: problem(drawError) };
      }
    },
    resetDraw: async (eventId: string) => {
      if (mode === 'phone') return commit((draft) => resetDrawMut(draft, eventId));
      return runtime.afterRemote(() => remoteResetDraw(eventId));
    },
  };
}
