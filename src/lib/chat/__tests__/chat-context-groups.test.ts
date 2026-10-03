import {
  buildChatContextGroups,
  buildChatContextGroupsWithOverrides,
  mergeChatContextGroups,
} from '../chat-context-groups';

describe('chat context groups', () => {
  it('partitions chat logic into stable internal domains and merges back without losing keys', () => {
    const chatLogic = {
      activeConversation: 'active',
      allConversations: 'all',
      isAiResponding: 'responding',
      setIsAiResponding: 'set-responding',
      playingMessageId: 'playing',
      isTtsLoadingForId: 'tts',
      chatInputValue: 'input',
      selectedVoice: 'voice',
      selectedTtsSpeed: 'tts-speed',
      isInitialLoadComplete: 'loaded',
      lastUserMessageId: 'last-user',
      isRecording: 'recording',
      isTranscribing: 'transcribing',
      isCameraOpen: 'camera',
      chatImageModelId: 'chat-image-model',
      selectChat: 'selectChat',
      startNewChat: 'startNewChat',
      deleteChat: 'deleteChat',
      sendMessage: 'sendMessage',
      handleFileSelect: 'handleFileSelect',
      clearUploadedImage: 'clearUploadedImage',
      handleModelChange: 'handleModelChange',
      handleStyleChange: 'handleStyleChange',
      handleVoiceChange: 'handleVoiceChange',
      handleTtsSpeedChange: 'handleTtsSpeedChange',
      toggleWebBrowsing: 'toggleWebBrowsing',
      toggleCodeMode: 'toggleCodeMode',
      webBrowsingEnabled: 'webBrowsingEnabled',
      handlePlayAudio: 'handlePlayAudio',
      setChatInputValue: 'setChatInputValue',
      handleCopyToClipboard: 'handleCopyToClipboard',
      regenerateLastResponse: 'regenerateLastResponse',
      retryLastRequest: 'retryLastRequest',
      retryMediaPart: 'retryMediaPart',
      startRecording: 'startRecording',
      stopRecording: 'stopRecording',
      openCamera: 'openCamera',
      closeCamera: 'closeCamera',
      toDate: 'toDate',
      setActiveConversation: 'setActiveConversation',
    };

    const groups = buildChatContextGroups(chatLogic);

    expect(groups.conversation.activeConversation).toBe('active');
    expect(groups.composer.sendMessage).toBe('sendMessage');
    expect(groups.modes.toggleWebBrowsing).toBe('toggleWebBrowsing');
    expect(groups.modes.chatImageModelId).toBe('chat-image-model');
    expect(groups.media.handleFileSelect).toBe('handleFileSelect');
    expect(groups.media.retryMediaPart).toBe('retryMediaPart');
    // Panels gehoeren der Huelle, nicht dem Chat-Zustand.
    expect(groups).not.toHaveProperty('panels');

    expect(mergeChatContextGroups(groups)).toEqual(chatLogic);
    expect(
      mergeChatContextGroups(
        buildChatContextGroupsWithOverrides(chatLogic, {
          composer: { setChatInputValue: 'wrapped-input' },
        }),
      ).setChatInputValue,
    ).toBe('wrapped-input');
  });
});
