import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DB, SeenSlip } from '@/src/model/types';
import { emptyDB } from '@/src/backend/mutate';

const DB_KEY = 'christmas-family-db-v1';
const PREFS_KEY = 'christmas-family-prefs-v1';

export type Prefs = {
  currentGroupId: string | null;
  previewAdvent: boolean;
  seenSlips: SeenSlip[];
  localDemo: boolean;
};

export function emptyPrefs(): Prefs {
  return { currentGroupId: null, previewAdvent: false, seenSlips: [], localDemo: false };
}

export async function loadLocal(): Promise<DB> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as Partial<DB>;
    const base = emptyDB();
    return {
      ...base,
      ...parsed,
      recordIds: { ...base.recordIds, ...(parsed.recordIds ?? {}) },
    };
  } catch {
    return emptyDB();
  }
}

export async function saveLocal(db: DB): Promise<void> {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
}

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return emptyPrefs();
    return { ...emptyPrefs(), ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return emptyPrefs();
  }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
