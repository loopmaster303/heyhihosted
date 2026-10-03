/**
 * chat-media-intent-handler
 * -------------------------
 * Ein Bild im Chat entsteht in zwei Schritten, damit die Antwort nicht auf das
 * Bild warten muss:
 *
 *   1. `prepareAssistantMedia` — sofort, synchron: sauberer Text plus ein
 *      Bildteil im Zustand `pending`. Der Platzhalter haelt ab hier den Platz.
 *   2. `resolveImagePart` — asynchron: erzeugt das Bild, speichert es im
 *      Asset-Pool und liefert denselben Teil fertig oder mit Fehler zurueck.
 *
 * Ein Fehler wirft nie: er wird zum Teil mit `status: 'error'` und bleibt am
 * Ort des Bildes stehen — dort, wo der Nutzer es erwartet hat.
 */

import type { ChatImagePayload, ChatMessage, ChatMessageContentPart } from '@/types';
import type { GenerateImageOptions } from '@/lib/services/chat-service';
import type { SaveGeneratedAssetOptions } from '@/lib/services/output-service';
import { isPollinationsHostedModel } from '@/config/unified-image-models';
import { parseMediaIntents } from './chat-media-intent';

/** Der Chat erzeugt quadratisch. Wer ein anderes Format will, geht in Create. */
export const CHAT_IMAGE_SIZE = { width: 1024, height: 1024 } as const;

/**
 * Deckelung gegen Mehrfach-Emission ("hier drei Varianten"). Sie gehoert in den
 * Code und nicht nur in den System-Prompt: sie darf nicht davon abhaengen, dass
 * sich das Modell an die Anweisung haelt.
 */
const MAX_IMAGES_PER_ANSWER = 1;

export interface PreparedAssistantMedia {
  cleanText: string;
  pendingParts: ChatMessageContentPart[];
}

export function prepareAssistantMedia(rawText: string, imageModelId: string): PreparedAssistantMedia {
  const { cleanText, markers } = parseMediaIntents(rawText);
  const pendingParts: ChatMessageContentPart[] = markers
    .slice(0, MAX_IMAGES_PER_ANSWER)
    .map((marker) => ({
      type: 'image_url',
      image_url: {
        url: '',
        isGenerated: true,
        status: 'pending',
        prompt: marker.prompt,
        modelId: imageModelId,
        altText: marker.prompt,
      },
    }));
  return { cleanText, pendingParts };
}

export interface ResolveImagePartDeps {
  conversationId: string;
  sessionId: string;
  generateImage: (options: GenerateImageOptions) => Promise<string>;
  saveGeneratedAsset: (options: SaveGeneratedAssetOptions) => Promise<string | undefined>;
}

/** Ein Teil, der ein noch nicht fertiges oder gescheitertes Bild traegt. */
export function isUnresolvedImagePart(part: ChatMessageContentPart): part is { type: 'image_url'; image_url: ChatImagePayload } {
  return part.type === 'image_url' && (part.image_url.status === 'pending' || part.image_url.status === 'error');
}

function describeImageError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.trim() || 'Das Bild konnte nicht erzeugt werden.';
}

export async function resolveImagePart(
  part: ChatMessageContentPart,
  deps: ResolveImagePartDeps,
): Promise<ChatMessageContentPart> {
  if (part.type !== 'image_url') return part;
  const payload = part.image_url;
  const prompt = payload.prompt ?? '';
  const modelId = payload.modelId ?? '';

  try {
    const url = await deps.generateImage({ prompt, modelId, ...CHAT_IMAGE_SIZE });
    if (!url) throw new Error('Das Bild kam leer zurück.');

    let assetId: string | undefined;
    try {
      assetId = await deps.saveGeneratedAsset({
        url,
        prompt,
        modelId,
        conversationId: deps.conversationId,
        sessionId: deps.sessionId,
        isVideo: false,
        isPollinations: isPollinationsHostedModel(modelId),
      });
    } catch {
      // Das Bild ist da, nur der lokale Speicher hat versagt. Zeigen statt
      // verwerfen — es fehlt dann nur in der Galerie.
    }

    return {
      type: 'image_url',
      image_url: {
        url,
        isGenerated: true,
        prompt,
        modelId,
        altText: payload.altText ?? prompt,
        metadata: assetId ? { assetId } : undefined,
      },
    };
  } catch (error) {
    return {
      type: 'image_url',
      image_url: { ...payload, url: '', status: 'error', error: describeImageError(error) },
    };
  }
}

/**
 * Ein `pending`-Teil ohne laufende Erzeugung — nach einem Reload liegt er so in
 * IndexedDB. Er wird als abgebrochen gelesen, nie als ewiger Platzhalter.
 */
export function markPendingAsInterrupted(part: ChatMessageContentPart): ChatMessageContentPart {
  if (part.type !== 'image_url' || part.image_url.status !== 'pending') return part;
  return {
    type: 'image_url',
    image_url: { ...part.image_url, status: 'error', error: 'Die Erzeugung wurde unterbrochen.' },
  };
}

/** Wendet `markPendingAsInterrupted` auf alle Nachrichten einer geladenen Unterhaltung an. */
export function interruptPendingMedia<T extends { messages: ChatMessage[] }>(conversation: T): T {
  let changed = false;
  const messages = conversation.messages.map((message) => {
    if (typeof message.content === 'string') return message;
    const parts = message.content.map(markPendingAsInterrupted);
    if (parts.every((part, i) => part === (message.content as ChatMessageContentPart[])[i])) return message;
    changed = true;
    return { ...message, content: parts };
  });
  return changed ? { ...conversation, messages } : conversation;
}
