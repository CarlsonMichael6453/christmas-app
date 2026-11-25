import {
  addItem as addItemMut,
  claimItem,
  deleteItem as deleteItemMut,
  markBought as markBoughtMut,
  releaseClaim,
  setBudget,
  updateItem as updateItemMut,
} from '@/src/backend/mutate';
import {
  remoteAddItem,
  remoteClaim,
  remoteDeleteItem,
  remoteMarkBought,
  remoteRelease,
  remoteSaveBudget,
  remoteUpdateItem,
} from '@/src/backend/remote';
import { clone, uid } from '@/src/logic/format';
import type { ItemInput } from '@/src/model/types';

import { problem } from '@/src/backend/state/problem';
import type { AppRuntime } from '@/src/backend/state/runtime';

export function wishlistActions(runtime: AppRuntime) {
  const { mode, dbRef, commit, afterRemote, requireIds, refreshRemote, setError } = runtime;
  return {
    addItem: async (input: ItemInput) => {
      if (mode === 'phone') return commit((draft) => addItemMut(draft, input));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteAddItem(ids.groupId, ids.userId, input);
      });
    },
    updateItem: async (id: string, input: ItemInput) => {
      if (mode === 'phone') return commit((draft) => updateItemMut(draft, id, input));
      return afterRemote(() => remoteUpdateItem(id, input));
    },
    deleteItem: async (id: string) => {
      if (mode === 'phone') return commit((draft) => deleteItemMut(draft, id));
      return afterRemote(() => remoteDeleteItem(id));
    },
    claim: async (itemId: string) => {
      if (mode === 'phone') return commit((draft) => claimItem(draft, itemId));
      return afterRemote(async () => {
        const ids = requireIds();
        await remoteClaim(ids.groupId, ids.userId, itemId);
      });
    },
    markBought: async (itemId: string, price: number | null) => {
      if (mode === 'phone') return commit((draft) => markBoughtMut(draft, itemId, price));
      return afterRemote(() => remoteMarkBought(itemId, price));
    },
    release: async (itemId: string) => {
      if (mode === 'phone') return commit((draft) => releaseClaim(draft, itemId));
      return afterRemote(() => remoteRelease(itemId));
    },
    setBudgetTotal: async (total: number) => {
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
  };
}
