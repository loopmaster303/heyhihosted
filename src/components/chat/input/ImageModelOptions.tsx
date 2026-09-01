'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { ModelLogo } from './ModelLogo';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { getChatImageModelGroups } from '@/config/unified-image-models';

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
  disabled?: boolean;
}

export const ImageModelOptions: React.FC<ImageModelOptionsProps> = ({
  selectedModelId,
  onModelChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const router = useRouter();

  // Phase 7: der Chat fuehrt nur die schluesselfreie Bildauswahl. Der
  // Provider-Schalter scopet sie nicht mehr — die Regel ist
  // providerunabhaengig formuliert, damit ein Pruna-Schluessel im Chat
  // keine BYOP-Modelle aufblaettern kann.
  const groups = React.useMemo(
    () =>
      getChatImageModelGroups()
        .map(group => ({ ...group, models: group.models.filter(m => unifiedModelConfigs[m.id]) }))
        .filter(group => group.models.length > 0),
    [],
  );

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t('modelSelector.title')} className="flex flex-col gap-3">
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
                    aria-pressed={isActive}
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

      {/* Create-Zeile: L-F.1 verlangt den Weg dort, wo die Verkuerzung
          spuerbar wird — im Panel selbst, nicht nur in der Sidebar. */}
      <button
        type="button"
        onClick={() => router.push('/create')}
        className={cn(
          'self-start bg-transparent px-1 py-2 font-mono text-[9.5px] font-semibold',
          'uppercase tracking-[0.14em] text-muted-foreground transition-colors',
          'hover:text-foreground focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-primary',
        )}
      >
        {t('modelSelector.allModelsInCreate')}
      </button>
    </div>
  );
};
