"use client";

import React, { useMemo, useState } from 'react';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGalleryAssets } from '@/hooks/useGalleryAssets';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Asset } from '@/lib/services/database';
import { useLanguage } from '@/components/LanguageProvider';

const MAX_PREVIEW = 3;

const GalleryThumb = ({
  asset,
  onOpen,
  sizeClass,
}: {
  asset: Asset;
  onOpen: (assetId: string, type: 'image' | 'video') => void;
  sizeClass: string;
}) => {
  const { t } = useLanguage();
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');

  if (!url) {
    return <div className={cn("rounded-lg bg-muted/20 animate-pulse", sizeClass)} />;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(asset.id, isVideo ? 'video' : 'image')}
      className={cn("relative overflow-hidden rounded-lg border border-border/40 bg-muted/10", sizeClass)}
      aria-label={t('gallery.openItem')}
    >
      {isVideo ? (
        <video src={url} muted loop playsInline className="h-full w-full object-cover"
          onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
          onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={asset.prompt || "Output item"} className="h-full w-full object-cover" />
      )}
    </button>
  );
};

interface GallerySidebarSectionProps {
  galleryOpen?: boolean;
  onGalleryToggle?: (open: boolean) => void;
}

const GallerySidebarSection: React.FC<GallerySidebarSectionProps> = ({
  galleryOpen = false,
  onGalleryToggle,
}) => {
  const { assets, isLoading, deleteAsset, clearAllAssets, toggleStarred } = useGalleryAssets();
  const { t } = useLanguage();

  const isOpen = galleryOpen;
  const setIsOpen = onGalleryToggle ?? (() => {});

  const imageAssets = useMemo(
    () => assets.filter((a) => !a.contentType?.startsWith('audio/')),
    [assets]
  );
  const recentAssets = useMemo(() => imageAssets.slice(0, MAX_PREVIEW), [imageAssets]);

  return (
    <div className="mt-2 relative">
      <div className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
        <span className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5" />
          {t('nav.gallery')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={cn(
            "h-6 w-6 rounded-full border border-border/40 bg-muted/20",
            isOpen ? "text-primary border-primary/40" : "hover:text-foreground"
          )}
          aria-label={t('gallery.toggle')}
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-90")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="px-2 pb-2 grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_PREVIEW }).map((_, i) => (
            <div key={`gallery-skel-${i}`} className="h-12 w-full rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : recentAssets.length > 0 ? (
        <div className="px-2 pb-2 grid grid-cols-3 gap-2">
          {recentAssets.map((asset) => (
            <GalleryThumb
              key={asset.id}
              asset={asset}
              onOpen={() => setIsOpen(true)}
              sizeClass="h-12"
            />
          ))}
        </div>
      ) : (
        <div className="px-2 pb-3 text-[10px] text-muted-foreground/70">
          {t('gallery.emptyShort')}
        </div>
      )}

    </div>
  );
};

export default GallerySidebarSection;
