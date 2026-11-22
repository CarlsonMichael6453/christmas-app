import type { Assignment, Claim, ClaimStatus, WishItem } from '@/src/model/types';

export type ClaimView = {
  claimerId: string;
  status: ClaimStatus;
  pricePaid: number | null;
};

export type ItemView = WishItem & { claim: ClaimView | null };

export type SpendLine = {
  itemId: string;
  ownerId: string;
  claimerId: string;
  title: string;
  pricePaid: number;
};

/**
 * The item's owner must never learn that a claim exists.
 * Everyone else in the group, including the person who claimed it, may.
 */
export function canViewerSeeClaim(itemOwnerId: string, viewerId: string): boolean {
  return itemOwnerId !== viewerId;
}

export function viewItems(items: WishItem[], claims: Claim[], viewerId: string): ItemView[] {
  return items.map((item) => {
    const claim = claims.find((entry) => entry.itemId === item.id) ?? null;
    if (!claim || !canViewerSeeClaim(item.ownerId, viewerId)) {
      return { ...item, claim: null };
    }
    return {
      ...item,
      claim: {
        claimerId: claim.claimerId,
        status: claim.status,
        pricePaid: claim.pricePaid,
      },
    };
  });
}

export function assertCanClaim(itemOwnerId: string, viewerId: string): void {
  if (itemOwnerId === viewerId) {
    throw new Error("You can't claim a gift from your own list.");
  }
}

export function applyClaim(claims: Claim[], item: WishItem, viewerId: string, claim: Claim): Claim[] {
  assertCanClaim(item.ownerId, viewerId);
  if (claim.itemId !== item.id || claim.claimerId !== viewerId) {
    throw new Error('That claim does not match this gift.');
  }
  const existing = claims.find((entry) => entry.itemId === item.id);
  if (existing && existing.claimerId !== viewerId) {
    throw new Error('Someone else already claimed this.');
  }
  if (existing) return claims;
  return [...claims, claim];
}

export function applyBought(
  claims: Claim[],
  item: WishItem,
  viewerId: string,
  pricePaid: number | null,
  now: string,
): Claim[] {
  assertCanClaim(item.ownerId, viewerId);
  const existing = claims.find((entry) => entry.itemId === item.id);
  if (!existing || existing.claimerId !== viewerId) {
    throw new Error('Claim this gift before marking it bought.');
  }
  return claims.map((entry) =>
    entry.itemId === item.id ? { ...entry, status: 'bought', pricePaid, updatedAt: now } : entry,
  );
}

export function applyRelease(claims: Claim[], item: WishItem, viewerId: string): Claim[] {
  const existing = claims.find((entry) => entry.itemId === item.id);
  if (!existing || existing.claimerId !== viewerId) {
    throw new Error('Only the person who claimed this can let it go.');
  }
  return claims.filter((entry) => entry.itemId !== item.id);
}

/** A person only receives their own slip. The organizer does not get the full list. */
export function viewAssignments(assignments: Assignment[], viewerId: string, eventId?: string): Assignment[] {
  return assignments.filter(
    (assignment) => assignment.giverId === viewerId && (eventId == null || assignment.eventId === eventId),
  );
}

/**
 * Spending the viewer is allowed to know about.
 * Purchases for the viewer's own wishlist are omitted, even if the viewer is looking at the family totals.
 * The buyer still sees the gifts they bought for other people.
 */
export function visibleSpending(items: WishItem[], claims: Claim[], viewerId: string): SpendLine[] {
  const lines: SpendLine[] = [];
  for (const claim of claims) {
    if (claim.status !== 'bought') continue;
    const item = items.find((entry) => entry.id === claim.itemId);
    if (!item) continue;
    const allowed = claim.claimerId === viewerId || canViewerSeeClaim(item.ownerId, viewerId);
    if (!allowed) continue;
    if (item.ownerId === viewerId) continue;
    lines.push({
      itemId: item.id,
      ownerId: item.ownerId,
      claimerId: claim.claimerId,
      title: item.title,
      pricePaid: claim.pricePaid ?? item.price ?? 0,
    });
  }
  return lines;
}
