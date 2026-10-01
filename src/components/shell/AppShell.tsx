'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { History, LayoutGrid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatProvider, useChatConversation } from '@/components/ChatProvider';
import { ChatSpace } from '@/components/chat/ChatSpace';
import { COMPOSER_INPUT_ID } from '@/components/chat/Composer';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { useLanguage } from '@/components/LanguageProvider';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import {
  ShellContext,
  pathForSpace,
  spaceForPath,
  type CreateHandoff,
  type LightboxItem,
  type ShellContextValue,
  type Space,
} from './ShellContext';
import { usePanelState } from './usePanelState';
import { HistorySheet } from './HistorySheet';
import { GallerySheet } from './GallerySheet';
import { SettingsSheet } from './SettingsSheet';
import { Lightbox } from './Lightbox';

// Create wird erst geladen, wenn man den Raum zum ersten Mal betritt — und
// bleibt danach gemountet, damit laufende Generierungen den Wechsel ueberleben.
const PlaygroundShell = dynamic(
  () => import('@/components/playground/PlaygroundShell').then((m) => m.PlaygroundShell),
  { ssr: false, loading: () => <div className="h-full" aria-busy="true" /> },
);

function SpaceSwitch({ space }: { space: Space }) {
  const { t } = useLanguage();
  const items: Array<{ id: Space; label: string }> = [
    { id: 'chat', label: t('shell.chat') },
    { id: 'create', label: t('shell.create') },
  ];
  return (
    <nav aria-label={t('shell.space')} className="relative grid grid-cols-2 rounded-full bg-muted/70 p-1">
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm',
          'transition-transform duration-med ease-out',
          space === 'create' && 'translate-x-full',
        )}
      />
      {items.map((item) => (
        <Link
          key={item.id}
          href={pathForSpace(item.id)}
          aria-current={space === item.id ? 'page' : undefined}
          className={cn(
            'relative z-10 flex h-9 min-w-[4.5rem] items-center justify-center rounded-full px-3 text-sm font-medium transition-colors duration-med',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            space === item.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function HeaderButton({ label, onClick, children, expanded }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className="press grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function ConversationTitle({ space }: { space: Space }) {
  const { activeConversation } = useChatConversation();
  if (space !== 'chat' || !activeConversation?.messages.length) return null;
  return (
    <span className="hidden min-w-0 truncate text-sm text-muted-foreground md:block">
      {activeConversation.title}
    </span>
  );
}

/**
 * Die eine Flaeche. Kopfzeile, zwei Raeume (Chat, Create) und die Sheets.
 * Der Raum folgt der Adresse (`/`, `/create`), das offene Sheet steht in
 * `?panel=` — Zurueck schliesst erst das Sheet, dann wechselt es den Raum.
 */
export function AppShell() {
  useViewportHeight();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const space = spaceForPath(pathname);
  const { panel, openPanel, closePanel } = usePanelState();

  // Einmal betreten, bleibt Create gemountet (Zustand aus dem letzten Render).
  const [createVisited, setCreateVisited] = useState(space === 'create');
  if (space === 'create' && !createVisited) setCreateVisited(true);

  const [createHandoff, setCreateHandoff] = useState<CreateHandoff | null>(null);
  const handoffCounter = useRef(0);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const goToSpace = useCallback((next: Space) => {
    if (next !== spaceForPath(window.location.pathname)) router.push(pathForSpace(next));
  }, [router]);

  // Cmd/Ctrl+K oeffnet den Verlauf. Mehr Kuerzel nicht — jedes weitere muss
  // sich seinen Platz verdienen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (panel === 'history') closePanel();
        else openPanel('history');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, openPanel, closePanel]);

  const context = useMemo<ShellContextValue>(() => ({
    space,
    goToSpace,
    panel,
    openPanel,
    closePanel,
    createHandoff,
    handoffToCreate: (handoff) => {
      handoffCounter.current += 1;
      setCreateHandoff({ ...handoff, id: handoffCounter.current });
    },
    consumeHandoff: (id) => setCreateHandoff((current) => (current?.id === id ? null : current)),
    openLightbox: setLightbox,
  }), [space, goToSpace, panel, openPanel, closePanel, createHandoff]);

  const sheetProps = (name: 'history' | 'gallery' | 'settings') => ({
    open: panel === name,
    onOpenChange: (open: boolean) => { if (!open) closePanel(); },
  });

  return (
    <ShellContext.Provider value={context}>
      <MotionConfig reducedMotion="user">
        <ChatProvider>
          <div className="flex h-[var(--vvh,100dvh)] flex-col overflow-hidden bg-background text-foreground">
            <a
              href={`#${COMPOSER_INPUT_ID}`}
              className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
            >
              {t('shell.skipToInput')}
            </a>

            <header className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 px-2 pb-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-3">
              <HeaderButton label={t('shell.history')} onClick={() => openPanel('history')} expanded={panel === 'history'}>
                <History className="h-5 w-5" aria-hidden="true" />
              </HeaderButton>
              <SpaceSwitch space={space} />
              <ConversationTitle space={space} />
              <div className="ml-auto flex items-center">
                <HeaderButton label={t('shell.gallery')} onClick={() => openPanel('gallery')} expanded={panel === 'gallery'}>
                  <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                </HeaderButton>
                <HeaderButton label={t('shell.settings')} onClick={() => openPanel('settings')} expanded={panel === 'settings'}>
                  <Settings className="h-5 w-5" aria-hidden="true" />
                </HeaderButton>
              </div>
            </header>

            <main className="relative min-h-0 flex-1 overflow-hidden">
              <section
                className="space"
                data-space="chat"
                data-active={space === 'chat'}
                inert={space !== 'chat'}
                aria-label={t('shell.chat')}
              >
                <ChatSpace />
              </section>
              {createVisited && (
                <section
                  className="space"
                  data-space="create"
                  data-active={space === 'create'}
                  inert={space !== 'create'}
                  aria-label={t('shell.create')}
                >
                  <h1 className="sr-only">hey.hi — Create</h1>
                  <PlaygroundShell />
                </section>
              )}
            </main>
          </div>

          <HistorySheet {...sheetProps('history')} />
          <GallerySheet {...sheetProps('gallery')} />
          <SettingsSheet {...sheetProps('settings')} />
          <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
          <OfflineIndicator />
        </ChatProvider>
      </MotionConfig>
    </ShellContext.Provider>
  );
}
