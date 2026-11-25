import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { clone } from '@/src/logic/format';
import type { DB } from '@/src/model/types';
import { pullRemote } from '@/src/backend/remote';
import { loadLocal, loadPrefs, saveLocal, savePrefs, type Prefs } from '@/src/backend/storage';
import { supabase, supabaseConfigured } from '@/src/backend/supabase';
import { adventActions } from '@/src/backend/state/advent';
import { householdActions } from '@/src/backend/state/household';
import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';
import { santaActions } from '@/src/backend/state/santa';
import { seasonActions } from '@/src/backend/state/season';
import { sessionActions } from '@/src/backend/state/session';
import type { AppApi } from '@/src/backend/state/types';
import { deriveView } from '@/src/backend/state/view';
import { wishlistActions } from '@/src/backend/state/wishlists';

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
    const runtime: AppRuntime = {
      mode,
      db,
      error,
      ready,
      dbRef,
      prefsRef,
      setError,
      setDb,
      setLocalDemo,
      commit,
      afterRemote,
      requireIds,
      refreshRemote,
    };
    const view = deriveView(db, mode);
    return {
      ready,
      mode,
      error,
      clearError: () => setError(null),
      ...view,
      ...sessionActions(runtime),
      ...householdActions(runtime),
      ...wishlistActions(runtime),
      ...santaActions(runtime),
      ...adventActions(runtime),
      ...seasonActions(runtime),
    };
  }, [db, error, mode, ready, refreshRemote]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
