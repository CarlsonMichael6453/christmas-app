import { clone } from '@/src/logic/format';
import {
  createGroup as createGroupMut,
  joinGroup as joinGroupMut,
  selectGroup as selectGroupMut,
} from '@/src/backend/mutate';
import { remoteCreateGroup, remoteJoinGroup } from '@/src/backend/remote';
import { savePrefs } from '@/src/backend/storage';

import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';

export function householdActions(runtime: AppRuntime) {
  const { mode, dbRef, prefsRef, setError, setDb, commit, afterRemote } = runtime;
  return {
    createGroup: async (name: string) => {
      if (mode === 'phone') return commit((draft) => createGroupMut(draft, name));
      return afterRemote(async () => {
        const id = await remoteCreateGroup(name);
        prefsRef.current = { ...prefsRef.current, currentGroupId: id };
        await savePrefs(prefsRef.current);
      });
    },
    joinGroup: async (code: string) => {
      if (mode === 'phone') return commit((draft) => joinGroupMut(draft, code));
      return afterRemote(async () => {
        const id = await remoteJoinGroup(code);
        prefsRef.current = { ...prefsRef.current, currentGroupId: id };
        await savePrefs(prefsRef.current);
      });
    },
    selectGroup: async (id: string) => {
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
  };
}
