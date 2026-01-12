"use client";

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Copy, Download, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGalleryAssets } from '@/hooks/useGalleryAssets';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Asset } from '@/lib/services/database';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';

const MAX_PREVIEW = 3;
const MAX_PANEL = 12;

interface LightboxData {
  assetId: string;
  type: 'image' | 'video';
}

const GalleryThumb = ({
  asset,
  onOpen,
  sizeClass,
}: {
  asset: Asset;
  onOpen: (assetId: string, type: 'image' | 'video') => void;
  sizeClass: string;
}) => {
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');

  if (!url) {
    return <div className={cn("rounded-lg bg-muted/20 animate-pulse", sizeClass)} />;
  }

  const handleOpen = () => {
    onOpen(asset.id, isVideo ? 'video' : 'image');
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={cn("relative overflow-hidden rounded-lg border border-border/40 bg-muted/10", sizeClass)}
      aria-label="Open gallery item"
    >
      {isVideo ? (
        <video
          src={url}
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
          onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={asset.prompt || "Gallery item"} className="h-full w-full object-cover" />
      )}
    </button>
  );
};

const GalleryPanelItem = ({
  asset,
  onOpen,
  onDownload,
  onCopyPrompt,
  onDelete,
}: {
  asset: Asset;
  onOpen: (assetId: string, type: 'image' | 'video') => void;
  onDownload: (url: string, filename: string) => void;
  onCopyPrompt: (prompt?: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');

  const handleOpen = () => {
    if (!url) return;
    onOpen(asset.id, isVideo ? 'video' : 'image');
  };

  const handleDownload = () => {
    if (!url) return;
    const baseName = asset.prompt || 'gallery-item';
    const ext = isVideo ? 'mp4' : 'png';
    onDownload(url, `${baseName.slice(0, 24)}.${ext}`);
  };

  return (
    <div className="break-inside-avoid rounded-xl bg-glass-background/30 backdrop-blur-md overflow-hidden group">
      <div className="relative w-full bg-muted/10">
        {!url && <div className="absolute inset-0 animate-pulse bg-muted/20" />}
        {url && isVideo ? (
          <video
            src={url}
            muted
            loop
            playsInline
            className="w-full h-auto object-contain cursor-pointer"
            onClick={handleOpen}
            onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
          />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={asset.prompt || "Gallery item"}
            className="w-full h-auto object-contain cursor-pointer"
            onClick={handleOpen}
          />
        ) : null}
        {url && (
          <div className="absolute inset-x-0 bottom-0 px-2 py-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-black/15 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopyPrompt(asset.prompt)}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Prompt kopieren"
              aria-label="Prompt kopieren"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Download"
              aria-label="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(asset.id)}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Löschen"
              aria-label="Löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const GallerySidebarSection: React.FC = () => {
  const { assets, isLoading, deleteAsset, clearAllAssets } = useGalleryAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<LightboxData | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const recentAssets = useMemo(() => assets.slice(0, MAX_PREVIEW), [assets]);
  const panelAssets = useMemo(() => assets.slice(0, MAX_PANEL), [assets]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleCopyPrompt = async (prompt?: string) => {
    if (!prompt) {
      toast({ title: "Kein Prompt", description: "Für dieses Asset ist kein Prompt gespeichert." });
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      toast({ title: "Prompt kopiert", description: "Der Prompt ist in der Zwischenablage." });
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", description: "Bitte erneut versuchen.", variant: "destructive" });
    }
  };

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
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }}
          className={cn(
            "h-6 w-6 rounded-full border border-border/40 bg-muted/20",
            isOpen ? "text-primary border-primary/40" : "hover:text-foreground"
          )}
          aria-label="Toggle gallery"
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-90")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="px-2 pb-2 grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_PREVIEW }).map((_, index) => (
            <div key={`gallery-skel-${index}`} className="h-12 w-full rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : recentAssets.length > 0 ? (
        <div className="px-2 pb-2 grid grid-cols-3 gap-2">
          {recentAssets.map((asset) => (
            <GalleryThumb
              key={asset.id}
              asset={asset}
              onOpen={(assetId, type) => setLightboxData({ assetId, type })}
              sizeClass="h-12"
            />
          ))}
        </div>
      ) : (
        <div className="px-2 pb-3 text-[10px] text-muted-foreground/70">
          Noch keine Assets.
        </div>
      )}

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed left-4 sm:left-[calc(20rem+8px)] top-16 w-[calc(100vw-2rem)] sm:w-[520px] z-[100] max-h-[80vh]"
        >
          <div className="relative bg-popover/80 text-popover-foreground shadow-glass-heavy backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (assets.length === 0) return;
                  if (confirm('Galerie wirklich leeren?')) clearAllAssets();
                }}
                className="h-8 px-4 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-transparent hover:shadow-[0_0_18px_rgba(180,150,255,0.35)]"
              >
                Löschen
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full hover:bg-muted/30"
                aria-label="Panel schließen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-4 pt-3 no-scrollbar">
              {panelAssets.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/70">
                  Noch keine Assets in deiner Galerie.
                </div>
              ) : (
                <div className="grid grid-cols-2 min-[520px]:grid-cols-3 gap-3">
                  {panelAssets.map((asset) => (
                    <GalleryPanelItem
                      key={asset.id}
                      asset={asset}
                      onOpen={(assetId, type) => setLightboxData({ assetId, type })}
                      onDownload={handleDownload}
                      onCopyPrompt={handleCopyPrompt}
                      onDelete={deleteAsset}
                    />
                  ))}
                </div>
              )}
            </div>

            {assets.length > 0 && (
              <div className="px-4 pb-4" />
            )}
          </div>
        </div>,
        document.body
      )}

      {lightboxData && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <GalleryLightboxContent assetId={lightboxData.assetId} type={lightboxData.type} />
            <button
              onClick={() => setLightboxData(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const GalleryLightboxContent = ({ assetId, type }: { assetId: string; type: 'image' | 'video' }) => {
  const { url, isLoading } = useAssetUrl(assetId);

  if (isLoading || !url) {
    return (
      <div className="w-[60vw] h-[60vh] flex items-center justify-center rounded-lg border border-white/10 bg-black/40">
        <span className="text-xs text-muted-foreground/70">Loading…</span>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-glass-heavy border border-white/10"
        controls
        autoPlay
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Fullscreen view"
      className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-glass-heavy border border-white/10"
    />
  );
};

export default GallerySidebarSection;
