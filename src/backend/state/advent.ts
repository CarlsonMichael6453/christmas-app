import { clone, uid } from '@/src/logic/format';
import { markDoorOpen as markDoorMut, setPreview } from '@/src/backend/mutate';
import { remoteSaveAdvent } from '@/src/backend/remote';
import { saveLocal, savePrefs } from '@/src/backend/storage';

import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';

export function adventActions(runtime: AppRuntime) {
  const { mode, dbRef, prefsRef, setDb, setError, commit, refreshRemote, requireIds } = runtime;
  return {
    setPreviewAdvent: async (value: boolean) => {
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
    markDoorOpen: async (day: number) => {
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
  };
}
