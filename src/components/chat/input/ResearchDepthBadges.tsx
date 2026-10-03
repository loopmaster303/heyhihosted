import React from 'react';
import { Zap, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { useRovingRadioGroup } from '@/components/a11y/useRovingRadioGroup';

/**
 * Deep Research hatte bislang nur eine Farbe. Die Unterscheidung steckt seit
 * jeher in der Modellwahl — hier bekommt sie einen Namen.
 */
export const RESEARCH_DEPTH_MODELS = {
    fast: 'perplexity-fast',
    thorough: 'perplexity-reasoning',
} as const;

export type ResearchDepth = keyof typeof RESEARCH_DEPTH_MODELS;

export const resolveResearchDepth = (modelId: string): ResearchDepth | null => {
    if (modelId === RESEARCH_DEPTH_MODELS.fast) return 'fast';
    if (modelId === RESEARCH_DEPTH_MODELS.thorough) return 'thorough';
    return null;
};

export const researchDepthLabelKey = (depth: ResearchDepth | null) =>
    depth === 'fast' ? 'research.depth.fast'
        : depth === 'thorough' ? 'research.depth.thorough'
            : 'research.depth.custom';

interface ResearchDepthBadgesProps {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

const OPTIONS: Array<{ depth: ResearchDepth; icon: React.ComponentType<{ className?: string }> }> = [
    { depth: 'fast', icon: Zap },
    { depth: 'thorough', icon: Telescope },
];

export const ResearchDepthBadges: React.FC<ResearchDepthBadgesProps> = ({
    selectedModelId,
    onModelChange,
    disabled = false,
}) => {
    const { t } = useLanguage();
    const active = resolveResearchDepth(selectedModelId);
    // `active` darf null sein (eigenes Modell, keine der beiden Tiefen) — dann
    // faellt der Hook auf die erste aktivierbare Option zurueck.
    const { containerProps, getTabIndex } = useRovingRadioGroup<ResearchDepth | null>(
        OPTIONS.map(({ depth }) => ({ value: depth, disabled })),
        active,
    );

    return (
        <div
            role="radiogroup"
            aria-label={t('research.depth')}
            className="flex flex-wrap items-center gap-2"
            {...containerProps}
        >
            {OPTIONS.map(({ depth, icon: Icon }) => {
                const isActive = active === depth;
                return (
                    <button
                        key={depth}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        tabIndex={getTabIndex(depth)}
                        disabled={disabled}
                        onClick={() => onModelChange(RESEARCH_DEPTH_MODELS[depth])}
                        className={cn(
                            "flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-all disabled:opacity-40",
                            isActive
                                ? "border-transparent"
                                : "border-border/30 text-foreground/80 hover:text-foreground hover:shadow-sm",
                        )}
                        style={isActive ? {
                            borderColor: 'hsl(var(--mode-research) / 0.45)',
                            background: 'hsl(var(--mode-research) / 0.12)',
                            color: 'hsl(var(--mode-research))',
                        } : undefined}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {t(researchDepthLabelKey(depth))}
                    </button>
                );
            })}
        </div>
    );
};
