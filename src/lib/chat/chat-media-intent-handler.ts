/**
 * chat-media-intent-handler
 * -------------------------
 * Bridges the output of `parseMediaIntents` with the existing image and
 * music generation services. Given a raw assistant string, this module:
 *
 *   1. Re-parses the text for `[IMAGE_GEN: ...]` and `[MUSIC_GEN: ...]` markers.
 *   2. Triggers image generation for every `image` marker, persists the
 *      resulting asset via `OutputService.saveGeneratedAsset`, and produces
 *      an `image_url` content part.
 *   3. Triggers music composition for every `music` marker by calling the
 *      existing `/api/compose` endpoint, and produces an `audio_url` content
 *      part.
 *   4. Returns the cleaned text plus all generated content parts so the
 *      caller can attach them to the assistant message.
 *
 * Failures are isolated: a single broken marker does not abort the rest of
 * the batch. Errors are reported via the optional `onError` callback.
 */

import type { ChatMessageContentPart } from '@/types';
import type { GenerateImageOptions } from '@/lib/services/chat-service';
import type { SaveGeneratedAssetOptions } from '@/lib/services/output-service';
import { parseMediaIntents, type MediaIntent } from './chat-media-intent';

export type ComposeMusicDefaults = {
  duration?: number;
  instrumental?: boolean;
  model?: string;
};

export interface ProcessAssistantMediaIntentsInput {
  rawText: string;
  conversationId: string;
  sessionId: string;
  selectedImageModelId: string;
  generateImage: (options: GenerateImageOptions) => Promise<string>;
  saveGeneratedAsset: (
    options: SaveGeneratedAssetOptions,
  ) => Promise<string | undefined>;
  composeMusic?: (prompt: string) => Promise<string | null>;
  composeDefaults?: ComposeMusicDefaults;
  onError?: (kind: 'image' | 'music' | 'audio-save', message: string) => void;
}

export interface ProcessAssistantMediaIntentsResult {
  cleanText: string;
  extraParts: ChatMessageContentPart[];
}

const EMPTY_RESULT: ProcessAssistantMediaIntentsResult = {
  cleanText: '',
  extraParts: [],
};

export async function processAssistantMediaIntents(
  input: ProcessAssistantMediaIntentsInput,
): Promise<ProcessAssistantMediaIntentsResult> {
  if (!input || typeof input.rawText !== 'string' || input.rawText.length === 0) {
    return EMPTY_RESULT;
  }

  const { markers, cleanText } = parseMediaIntents(input.rawText);
  if (markers.length === 0) {
    return { cleanText, extraParts: [] };
  }

  const extraParts: ChatMessageContentPart[] = [];

  for (const marker of markers) {
    try {
      if (marker.kind === 'image') {
        const part = await generateImagePart(marker, input);
        if (part) extraParts.push(part);
      } else {
        const part = await generateMusicPart(marker, input);
        if (part) extraParts.push(part);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      input.onError?.(marker.kind === 'image' ? 'image' : 'music', message);
    }
  }

  return { cleanText, extraParts };
}

async function generateImagePart(
  marker: MediaIntent,
  input: ProcessAssistantMediaIntentsInput,
): Promise<ChatMessageContentPart | null> {
  const imageParams: GenerateImageOptions = {
    prompt: marker.prompt,
    modelId: input.selectedImageModelId,
  };

  const imageUrl = await input.generateImage(imageParams);
  if (!imageUrl) return null;

  let generatedAssetId: string | undefined;
  try {
    generatedAssetId = await input.saveGeneratedAsset({
      url: imageUrl,
      prompt: marker.prompt,
      modelId: input.selectedImageModelId,
      conversationId: input.conversationId,
      sessionId: input.sessionId,
      isVideo: false,
      isPollinations: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    input.onError?.('audio-save', message);
  }

  return {
    type: 'image_url',
    image_url: {
      url: imageUrl,
      altText: `Generated image (${input.selectedImageModelId})`,
      isGenerated: true,
      metadata: generatedAssetId ? { assetId: generatedAssetId } : undefined,
    },
  };
}

async function generateMusicPart(
  marker: MediaIntent,
  input: ProcessAssistantMediaIntentsInput,
): Promise<ChatMessageContentPart | null> {
  if (!input.composeMusic) {
    input.onError?.(
      'music',
      'Music composition is unavailable in this context; skipping marker.',
    );
    return null;
  }

  const audioUrl = await input.composeMusic(marker.prompt);
  if (!audioUrl) return null;

  return {
    type: 'audio_url',
    audio_url: {
      url: audioUrl,
      altText: `Generated music: ${marker.prompt}`,
      isGenerated: true,
    },
  };
}

export const __testing = {
  generateImagePart,
  generateMusicPart,
};
