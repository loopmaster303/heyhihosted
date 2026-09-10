import { renderHook } from '@testing-library/react';
import { useChatPersistence } from './useChatPersistence';

// useLiveQuery haelt das Ergebnis in einer Ref und liefert zwischen Renders
// dieselbe Identitaet. Der Testdoppel muss das genauso tun, sonst prueft er
// einen Zustand, den es in der App nicht gibt.
const liveQueryResult = [{ id: 'conv-1' }];

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => liveQueryResult,
}));

jest.mock('@/lib/services/database', () => ({
  db: {},
  DatabaseService: {
    getFullConversation: jest.fn(),
    saveFullConversation: jest.fn(),
    getConversation: jest.fn(),
    saveConversation: jest.fn(),
    deleteConversation: jest.fn(),
  },
}));

// A8: Das Rueckgabeobjekt entstand bei jedem Render neu. Ein Effekt mit diesem
// Objekt in der Abhaengigkeitsliste konnte deshalb pro Render erneut starten.
describe('useChatPersistence', () => {
  it('liefert zwischen zwei Renders dieselbe Objektidentitaet', () => {
    const { result, rerender } = renderHook(() => useChatPersistence());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('liefert auch leer dieselbe Listenidentitaet', () => {
    const { result, rerender } = renderHook(() => useChatPersistence());
    const first = result.current.allConversations;

    rerender();

    expect(result.current.allConversations).toBe(first);
  });
});
