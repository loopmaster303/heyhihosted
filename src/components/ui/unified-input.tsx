import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '../LanguageProvider';

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
  topElements?: React.ReactNode;
  topElementsVariant?: 'framed' | 'bare';
  children?: React.ReactNode;
  drawer?: React.ReactNode;
  isDrawerOpen?: boolean;
  className?: string;
  autoFocus?: boolean;
  /** CSS color for active mode glow (e.g. "hsl(325 100% 62%)") */
  modeColor?: string;
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
  topElementsVariant = 'framed',
  children,
  drawer,
  isDrawerOpen,
  className,
  autoFocus,
  modeColor,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();
  const [flashActive, setFlashActive] = useState(false);
  const prevModeColor = useRef(modeColor);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 24),
        200
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Flash on mode change
  useEffect(() => {
    if (modeColor && modeColor !== prevModeColor.current) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 500);
      prevModeColor.current = modeColor;
      return () => clearTimeout(timer);
    }
    prevModeColor.current = modeColor;
  }, [modeColor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const hasTopElements = !!topElements;

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      {/* Container — real glass */}
      <div
        className={cn(
          "relative rounded-[28px] p-5 transition-all duration-500 ease-out overflow-hidden",
          "backdrop-blur-3xl",
          !modeColor && "border border-primary/30 hover:border-primary/50 hover:shadow-glow-primary focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 focus-within:shadow-glow-primary",
          modeColor && "border",
          isDrawerOpen && "rounded-b-xl rounded-t-[28px]",
        )}
        style={{
          background: `
            linear-gradient(
              169deg,
              rgba(179,136,255,0.08) 0%,
              rgba(179,136,255,0.02) 40%,
              rgba(179,136,255,0.0) 70%
            ),
            rgba(var(--glass-bg-rgb, 20,20,20), 0.55)
          `,
          boxShadow: modeColor
            ? `
              0 1px 0 0 rgba(179,136,255,0.06) inset,
              0 -1px 0 0 rgba(0,0,0,0.1) inset,
              0 8px 32px -8px rgba(0,0,0,0.4),
              0 2px 8px -2px rgba(0,0,0,0.2),
              0 0 ${flashActive ? '20px' : '10px'} ${modeColor}33
            `
            : `
              0 1px 0 0 rgba(179,136,255,0.06) inset,
              0 -1px 0 0 rgba(0,0,0,0.1) inset,
              0 8px 32px -8px rgba(0,0,0,0.4),
              0 2px 8px -2px rgba(0,0,0,0.2)
            `,
          borderColor: modeColor ? `${modeColor}44` : undefined,
          transform: flashActive ? 'scale(1.008)' : 'scale(1)',
        }}
      >
        {/* Flash overlay on mode activation */}
        {flashActive && modeColor && (
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none z-10"
            style={{
              background: `radial-gradient(ellipse at center, ${modeColor}18 0%, transparent 70%)`,
              animation: 'flash-fade 500ms ease-out forwards',
            }}
          />
        )}

        {children}

        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder || "Chat message input"}
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

        {/* Drawer Slot */}
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

        {/* Actions — config + controls on one line */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar min-w-0">
            {hasTopElements ? topElements : leftActions}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {rightActions}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 text-center hidden lg:block">
        <p className="text-[9px] md:text-[10px] text-muted-foreground/60 px-4">
          {t('chat.disclaimer')}
        </p>
      </div>
    </div>
  );
};
