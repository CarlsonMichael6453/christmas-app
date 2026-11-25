import {
  signInWithEmail,
  signInWithName,
  signOut as signOutMut,
  switchUser as switchUserMut,
  updateName as updateNameMut,
} from '@/src/backend/mutate';
import { remoteSignInEmail, remoteSignInName, remoteSignOut, remoteUpdateName } from '@/src/backend/remote';
import { demoDatabase } from '@/src/backend/seed';
import { saveLocal, savePrefs } from '@/src/backend/storage';
import { supabaseConfigured } from '@/src/backend/supabase';

import type { AppRuntime } from '@/src/backend/state/runtime';

export function sessionActions(runtime: AppRuntime) {
  const { mode, dbRef, prefsRef, setError, setDb, setLocalDemo, commit, afterRemote } = runtime;
  return {
    signInName: async (name: string) => {
      if (supabaseConfigured) {
        prefsRef.current = { ...prefsRef.current, localDemo: false };
        await savePrefs(prefsRef.current);
        setLocalDemo(false);
        return afterRemote(() => remoteSignInName(name.trim()));
      }
      return commit((draft) => signInWithName(draft, name));
    },
    signInEmail: async (email: string, password: string, name?: string) => {
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
    switchUser: async (userId: string) => {
      if (mode !== 'phone') {
        setError('On Supabase, sign out and sign in as the other person.');
        return false;
      }
      return commit((draft) => switchUserMut(draft, userId));
    },
    updateName: async (name: string) => {
      if (mode === 'supabase') return afterRemote(async () => {
        await remoteUpdateName(name);
      });
      return commit((draft) => updateNameMut(draft, name));
    },
  };
}
