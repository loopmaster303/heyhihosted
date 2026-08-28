'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { getDurationOptionsSeconds, getUnifiedModel } from '@/config/unified-image-models';
import type { UnifiedModelConfig } from '@/config/unified-model-configs';

/**
 * Format und Dauer als flache Knoepfe, nicht als Select.
 *
 * Derselbe Grund wie beim Modell: der Picker fuellt die Leiste bereits: steht
 * dort ein Select, kostet jede Aenderung drei Klicks statt zwei, und das
 * Overlay reisst die Leiste auf, die gerade die Auswahl geworden ist.
 *
 * Nur die zwei Werte, die vor dem Absenden die Bildidee bestimmen. Aufloesung,
 * Seed, Negativ-Prompt und Ausgabeformat gehoeren ans Ergebnis, wo man sie an
 * etwas Sichtbarem entscheidet.
 */
interface ImageParamOptionsProps {
  selectedModelId: string;
  currentModelConfig?: UnifiedModelConfig | null;
  formFields: Record<string, unknown>;
  onFieldChange: (name: string, value: unknown) => void;
  setFormFields: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  isPollenModel?: boolean;
  disabled?: boolean;
  /** Nach der Wahl schliesst der Aufrufer den Picker — ein Klick, fertig. */
  onAfterSelect?: () => void;
}

const optionClass = (isActive: boolean) =>
  cn(
    'bg-transparent px-1 py-2 font-mono text-xs transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-primary disabled:opacity-40',
    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

export const ImageParamOptions: React.FC<ImageParamOptionsProps> = ({
  selectedModelId,
  currentModelConfig,
  formFields,
  onFieldChange,
  setFormFields,
  isPollenModel = false,
  disabled = false,
  onAfterSelect,
}) => {
  const { t } = useLanguage();

  const presets = React.useMemo(
    () => getAspectRatioPresetsForModel(selectedModelId),
    [selectedModelId],
  );
  const durations = React.useMemo(
    () => getDurationOptionsSeconds(getUnifiedModel(selectedModelId)),
    [selectedModelId],
  );

  const isVideo = currentModelConfig?.outputType === 'video';
  const supportsRatio = isPollenModel || !!currentModelConfig?.inputs.find(i => i.name === 'aspect_ratio');

  const ratios = isVideo ? ['16:9', '9:16'] : Object.keys(presets);
  const activeRatio = typeof formFields.aspect_ratio === 'string'
    ? formFields.aspect_ratio
    : (isVideo ? '16:9' : '1:1');
  const activeDuration = formFields.duration;

  const pickRatio = (value: string) => {
    // Bei Pollen-Modellen haengen Breite und Hoehe am Verhaeltnis — sonst
    // stimmt der Chip, aber der Request nicht.
    const preset = presets[value];
    if (isPollenModel && preset) {
      setFormFields(prev => ({ ...prev, aspect_ratio: value, width: preset.width, height: preset.height }));
    } else {
      onFieldChange('aspect_ratio', value);
    }
    onAfterSelect?.();
  };

  if (!supportsRatio && durations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {supportsRatio && ratios.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('visualize.aspectRatio')}
          </span>
          <div role="radiogroup" aria-label={t('visualize.aspectRatio')} className="flex flex-wrap gap-x-5 gap-y-1">
            {ratios.map(ratio => {
              const isActive = ratio === activeRatio;
              return (
                <button
                  key={ratio}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isActive ? 0 : -1}
                  disabled={disabled}
                  onClick={() => pickRatio(ratio)}
                  className={optionClass(isActive)}
                >
                  {ratio}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {durations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('visualize.duration')}
          </span>
          <div role="radiogroup" aria-label={t('visualize.duration')} className="flex flex-wrap gap-x-5 gap-y-1">
            {durations.map(seconds => {
              const isActive = Number(activeDuration) === seconds;
              return (
                <button
                  key={seconds}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isActive ? 0 : -1}
                  disabled={disabled}
                  onClick={() => { onFieldChange('duration', seconds); onAfterSelect?.(); }}
                  className={optionClass(isActive)}
                >
                  {seconds}s
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
