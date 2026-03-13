import React from 'react';
import { Palette, Globe, MessageSquare, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { ModeButtonOverlay } from '@/components/ui/ModeButtonOverlay';

type ToolMode = 'standard' | 'visualize' | 'compose' | 'research' | 'code';

interface ToolsBadgesProps {
    isImageMode: boolean;
    isComposeMode: boolean;
    isCodeMode: boolean;
    webBrowsingEnabled: boolean;
    onSelectMode: (mode: ToolMode) => void;
    canToggleCodeMode?: boolean;
}

export const ToolsBadges: React.FC<ToolsBadgesProps> = ({
    isImageMode,
    isComposeMode,
    isCodeMode,
    webBrowsingEnabled,
    onSelectMode,
    canToggleCodeMode = true,
}) => {
    const { t } = useLanguage();
    const isStandardActive = !isImageMode && !isComposeMode && !isCodeMode && !webBrowsingEnabled;

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            {/* Standard Chat */}
            <button
                type="button"
                onClick={() => onSelectMode('standard')}
                aria-pressed={isStandardActive}
                aria-label={t('tools.standard')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isStandardActive
                        ? "bg-transparent border-border/60 text-foreground shadow-sm"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{t('tools.standard')}</span>
            </button>

            {/* Visualize Mode */}
            <button
                type="button"
                onClick={() => onSelectMode('visualize')}
                aria-pressed={isImageMode}
                aria-label={t('tools.visualize')}
                className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isImageMode
                        ? "bg-mode-visualize/10 text-mode-visualize font-bold border border-mode-visualize/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <ModeButtonOverlay mode="visualize" isActive={isImageMode} />
                <Palette className="w-3.5 h-3.5 relative z-10" />
                <span className="text-xs font-bold relative z-10">{t('tools.visualize')}</span>
            </button>

            {/* Compose Mode (Music) */}
            <button
                type="button"
                onClick={() => onSelectMode('compose')}
                aria-pressed={isComposeMode}
                aria-label={t('tools.compose')}
                className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isComposeMode
                        ? "bg-mode-compose/10 text-mode-compose font-bold border border-mode-compose/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <ModeButtonOverlay mode="compose" isActive={isComposeMode} />
                <Music2 className="w-3.5 h-3.5 relative z-10" />
                <span className="text-xs font-bold relative z-10">{t('tools.compose')}</span>
            </button>

            {/* Deep Research Mode */}
            <button
                type="button"
                onClick={() => onSelectMode('research')}
                aria-pressed={webBrowsingEnabled}
                aria-label={t('tools.deepResearch')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    webBrowsingEnabled
                        ? "bg-mode-research/10 text-mode-research font-bold border border-mode-research/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{t('tools.deepResearch')}</span>
            </button>
        </div>
    );
};
