import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEFAULT_POLLINATIONS_MODEL_ID,
  findVisiblePollinationsModelById,
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

interface VisibleTextModelOptions {
  visibleModels?: PollinationsModel[];
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

export function resolveEffectiveTextModel(modelId?: string, visibleModels?: PollinationsModel[]): string {
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
  visibleModels?: PollinationsModel[],
) {
  const normalizedModes = normalizeChatModeState(options);

  return {
    selectedModelId: resolveEffectiveTextModel(options.initialModelId || fallbackModelId, visibleModels),
    ...normalizedModes,
  };
}

export function resolveRequestCapabilities(
  input: RequestCapabilityInput,
  options: VisibleTextModelOptions = {},
): RequestCapabilityResolution {
  const visibleModels = options.visibleModels && options.visibleModels.length > 0
    ? options.visibleModels
    : AVAILABLE_POLLINATIONS_MODELS;
  const requestedModelId = resolveEffectiveTextModel(input.selectedModelId, visibleModels);
  const requestedModel = visibleModels.find((model) => model.id === requestedModelId)
    || findVisiblePollinationsModelById(requestedModelId)
    || AVAILABLE_POLLINATIONS_MODELS[0];

  const isImageModeIntent = !!input.isImageModeIntent;
  const requiresVisionModel = input.hasUploadedFile && !isImageModeIntent;

  let selectedModel = requestedModel;
  let fallbackModel: PollinationsModel | undefined;
  let didFallbackToVisionModel = false;

  if (requiresVisionModel && !requestedModel.vision) {
    fallbackModel = visibleModels.find((model) => model.vision) || AVAILABLE_POLLINATIONS_MODELS.find((model) => model.vision);
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
