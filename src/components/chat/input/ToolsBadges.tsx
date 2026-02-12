import React from 'react';
import { Palette, Code2, Globe, MessageSquare, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

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
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isImageMode
                        ? "bg-mode-visualize/10 text-mode-visualize font-bold border border-mode-visualize/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Palette className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{t('tools.visualize')}</span>
            </button>

            {/* Compose Mode (Music) */}
            <button
                type="button"
                onClick={() => onSelectMode('compose')}
                aria-pressed={isComposeMode}
                aria-label={t('tools.compose')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isComposeMode
                        ? "bg-mode-compose/10 text-mode-compose font-bold border border-mode-compose/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Music2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{t('tools.compose')}</span>
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

            {/* Coding Assist Mode */}
            {canToggleCodeMode && (
                <button
                    type="button"
                    onClick={() => onSelectMode('code')}
                    aria-pressed={isCodeMode}
                    aria-label={t('tools.code')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        isCodeMode
                            ? "bg-mode-code/10 text-mode-code font-bold border border-mode-code/60"
                            : "bg-transparent border-border/30 text-muted-foreground"
                    )}
                >
                    <Code2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{t('tools.code')}</span>
                </button>
            )}
        </div>
    );
};
