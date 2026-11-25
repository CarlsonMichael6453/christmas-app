import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { DB } from '@/src/model/types';
import type { Prefs } from '@/src/backend/storage';

export type AppMode = 'phone' | 'supabase';

export type AppRuntime = {
  mode: AppMode;
  db: DB | null;
  error: string | null;
  ready: boolean;
  dbRef: MutableRefObject<DB | null>;
  prefsRef: MutableRefObject<Prefs>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDb: Dispatch<SetStateAction<DB | null>>;
  setLocalDemo: Dispatch<SetStateAction<boolean>>;
  commit: (mut: (draft: DB) => void) => boolean;
  afterRemote: (work: () => Promise<void>) => Promise<boolean>;
  requireIds: () => { userId: string; groupId: string };
  refreshRemote: () => Promise<void>;
};
