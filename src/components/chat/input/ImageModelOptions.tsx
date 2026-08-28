'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';
import { ModelLogo } from './ModelLogo';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import {
  getVisualizeModelGroupsForProvider,
  shouldIncludeByopHidden,
  type ImageProvider,
} from '@/config/unified-image-models';

/**
 * Eine flache Liste, kein Select.
 *
 * Der Picker fuellt die Leiste bereits — steht dort noch ein Select, kostet die
 * Modellwahl drei Klicks statt zwei, und das Select-Overlay reisst die Leiste
 * auf, die gerade erst die Auswahl geworden ist. Was im Picker erscheint, sind
 * die Optionen selbst.
 */
interface ImageModelOptionsProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  providerMode?: ImageProvider;
  prunaAvailable?: boolean;
  disabled?: boolean;
}

export const ImageModelOptions: React.FC<ImageModelOptionsProps> = ({
  selectedModelId,
  onModelChange,
  providerMode = 'pollinations',
  prunaAvailable = false,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const hasPollenKey = useHasPollenKey();

  const groups = React.useMemo(() => {
    const includeByopHidden = shouldIncludeByopHidden(providerMode, { prunaAvailable, hasPollenKey });
    return getVisualizeModelGroupsForProvider(providerMode, { includeByopHidden })
      .map(group => ({ ...group, models: group.models.filter(m => unifiedModelConfigs[m.id]) }))
      .filter(group => group.models.length > 0);
  }, [providerMode, prunaAvailable, hasPollenKey]);

  if (groups.length === 0) return null;

  return (
    <div role="radiogroup" aria-label={t('modelSelector.title')} className="flex flex-col gap-3">
      {groups.map(group => (
        <div key={group.key} className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {group.models.map(model => {
              const isActive = model.id === selectedModelId;
              const name = unifiedModelConfigs[model.id]?.name || model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isActive ? 0 : -1}
                  disabled={disabled}
                  onClick={() => onModelChange(model.id)}
                  className={cn(
                    'flex items-center gap-2 bg-transparent px-1 py-2 font-mono text-xs transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                    'focus-visible:outline-primary disabled:opacity-40',
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ModelLogo modelId={model.id} />
                  <span>{name}</span>
                  {isActive && <span aria-hidden="true" className="text-primary">·</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
