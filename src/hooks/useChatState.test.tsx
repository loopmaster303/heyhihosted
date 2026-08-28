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

  it('runs the migration service once on mount', async () => {
    renderHook(() => useChatState());
    await act(async () => {});
    expect(MigrationService.migrateIfNeeded).toHaveBeenCalled();
  });
});
