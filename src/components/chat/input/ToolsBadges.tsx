import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

type ToolMode = 'standard' | 'visualize' | 'compose' | 'research' | 'code';

const MODE_ORDER: ToolMode[] = ['standard', 'visualize', 'compose', 'research'];

interface ToolsBadgesProps {
    isImageMode: boolean;
    isComposeMode: boolean;
    isCodeMode: boolean;
    webBrowsingEnabled: boolean;
    onSelectMode: (mode: ToolMode) => void;
    canToggleCodeMode?: boolean;
}

const MODE_CONFIG = {
    visualize: { cssVar: 'var(--mode-visualize)', label: 'tools.visualize' },
    compose: { cssVar: 'var(--mode-compose)', label: 'tools.compose' },
    research: { cssVar: 'var(--mode-research)', label: 'tools.deepResearch' },
} as const;

export const ToolsBadges: React.FC<ToolsBadgesProps> = ({
    isImageMode,
    isComposeMode,
    isCodeMode,
    webBrowsingEnabled,
    onSelectMode,
    canToggleCodeMode = true,
}) => {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const isStandardActive = !isImageMode && !isComposeMode && !isCodeMode && !webBrowsingEnabled;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const current = Array.from(buttons).findIndex((b) => b === document.activeElement);
        const next = e.key === 'ArrowRight'
            ? (current + 1) % buttons.length
            : (current - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
    }, []);

    return (
        <div
            ref={containerRef}
            role="radiogroup"
            aria-label={t('menu.section.mode')}
            onKeyDown={handleKeyDown}
            className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right"
        >
            {/* Standard Chat */}
            <button
                type="button"
                role="radio"
                onClick={() => onSelectMode('standard')}
                aria-checked={isStandardActive}
                tabIndex={isStandardActive ? 0 : -1}
                className={cn(
                    "relative flex items-center justify-center px-4 py-1.5 rounded-full border-0 transition-all duration-300 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isStandardActive
                        ? "text-foreground"
                        : "text-muted-foreground/50 hover:text-muted-foreground/80"
                )}
            >
                <span className="text-[11px] font-semibold tracking-wide uppercase">{t('tools.standard')}</span>
            </button>

            <ModeBadge
                mode="visualize"
                isActive={isImageMode}
                onSelect={() => onSelectMode('visualize')}
                label={t(MODE_CONFIG.visualize.label)}
            />
            <ModeBadge
                mode="compose"
                isActive={isComposeMode}
                onSelect={() => onSelectMode('compose')}
                label={t(MODE_CONFIG.compose.label)}
            />
            <ModeBadge
                mode="research"
                isActive={webBrowsingEnabled}
                onSelect={() => onSelectMode('research')}
                label={t(MODE_CONFIG.research.label)}
            />
        </div>
    );
};

function ModeBadge({
    mode,
    isActive,
    onSelect,
    label,
}: {
    mode: keyof typeof MODE_CONFIG;
    isActive: boolean;
    onSelect: () => void;
    label: string;
}) {
    const cssVar = MODE_CONFIG[mode].cssVar;

    return (
        <button
            type="button"
            role="radio"
            onClick={onSelect}
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
                "relative flex items-center justify-center px-4 py-1.5 rounded-full border-0 transition-all duration-300 ease-out shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                    ? "hover:-translate-y-0.5 scale-105"
                    : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:-translate-y-0.5"
            )}
            style={isActive ? {
                color: `hsl(${cssVar})`,
                textShadow: `0 0 14px hsl(${cssVar} / 0.7), 0 0 30px hsl(${cssVar} / 0.3)`,
                filter: `drop-shadow(0 0 8px hsl(${cssVar} / 0.4))`,
            } : undefined}
        >
            {/* Glow backdrop */}
            {isActive && (
                <span
                    className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                    style={{
                        background: `radial-gradient(ellipse at center, hsl(${cssVar} / 0.15) 0%, transparent 70%)`,
                    }}
                />
            )}
            <span className={cn(
                "text-[11px] tracking-wide uppercase relative z-10 transition-all duration-300",
                isActive ? "font-black tracking-widest" : "font-semibold"
            )}>
                {label}
            </span>
        </button>
    );
}
