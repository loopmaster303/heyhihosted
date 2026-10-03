import { renderHook, act } from '@testing-library/react';
import { useChatState } from './useChatState';
import { MigrationService } from '@/lib/services/migration';
import type { Conversation } from '@/types';

const loadConversationMock = jest.fn();

// Mutable per-test state for the mocked persistence hook.
let mockActiveConversation: Conversation | undefined;

jest.mock('./useChatPersistence', () => ({
  useChatPersistence: () => ({
    activeConversation: mockActiveConversation,
    conversations: [],
    loadConversation: loadConversationMock,
  }),
}));

jest.mock('./useChatUI', () => ({
  useChatUI: () => ({}),
}));

jest.mock('./useChatMedia', () => ({
  useChatMedia: () => ({}),
}));

jest.mock('@/lib/services/migration', () => ({
  MigrationService: {
    migrateIfNeeded: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('useChatState', () => {
  beforeEach(() => {
    localStorage.clear();
    loadConversationMock.mockClear();
    mockActiveConversation = undefined;
  });

  it('starts with ephemeral defaults and no special mode', () => {
    const { result } = renderHook(() => useChatState());

    expect(result.current.chatInputValue).toBe('');
    expect(result.current.isImageMode).toBe(false);
    expect(result.current.isComposeMode).toBe(false);
    expect(result.current.webBrowsingEnabled).toBe(false);
    expect(result.current.lastFailedRequest).toBeNull();
  });

  it('updates the chat input value', () => {
    const { result } = renderHook(() => useChatState());

    act(() => {
      result.current.setChatInputValue('Hallo Welt');
    });
    expect(result.current.chatInputValue).toBe('Hallo Welt');
  });

  it('derives mode flags from the active conversation', () => {
    mockActiveConversation = {
      id: 'conv-1',
      isImageMode: true,
      isComposeMode: true,
      webBrowsingEnabled: true,
    } as unknown as Conversation;

    const { result } = renderHook(() => useChatState());
    expect(result.current.isImageMode).toBe(true);
    expect(result.current.isComposeMode).toBe(true);
    expect(result.current.webBrowsingEnabled).toBe(true);
  });

  it('loads the persisted conversation when none is active', async () => {
    localStorage.setItem('activeConversationId', JSON.stringify('conv-42'));
    renderHook(() => useChatState());

    await act(async () => {});
    expect(loadConversationMock).toHaveBeenCalledWith('conv-42');
  });

  // A8: Der Effekt hing am Rueckgabeobjekt des Persistence-Hooks und konnte
  // deshalb pro Render ein weiteres Laden starten.
  it('laedt die gespeicherte Unterhaltung genau einmal, auch bei weiteren Renders', async () => {
    localStorage.setItem('activeConversationId', JSON.stringify('conv-42'));
    const { rerender } = renderHook(() => useChatState());

    await act(async () => {});
    rerender();
    await act(async () => {});

    expect(loadConversationMock).toHaveBeenCalledTimes(1);
  });

  // A6: Der Standard ueberschrieb die Chat-Auswahl, weil der Effekt auch auf
  // die Hydration aus dem localStorage reagierte.
  it('behaelt die im Chat gewaehlte Bildmodellwahl gegenueber dem Standard', async () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('gpt-image'));
    localStorage.setItem('chatSelectedImageModel', JSON.stringify('klein'));

    const { result } = renderHook(() => useChatState());
    await act(async () => {});

    expect(result.current.selectedImageModelId).toBe('klein');
    expect(JSON.parse(localStorage.getItem('chatSelectedImageModel') ?? '""')).toBe('klein');
  });

  it('uebernimmt den Standard, solange im Chat nichts gewaehlt wurde', async () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('gpt-image'));

    const { result } = renderHook(() => useChatState());
    await act(async () => {});

    expect(result.current.selectedImageModelId).toBe('gpt-image');
  });

  it('runs the migration service once on mount', async () => {
    renderHook(() => useChatState());
    await act(async () => {});
    expect(MigrationService.migrateIfNeeded).toHaveBeenCalled();
  });
});
