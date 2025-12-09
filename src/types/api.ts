/**
 * Type definitions for API requests and responses
 */

// ===== Pollinations Chat API =====

export interface PollinationsApiMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface PollinationsChatCompletionRequest {
  messages: PollinationsApiMessage[];
  modelId: string;
  systemPrompt?: string;
}

export interface PollinationsChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: 'assistant';
    };
    finish_reason?: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ===== Replicate API =====

export interface ReplicatePredictionRequest {
  version: string;
  input: Record<string, unknown>;
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
  urls?: {
    get: string;
    cancel?: string;
  };
}

// ===== Image Generation API =====

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
  private?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  seed?: number;
  modelUsed?: string;
}

// ===== TTS API =====

export interface TTSRequest {
  text: string;
  voice: string;
}

export interface TTSResponse {
  audioDataUri: string;
}

// ===== STT API =====

export interface STTResponse {
  transcription: string;
}

// ===== Title Generation API =====

export interface TitleGenerationRequest {
  messages: string;
}

export interface TitleGenerationResponse {
  title: string;
}

// ===== Error Response =====

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

// ===== Type Guards =====

export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error === 'string'
  );
}

export function isPollinationsChatResponse(data: unknown): data is PollinationsChatCompletionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'choices' in data &&
    Array.isArray((data as PollinationsChatCompletionResponse).choices)
  );
}


