import { renderHook, act } from '@testing-library/react';
import { useChatLogic } from '../ChatProvider';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion } from '@/ai/flows/pollinations-chat-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';

// Mock AI flows to prevent actual API calls during tests
jest.mock('@/ai/flows/generate-chat-title');
jest.mock('@/ai/flows/pollinations-chat-flow');
jest.mock('@/ai/flows/tts-flow');
jest.mock('@/ai/flows/stt-flow');

const mockGenerateChatTitle = generateChatTitle as jest.Mock;
const mockGetPollinationsChatCompletion = getPollinationsChatCompletion as jest.Mock;
const mockTextToSpeech = textToSpeech as jest.Mock;

describe('useChatLogic Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
    // Mock the toast hook
    jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({
      toast: jest.fn(),
    });
  });

  it('should start a new chat', () => {
    const { result } = renderHook(() => useChatLogic({}));

    expect(result.current.activeConversation).toBe(null);

    act(() => {
      result.current.startNewChat();
    });

    expect(result.current.activeConversation).not.toBe(null);
    expect(result.current.activeConversation?.title).toBe('default.long.language.loop');
    expect(result.current.allConversations.length).toBe(1);
  });

  it('should send a message and receive an AI response', async () => {
    const aiResponse = { responseText: 'Hello from the AI!' };
    mockGetPollinationsChatCompletion.mockResolvedValue(aiResponse);

    const { result } = renderHook(() => useChatLogic({}));

    // Start a chat
    act(() => {
      result.current.startNewChat();
    });

    // Set input value
    act(() => {
        result.current.setChatInputValue('Hello, world!');
    });

    // Send the message
    await act(async () => {
      await result.current.sendMessage('Hello, world!');
    });
    
    expect(result.current.isAiResponding).toBe(false);
    expect(result.current.currentMessages.length).toBe(2);
    expect(result.current.currentMessages[0].role).toBe('user');
    expect(result.current.currentMessages[1].role).toBe('assistant');
    expect(result.current.currentMessages[1].content).toBe(aiResponse.responseText);
  });

  it('should delete a chat', () => {
    const { result } = renderHook(() => useChatLogic({}));
    
    // Start two chats
    act(() => {
      result.current.startNewChat();
    });
    const firstChatId = result.current.activeConversation!.id;
    
    act(() => {
      result.current.startNewChat();
    });
    const secondChatId = result.current.activeConversation!.id;
    
    expect(result.current.allConversations.length).toBe(2);
    expect(result.current.activeConversation?.id).toBe(secondChatId);

    // Delete the active (second) chat
    act(() => {
      result.current.deleteChat(secondChatId);
    });

    expect(result.current.allConversations.length).toBe(1);
    // The first chat should now be active
    expect(result.current.activeConversation?.id).toBe(firstChatId);
  });

  it('should edit a chat title', () => {
    const { result } = renderHook(() => useChatLogic({}));
    act(() => {
        result.current.startNewChat();
    });
    
    const chatId = result.current.activeConversation!.id;
    const newTitle = 'My Edited Title';

    act(() => {
        result.current.requestEditTitle(chatId);
    });
    act(() => {
        result.current.setEditingTitle(newTitle);
    });
    act(() => {
        result.current.confirmEditTitle();
    });
    
    expect(result.current.activeConversation?.title).toBe(newTitle);
    expect(result.current.allConversations.find(c => c.id === chatId)?.title).toBe(newTitle);
  });
});
