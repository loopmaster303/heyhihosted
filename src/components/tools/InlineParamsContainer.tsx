import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

/**
 * Renders parameter controls inline on desktop, or behind a bottom drawer on mobile.
 * The mobile drawer (vaul) slides up from the bottom edge with the glass treatment;
 * params stack as full-width rows so every control stays tappable without scroll
 * gymnastics. Defined at module scope so children never remount while typing.
 *
 * Direct `<div>` children get row styling on mobile via the `[&>div]` utilities.
 */
export const InlineParamsContainer: React.FC<{
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ isMobile, open, onOpenChange, children }) => {
  if (!isMobile) {
    return <div className="flex items-center min-w-0 md:overflow-x-auto no-scrollbar">{children}</div>;
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Parameter"
          className="flex items-center justify-center shrink-0 h-7 w-7 rounded-full border border-border/30 text-muted-foreground hover:text-foreground transition-colors data-[state=open]:bg-muted/40 data-[state=open]:text-foreground"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[78dvh]">
        <DrawerHeader className="pb-1 pt-2 text-left">
          <DrawerTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Parameter
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Modell-Parameter anpassen
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-1 gap-1.5 px-4 pb-8 overflow-y-auto [&>div]:w-full [&>div]:border-r-0 [&>div]:rounded-lg [&>div]:bg-muted/20 [&>div]:px-3 [&>div]:py-2.5 [&>div]:justify-between">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
