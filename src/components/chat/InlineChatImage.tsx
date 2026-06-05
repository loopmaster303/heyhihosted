'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import { useLanguage } from '@/components/LanguageProvider';

export interface InlineChatImageProps {
  url: string;
  altText?: string;
  assetId?: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

const fitWithin = (ratio: number, maxWidth: number, maxHeight: number) => {
  const safeRatio = ratio > 0 ? ratio : 1;
  const maxRatio = maxWidth / maxHeight;
  if (safeRatio >= maxRatio) {
    return { width: maxWidth, height: Math.round(maxWidth / safeRatio) };
  }
  return { width: Math.round(maxHeight * safeRatio), height: maxHeight };
};

export const InlineChatImage: React.FC<InlineChatImageProps> = ({
  url,
  altText,
  assetId,
  className,
  maxWidth = 320,
  maxHeight = 240,
}) => {
  const { t } = useLanguage();
  const { url: resolvedUrl, isLoading: assetLoading, error: assetError, refresh } = useAssetUrl(assetId, url);
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const maxRetries = 8;
  const canReload = !!resolvedUrl && resolvedUrl.startsWith('http') && !resolvedUrl.includes('blob:');
  const isLoading = assetLoading || (!isLoaded && !assetError);
  const ratio = aspectRatio || 1;
  const size = fitWithin(ratio, maxWidth, maxHeight);

  const displayUrl: string | null = canReload && resolvedUrl && reloadToken > 0
    ? `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}r=${reloadToken}`
    : resolvedUrl;

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!canReload || !resolvedUrl) return;
    if (retryCount >= maxRetries) return;
    const next = retryCount + 1;
    setRetryCount(next);
    window.setTimeout(() => setReloadToken(next), 1200 * next);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(altText || 'image').slice(0, 30)}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className={cn(
        'relative inline-flex flex-col rounded-2xl border border-glass-border bg-glass-background/40 backdrop-blur-xl shadow-glass overflow-hidden',
        className,
      )}
      style={{ width: size.width, height: size.height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={altText || t('media.generatedImage')}
          className={cn(
            'h-full w-full object-cover transition-opacity',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
      {assetError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <button
            type="button"
            onClick={() => {
              setRetryCount(0);
              setReloadToken(0);
              void refresh();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-glass-border bg-background/70 px-2 py-1 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Erneut versuchen
          </button>
        </div>
      )}
      <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-md bg-background/70 p-1 text-foreground/80 hover:text-foreground"
          aria-label={t('action.download')}
        >
          <Download className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default InlineChatImage;
