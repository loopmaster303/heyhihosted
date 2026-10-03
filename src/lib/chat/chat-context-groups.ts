/**
 * Der Chat-Zustand ist in vier Kontexte geschnitten, damit eine Komponente nur
 * dann neu rendert, wenn sich ihr Teil aendert. Panels gehoeren nicht dazu:
 * Sheets oeffnet und schliesst die Huelle (AppShell).
 */

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
  'webBrowsingEnabled',
  'selectedVoice',
  'selectedTtsSpeed',
  'chatImageModelId',
  'handleModelChange',
  'handleStyleChange',
  'handleVoiceChange',
  'handleTtsSpeedChange',
  'toggleWebBrowsing',
  'toggleCodeMode',
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
  'retryMediaPart',
] as const;

type ConversationKey = (typeof CONVERSATION_KEYS)[number];
type ComposerKey = (typeof COMPOSER_KEYS)[number];
type ModeKey = (typeof MODE_KEYS)[number];
type MediaKey = (typeof MEDIA_KEYS)[number];
type GroupKey = ConversationKey | ComposerKey | ModeKey | MediaKey;

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

export function buildChatContextGroups<T extends Record<GroupKey, unknown>>(chatLogic: T) {
  return {
    conversation: pickKeys(chatLogic, CONVERSATION_KEYS as readonly (keyof T)[]),
    composer: pickKeys(chatLogic, COMPOSER_KEYS as readonly (keyof T)[]),
    modes: pickKeys(chatLogic, MODE_KEYS as readonly (keyof T)[]),
    media: pickKeys(chatLogic, MEDIA_KEYS as readonly (keyof T)[]),
  };
}

type Groups<T extends Record<GroupKey, unknown>> = ReturnType<typeof buildChatContextGroups<T>>;

export function buildChatContextGroupsWithOverrides<T extends Record<GroupKey, unknown>>(
  chatLogic: T,
  overrides: {
    conversation?: Partial<Groups<T>['conversation']>;
    composer?: Partial<Groups<T>['composer']>;
    modes?: Partial<Groups<T>['modes']>;
    media?: Partial<Groups<T>['media']>;
  },
) {
  const groups = buildChatContextGroups(chatLogic);
  return {
    conversation: { ...groups.conversation, ...overrides.conversation },
    composer: { ...groups.composer, ...overrides.composer },
    modes: { ...groups.modes, ...overrides.modes },
    media: { ...groups.media, ...overrides.media },
  };
}

export function mergeChatContextGroups<T extends Record<string, unknown>>(groups: {
  conversation: T;
  composer: T;
  modes: T;
  media: T;
}) {
  return {
    ...groups.conversation,
    ...groups.composer,
    ...groups.modes,
    ...groups.media,
  };
}
