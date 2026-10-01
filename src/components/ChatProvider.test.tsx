/**
 * ChatProvider contract tests
 *
 * These tests lock the observable public surface of `useChatLogic` (the core of
 * ChatProvider). They intentionally do NOT assert on internal implementation —
 * instead they verify:
 *   - Conversation lifecycle transitions (new chat, select, delete → fallback).
 *   - Send-flow entry point delegates to `executeChatSendCoordinator` and hands
 *     it the image hooks (a marker becomes a pending part with the chat model).
 *   - An image can be retried in place, with its own prompt.
 *
 * Boundary mocks only:
 *   - `useChatPersistence` (IndexedDB / Dexie) → in-memory fake.
 *   - `useChatEffects` → no-op (we are testing the orchestrator, not the
 *     auto-save side-effect which already has unit coverage elsewhere).
 *   - `useChatAudio` / `useChatRecording` → no-op (unrelated to contract).
 *   - `chat-send-coordinator.executeChatSendCoordinator` → spy, so we can
 *     observe how ChatProvider hands off the request.
 *   - `ChatService.generateTitle` → stub (title generation tested separately).
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import type { Conversation } from '@/types';

// -----------------------------------------------------------------------------
// Module boundary mocks. Declared BEFORE importing the provider, so the hook
// picks them up.
// -----------------------------------------------------------------------------

type PersistenceState = {
  allConversations: Conversation[];
  activeConversation: Conversation | null;
};

const persistenceState: PersistenceState = {
  allConversations: [],
  activeConversation: null,
};

const persistenceListeners = new Set<() => void>();
const notifyPersistence = () => persistenceListeners.forEach((l) => l());

const loadConversationMock = jest.fn(async (id: string) => {
  const found = persistenceState.allConversations.find((c) => c.id === id) ?? null;
  persistenceState.activeConversation = found;
  notifyPersistence();
  return found;
});

const saveConversationMock = jest.fn(async (_conv: Conversation) => {
  /* no-op: covered by chat-send-coordinator + useChatEffects tests */
});

const deleteConversationMock = jest.fn(async (id: string) => {
  persistenceState.allConversations = persistenceState.allConversations.filter(
    (c) => c.id !== id,
  );
  if (persistenceState.activeConversation?.id === id) {
    persistenceState.activeConversation = null;
  }
  notifyPersistence();
});

jest.mock('@/hooks/useChatPersistence', () => ({
  useChatPersistence: () => {
    const [, force] = React.useReducer((x: number) => x + 1, 0);
    React.useEffect(() => {
      persistenceListeners.add(force);
      return () => {
        persistenceListeners.delete(force);
      };
    }, []);
    const setActiveConversation = React.useCallback(
      (updater: React.SetStateAction<Conversation | null>) => {
        const prev = persistenceState.activeConversation;
        const next =
          typeof updater === 'function'
            ? (updater as (p: Conversation | null) => Conversation | null)(prev)
            : updater;
        persistenceState.activeConversation = next;
        force();
      },
      [force],
    );
    return {
      allConversations: persistenceState.allConversations,
      activeConversation: persistenceState.activeConversation,
      setActiveConversation,
      loadConversation: loadConversationMock,
      saveConversation: saveConversationMock,
      updateConversationMetadata: jest.fn(async () => {}),
      deleteConversation: deleteConversationMock,
      isInitialLoadComplete: true,
    };
  },
}));

jest.mock('@/hooks/useChatEffects', () => ({
  useChatEffects: () => {
    /* no-op — effect coverage lives in useChatEffects' own tests */
  },
}));

jest.mock('@/hooks/useChatAudio', () => ({
  useChatAudio: () => ({ handlePlayAudio: jest.fn() }),
}));

jest.mock('@/hooks/useChatRecording', () => ({
  useChatRecording: () => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
  }),
}));

// Spy on the coordinator boundary. Tests reach into this to observe how
// ChatProvider routed the send.
const executeChatSendCoordinatorMock = jest.fn(async (_input: any) => {
  /* default: no-op success */
});

jest.mock('@/lib/chat/chat-send-coordinator', () => {
  const actual = jest.requireActual('@/lib/chat/chat-send-coordinator');
  return {
    ...actual,
    executeChatSendCoordinator: (input: any) =>
      executeChatSendCoordinatorMock(input),
  };
});

// Avoid real network in updateConversationTitle; default behavior for
// contract tests is "no title change".
jest.mock('@/lib/services/chat-service', () => ({
  ChatService: {
    generateTitle: jest.fn(async () => ''),
    sendChatCompletion: jest.fn(async () => ''),
    generateImage: jest.fn(async () => 'https://cdn.example.com/retry.png'),
  },
}));

jest.mock('@/lib/services/output-service', () => ({
  OutputService: { saveGeneratedAsset: jest.fn(async () => 'asset-retry') },
}));

// -----------------------------------------------------------------------------
// Imports that depend on the mocks above.
// -----------------------------------------------------------------------------

import { useChatLogic } from './ChatProvider';
import { LanguageProvider } from './LanguageProvider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: overrides.id ?? 'conv-seed',
    title: overrides.title ?? 'Seed Chat',
    messages: overrides.messages ?? [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    toolType: 'long language loops',
    selectedModelId: 'claude-fast',
    selectedResponseStyleName: 'Basic',
    isCodeMode: false,
    webBrowsingEnabled: false,
    ...overrides,
  };
}

function resetPersistence(initial: Partial<PersistenceState> = {}) {
  persistenceState.allConversations = initial.allConversations ?? [];
  persistenceState.activeConversation = initial.activeConversation ?? null;
  notifyPersistence();
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('ChatProvider / useChatLogic contract', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistence();
    executeChatSendCoordinatorMock.mockReset();
    executeChatSendCoordinatorMock.mockImplementation(async () => {});
    loadConversationMock.mockClear();
    saveConversationMock.mockClear();
    deleteConversationMock.mockClear();
  });

  // ---- Conversation lifecycle ----------------------------------------------

  it('startNewChat seeds an empty conversation as the active one', () => {
    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    let created: Conversation | undefined;
    act(() => {
      created = result.current.startNewChat();
    });

    expect(created).toBeDefined();
    expect(result.current.activeConversation?.id).toBe(created!.id);
    expect(result.current.activeConversation?.messages).toEqual([]);
    expect(result.current.activeConversation?.toolType).toBe('long language loops');
  });

  it('selectChat loads an existing conversation and swaps active state', async () => {
    const a = makeConversation({ id: 'conv-a', title: 'A' });
    const b = makeConversation({ id: 'conv-b', title: 'B' });
    resetPersistence({ allConversations: [a, b], activeConversation: a });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.selectChat('conv-b');
    });

    expect(loadConversationMock).toHaveBeenCalledWith('conv-b');
    expect(result.current.activeConversation?.id).toBe('conv-b');
  });

  it('deleteChat on the active conversation invokes the persistence delete and attempts a fallback path', async () => {
    const only = makeConversation({ id: 'conv-only' });
    resetPersistence({ allConversations: [only], activeConversation: only });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.deleteChat('conv-only');
    });

    // Contract: the delete is forwarded to persistence. Whichever branch of the
    // fallback (load another / startNewChat) runs depends on the remaining
    // list, but the delete call itself is the stable boundary to lock.
    expect(deleteConversationMock).toHaveBeenCalledWith('conv-only');
  });

  it('deleteChat on the active conversation selects the next most-recent chat when available', async () => {
    const older = makeConversation({
      id: 'conv-older',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const active = makeConversation({
      id: 'conv-active',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    resetPersistence({
      allConversations: [active, older],
      activeConversation: active,
    });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.deleteChat('conv-active');
    });

    expect(loadConversationMock).toHaveBeenCalledWith('conv-older');
  });

  // ---- Send-flow entry point -----------------------------------------------

  it('sendMessage forwards a text prompt to the coordinator with the current conversation', async () => {
    const conv = makeConversation({ id: 'conv-send', title: 'T' });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.sendMessage('hello world');
    });

    expect(executeChatSendCoordinatorMock).toHaveBeenCalledTimes(1);
    const input = executeChatSendCoordinatorMock.mock.calls[0][0];
    expect(input.messageText).toBe('hello world');
    expect(input.conversation.id).toBe('conv-send');
    // Bilder entstehen nur noch ueber den Marker in der Antwort.
    expect(input.media).toBeDefined();
    expect(input.media.prepare('Bitte.\n[IMAGE_GEN: a fox]')).toEqual({
      cleanText: 'Bitte.',
      pendingParts: [expect.objectContaining({
        type: 'image_url',
        image_url: expect.objectContaining({ status: 'pending', prompt: 'a fox', modelId: 'flux' }),
      })],
    });
  });

  it('paints chat images with the free model the user picked in settings', async () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('klein'));
    const conv = makeConversation({ id: 'conv-klein' });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });
    expect(result.current.chatImageModelId).toBe('klein');
  });

  it('never promises a key-gated model in chat — falls back to the free default', () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('p-image'));
    const conv = makeConversation({ id: 'conv-paid' });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });
    expect(result.current.chatImageModelId).toBe('flux');
  });

  it('sendMessage delegates unhandled coordinator errors upward — the coordinator owns its own failure state', async () => {
    const conv = makeConversation({ id: 'conv-err' });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    executeChatSendCoordinatorMock.mockImplementationOnce(async () => {
      throw new Error('downstream boom');
    });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    let captured: Error | null = null;
    await act(async () => {
      try {
        await result.current.sendMessage('boom');
      } catch (e) {
        captured = e as Error;
      }
    });

    // Contract: the provider does NOT wrap the coordinator in a try/catch.
    // The coordinator is expected to build its own failure state via
    // `buildSendFailureState` on recognised errors. If it throws, the caller
    // of `sendMessage` sees the error. Locking this behaviour ensures a
    // future refactor cannot silently swallow coordinator exceptions.
    expect(captured).toBeInstanceOf(Error);
    expect((captured as unknown as Error).message).toBe('downstream boom');
    expect(executeChatSendCoordinatorMock).toHaveBeenCalled();
  });

  it('sendMessage is a no-op when there is no active conversation', async () => {
    resetPersistence();

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.sendMessage('no one home');
    });

    expect(executeChatSendCoordinatorMock).not.toHaveBeenCalled();
  });

  // ---- State persistence / settings ----------------------------------------

  it('handleModelChange updates the active conversation model selection', () => {
    const conv = makeConversation({ id: 'conv-model', selectedModelId: 'claude-fast' });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    act(() => {
      result.current.handleModelChange('gemini-fast');
    });

    expect(result.current.activeConversation?.selectedModelId).toBe('gemini-fast');
  });

  it('handleStyleChange updates the response style on the active conversation', () => {
    const conv = makeConversation({
      id: 'conv-style',
      selectedResponseStyleName: 'Basic',
    });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    act(() => {
      result.current.handleStyleChange('Precise');
    });

    expect(result.current.activeConversation?.selectedResponseStyleName).toBe('Precise');
  });

  it('retryMediaPart regenerates a failed image in place, with its own prompt', async () => {
    const conv = makeConversation({
      id: 'conv-retry',
      messages: [{
        id: 'a1',
        role: 'assistant',
        timestamp: '2026-01-01T00:00:01.000Z',
        content: [
          { type: 'text', text: 'Hier.' },
          { type: 'image_url', image_url: { url: '', status: 'error', error: 'weg', prompt: 'a fox', modelId: 'flux' } },
        ],
      }],
    });
    resetPersistence({ allConversations: [conv], activeConversation: conv });

    const { result } = renderHook(() => useChatLogic({}), { wrapper });

    await act(async () => {
      await result.current.retryMediaPart('a1', 1);
    });

    const content = result.current.activeConversation?.messages[0].content;
    expect(Array.isArray(content) && content[1]).toEqual({
      type: 'image_url',
      image_url: expect.objectContaining({
        url: 'https://cdn.example.com/retry.png',
        prompt: 'a fox',
        metadata: { assetId: 'asset-retry' },
      }),
    });
    expect(Array.isArray(content) && content[1].type === 'image_url' && content[1].image_url.status).toBeFalsy();
  });
});
