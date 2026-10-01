'use client';

import { createContext, useContext } from 'react';

export type Space = 'chat' | 'create';
export type ShellPanel = 'history' | 'gallery' | 'settings';
export const SHELL_PANELS: readonly ShellPanel[] = ['history', 'gallery', 'settings'];

/** Ein Bild aus dem Chat, das in Create weiterbearbeitet werden soll. */
export interface CreateHandoff {
  id: number;
  prompt: string;
  modelId?: string;
}

/** Was die Grossansicht zeigt. */
export interface LightboxItem {
  url: string;
  alt: string;
  prompt?: string;
  modelId?: string;
}

export interface ShellContextValue {
  space: Space;
  goToSpace: (space: Space) => void;
  panel: ShellPanel | null;
  openPanel: (panel: ShellPanel) => void;
  closePanel: () => void;
  createHandoff: CreateHandoff | null;
  handoffToCreate: (handoff: Omit<CreateHandoff, 'id'>) => void;
  consumeHandoff: (id: number) => void;
  openLightbox: (item: LightboxItem) => void;
}

const noop = () => {};

/**
 * Ausserhalb der Huelle (isolierte Komponententests, die About-Seite) laeuft
 * alles weiter, nur ohne Wirkung — kein Absturz wegen eines fehlenden Providers.
 */
const DETACHED: ShellContextValue = {
  space: 'chat',
  goToSpace: noop,
  panel: null,
  openPanel: noop,
  closePanel: noop,
  createHandoff: null,
  handoffToCreate: noop,
  consumeHandoff: noop,
  openLightbox: noop,
};

export const ShellContext = createContext<ShellContextValue>(DETACHED);

export function useShell(): ShellContextValue {
  return useContext(ShellContext);
}

export function spaceForPath(pathname: string | null | undefined): Space {
  return pathname?.startsWith('/create') ? 'create' : 'chat';
}

export function pathForSpace(space: Space): string {
  return space === 'create' ? '/create' : '/';
}
