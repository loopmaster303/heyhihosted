/**
 * Message ordering for the local conversation store.
 *
 * Sorting stored messages by timestamp alone is not safe: a user message and
 * the assistant message that answers it are created in the same synchronous
 * block (there is no `await` between chat-send-coordinator and the assistant
 * message built in chat-send-orchestrator), so both usually carry the *same*
 * millisecond. When the timestamps tie, IndexedDB returns rows in primary-key
 * order — and the primary key is a random UUID, which shuffled the transcript
 * on every reload.
 *
 * So the position is persisted explicitly and used as the primary sort key.
 * `timestamp` remains the fallback for rows written before `order` existed.
 */

export interface OrderableMessage {
  order?: number;
  timestamp: number;
}

export function compareMessageOrder(a: OrderableMessage, b: OrderableMessage): number {
  const aHasOrder = typeof a.order === 'number';
  const bHasOrder = typeof b.order === 'number';

  // Legacy rows without `order` keep their timestamp ordering and sort ahead of
  // nothing in particular — mixing the two only happens until the conversation
  // is saved again, which rewrites every message with an order.
  if (aHasOrder && bHasOrder) {
    if (a.order !== b.order) return (a.order as number) - (b.order as number);
    return a.timestamp - b.timestamp;
  }

  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  if (aHasOrder) return -1;
  if (bHasOrder) return 1;
  return 0;
}

export function sortMessagesByOrder<T extends OrderableMessage>(messages: T[]): T[] {
  return [...messages].sort(compareMessageOrder);
}
