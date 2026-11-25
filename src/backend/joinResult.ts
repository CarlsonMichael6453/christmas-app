type JoinError = { message: string } | null;

/** Turn a join_group RPC result into a group id, or a message the sign-in screen can show. */
export function groupIdFromJoinRpc(data: unknown, error: JoinError): string {
  if (error) {
    const message = error.message.trim();
    throw new Error(message || 'Something went wrong.');
  }
  const row = (Array.isArray(data) ? data[0] : data) as { id?: unknown } | null;
  const id = row && typeof row.id === 'string' ? row.id : '';
  if (!id) throw new Error('No group uses that code.');
  return id;
}
