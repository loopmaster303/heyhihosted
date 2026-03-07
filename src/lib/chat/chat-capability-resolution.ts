import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEFAULT_POLLINATIONS_MODEL_ID,
  isKnownPollinationsTextModelId,
  type PollinationsModel,
} from '@/config/chat-options';

export interface ChatModeState {
  isImageMode?: boolean;
  isComposeMode?: boolean;
  isCodeMode?: boolean;
  webBrowsingEnabled?: boolean;
}

export interface StartNewChatOptions extends ChatModeState {
  initialModelId?: string;
}

export interface RequestCapabilityInput {
  selectedModelId?: string;
  hasUploadedFile: boolean;
  isImageModeIntent?: boolean;
  isCodeMode?: boolean;
}

export interface RequestCapabilityResolution {
  selectedModelId: string;
  selectedModel: PollinationsModel;
  requiresVisionModel: boolean;
  didFallbackToVisionModel: boolean;
  fallbackModel?: PollinationsModel;
  isImageModeIntent: boolean;
  isCodeMode: boolean;
}

export function resolveEffectiveTextModel(modelId?: string): string {
  return modelId && isKnownPollinationsTextModelId(modelId)
    ? modelId
    : DEFAULT_POLLINATIONS_MODEL_ID;
}

export function normalizeChatModeState(state: ChatModeState): Required<ChatModeState> {
  const normalized: Required<ChatModeState> = {
    isImageMode: !!state.isImageMode,
    isComposeMode: !!state.isComposeMode,
    isCodeMode: !!state.isCodeMode,
    webBrowsingEnabled: !!state.webBrowsingEnabled,
  };

  if (normalized.isComposeMode) {
    normalized.isImageMode = false;
  } else if (normalized.isImageMode) {
    normalized.isComposeMode = false;
  }

  return normalized;
}

export function resolveStartNewChatState(
  options: StartNewChatOptions,
  fallbackModelId?: string,
) {
  const normalizedModes = normalizeChatModeState(options);

  return {
    selectedModelId: resolveEffectiveTextModel(options.initialModelId || fallbackModelId),
    ...normalizedModes,
  };
}

export function resolveRequestCapabilities(
  input: RequestCapabilityInput,
): RequestCapabilityResolution {
  const requestedModelId = resolveEffectiveTextModel(input.selectedModelId);
  const requestedModel =
    AVAILABLE_POLLINATIONS_MODELS.find((model) => model.id === requestedModelId) ||
    AVAILABLE_POLLINATIONS_MODELS[0];

  const isImageModeIntent = !!input.isImageModeIntent;
  const requiresVisionModel = input.hasUploadedFile && !isImageModeIntent;

  let selectedModel = requestedModel;
  let fallbackModel: PollinationsModel | undefined;
  let didFallbackToVisionModel = false;

  if (requiresVisionModel && !requestedModel.vision) {
    fallbackModel = AVAILABLE_POLLINATIONS_MODELS.find((model) => model.vision);
    if (fallbackModel) {
      selectedModel = fallbackModel;
      didFallbackToVisionModel = true;
    }
  }

  return {
    selectedModelId: selectedModel.id,
    selectedModel,
    requiresVisionModel,
    didFallbackToVisionModel,
    fallbackModel,
    isImageModeIntent,
    isCodeMode: !!input.isCodeMode && !isImageModeIntent,
  };
}
