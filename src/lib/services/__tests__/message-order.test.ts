import { sortMessagesByOrder } from '@/lib/services/message-order';

interface TestMessage {
  id: string;
  role: 'user' | 'assistant';
  order?: number;
  timestamp: number;
}

describe('sortMessagesByOrder', () => {
  it('keeps a user message ahead of the assistant reply that shares its timestamp', () => {
    // The regression: both messages are created in the same synchronous block,
    // so they carry the same millisecond. IndexedDB then returned them in
    // primary-key (random UUID) order, which flipped the transcript.
    const stored: TestMessage[] = [
      { id: 'aaa-assistant-uuid', role: 'assistant', order: 1, timestamp: 1_000 },
      { id: 'zzz-user-uuid', role: 'user', order: 0, timestamp: 1_000 },
    ];

    expect(sortMessagesByOrder(stored).map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('orders a full transcript by position, not by tied timestamps', () => {
    const stored: TestMessage[] = [
      { id: 'd', role: 'assistant', order: 3, timestamp: 2_000 },
      { id: 'a', role: 'user', order: 0, timestamp: 1_000 },
      { id: 'c', role: 'user', order: 2, timestamp: 2_000 },
      { id: 'b', role: 'assistant', order: 1, timestamp: 1_000 },
    ];

    expect(sortMessagesByOrder(stored).map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('falls back to timestamp for legacy rows without an order', () => {
    const stored: TestMessage[] = [
      { id: 'later', role: 'assistant', timestamp: 2_000 },
      { id: 'earlier', role: 'user', timestamp: 1_000 },
    ];

    expect(sortMessagesByOrder(stored).map((m) => m.id)).toEqual(['earlier', 'later']);
  });

  it('does not mutate the input array', () => {
    const stored: TestMessage[] = [
      { id: 'b', role: 'assistant', order: 1, timestamp: 1_000 },
      { id: 'a', role: 'user', order: 0, timestamp: 1_000 },
    ];

    sortMessagesByOrder(stored);

    expect(stored.map((m) => m.id)).toEqual(['b', 'a']);
  });
});
