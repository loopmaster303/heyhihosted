'use client';

import * as React from 'react';
import { Drawer as Vaul } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export type SheetSide = 'left' | 'right' | 'bottom';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Wo das Sheet herkommt. `right` wird auf dem Telefon automatisch zu
   * `bottom` — dort greift der Daumen, nicht die Maus.
   */
  side: SheetSide;
  title: string;
  description?: string;
  /** Zusaetzliche Knoepfe in der Kopfzeile, links vom Schliessen. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
}

/**
 * Der eine Panel-Baustein der App. Verlauf, Galerie und Einstellungen sind
 * alle dieses Sheet — damit oeffnet, schliesst und bewegt sich jedes Panel
 * gleich. vaul (Radix Dialog darunter) bringt mit, was vorher jedes Panel
 * selbst vergessen hat: Esc, Fokusfang, Fokus-Rueckgabe, inerter
 * Hintergrund, Ausgangsbewegung und Wischen zum Schliessen.
 */
export function Sheet({
  open,
  onOpenChange,
  side,
  title,
  description,
  headerActions,
  children,
  className,
  bodyClassName,
  closeLabel = 'Schließen',
}: SheetProps) {
  const isPhone = useMediaQuery('(max-width: 639px)');
  const direction: SheetSide = side === 'right' && isPhone ? 'bottom' : side;
  const isBottom = direction === 'bottom';

  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} direction={direction} shouldScaleBackground={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Vaul.Content
          className={cn(
            'fixed z-50 flex flex-col bg-popover text-popover-foreground outline-none',
            'shadow-[0_12px_48px_-12px_rgba(0,0,0,0.45)]',
            direction === 'left' && 'inset-y-0 left-0 w-[min(88vw,22rem)] border-r border-border pt-[env(safe-area-inset-top)]',
            direction === 'right' && 'inset-y-0 right-0 w-[min(92vw,28rem)] border-l border-border pt-[env(safe-area-inset-top)]',
            isBottom && 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t border-border pb-[env(safe-area-inset-bottom)]',
            className,
          )}
        >
          {isBottom && <Vaul.Handle className="mx-auto mt-3 !h-1.5 !w-12 shrink-0 !bg-muted-foreground/30" />}
          <header className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
            <Vaul.Title className="flex-1 truncate text-base font-semibold">{title}</Vaul.Title>
            {headerActions}
            <Vaul.Close
              className="press grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Vaul.Close>
          </header>
          {description ? (
            <Vaul.Description className="px-4 pb-2 text-sm text-muted-foreground">{description}</Vaul.Description>
          ) : (
            <Vaul.Description className="sr-only">{title}</Vaul.Description>
          )}
          <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4', bodyClassName)}>
            {children}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
