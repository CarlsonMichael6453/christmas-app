import { describe, expect, it } from 'vitest';

import { groupIdFromJoinRpc } from '@/src/backend/joinResult';

describe('groupIdFromJoinRpc', () => {
  it('treats a null result as a wrong code', () => {
    expect(() => groupIdFromJoinRpc(null, null)).toThrow('No group uses that code.');
  });

  it('treats an empty list as a wrong code', () => {
    expect(() => groupIdFromJoinRpc([], null)).toThrow('No group uses that code.');
  });

  it('returns the group id when the code matches', () => {
    expect(groupIdFromJoinRpc({ id: 'group-1', name: 'Carlson' }, null)).toBe('group-1');
    expect(groupIdFromJoinRpc([{ id: 'group-2' }], null)).toBe('group-2');
  });

  it('surfaces the lockout message without rewriting it', () => {
    expect(() =>
      groupIdFromJoinRpc(null, { message: 'Too many wrong codes. Wait 15 minutes and try again.' }),
    ).toThrow('Too many wrong codes. Wait 15 minutes and try again.');
  });
});
