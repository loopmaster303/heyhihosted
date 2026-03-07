# Starred Assets + Track Gallery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a like/star system to gallery assets, auto-save Compose audio tracks to the vault, and add tabs + a Vault link to the Midi Gallery panel.

**Architecture:** `starred` boolean added to the Asset DB schema (version bump 3→4). `useGalleryAssets` sorts starred items first. Track saving hooks into `useComposeMusicState.generateMusic`. New `TrackItem` component renders audio. Tabs filter by `contentType` in both Midi Panel and Vault page.

**Tech Stack:** Dexie (IndexedDB), React hooks, framer-motion, lucide-react, Next.js App Router

---

### Task 1: Add `starred` to Asset schema + DB migration

**Files:**
- Modify: `src/lib/services/database.ts`

**Step 1: Add `starred` to Asset interface**

In `src/lib/services/database.ts`, update the `Asset` interface (around line 28):

```typescript
export interface Asset {
  id: string;
  blob?: Blob;
  contentType: string;
  prompt?: string;
  modelId?: string;
  conversationId?: string;
  timestamp: number;
  storageKey?: string;
  remoteUrl?: string;
  starred?: boolean;  // ADD THIS
}
```

**Step 2: Bump DB version and add starred index**

In `HeyHiDatabase` constructor, add version 4 after the existing version 3 block:

```typescript
this.version(4).stores({
  conversations: 'id, title, updatedAt, toolType',
  messages: 'id, conversationId, timestamp',
  memories: '++id, key, updatedAt',
  assets: 'id, conversationId, timestamp, starred'
});
```

**Step 3: Add `toggleStarred` to DatabaseService**

After the `deleteAsset` method (around line 163), add:

```typescript
async toggleStarred(id: string): Promise<void> {
  const asset = await db.assets.get(id);
  if (asset) await db.assets.update(id, { starred: !asset.starred });
},
```

**Step 4: Run the app and check DevTools → Application → IndexedDB**

Open the app in browser. DevTools → Application → IndexedDB → HeyHiVault → assets. Verify the table shows without errors (Dexie auto-migrates).

**Step 5: Commit**

```bash
git add src/lib/services/database.ts
git commit -m "feat: add starred field to Asset schema and toggleStarred method"
```

---

### Task 2: Sort starred assets first in useGalleryAssets + expose toggleStarred

**Files:**
- Modify: `src/hooks/useGalleryAssets.ts`

**Step 1: Update the hook**

Replace the entire file content:

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import { DatabaseService } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';

export function useGalleryAssets() {
  const assets = useLiveQuery(
    async () => {
      const all = await db.assets
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();
      // Starred items always first, then by timestamp desc
      return all.sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return 0; // already sorted by timestamp from Dexie
      });
    },
    []
  );

  const isLoading = assets === undefined;

  const deleteAsset = async (id: string) => {
    await db.assets.delete(id);
  };

  const clearAllAssets = async () => {
    await db.assets.clear();
  };

  const toggleStarred = async (id: string) => {
    await DatabaseService.toggleStarred(id);
  };

  return {
    assets: assets || [],
    isLoading,
    deleteAsset,
    clearAllAssets,
    toggleStarred,
  };
}
```

**Step 2: Verify no TypeScript errors**

```bash
npm run typecheck
```

Expected: no errors related to this file.

**Step 3: Commit**

```bash
git add src/hooks/useGalleryAssets.ts
git commit -m "feat: sort starred assets first + expose toggleStarred in useGalleryAssets"
```

---

### Task 3: Save Compose audio tracks to the vault

**Files:**
- Modify: `src/hooks/useComposeMusicState.ts`

**Context:** `generateMusic` currently returns the `audioUrl` string and sets it in state. After a successful response, we need to call `GalleryService.saveGeneratedAsset` with the audio URL, prompt, and modelId.

**Step 1: Check how saveGeneratedAsset works for audio**

Open `src/lib/services/gallery-service.ts`. The `SaveGeneratedAssetOptions` has `url`, `prompt`, `modelId`, `conversationId`, `isVideo`, `isPollinations`. Audio is not video, so `isVideo: false` is correct. The `ingestGeneratedAsset` pipeline handles fetching and storing — this works for any URL including audio.

**Step 2: Add GalleryService import to useComposeMusicState**

At the top of `src/hooks/useComposeMusicState.ts`, add:

```typescript
import { GalleryService } from '@/lib/services/gallery-service';
```

**Step 3: Save audio after successful generation**

In the `generateMusic` callback, after `setAudioUrl(data.audioUrl)` and before `return data.audioUrl`, add:

```typescript
// Save track to vault
GalleryService.saveGeneratedAsset({
  url: data.audioUrl,
  prompt,
  modelId: selectedModel,
  isPollinations: true,
}).catch(() => {
  // Non-blocking — vault save failure should not affect playback
});
```

The full try block should now look like:

```typescript
try {
  const response = await fetch('/api/compose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
    body: JSON.stringify({ prompt, duration, instrumental, model: selectedModel }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate music');
  }

  setAudioUrl(data.audioUrl);

  // Save track to vault (non-blocking)
  GalleryService.saveGeneratedAsset({
    url: data.audioUrl,
    prompt,
    modelId: selectedModel,
    isPollinations: true,
  }).catch(() => {});

  return data.audioUrl;
}
```

**Step 4: Verify audio contentType is set correctly**

Open `src/lib/services/gallery-service.ts` and find `saveGeneratedAsset`. Check how `contentType` is determined — it likely uses the URL extension or a hardcoded value. If audio URLs from Pollinations end in `.mp3` or `.wav`, the content-type detection should work. If not, we may need to pass `contentType: 'audio/mpeg'` explicitly. Check the `SaveGeneratedAssetOptions` interface and add `contentType?: string` if missing, then pass it through.

**Step 5: Generate a track in the app and check the vault**

Go to Compose mode, generate a track. Open `/gallery` and verify the audio asset appears (even if it renders as broken image for now — that's fine, we'll fix display in later tasks).

**Step 6: Commit**

```bash
git add src/hooks/useComposeMusicState.ts src/lib/services/gallery-service.ts
git commit -m "feat: auto-save compose audio tracks to vault"
```

---

### Task 4: Like button in GallerySidebarSection (Midi Panel)

**Files:**
- Modify: `src/components/gallery/GallerySidebarSection.tsx`

**Step 1: Add Heart icon import**

In the imports at the top, add `Heart` to the lucide-react import:

```typescript
import { ChevronRight, Copy, Download, Heart, Image as ImageIcon, Trash2, X } from 'lucide-react';
```

**Step 2: Add `onToggleStar` to GalleryPanelItem props**

Update the `GalleryPanelItem` props interface:

```typescript
const GalleryPanelItem = ({
  asset,
  onOpen,
  onDownload,
  onCopyPrompt,
  onDelete,
  onToggleStar,
}: {
  asset: Asset;
  onOpen: (assetId: string, type: 'image' | 'video') => void;
  onDownload: (url: string, filename: string) => void;
  onCopyPrompt: (prompt?: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
}) => {
```

**Step 3: Add star badge + Heart button to GalleryPanelItem**

Add a star badge in the top-left of the media wrapper (after the `!url` skeleton div):

```tsx
{asset.starred && (
  <div className="absolute top-1.5 left-1.5 z-10 text-yellow-400 text-[10px] leading-none">
    ★
  </div>
)}
```

Add the Heart button in the actions overlay (alongside Copy/Download/Delete):

```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => onToggleStar(asset.id)}
  className={cn(
    "h-7 w-7 rounded-full bg-black/50 hover:bg-black/70",
    asset.starred ? "text-red-400" : "text-white"
  )}
  title="Like"
  aria-label="Like"
>
  <Heart className={cn("h-3.5 w-3.5", asset.starred && "fill-current")} />
</Button>
```

**Step 4: Wire up toggleStarred in the main GallerySidebarSection**

Destructure `toggleStarred` from `useGalleryAssets`:

```typescript
const { assets, isLoading, deleteAsset, clearAllAssets, toggleStarred } = useGalleryAssets();
```

Pass it to `GalleryPanelItem`:

```tsx
<GalleryPanelItem
  key={asset.id}
  asset={asset}
  onOpen={(assetId, type) => setLightboxData({ assetId, type })}
  onDownload={handleDownload}
  onCopyPrompt={handleCopyPrompt}
  onDelete={deleteAsset}
  onToggleStar={toggleStarred}
/>
```

**Step 5: Verify in browser**

Open the Midi Gallery panel. Click the heart on an image. Verify it turns red. Close and reopen panel — verify starred image appears first with ★ badge.

**Step 6: Commit**

```bash
git add src/components/gallery/GallerySidebarSection.tsx
git commit -m "feat: add like/star button to Midi Gallery panel"
```

---

### Task 5: Tabs (Images | Tracks) + TrackItem + Vault Link in Midi Panel

**Files:**
- Modify: `src/components/gallery/GallerySidebarSection.tsx`

**Step 1: Add tab state**

Inside `GallerySidebarSection`, add:

```typescript
const [activeTab, setActiveTab] = useState<'images' | 'tracks'>('images');
```

**Step 2: Split assets by type**

```typescript
const imageAssets = useMemo(
  () => assets.filter(a => !a.contentType?.startsWith('audio/')),
  [assets]
);
const trackAssets = useMemo(
  () => assets.filter(a => a.contentType?.startsWith('audio/')),
  [assets]
);
const panelImages = useMemo(() => imageAssets.slice(0, MAX_PANEL), [imageAssets]);
const panelTracks = useMemo(() => trackAssets.slice(0, MAX_PANEL), [trackAssets]);
```

**Step 3: Add TrackItem component**

Add this component above `GallerySidebarSection` in the same file:

```tsx
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
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-muted/20 group">
      {url && <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />}
      <button
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <span className="text-[10px] font-bold">▐▐</span>
        ) : (
          <span className="text-[10px] font-bold pl-0.5">▶</span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-foreground/80 truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground/60 font-mono">{asset.modelId || 'elevenmusic'}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost" size="icon"
          onClick={() => onCopyPrompt(asset.prompt)}
          className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => onToggleStar(asset.id)}
          className={cn("h-6 w-6 rounded", asset.starred ? "text-red-400" : "text-muted-foreground hover:text-foreground")}
        >
          <Heart className={cn("h-3 w-3", asset.starred && "fill-current")} />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => onDelete(asset.id)}
          className="h-6 w-6 rounded text-muted-foreground hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
```

Add `useState` and `React` to imports if not already there:
```typescript
import React, { useMemo, useState } from 'react';
```

Also add `Music` to lucide imports: `import { ..., Music, ... } from 'lucide-react';`

**Step 4: Replace the panel grid with tabs**

Inside the portal, replace the grid section with:

```tsx
{/* Tabs */}
<div className="flex gap-1 px-4 pt-3 pb-2">
  <button
    onClick={() => setActiveTab('images')}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
      activeTab === 'images'
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <ImageIcon className="h-3 w-3" />
    Images
    {imageAssets.length > 0 && (
      <span className="text-[10px] opacity-60">{imageAssets.length}</span>
    )}
  </button>
  <button
    onClick={() => setActiveTab('tracks')}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
      activeTab === 'tracks'
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Music className="h-3 w-3" />
    Tracks
    {trackAssets.length > 0 && (
      <span className="text-[10px] opacity-60">{trackAssets.length}</span>
    )}
  </button>
</div>

<div className="max-h-[55vh] overflow-y-auto px-4 pb-3 no-scrollbar">
  {activeTab === 'images' ? (
    panelImages.length === 0 ? (
      <div className="py-8 text-center text-xs text-muted-foreground/70">
        {t('gallery.emptyPanel')}
      </div>
    ) : (
      <div className="grid grid-cols-2 min-[520px]:grid-cols-3 gap-3">
        {panelImages.map((asset) => (
          <GalleryPanelItem
            key={asset.id}
            asset={asset}
            onOpen={(assetId, type) => setLightboxData({ assetId, type })}
            onDownload={handleDownload}
            onCopyPrompt={handleCopyPrompt}
            onDelete={deleteAsset}
            onToggleStar={toggleStarred}
          />
        ))}
      </div>
    )
  ) : (
    panelTracks.length === 0 ? (
      <div className="py-8 text-center text-xs text-muted-foreground/70">
        Noch keine Tracks. Compose-Modus öffnen.
      </div>
    ) : (
      <div className="space-y-1">
        {panelTracks.map((asset) => (
          <TrackItem
            key={asset.id}
            asset={asset}
            onCopyPrompt={handleCopyPrompt}
            onDelete={deleteAsset}
            onToggleStar={toggleStarred}
          />
        ))}
      </div>
    )
  )}
</div>
```

**Step 5: Add Vault link in panel footer**

Replace the empty `<div className="px-4 pb-4" />` with:

```tsx
<div className="px-4 pb-4 pt-2 border-t border-border/20 flex justify-between items-center">
  <Link href="/gallery" className="text-xs font-mono text-primary/60 hover:text-primary transition-colors">
    open vault →
  </Link>
</div>
```

Add `Link` import at top: `import Link from 'next/link';`

**Step 6: Verify in browser**

- Open Midi panel → see "Images" and "Tracks" tabs
- Images tab shows images with like button
- Tracks tab shows "Noch keine Tracks" if no audio yet (or shows tracks if you generated some)
- "open vault →" link at bottom navigates to `/gallery`

**Step 7: Run typecheck**

```bash
npm run typecheck
```

**Step 8: Commit**

```bash
git add src/components/gallery/GallerySidebarSection.tsx
git commit -m "feat: add tabs (Images|Tracks), TrackItem component and Vault link to Midi Gallery panel"
```

---

### Task 6: Like button + model name + tracks in Vault page

**Files:**
- Modify: `src/app/gallery/page.tsx`

**Step 1: Add imports**

Add to imports:
```typescript
import { Heart, Music } from 'lucide-react';
import { useState, useMemo } from 'react'; // useState already there, add useMemo
import { DatabaseService } from '@/lib/services/database';
import Link from 'next/link'; // likely already imported
```

**Step 2: Add tab state + asset split in GalleryPageContent**

```typescript
const [activeTab, setActiveTab] = useState<'images' | 'tracks'>('images');
const imageAssets = useMemo(
  () => assets.filter(a => !a.contentType?.startsWith('audio/')),
  [assets]
);
const trackAssets = useMemo(
  () => assets.filter(a => a.contentType?.startsWith('audio/')),
  [assets]
);

const toggleStarred = async (id: string) => {
  await DatabaseService.toggleStarred(id);
};
```

**Step 3: Add `onToggleStar` to GalleryItem**

Update `GalleryItem` component props:

```typescript
const GalleryItem = ({
  asset,
  onSelect,
  onToggleStar,
}: {
  asset: Asset;
  onSelect: (url: string, type: 'image' | 'video') => void;
  onToggleStar: (id: string) => void;
}) => {
```

Add star badge (top-left, always visible):
```tsx
{asset.starred && (
  <div className="absolute top-2 left-2 z-10 text-yellow-400 text-sm leading-none drop-shadow">
    ★
  </div>
)}
```

Add Heart button + model name to the hover overlay. Replace the existing overlay content with:

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 pointer-events-none group-hover:pointer-events-auto">
  <p className="text-xs text-white/90 line-clamp-3 font-medium mb-1 font-mono leading-relaxed">
    {asset.prompt}
  </p>
  <p className="text-[10px] text-white/40 font-mono mb-3">{asset.modelId}</p>
  <div className="flex items-center justify-between pt-2 border-t border-white/10">
    <span className="text-[10px] text-zinc-400 font-mono">
      {new Date(asset.timestamp).toLocaleDateString()}
    </span>
    <div className="flex gap-2">
      <Button
        size="icon"
        className={cn(
          "h-7 w-7 rounded-full bg-white/10 border-0 backdrop-blur-sm",
          asset.starred ? "text-red-400 hover:bg-white/20" : "text-white hover:bg-primary hover:text-white"
        )}
        onClick={(e) => { e.stopPropagation(); onToggleStar(asset.id); }}
      >
        <Heart className={cn("h-3.5 w-3.5", asset.starred && "fill-current")} />
      </Button>
      <Button
        size="icon"
        className="h-7 w-7 rounded-full bg-white/10 hover:bg-primary hover:text-white border-0 text-white backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          const link = document.createElement('a');
          link.href = url;
          link.download = `heyhi-${asset.id.slice(0, 8)}.${isVideo ? 'mp4' : 'png'}`;
          link.click();
        }}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        className="h-7 w-7 rounded-full bg-white/10 hover:bg-primary hover:text-white border-0 text-white backdrop-blur-sm"
        onClick={() => onSelect(url, isVideo ? 'video' : 'image')}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</div>
```

**Step 4: Add VaultTrackItem component for the Vault page**

Add above `GalleryPageContent`:

```tsx
const VaultTrackItem = ({
  asset,
  onToggleStar,
}: {
  asset: Asset;
  onToggleStar: (id: string) => void;
}) => {
  const { url } = useAssetUrl(asset.id);
  const title = asset.prompt
    ? asset.prompt.split(' ').slice(0, 5).join(' ') + (asset.prompt.split(' ').length > 5 ? '…' : '')
    : 'untitled track';

  return (
    <div className="break-inside-avoid rounded-xl border border-glass-border bg-glass-background/30 backdrop-blur-md p-4 group hover:border-primary/30 transition-all duration-300">
      {url && (
        <audio controls src={url} className="w-full h-8 mb-3" style={{ accentColor: 'hsl(var(--primary))' }} />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono text-foreground/80 truncate font-medium">{title}</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{asset.modelId || 'elevenmusic'}</p>
        </div>
        <button
          onClick={() => onToggleStar(asset.id)}
          className={cn("shrink-0 text-sm", asset.starred ? "text-red-400" : "text-muted-foreground/40 hover:text-red-400")}
        >
          <Heart className={cn("h-4 w-4", asset.starred && "fill-current")} />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/40 font-mono mt-2">
        {new Date(asset.timestamp).toLocaleDateString()}
      </p>
    </div>
  );
};
```

**Step 5: Add tabs to the Vault header**

After the `<h1>` block in the header, add:

```tsx
<div className="flex gap-1 mt-4">
  {[
    { key: 'images', label: 'Images', icon: ImageIcon, count: imageAssets.length },
    { key: 'tracks', label: 'Tracks', icon: Music, count: trackAssets.length },
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key as 'images' | 'tracks')}
      className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
        activeTab === tab.key
          ? "bg-primary/15 text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground border border-border/30"
      )}
    >
      <tab.icon className="h-3.5 w-3.5" />
      {tab.label}
      <span className="opacity-50">{tab.count}</span>
    </button>
  ))}
</div>
```

**Step 6: Replace the grid with tab-aware rendering**

In the grid area, replace `assets.map(...)` with:

```tsx
{activeTab === 'images' ? (
  imageAssets.length === 0 ? (
    <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground opacity-50">
      {/* existing empty state */}
    </div>
  ) : (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 mx-auto">
      {imageAssets.map((asset) => (
        <GalleryItem
          key={asset.id}
          asset={asset}
          onSelect={setSelectedContent}
          onToggleStar={toggleStarred}
        />
      ))}
    </div>
  )
) : (
  trackAssets.length === 0 ? (
    <div className="h-[40vh] flex flex-col items-center justify-center text-muted-foreground opacity-50">
      <Music className="w-10 h-10 mb-4" />
      <p className="text-sm font-medium">Keine Tracks gefunden.</p>
      <p className="text-xs mt-1">Im Compose-Modus Musik generieren.</p>
    </div>
  ) : (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4 mx-auto">
      {trackAssets.map((asset) => (
        <VaultTrackItem
          key={asset.id}
          asset={asset}
          onToggleStar={toggleStarred}
        />
      ))}
    </div>
  )
)}
```

**Step 7: Run typecheck**

```bash
npm run typecheck
```

Fix any type errors (likely `cn` import if missing — it's at `@/lib/utils`).

**Step 8: Test in browser**

- Open `/gallery` — Images tab shows images with heart button + model name on hover
- Generate a compose track, revisit `/gallery` — Tracks tab shows the track with audio player
- Star an image → refresh → starred image appears first with ★

**Step 9: Commit**

```bash
git add src/app/gallery/page.tsx
git commit -m "feat: add tabs, TrackItem, like button and model name to Vault page"
```

---

### Task 7: Update item count in Vault header

**Files:**
- Modify: `src/app/gallery/page.tsx`

**Step 1: Update the items badge**

The header currently shows `{assets.length} items`. Update to show tab-specific counts:

```tsx
<span className="text-xs font-normal text-muted-foreground ml-2 border border-border/50 px-2 py-0.5 rounded-full bg-muted/20">
  {activeTab === 'images' ? imageAssets.length : trackAssets.length} {activeTab}
</span>
```

**Step 2: Commit**

```bash
git add src/app/gallery/page.tsx
git commit -m "fix: show tab-specific item count in Vault header"
```
