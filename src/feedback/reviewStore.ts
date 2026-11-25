import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { shouldAskForReview, type ReviewRecord } from '@/src/logic/reviewPrompt';

const KEY = 'christmas-family-review';

function emptyRecord(now = Date.now()): ReviewRecord {
  return { firstOpenedAt: now, asked: false, wishlistAdds: 0, santaDraws: 0 };
}

async function load(): Promise<ReviewRecord> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw) as Partial<ReviewRecord>;
    return { ...emptyRecord(0), ...parsed, firstOpenedAt: parsed.firstOpenedAt || Date.now() };
  } catch {
    return emptyRecord();
  }
}

async function save(record: ReviewRecord) {
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
}

export async function rememberFirstOpen() {
  if (Platform.OS === 'web') return;
  const record = await load();
  if (!record.firstOpenedAt) {
    record.firstOpenedAt = Date.now();
    await save(record);
  }
}

async function maybeAsk(record: ReviewRecord) {
  if (Platform.OS === 'web' || record.asked) return;
  const StoreReview = await import('expo-store-review');
  const available = await StoreReview.isAvailableAsync();
  if (!shouldAskForReview(record, Date.now(), { web: false, available })) return;
  record.asked = true;
  await save(record);
  await StoreReview.requestReview();
}

export async function notePositiveUse(kind: 'wish' | 'draw') {
  if (Platform.OS === 'web') return;
  try {
    const record = await load();
    if (kind === 'wish') record.wishlistAdds += 1;
    else record.santaDraws += 1;
    await save(record);
    await maybeAsk(record);
  } catch {
    // A missing store module should not block saving a wish or a draw.
  }
}

export async function requestStoreReview(): Promise<'review' | 'unavailable'> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const StoreReview = await import('expo-store-review');
    if (!(await StoreReview.isAvailableAsync())) return 'unavailable';
    const record = await load();
    record.asked = true;
    await save(record);
    await StoreReview.requestReview();
    return 'review';
  } catch {
    return 'unavailable';
  }
}
