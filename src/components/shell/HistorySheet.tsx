'use client';

import React from 'react';
import Link from 'next/link';
import { History, Info, Plus, Trash2 } from 'lucide-react';
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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title={t('shell.history')}
      icon={<History aria-hidden="true" />}
      bodyClassName="px-3"
    >
      <button
        type="button"
        onClick={() => { startNewChat(); finish(); }}
        className="panel-action press mb-5 h-9 w-full"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('shell.newChat')}
      </button>

      {conversations.length === 0 ? (
        <p className="px-2 py-4 text-xs text-muted-foreground">{t('chat.noHistory')}</p>
      ) : (
        <ul className="flex flex-col gap-1" aria-label={t('shell.history')}>
          {conversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            return (
              <li key={conv.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => { void selectChat(conv.id); finish(); }}
                  aria-current={isActive ? 'true' : undefined}
                  className="panel-item flex min-h-11 flex-1 flex-col justify-center px-3 py-2 pr-11 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn(
                    'w-full truncate text-xs font-medium',
                    isActive ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground',
                  )}>
                    {conv.title}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {relativeTime(conv.updatedAt, t)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteChat(conv.id)}
                  aria-label={`${t('action.delete')}: ${conv.title}`}
                  className="reveal-on-hover touch-hit absolute right-1.5 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-sidebar-border/50 pt-3">
        <Link
          href="/about"
          className="panel-item flex h-9 items-center gap-2 px-3 text-xs text-foreground/75 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          {t('shell.about')}
        </Link>
      </div>
    </Sheet>
  );
}
