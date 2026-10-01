'use client';

import React, { useState } from 'react';
import { Sheet } from './Sheet';
import { useShell } from './ShellContext';
import { GalleryPanel } from '@/components/gallery/GalleryPanel';
import { useGalleryAssets } from '@/hooks/useGalleryAssets';
import type { AssetOrigin } from '@/lib/assets/asset-origin';
import { useLanguage } from '@/components/LanguageProvider';

interface GallerySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORIGINS_BY_SPACE: Record<'chat' | 'create', readonly AssetOrigin[]> = {
  chat: ['chat', 'compose'],
  create: ['create'],
};

/**
 * Ein Pool, ein Panel. Beim Oeffnen zeigt der Herkunftsfilter die Herkunft des
 * Raums, in dem du gerade bist — fluechtig, kein localStorage (E5.2).
 */
export function GallerySheet({ open, onOpenChange }: GallerySheetProps) {
  const { t } = useLanguage();
  const { space } = useShell();
  const [origins, setOrigins] = useState<readonly AssetOrigin[] | undefined>(ORIGINS_BY_SPACE[space]);

  // Bei jedem Oeffnen zurueck auf die Herkunft des aktuellen Raums.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOrigins(ORIGINS_BY_SPACE[space]);
  }

  const gallery = useGalleryAssets(origins);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title={t('shell.gallery')} bodyClassName="px-0 pb-0">
      <GalleryPanel
        assets={gallery.assets}
        totalAssetCount={gallery.totalInScope}
        origins={origins}
        onOriginsChange={setOrigins}
        onDelete={gallery.deleteAsset}
        onClearAll={gallery.clearAllAssets}
        clearProgress={gallery.clearProgress}
        onToggleStar={gallery.toggleStarred}
      />
    </Sheet>
  );
}
