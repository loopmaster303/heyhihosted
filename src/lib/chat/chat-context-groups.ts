const CONVERSATION_KEYS = [
  'activeConversation',
  'allConversations',
  'isInitialLoadComplete',
  'lastUserMessageId',
  'selectChat',
  'startNewChat',
  'deleteChat',
  'toDate',
  'setActiveConversation',
] as const;

const COMPOSER_KEYS = [
  'isAiResponding',
  'setIsAiResponding',
  'chatInputValue',
  'setChatInputValue',
  'sendMessage',
  'handleCopyToClipboard',
  'regenerateLastResponse',
  'retryLastRequest',
] as const;

const MODE_KEYS = [
  'isImageMode',
  'isComposeMode',
  'webBrowsingEnabled',
  'selectedVoice',
  'selectedTtsSpeed',
  'availableImageModels',
  'selectedImageModelId',
  'toggleImageMode',
  'toggleComposeMode',
  'handleModelChange',
  'handleStyleChange',
  'handleVoiceChange',
  'handleTtsSpeedChange',
  'handleImageModelChange',
  'toggleWebBrowsing',
] as const;

const MEDIA_KEYS = [
  'playingMessageId',
  'isTtsLoadingForId',
  'isRecording',
  'isTranscribing',
  'isCameraOpen',
  'handlePlayAudio',
  'handleFileSelect',
  'clearUploadedImage',
  'startRecording',
  'stopRecording',
  'openCamera',
  'closeCamera',
] as const;

const PANEL_KEYS = [
  'isHistoryPanelOpen',
  'isAdvancedPanelOpen',
  'toggleHistoryPanel',
  'closeHistoryPanel',
  'toggleAdvancedPanel',
  'closeAdvancedPanel',
] as const;

type ConversationKey = (typeof CONVERSATION_KEYS)[number];
type ComposerKey = (typeof COMPOSER_KEYS)[number];
type ModeKey = (typeof MODE_KEYS)[number];
type MediaKey = (typeof MEDIA_KEYS)[number];
type PanelKey = (typeof PANEL_KEYS)[number];

function pickKeys<T extends Record<string, unknown>, K extends readonly (keyof T)[]>(
  source: T,
  keys: K,
): Pick<T, K[number]> {
  const result = {} as Pick<T, K[number]>;
  for (const key of keys) {
    result[key] = source[key];
  }
  return result;
}

export function buildChatContextGroups<
  T extends Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>,
>(chatLogic: T) {
  return {
    conversation: pickKeys(chatLogic, CONVERSATION_KEYS as readonly (keyof T)[]),
    composer: pickKeys(chatLogic, COMPOSER_KEYS as readonly (keyof T)[]),
    modes: pickKeys(chatLogic, MODE_KEYS as readonly (keyof T)[]),
    media: pickKeys(chatLogic, MEDIA_KEYS as readonly (keyof T)[]),
    panels: pickKeys(chatLogic, PANEL_KEYS as readonly (keyof T)[]),
  };
}

export function buildChatContextGroupsWithOverrides<
  T extends Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>,
>(
  chatLogic: T,
  overrides: {
    conversation?: Partial<ReturnType<typeof buildChatContextGroups<T>>['conversation']>;
    composer?: Partial<ReturnType<typeof buildChatContextGroups<T>>['composer']>;
    modes?: Partial<ReturnType<typeof buildChatContextGroups<T>>['modes']>;
    media?: Partial<ReturnType<typeof buildChatContextGroups<T>>['media']>;
    panels?: Partial<ReturnType<typeof buildChatContextGroups<T>>['panels']>;
  },
) {
  const groups = buildChatContextGroups(chatLogic);
  return {
    conversation: { ...groups.conversation, ...overrides.conversation },
    composer: { ...groups.composer, ...overrides.composer },
    modes: { ...groups.modes, ...overrides.modes },
    media: { ...groups.media, ...overrides.media },
    panels: { ...groups.panels, ...overrides.panels },
  };
}

export function mergeChatContextGroups<T extends Record<string, unknown>>(groups: {
  conversation: T;
  composer: T;
  modes: T;
  media: T;
  panels: T;
}) {
  return {
    ...groups.conversation,
    ...groups.composer,
    ...groups.modes,
    ...groups.media,
    ...groups.panels,
  };
}

export function getChatConversationSlice<T extends ReturnType<typeof buildChatContextGroups<Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>>>>(
  groups: T,
) {
  return groups.conversation;
}

export function getChatComposerSlice<T extends ReturnType<typeof buildChatContextGroups<Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>>>>(
  groups: T,
) {
  return groups.composer;
}

export function getChatModesSlice<T extends ReturnType<typeof buildChatContextGroups<Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>>>>(
  groups: T,
) {
  return groups.modes;
}

export function getChatMediaSlice<T extends ReturnType<typeof buildChatContextGroups<Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>>>>(
  groups: T,
) {
  return groups.media;
}

export function getChatPanelsSlice<T extends ReturnType<typeof buildChatContextGroups<Record<ConversationKey | ComposerKey | ModeKey | MediaKey | PanelKey, unknown>>>>(
  groups: T,
) {
  return groups.panels;
}
