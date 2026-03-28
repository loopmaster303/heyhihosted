import {
  buildChatContextGroups,
  buildChatContextGroupsWithOverrides,
  getChatComposerSlice,
  getChatConversationSlice,
  getChatMediaSlice,
  getChatModesSlice,
  getChatPanelsSlice,
  mergeChatContextGroups,
} from '../chat-context-groups';

describe('chat context groups', () => {
  it('partitions chat logic into stable internal domains and merges back without losing keys', () => {
    const chatLogic = {
      activeConversation: 'active',
      allConversations: 'all',
      isAiResponding: 'responding',
      setIsAiResponding: 'set-responding',
      isImageMode: 'image',
      isComposeMode: 'compose',
      isHistoryPanelOpen: 'history',
      isAdvancedPanelOpen: 'advanced',
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
      availableImageModels: 'image-models',
      selectedImageModelId: 'selected-image-model',
      selectChat: 'selectChat',
      startNewChat: 'startNewChat',
      deleteChat: 'deleteChat',
      sendMessage: 'sendMessage',
      toggleImageMode: 'toggleImageMode',
      toggleComposeMode: 'toggleComposeMode',
      handleFileSelect: 'handleFileSelect',
      clearUploadedImage: 'clearUploadedImage',
      handleModelChange: 'handleModelChange',
      handleStyleChange: 'handleStyleChange',
      handleVoiceChange: 'handleVoiceChange',
      handleTtsSpeedChange: 'handleTtsSpeedChange',
      handleImageModelChange: 'handleImageModelChange',
      toggleHistoryPanel: 'toggleHistoryPanel',
      closeHistoryPanel: 'closeHistoryPanel',
      toggleAdvancedPanel: 'toggleAdvancedPanel',
      closeAdvancedPanel: 'closeAdvancedPanel',
      toggleWebBrowsing: 'toggleWebBrowsing',
      webBrowsingEnabled: 'webBrowsingEnabled',
      handlePlayAudio: 'handlePlayAudio',
      setChatInputValue: 'setChatInputValue',
      handleCopyToClipboard: 'handleCopyToClipboard',
      regenerateLastResponse: 'regenerateLastResponse',
      retryLastRequest: 'retryLastRequest',
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
    expect(groups.media.handleFileSelect).toBe('handleFileSelect');
    expect(groups.panels.toggleHistoryPanel).toBe('toggleHistoryPanel');
    expect(getChatComposerSlice(groups)).toEqual(groups.composer);
    expect(getChatConversationSlice(groups)).toEqual(groups.conversation);
    expect(getChatModesSlice(groups)).toEqual(groups.modes);
    expect(getChatMediaSlice(groups)).toEqual(groups.media);
    expect(getChatPanelsSlice(groups)).toEqual(groups.panels);

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
