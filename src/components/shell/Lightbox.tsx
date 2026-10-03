'use client';

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { LightboxItem } from './ShellContext';

interface LightboxProps {
  item: LightboxItem | null;
  onClose: () => void;
}

/**
 * Die Grossansicht eines Bildes. Ersetzt zwei handgebaute Lightboxen auf
 * z-[9999], die weder Esc noch Fokus kannten. Hier steht auch der Prompt —
 * er gehoert zum Bild, aber nicht um das Bild herum in den Chat.
 */
export function Lightbox({ item, onClose }: LightboxProps) {
  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-med"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <Dialog.Title className="sr-only">{item?.alt || 'Bild'}</Dialog.Title>
          <Dialog.Description className="sr-only">{item?.prompt || item?.alt || 'Großansicht'}</Dialog.Description>
          {item && (
            <img
              src={item.url}
              alt={item.alt}
              className="max-h-[78dvh] max-w-full rounded-2xl object-contain"
            />
          )}
          {item?.prompt && (
            <p className="max-w-2xl text-center font-mono text-xs leading-relaxed text-white/75">
              {item.prompt}{item.modelId ? ` · ${item.modelId}` : ''}
            </p>
          )}
          <Dialog.Close
            className="press absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
