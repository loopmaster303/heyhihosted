import React, { useRef, useEffect } from 'react';
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
  children?: React.ReactNode;
  drawer?: React.ReactNode;
  isDrawerOpen?: boolean;
  className?: string;
  autoFocus?: boolean;
  /** HSL triple (or var() resolving to one) for the active mode tint, e.g. "var(--mode-visualize)" */
  modeColor?: string;
  /** Visual corner overlay for mode indication */
  visualCorner?: React.ReactNode;
  /** Attachment preview row above the input */
  attachmentRow?: React.ReactNode;
  /**
   * Auswahl, die den Inhalt der Leiste *ersetzt*. Solange sie gesetzt ist,
   * verschwinden Textzeile und Chip-Reihe: die Leiste ist die Auswahl, nichts
   * klappt darueber auf und kein Wert steht zweimal da.
   */
  picker?: React.ReactNode;
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
  children,
  drawer,
  isDrawerOpen,
  className,
  autoFocus,
  modeColor,
  visualCorner,
  attachmentRow,
  picker,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    // Enter confirms the IME candidate, not the message (e.g. Japanese/Chinese input)
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };


  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      {/* Container — real glass */}
      <div
        className={cn(
          "group relative rounded-[28px] p-4 sm:p-5 transition-all duration-500 ease-out overflow-hidden",
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
              0 0 10px hsl(${modeColor} / 0.2)
            `
            : `
              0 1px 0 0 rgba(179,136,255,0.06) inset,
              0 -1px 0 0 rgba(0,0,0,0.1) inset,
              0 8px 32px -8px rgba(0,0,0,0.4),
              0 2px 8px -2px rgba(0,0,0,0.2)
          `,
          borderColor: modeColor ? `hsl(${modeColor} / 0.27)` : undefined,
        }}
      >
        {/* Rotating light sweep on the border ring — focus only, reduced-motion safe */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[28px] opacity-0 transition-opacity duration-700 group-focus-within:opacity-100"
          style={{
            padding: '1.5px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <div
            className="animate-border-spin absolute left-1/2 top-1/2 aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.8) 40deg, transparent 80deg)',
            }}
          />
        </div>

        {/* Flash overlay on mode activation */}
        {modeColor && (
          <div
            key={modeColor}
            className="absolute inset-0 rounded-[28px] pointer-events-none z-10"
            style={{
              background: `radial-gradient(ellipse at center, hsl(${modeColor} / 0.09) 0%, transparent 70%)`,
              animation: 'flash-fade 500ms ease-out forwards',
            }}
          />
        )}

        {children}

        {/* Visual Corner — decorative mode indicator */}
        {visualCorner}

        {picker}

        {!picker && <>

        {/* Attachment Preview Row */}
        {attachmentRow}

        {/*
          Eine Zeile: Steuerung links, Eingabe in der Mitte, Aktionen rechts.
          `items-end` haelt die Knoepfe unten, wenn die Textarea mehrzeilig
          waechst — sonst wandern sie mit der Mitte nach unten weg.
          `flex-wrap` ist das Sicherheitsnetz fuer sehr schmale Fenster: dort
          bricht die Zeile um, statt die Chips abzuschneiden.
        */}
        {/* Eingabe: volle Breite, damit der Platzhalter nie umbricht. */}
        <div className="relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label={placeholder}
              disabled={disabled || isLoading}
              autoFocus={autoFocus}
              rows={1}
              className={cn(
                "w-full bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/70",
                "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                "resize-none overflow-y-auto min-h-[40px] max-h-[200px]",
              )}
              style={{ fontSize: '1.0625rem', lineHeight: '1.5' }}
            />
        </div>

        {/*
          Steuerzeile: eine Reihe, links die Konfiguration, rechts Aufnahme und
          Senden. `flex-wrap` faengt sehr schmale Fenster ab, statt die Chips
          stillschweigend abzuschneiden — genau das ist vorher passiert.
        */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 shrink items-center gap-1.5 md:gap-2">
            {leftActions}
          </div>
          <div data-testid="bar-actions-right" className="flex shrink-0 items-center gap-2">
            {rightActions}
          </div>
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



        </>}
      </div>

      {/* Disclaimer */}
      <div className="mt-3 text-center hidden lg:block">
        <p className="text-[11px] md:text-xs text-muted-foreground/70 px-4">
          {t('chat.disclaimer')}
        </p>
      </div>
    </div>
  );
};
