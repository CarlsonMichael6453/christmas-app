import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Assignment, Claim, WishItem } from '@/src/model/types';
import {
  applyBought,
  applyClaim,
  applyRelease,
  canViewerSeeClaim,
  viewAssignments,
  viewItems,
  visibleSpending,
} from './visibility';

const michael = '11111111-1111-4111-8111-111111111111';
const emma = '22222222-2222-4222-8222-222222222222';
const lily = '33333333-3333-4333-8333-333333333333';

function item(partial: Partial<WishItem> & Pick<WishItem, 'id' | 'ownerId' | 'title'>): WishItem {
  return {
    groupId: 'group',
    link: '',
    price: null,
    notes: '',
    priority: 2,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...partial,
  };
}

const drill = item({ id: 'drill', ownerId: michael, title: 'Cordless drill', price: 89 });
const skillet = item({ id: 'skillet', ownerId: emma, title: 'Skillet', price: 40 });
const art = item({ id: 'art', ownerId: lily, title: 'Watercolor set', price: 22 });

const claims: Claim[] = [
  {
    id: 'c1',
    itemId: 'drill',
    groupId: 'group',
    claimerId: emma,
    status: 'bought',
    pricePaid: 79,
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'c2',
    itemId: 'skillet',
    groupId: 'group',
    claimerId: lily,
    status: 'claimed',
    pricePaid: null,
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
];

describe('hidden claim visibility', () => {
  it('hides every claim from the person the gift belongs to', () => {
    const michaelView = viewItems([drill, skillet, art], claims, michael);
    expect(michaelView.find((entry) => entry.id === 'drill')?.claim).toBeNull();
    expect(canViewerSeeClaim(michael, michael)).toBe(false);
  });

  it('shows the buyer and the bought status to everyone else', () => {
    const emmaView = viewItems([drill], claims, emma);
    expect(emmaView[0]?.claim).toEqual({ claimerId: emma, status: 'bought', pricePaid: 79 });

    const lilyView = viewItems([drill], claims, lily);
    expect(lilyView[0]?.claim?.status).toBe('bought');
    expect(lilyView[0]?.claim?.claimerId).toBe(emma);
    expect(lilyView[0]?.claim?.pricePaid).toBe(79);
  });

  it('lets Michael see a claim on Emma while Emma cannot see it on her own list', () => {
    const michaelView = viewItems([skillet], claims, michael);
    expect(michaelView[0]?.claim).toEqual({ claimerId: lily, status: 'claimed', pricePaid: null });

    const emmaView = viewItems([skillet], claims, emma);
    expect(emmaView[0]?.claim).toBeNull();
  });

  it('refuses a claim on your own item and keeps the list unchanged', () => {
    expect(() =>
      applyClaim(claims, drill, michael, {
        id: 'nope',
        itemId: drill.id,
        groupId: 'group',
        claimerId: michael,
        status: 'claimed',
        pricePaid: null,
        updatedAt: 'now',
      }),
    ).toThrow(/own list/);
  });

  it('lets someone else claim, mark bought, and release', () => {
    const claimed = applyClaim([], art, michael, {
      id: 'c3',
      itemId: art.id,
      groupId: 'group',
      claimerId: michael,
      status: 'claimed',
      pricePaid: null,
      updatedAt: 'now',
    });
    expect(claimed).toHaveLength(1);
    const bought = applyBought(claimed, art, michael, 18, 'later');
    expect(bought[0]?.status).toBe('bought');
    expect(bought[0]?.pricePaid).toBe(18);
    expect(applyRelease(bought, art, michael)).toEqual([]);
    expect(() => applyBought(claimed, art, emma, 18, 'later')).toThrow(/Claim this gift/);
  });

  it('blocks a second person from claiming a taken gift', () => {
    expect(() =>
      applyClaim(claims, drill, lily, {
        id: 'c4',
        itemId: drill.id,
        groupId: 'group',
        claimerId: lily,
        status: 'claimed',
        pricePaid: null,
        updatedAt: 'now',
      }),
    ).toThrow(/already claimed/);
  });

  it('keeps bought gifts for you out of your budget, and shows them to the buyer', () => {
    const items = [drill, skillet, art];
    const michaelSpend = visibleSpending(items, claims, michael);
    expect(michaelSpend.find((line) => line.itemId === 'drill')).toBeUndefined();

    const emmaSpend = visibleSpending(items, claims, emma);
    expect(emmaSpend).toEqual([
      { itemId: 'drill', ownerId: michael, claimerId: emma, title: 'Cordless drill', pricePaid: 79 },
    ]);

    const lilySpend = visibleSpending(items, claims, lily);
    expect(lilySpend.map((line) => line.itemId)).toEqual(['drill']);
  });

  it('returns only the viewer’s Secret Santa slip', () => {
    const assignments: Assignment[] = [
      { id: '1', eventId: 'event', giverId: michael, receiverId: lily },
      { id: '2', eventId: 'event', giverId: emma, receiverId: noahId() },
      { id: '3', eventId: 'other', giverId: michael, receiverId: emma },
    ];
    expect(viewAssignments(assignments, michael, 'event')).toEqual([assignments[0]]);
    expect(viewAssignments(assignments, emma).map((entry) => entry.giverId)).toEqual([emma]);
    expect(viewAssignments(assignments, lily)).toEqual([]);
  });
});

function noahId() {
  return '44444444-4444-4444-8444-444444444444';
}

describe('supabase policies', () => {
  const sql = readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');

  it('denies the gift owner from reading claims', () => {
    expect(sql).toContain('i.owner_id <> (select auth.uid())');
    expect(sql).toMatch(/claims_select/);
  });

  it('lets a person read only their own Secret Santa slip', () => {
    expect(sql).toMatch(/giver_id = \(select auth\.uid\(\)\)/);
    expect(sql.toLowerCase()).toContain('revoke all on table public.santa_assignments');
  });
});
