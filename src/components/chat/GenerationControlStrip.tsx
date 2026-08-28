'use client';

import React from 'react';
import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { getDurationOptionsSeconds, getUnifiedModel } from '@/config/unified-image-models';
import type { GenerationRecord } from '@/types';

interface GenerationControlStripProps {
    generation: GenerationRecord;
    onRerun: (next: GenerationRecord) => void;
    disabled?: boolean;
}

const control = "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-all disabled:opacity-40 tabular-nums";

/**
 * Die Regler, die erst am fertigen Ergebnis eine Entscheidung sind. Hier ist
 * „16:9" keine Abstraktion mehr — das Bild liegt daneben. Jede Aenderung ist
 * ein Neulauf mit demselben Prompt.
 */
export const GenerationControlStrip: React.FC<GenerationControlStripProps> = ({
    generation,
    onRerun,
    disabled = false,
}) => {
    const { t } = useLanguage();
    const model = getUnifiedModel(generation.modelId);
    const isVideo = model?.kind === 'video';

    const ratios = Object.keys(getAspectRatioPresetsForModel(generation.modelId));
    const durations = isVideo ? getDurationOptionsSeconds(model) : [];
    const currentRatio = generation.aspectRatio ?? ratios[0];

    const cycle = <T,>(list: T[], current: T | undefined): T | undefined => {
        if (list.length === 0) return undefined;
        const index = current === undefined ? -1 : list.indexOf(current);
        return list[(index + 1) % list.length];
    };

    return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70 tracking-tight">
                {model?.name || generation.modelId}
            </span>

            {ratios.length > 1 && (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRerun({ ...generation, aspectRatio: cycle(ratios, currentRatio) })}
                    className={cn(control, "border-border/40 text-foreground/80 hover:border-border hover:text-foreground")}
                    aria-label={`${t('generation.ratio')}: ${currentRatio}`}
                >
                    {currentRatio}
                </button>
            )}

            {durations.length > 1 && (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRerun({ ...generation, duration: cycle(durations, generation.duration) })}
                    className={cn(control, "border-border/40 text-foreground/80 hover:border-border hover:text-foreground")}
                    aria-label={`${t('generation.duration')}: ${generation.duration ?? durations[0]}s`}
                >
                    {generation.duration ?? durations[0]}s
                </button>
            )}

            {isVideo && model?.supportsAudio && (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRerun({ ...generation, audio: !generation.audio })}
                    className={cn(control, "border-border/40 text-foreground/80 hover:border-border hover:text-foreground")}
                    aria-label={t('generation.audio')}
                >
                    {generation.audio ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </button>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => onRerun({ ...generation })}
                className={cn(
                    control,
                    "ml-auto border-primary/35 bg-primary/10 text-primary hover:bg-primary/15",
                )}
            >
                <RefreshCw className="h-3 w-3" />
                {t('generation.rerun')}
            </button>
        </div>
    );
};
