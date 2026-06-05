"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Copy, Download, Heart,
  Image as ImageIcon, Music, Trash2, X, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Asset } from '@/lib/services/database';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';

type GalleryView = 'grid' | 'detail';
type DensityLevel = 'compact' | 'default' | 'large';

const DENSITY_COLS: Record<DensityLevel, string> = {
  compact: 'grid-cols-3 min-[520px]:grid-cols-4',
  default: 'grid-cols-2 min-[520px]:grid-cols-3',
  large:   'grid-cols-1 min-[520px]:grid-cols-2',
};

// ─── Track Item ────────────────────────────────────────────────────────────────

const TrackItem = ({
  asset,
  onCopyPrompt,
  onDelete,
  onToggleStar,
}: {
  asset: Asset;
  onCopyPrompt: (prompt?: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const { url } = useAssetUrl(asset.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const title = asset.prompt
    ? asset.prompt.split(' ').slice(0, 5).join(' ') + (asset.prompt.split(' ').length > 5 ? '…' : '')
    : 'untitled track';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  return (
    <div className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-muted/20 group">
      {url && <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />}
      <button
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <span className="text-[10px] font-bold">▐▐</span>
          : <span className="text-[10px] font-bold pl-0.5">▶</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-foreground/80 truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground/60 font-mono">{asset.modelId || 'elevenmusic'}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => onCopyPrompt(asset.prompt)}
          className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
          title={t('action.copyPrompt')} aria-label={t('action.copyPrompt')}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onToggleStar(asset.id)}
          className={cn("h-6 w-6 rounded", asset.starred ? "text-red-400" : "text-muted-foreground hover:text-foreground")}
          title="Like" aria-label="Like" aria-pressed={!!asset.starred}>
          <Heart className={cn("h-3 w-3", asset.starred && "fill-current")} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(asset.id)}
          className="h-6 w-6 rounded text-muted-foreground hover:text-red-400"
          title={t('action.delete')} aria-label={t('action.delete')}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// ─── Panel Grid Item ───────────────────────────────────────────────────────────

const GalleryPanelItem = ({
  asset,
  onOpen,
  onDownload,
  onCopyPrompt,
  onDelete,
  onToggleStar,
}: {
  asset: Asset;
  onOpen: () => void;
  onDownload: (url: string, filename: string) => void;
  onCopyPrompt: (prompt?: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');

  const handleDownload = () => {
    if (!url) return;
    const baseName = asset.prompt || 'output-item';
    const ext = isVideo ? 'mp4' : 'png';
    onDownload(url, `${baseName.slice(0, 24)}.${ext}`);
  };

  return (
    <div className="break-inside-avoid rounded-xl bg-glass-background/30 backdrop-blur-md overflow-hidden group">
      <div className="relative w-full bg-muted/10">
        {!url && <div className="absolute inset-0 animate-pulse bg-muted/20" />}
        {asset.starred && (
          <div className="absolute top-1.5 left-1.5 z-10 text-yellow-400 text-[10px] leading-none">★</div>
        )}
        {url && isVideo ? (
          <video src={url} muted loop playsInline
            className="w-full h-auto object-contain cursor-pointer"
            onClick={onOpen}
            onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
          />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={asset.prompt || "Output item"} loading="lazy" decoding="async"
            className="w-full h-auto object-contain cursor-pointer" onClick={onOpen}
          />
        ) : null}
        {url && (
          <div className="absolute inset-x-0 bottom-0 px-2 py-2 flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-black/15 to-transparent">
            <Button variant="ghost" size="icon" onClick={() => onToggleStar(asset.id)}
              className={cn("h-7 w-7 rounded-full bg-black/50 hover:bg-black/70", asset.starred ? "text-red-400" : "text-white")}
              title="Like" aria-label="Like">
              <Heart className={cn("h-3.5 w-3.5", asset.starred && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onCopyPrompt(asset.prompt)}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title={t('action.copyPrompt')} aria-label={t('action.copyPrompt')}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title={t('action.download')} aria-label={t('action.download')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(asset.id)}
              className="h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
              title={t('action.delete')} aria-label={t('action.delete')}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Detail View ───────────────────────────────────────────────────────────────

const GalleryDetailContent = ({
  asset,
  onDownload,
  onCopyPrompt,
  onDelete,
  onToggleStar,
  onPrev,
  onNext,
  onClose,
  hasPrev,
  hasNext,
}: {
  asset: Asset;
  onDownload: (url: string, filename: string) => void;
  onCopyPrompt: (prompt?: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) => {
  const { t } = useLanguage();
  const { url, isLoading } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');

  const handleDownload = () => {
    if (!url) return;
    const baseName = asset.prompt || 'output-item';
    const ext = isVideo ? 'mp4' : 'png';
    onDownload(url, `${baseName.slice(0, 24)}.${ext}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/20 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose}
          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3" />
          {t('gallery.tabImages')}
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onToggleStar(asset.id)}
            className={cn("h-7 w-7 rounded-full", asset.starred ? "text-red-400" : "text-muted-foreground hover:text-foreground")}
            title="Like" aria-label="Like" aria-pressed={!!asset.starred}>
            <Heart className={cn("h-3.5 w-3.5", asset.starred && "fill-current")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onCopyPrompt(asset.prompt)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title={t('action.copyPrompt')} aria-label={t('action.copyPrompt')}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title={t('action.download')} aria-label={t('action.download')}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(asset.id)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-400"
            title={t('action.delete')} aria-label={t('action.delete')}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 min-h-0">
        {/* Cohesive unit: image + prompt directly attached, with slight glassmorphism, responsive */}
        <div className="mx-auto w-full max-w-[520px] rounded-2xl overflow-hidden border border-white/10 bg-black/10 backdrop-blur-xl shadow-glass-heavy">
          {/* Image / Video area */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              disabled={!hasPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {isLoading || !url ? (
              <div className="w-full aspect-[4/3] rounded-t-2xl bg-muted/20 animate-pulse" />
            ) : isVideo ? (
              <video
                src={url}
                className="w-full h-auto max-h-[55vh] object-contain rounded-t-2xl"
                controls
                autoPlay
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={asset.prompt || "Output item"}
                loading="lazy"
                decoding="async"
                className="w-full h-auto max-h-[55vh] object-contain rounded-t-2xl"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!hasNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Prompt bar directly under the image, slight glass */}
          {asset.prompt && (
            <div className="px-3 py-2.5 bg-white/5 backdrop-blur-md border-t border-white/10 text-[11px] text-muted-foreground/90 font-mono">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">prompt</span>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                  onClick={() => onCopyPrompt(asset.prompt)}
                  title={t('action.copyPrompt')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="leading-snug break-words">{asset.prompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Gallery Panel ─────────────────────────────────────────────────────────────

export interface GalleryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  totalAssetCount: number;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onToggleStar: (id: string) => void;
  /** When true, renders as a fixed popover-style panel positioned to the right of the sidebar (using --sidebar-width var). */
  embedded?: boolean;
}

export const GalleryPanel: React.FC<GalleryPanelProps> = ({
  isOpen,
  onClose,
  assets,
  totalAssetCount,
  onDelete,
  onClearAll,
  onToggleStar,
  embedded = false,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [view, setView] = useState<GalleryView>('grid');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'images' | 'tracks'>('images');
  const [density, setDensity] = useLocalStorageState<DensityLevel>('heyhi_gallery_density', 'default');

  const imageAssets = useMemo(
    () => assets.filter((a) => !a.contentType?.startsWith('audio/')),
    [assets]
  );
  const trackAssets = useMemo(
    () => assets.filter((a) => a.contentType?.startsWith('audio/')),
    [assets]
  );

  // Reset to grid when panel closes
  useEffect(() => {
    if (!isOpen) setView('grid');
  }, [isOpen]);

  // Keyboard navigation in detail view
  useEffect(() => {
    if (!isOpen || view !== 'detail') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setSelectedIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setSelectedIndex(i => Math.min(imageAssets.length - 1, i + 1));
      if (e.key === 'Escape')     setView('grid');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, view, imageAssets.length]);

  const handleDownload = useCallback((url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  }, []);

  const handleCopyPrompt = useCallback(async (prompt?: string) => {
    if (!prompt) {
      toast({ title: t('gallery.copyPrompt.noPromptTitle'), description: t('gallery.copyPrompt.noPromptDesc') });
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      toast({ title: t('gallery.copyPrompt.successTitle'), description: t('gallery.copyPrompt.successDesc') });
    } catch {
      toast({ title: t('gallery.copyPrompt.errorTitle'), description: t('gallery.copyPrompt.errorDesc'), variant: 'destructive' });
    }
  }, [toast, t]);

  const openDetail = useCallback((index: number) => {
    setSelectedIndex(index);
    setView('detail');
  }, []);

  const handleDeleteAndReturn = useCallback((id: string) => {
    onDelete(id);
    setView('grid');
  }, [onDelete]);

  const cycleDensity = () => {
    const cycle: DensityLevel[] = ['compact', 'default', 'large'];
    setDensity(prev => cycle[(cycle.indexOf(prev) + 1) % cycle.length]);
  };

  if (!isOpen) return null;

  const selectedAsset = view === 'detail' ? imageAssets[selectedIndex] : null;

  const containerClass = embedded
    ? "fixed z-[80] top-16 bottom-4 border border-border bg-popover/90 backdrop-blur-xl shadow-glass-heavy overflow-hidden flex flex-col left-[var(--sidebar-width)] w-[520px] max-w-[calc(100vw-var(--sidebar-width)-2rem)] rounded-2xl"
    : "fixed left-4 sm:left-[calc(var(--sidebar-width,20rem)+8px)] top-16 w-[calc(100vw-var(--sidebar-width,20rem)-2rem)] sm:w-[520px] z-[100] max-h-[80vh] rounded-2xl";

  return (
    <div className={containerClass}>
      <div className="relative flex flex-col h-full overflow-hidden">

        {view === 'grid' ? (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between gap-2 px-4 pt-4 shrink-0">
              <Button variant="ghost" size="sm"
                onClick={() => { if (totalAssetCount === 0) return; if (confirm(t('gallery.clearConfirm'))) onClearAll(); }}
                className="h-8 px-4 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-transparent hover:shadow-[0_0_18px_rgba(180,150,255,0.35)]">
                {t('gallery.clearButton')}
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={cycleDensity}
                  className="h-7 w-7 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  title="Dichte ändern" aria-label="Dichte ändern">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}
                  className="h-7 w-7 rounded-full hover:bg-muted/30"
                  aria-label={t('gallery.closePanel')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label={t('nav.gallery')} className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
              <button role="tab" id="gallery-tab-images"
                aria-selected={activeTab === 'images'} aria-controls="gallery-panel-images"
                tabIndex={activeTab === 'images' ? 0 : -1}
                onClick={() => setActiveTab('images')}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                  activeTab === 'images' ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <ImageIcon className="h-3 w-3" />
                {t('gallery.tabImages')}
                {imageAssets.length > 0 && <span className="text-[10px] opacity-60">{imageAssets.length}</span>}
              </button>
              <button role="tab" id="gallery-tab-tracks"
                aria-selected={activeTab === 'tracks'} aria-controls="gallery-panel-tracks"
                tabIndex={activeTab === 'tracks' ? 0 : -1}
                onClick={() => setActiveTab('tracks')}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                  activeTab === 'tracks' ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Music className="h-3 w-3" />
                {t('gallery.tabTracks')}
                {trackAssets.length > 0 && <span className="text-[10px] opacity-60">{trackAssets.length}</span>}
              </button>
            </div>

            {/* Grid */}
            <div role="tabpanel"
              id={activeTab === 'images' ? 'gallery-panel-images' : 'gallery-panel-tracks'}
              aria-labelledby={activeTab === 'images' ? 'gallery-tab-images' : 'gallery-tab-tracks'}
              className="overflow-y-auto px-4 pb-3 no-scrollbar flex-1">
              {activeTab === 'images' ? (
                imageAssets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground/70">{t('gallery.emptyPanel')}</div>
                ) : (
                  <div className={cn("grid gap-3", DENSITY_COLS[density])}>
                    {imageAssets.map((asset, index) => (
                      <GalleryPanelItem key={asset.id} asset={asset}
                        onOpen={() => openDetail(index)}
                        onDownload={handleDownload}
                        onCopyPrompt={handleCopyPrompt}
                        onDelete={onDelete}
                        onToggleStar={onToggleStar}
                      />
                    ))}
                  </div>
                )
              ) : (
                trackAssets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground/70">{t('gallery.emptyTracksHint')}</div>
                ) : (
                  <div className="space-y-1">
                    {trackAssets.map((asset) => (
                      <TrackItem key={asset.id} asset={asset}
                        onCopyPrompt={handleCopyPrompt}
                        onDelete={onDelete}
                        onToggleStar={onToggleStar}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          // Detail View — same container, no second portal
          selectedAsset && (
            <GalleryDetailContent
              asset={selectedAsset}
              onDownload={handleDownload}
              onCopyPrompt={handleCopyPrompt}
              onDelete={handleDeleteAndReturn}
              onToggleStar={onToggleStar}
              onPrev={() => setSelectedIndex(i => Math.max(0, i - 1))}
              onNext={() => setSelectedIndex(i => Math.min(imageAssets.length - 1, i + 1))}
              onClose={() => setView('grid')}
              hasPrev={selectedIndex > 0}
              hasNext={selectedIndex < imageAssets.length - 1}
            />
          )
        )}
      </div>
    </div>
  );
};
