'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet } from './Sheet';
import { useShell } from './ShellContext';
import { useChatConversation } from '@/components/ChatProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { toDate } from '@/utils/chatHelpers';

function relativeTime(value: string | Date | undefined, t: (key: string) => string): string {
  if (!value) return '';
  const diffHours = Math.floor((Date.now() - toDate(value).getTime()) / 3_600_000);
  if (diffHours < 1) return t('time.justNow');
  if (diffHours < 24) return `${diffHours} h`;
  return `${Math.floor(diffHours / 24)} d`;
}

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Alle Unterhaltungen. Eine waehlen bringt dich in den Chat-Raum. */
export function HistorySheet({ open, onOpenChange }: HistorySheetProps) {
  const { t } = useLanguage();
  const shell = useShell();
  const { allConversations, activeConversation, selectChat, startNewChat, deleteChat } = useChatConversation();
  const conversations = allConversations.filter((c) => c.toolType === 'long language loops');

  const finish = () => {
    shell.goToSpace('chat');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="left" title={t('shell.history')} bodyClassName="px-2">
      <button
        type="button"
        onClick={() => { startNewChat(); finish(); }}
        className="press mb-3 flex h-11 w-full items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
      >
        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
        {t('shell.newChat')}
      </button>

      {conversations.length === 0 ? (
        <p className="px-2 py-6 text-sm text-muted-foreground">{t('chat.noHistory')}</p>
      ) : (
        <ul className="flex flex-col gap-0.5" aria-label={t('shell.history')}>
          {conversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            return (
              <li key={conv.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => { void selectChat(conv.id); finish(); }}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 py-2 pr-12 text-left text-sm transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'bg-primary/12 text-foreground' : 'text-foreground/85 hover:bg-muted',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{conv.title}</span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {relativeTime(conv.updatedAt, t)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteChat(conv.id)}
                  aria-label={`${t('action.delete')}: ${conv.title}`}
                  className="reveal-on-hover absolute right-1 grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-border px-2 pt-3">
        <Link href="/about" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {t('shell.about')}
        </Link>
      </div>
    </Sheet>
  );
}
