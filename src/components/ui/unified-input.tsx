import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface UnifiedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e?: React.FormEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  topElements?: React.ReactNode; // For bubbles/badges above input
  children?: React.ReactNode; // For overlays or extra content
  drawer?: React.ReactNode; // Content for the expandable drawer
  isDrawerOpen?: boolean; // Controls drawer visibility
  className?: string;
  autoFocus?: boolean;
}

export const UnifiedInput: React.FC<UnifiedInputProps> = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder,
  isLoading,
  disabled,
  leftActions,
  rightActions,
  topElements,
  children,
  drawer,
  isDrawerOpen,
  className,
  autoFocus
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic from existing components
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 24), // Min height
        200 // Max height
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      {topElements && (
        <div className="absolute left-0 right-0 -top-3 z-20 -translate-y-full">
          <div className="px-2 md:px-4">
            <div className="rounded-2xl border border-border/40 bg-background/70 px-3 py-2 shadow-sm backdrop-blur-sm origin-bottom animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out">
              {topElements}
            </div>
          </div>
        </div>
      )}
      {/* Container echoing the v0 design */}
      <div 
        className={cn(
          "relative rounded-[32px] p-4 shadow-2xl backdrop-blur-sm transition-all duration-300",
          "bg-background/80 dark:bg-[#1a1a1a]/90", // Using standardized backgrounds
          "border border-primary/20 hover:border-primary/40 focus-within:border-primary/60",
           // Add a subtle glow on focus/hover
          "hover:shadow-[0_0_20px_rgba(232,154,184,0.1)] focus-within:shadow-[0_0_25px_rgba(232,154,184,0.15)]",
          isDrawerOpen && "rounded-b-2xl rounded-t-2xl ring-1 ring-primary/20", // Adjust shape/ring when drawer is open
        )}
      >
        
        {children}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            autoFocus={autoFocus}
            rows={1}
            className={cn(
              "w-full bg-transparent px-2 py-1 text-lg text-foreground placeholder:text-muted-foreground/70",
              "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "resize-none overflow-y-auto min-h-[40px] max-h-[200px]"
            )}
            style={{ fontSize: '1.125rem', lineHeight: '1.5' }} 
          />
        </div>

        {/* Drawer Slot - Expandable Area */}
        <div 
            className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isDrawerOpen ? "max-h-[500px] opacity-100 mt-2 mb-2" : "max-h-0 opacity-0 mt-0 mb-0"
            )}
        >
            <div className="pt-2 border-t border-border/40">
                {drawer}
            </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            {leftActions}
          </div>

          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-3 text-center">
         <p className="text-[10px] md:text-xs text-muted-foreground/60">
          AI kann Fehler machen. Bitte überprüfe wichtige Informationen.
        </p>
      </div>
    </div>
  );
};
