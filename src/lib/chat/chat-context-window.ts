import type { ChatMessage } from '@/types';

const MAX_CONTEXT_USER_TURNS = 8;
const SUMMARY_CHAR_BUDGET = 1800;

export function toPlainTextForSummary(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map((part: any) => {
      if (part?.type === 'text') return String(part.text || '');
      if (part?.type === 'image_url') return '[image]';
      if (part?.type === 'video_url') return '[video]';
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

export function isAssistantAssetOutput(message: ChatMessage): boolean {
  if (message.role !== 'assistant') return false;
  if (Array.isArray(message.content)) {
    return message.content.some(
      (part: any) => part?.type === 'image_url' || part?.type === 'video_url' || part?.type === 'audio_url',
    );
  }

  const content = typeof message.content === 'string' ? message.content : '';
  return (
    content.startsWith('data:audio/') ||
    content.startsWith('data:image/') ||
    content.startsWith('data:video/')
  );
}

export function buildOlderMessagesSummary(olderMessages: ChatMessage[]): string {
  if (!olderMessages.length) return '';

  const lines: string[] = [];
  const tail = olderMessages.slice(-80);

  for (const message of tail) {
    const prefix = message.role === 'user' ? 'U' : 'A';
    const text = toPlainTextForSummary(message.content)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);

    if (text) lines.push(`${prefix}: ${text}`);
  }

  let summary = lines.join('\n').trim();
  if (summary.length > SUMMARY_CHAR_BUDGET) {
    summary = summary.slice(summary.length - SUMMARY_CHAR_BUDGET);
    const firstNewline = summary.indexOf('\n');
    if (firstNewline > 0) summary = summary.slice(firstNewline + 1);
  }

  if (!summary.trim()) return '';
  return `\n<conversation_summary>\nOlder messages (compressed, truncated):\n${summary}\n</conversation_summary>\n`;
}

export function splitMessagesForApiContext(allMessages: ChatMessage[]) {
  const userAssistantMessages = allMessages.filter(
    (message) => (message.role === 'user' || message.role === 'assistant') && !isAssistantAssetOutput(message),
  );

  if (userAssistantMessages.length === 0) {
    return { older: [] as ChatMessage[], recent: [] as ChatMessage[] };
  }

  let userTurns = 0;
  let startIndex = 0;

  for (let i = userAssistantMessages.length - 1; i >= 0; i--) {
    if (userAssistantMessages[i]?.role === 'user') userTurns++;
    if (userTurns >= MAX_CONTEXT_USER_TURNS) {
      startIndex = i;
      break;
    }
  }

  return {
    older: userAssistantMessages.slice(0, startIndex),
    recent: userAssistantMessages.slice(startIndex),
  };
}
