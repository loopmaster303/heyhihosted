import type { ApiChatMessage, ChatMessage, ChatMessageContentPart } from '@/types';
import { stripMarkersForDisplay } from './chat-media-intent';

/**
 * Die zwei Schritte eines Bildes in der Antwort (siehe chat-media-intent-handler):
 * `prepare` laeuft sofort und liefert sauberen Text plus Platzhalter, `resolve`
 * erzeugt danach jedes Bild und gibt den fertigen (oder gescheiterten) Teil zurueck.
 */
export interface AssistantMediaHooks {
  prepare: (rawText: string) => { cleanText: string; pendingParts: ChatMessageContentPart[] };
  resolve: (part: ChatMessageContentPart) => Promise<ChatMessageContentPart>;
}

interface RunTextChatCompletionFlowInput {
  updatedMessagesForState: ChatMessage[];
  modelIdForRequest: string;
  systemPromptForRequest: string;
  webBrowsingEnabled: boolean;
  skipSmartRouter?: boolean;
  createMessageId: () => string;
  createTimestamp: () => string;
  sendChatCompletion: (
    options: {
      messages: ApiChatMessage[];
      modelId: string;
      systemPrompt?: string;
      webBrowsingEnabled?: boolean;
      skipSmartRouter?: boolean;
    },
    onStream?: (delta: string) => void,
  ) => Promise<string>;
  onConversationMessagesUpdate: (messages: ChatMessage[]) => void;
  historyForApiRecent?: ApiChatMessage[];
  media?: AssistantMediaHooks;
}

interface RunTextChatCompletionFlowResult {
  assistantMessage: ChatMessage;
  finalMessages: ChatMessage[];
}

export async function runTextChatCompletionFlow(
  input: RunTextChatCompletionFlowInput,
): Promise<RunTextChatCompletionFlowResult> {
  const streamingMessageId = input.createMessageId();
  const baseAssistantMessage: ChatMessage = {
    id: streamingMessageId,
    role: 'assistant',
    content: '',
    timestamp: input.createTimestamp(),
    toolType: 'long language loops',
    isStreaming: true,
  };

  let finalMessages = [...input.updatedMessagesForState, baseAssistantMessage];
  input.onConversationMessagesUpdate(finalMessages);

  const publish = (message: ChatMessage) => {
    finalMessages = [...input.updatedMessagesForState, message];
    input.onConversationMessagesUpdate(finalMessages);
  };

  let streamedContent = '';
  const completion = await input.sendChatCompletion(
    {
      messages: input.historyForApiRecent || [],
      modelId: input.modelIdForRequest,
      systemPrompt: input.systemPromptForRequest,
      webBrowsingEnabled: input.webBrowsingEnabled,
      skipSmartRouter: input.skipSmartRouter,
    },
    (delta: string) => {
      streamedContent = delta;
      // Schon der Zwischenstand zeigt keinen Marker: ein Bild-Prompt ist eine
      // Anweisung an das Bildmodell, kein Text fuer den Menschen.
      publish({ ...baseAssistantMessage, content: stripMarkersForDisplay(streamedContent), isStreaming: true });
    },
  );

  // The return value is the authoritative full completion; the stream callback
  // only mirrors it for live UI updates and may lag or never fire (JSON path).
  if (completion.trim()) {
    streamedContent = completion;
  }

  const trimmed = streamedContent.trim() || "Sorry, I couldn't get a response.";
  const prepared = input.media
    ? input.media.prepare(trimmed)
    : { cleanText: stripMarkersForDisplay(trimmed), pendingParts: [] };

  const withParts = (parts: ChatMessageContentPart[]): ChatMessage => ({
    ...baseAssistantMessage,
    content: parts.length > 0 ? [{ type: 'text', text: prepared.cleanText }, ...parts] : prepared.cleanText,
    // The placeholder was stamped before the request went out; the finished
    // reply should carry the time it actually arrived.
    timestamp: input.createTimestamp(),
    isStreaming: false,
  });

  // Schritt 1: Text sofort, Bild als Platzhalter.
  let assistantMessage = withParts(prepared.pendingParts);
  publish(assistantMessage);

  // Schritt 2: jedes Bild an seinem Platz einsetzen.
  if (input.media && prepared.pendingParts.length > 0) {
    const resolved = await Promise.all(prepared.pendingParts.map((part) => input.media!.resolve(part)));
    assistantMessage = { ...withParts(resolved), timestamp: assistantMessage.timestamp };
    publish(assistantMessage);
  }

  return {
    assistantMessage,
    finalMessages,
  };
}
