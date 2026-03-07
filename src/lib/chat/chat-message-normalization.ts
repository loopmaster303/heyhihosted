import type { ApiChatMessage, ChatMessage, ChatMessageContentPart } from '@/types';

function collapseContentToText(parts: ChatMessageContentPart[]): string {
  return parts
    .filter((part): part is Extract<ChatMessageContentPart, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

function normalizeVisionContent(parts: ChatMessageContentPart[]): ChatMessageContentPart[] {
  return parts.map((part) => {
    if (part.type !== 'image_url') {
      return part;
    }

    return {
      type: 'image_url',
      image_url: { url: part.image_url.remoteUrl || part.image_url.url },
    };
  });
}

export function normalizeRecentMessagesForApi(
  messages: ChatMessage[],
  modelSupportsVision: boolean,
): ApiChatMessage[] {
  return messages.map((message) => {
    let content: string | ChatMessageContentPart[] = message.content;

    if (Array.isArray(content)) {
      if (!modelSupportsVision || message.role === 'assistant') {
        content = collapseContentToText(content);
      } else {
        content = normalizeVisionContent(content);
      }
    }

    return {
      role: message.role as 'user' | 'assistant',
      content,
    };
  });
}
