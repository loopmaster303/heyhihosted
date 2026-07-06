import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';

/**
 * Renders parameter controls inline on desktop, or behind a 3-dot popover on mobile.
 * The mobile popover uses Radix DropdownMenu (side="top", collision-aware) so it opens
 * upward and never gets clipped by the bottom screen edge; params sit in a 2-column grid
 * to avoid scrolling. Defined at module scope so children never remount while typing.
 *
 * Direct `<div>` children get grid-cell styling on mobile via the `[&>div]` utilities.
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
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Parameter"
          className="flex items-center justify-center shrink-0 h-7 w-7 rounded-full border border-border/30 text-muted-foreground hover:text-foreground transition-colors data-[state=open]:bg-muted/40 data-[state=open]:text-foreground"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        className="grid grid-cols-2 gap-1.5 w-[min(340px,92vw)] p-2 bg-popover/95 backdrop-blur-xl border-border/40 shadow-glass-heavy [&>div]:w-full [&>div]:border-r-0 [&>div]:rounded-lg [&>div]:bg-muted/20 [&>div]:px-2.5 [&>div]:py-2 [&>div]:justify-between"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
