'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { ChatImagePayload } from '@/types';
import { useChatComposer, useChatConversation, useChatMedia } from '@/components/ChatProvider';
import { useShell } from '@/components/shell/ShellContext';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLanguage } from '@/components/LanguageProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import ChatView from './ChatView';
import { Composer } from './Composer';

// Canvas-basiert, nur im Browser.
const ASCIIText = dynamic(() => import('@/components/ui/ASCIIText'), {
  ssr: false,
  loading: () => <div className="h-24 sm:h-32" />,
});

const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

function ChatHero() {
  const { t } = useLanguage();
  const { isConnected, connectOAuth } = usePollenKey();
  const isPhone = useMediaQuery('(max-width: 639px)');
  const [storedName] = useLocalStorageState<string>('userDisplayName', 'user');
  const name = (typeof storedName === 'string' && storedName.trim() ? storedName.trim() : 'user').toLowerCase();

  return (
    <div className="flex w-full flex-col items-center gap-2 px-4 text-center">
      <h1 className="sr-only">hey.hi — Chat</h1>
      <div className="h-24 w-full max-w-3xl sm:h-32" aria-hidden="true">
        <ASCIIText
          text={`(!hey.hi = '${name}')`}
          asciiFontSize={isPhone ? 6 : 9}
          enableWaves
          color="hsl(267 85% 72% / 0.95)"
          className="h-full w-full"
        />
      </div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
        Everyone can say hi to AI
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {isConnected ? (
          <span className="font-mono uppercase tracking-[0.18em] text-[hsl(150_55%_40%)]">{t('shell.connected')}</span>
        ) : (
          <button type="button" onClick={connectOAuth} className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t('shell.connectHint')}
          </button>
        )}
        <span aria-hidden="true">·</span>
        <Link href="/about" className="underline underline-offset-4 hover:text-foreground">{t('shell.about')}</Link>
      </div>
    </div>
  );
}

/**
 * Der Chat-Raum. Leer steht die Eingabe mittig unter dem Schriftzug; mit der
 * ersten Nachricht gleitet sie nach unten und die Unterhaltung waechst
 * darueber — ein Zustand, kein Seitenwechsel.
 */
export function ChatSpace() {
  const { t } = useLanguage();
  const conversation = useChatConversation();
  const composer = useChatComposer();
  const media = useChatMedia();
  const shell = useShell();
  const messages = conversation.activeConversation?.messages ?? [];
  const isEmpty = messages.length === 0;

  const onZoomImage = useCallback((image: ChatImagePayload, src: string) => {
    shell.openLightbox({ url: src, alt: image.altText || image.prompt || 'Bild', prompt: image.prompt, modelId: image.modelId });
  }, [shell]);

  const onOpenInCreate = useCallback((image: ChatImagePayload) => {
    shell.handoffToCreate({ prompt: image.prompt || image.altText || '', modelId: image.modelId });
    shell.goToSpace('create');
  }, [shell]);

  return (
    <div className="flex h-full flex-col">
      <div className={isEmpty ? 'flex flex-1 flex-col justify-end pb-6' : 'min-h-0 flex-1'}>
        <AnimatePresence initial={false} mode="popLayout">
          {isEmpty ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <ChatHero />
            </motion.div>
          ) : (
            <motion.div
              key="log"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <ChatView
                messages={messages}
                isAiResponding={composer.isAiResponding}
                onPlayAudio={media.handlePlayAudio}
                playingMessageId={media.playingMessageId}
                isTtsLoadingForId={media.isTtsLoadingForId}
                onCopyToClipboard={composer.handleCopyToClipboard}
                onRegenerate={composer.regenerateLastResponse}
                onRetryMedia={media.retryMediaPart}
                onZoomImage={onZoomImage}
                onOpenInCreate={onOpenInCreate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        layout="position"
        transition={{ duration: 0.42, ease: EASE_OUT }}
        className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <div className="mx-auto w-full max-w-3xl">
          <Composer />
          <p className="mt-2 hidden text-center text-[11px] text-muted-foreground/70 lg:block">
            {t('chat.disclaimer')}
          </p>
        </div>
      </motion.div>

      {isEmpty && <div className="flex-1" aria-hidden="true" />}

      <CameraCaptureDialog
        isOpen={media.isCameraOpen}
        onOpenChange={media.closeCamera}
        onCapture={(dataUri) => media.handleFileSelect(dataUri, 'image')}
      />
    </div>
  );
}
