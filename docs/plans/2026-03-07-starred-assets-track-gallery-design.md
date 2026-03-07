# Design: Starred Assets + Track Gallery + Vault Link

**Date**: 2026-03-07
**Status**: Approved

---

## Overview

Three connected improvements to the gallery system:

1. **Starred/Like system** — users can heart any asset; starred items sort to the top everywhere with a visual badge
2. **Track Gallery** — Compose/Eleven Music audio gets auto-saved to the assets table and shown in a Tracks tab
3. **Vault Link** — prominent "Open Vault" button in the Midi Gallery panel footer linking to `/gallery`

The Prompt Library concept is embedded in the Like system: liking an image = liking its prompt. The prompt is already stored on `asset.prompt`. Copy prompt is already in the panel.

---

## Gallery Hierarchy

```
Mini Gallery (sidebar strip, 3 thumbs, images only)
  └── Midi Gallery (portal panel, 12 items, tabs: Images | Tracks)
        └── [Open Vault →] button
              └── /gallery — pollinations_vault (full masonry, tabs: Images | Tracks)
```

---

## Data Changes

### Asset interface — add `starred`

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
  starred?: boolean;   // NEW
}
```

### DB migration — version 3 → 4

```typescript
this.version(4).stores({
  conversations: 'id, title, updatedAt, toolType',
  messages: 'id, conversationId, timestamp',
  memories: '++id, key, updatedAt',
  assets: 'id, conversationId, timestamp, starred'  // add starred index
});
```

### DatabaseService — new method

```typescript
async toggleStarred(id: string): Promise<void> {
  const asset = await db.assets.get(id);
  if (asset) await db.assets.update(id, { starred: !asset.starred });
}
```

### useGalleryAssets — sorting

Starred assets always first:
```typescript
assets.sort((a, b) => {
  if (a.starred && !b.starred) return -1;
  if (!a.starred && b.starred) return 1;
  return b.timestamp - a.timestamp;
});
```

---

## Track Saving

Hook into `useComposeMusicState` after successful audio generation:

```typescript
await GalleryService.saveGeneratedAsset({
  blob: audioBlob,           // or remoteUrl if no blob
  contentType: 'audio/mpeg',
  prompt: currentPrompt,
  modelId: 'elevenmusic',
  conversationId: activeConversationId,
});
```

Track title derived from prompt: first 4–5 words, shown in the track card.

---

## UI Changes

### Tabs — Midi Panel + Vault

Simple two-tab toggle: **Images** | **Tracks**

Filter logic:
- Images tab: `assets.filter(a => !a.contentType?.startsWith('audio/'))`
- Tracks tab: `assets.filter(a => a.contentType?.startsWith('audio/'))`

### Like Button

- Heart icon (`lucide: Heart`) on every `GalleryPanelItem` and `GalleryItem`
- Filled heart + primary color when `asset.starred === true`
- Small star badge (`⭐`) in top-left corner of thumbnail for starred items
- Calls `DatabaseService.toggleStarred(asset.id)` + local state refresh

### Model Name in Vault Hover Overlay

Add `asset.modelId` below the prompt text in the existing hover overlay in `/gallery/page.tsx`:

```tsx
<p className="text-xs text-white/90 line-clamp-3 font-mono">{asset.prompt}</p>
<span className="text-[10px] text-white/40 font-mono">{asset.modelId}</span>
```

### TrackItem Component

New component for the Tracks tab:

```
[  ▶  ]  deephouse raw 130bpm...       elevenmusic
         2026-03-07            [Copy] [Download] [★] [Delete]
```

Audio playback via `<audio>` element, play/pause toggle.

### Vault Link in Midi Panel

Replace empty `<div className="px-4 pb-4" />` footer with:

```tsx
<div className="px-4 pb-4 pt-2 border-t border-border/20">
  <Link href="/gallery" className="text-xs text-primary/70 hover:text-primary font-mono">
    open vault →
  </Link>
</div>
```

---

## Implementation Order

1. DB migration (`database.ts`) + `toggleStarred` method
2. `useGalleryAssets` sorting
3. Like button on `GalleryPanelItem` + `GalleryItem`
4. Tabs in Midi Panel (`GallerySidebarSection`)
5. Track saving in `useComposeMusicState`
6. `TrackItem` component
7. Tabs + TrackItem in Vault (`/gallery/page.tsx`)
8. Model name in Vault hover overlay
9. Vault link in Midi Panel footer

---

## Out of Scope

- Prompt-only library view (prompts are accessible via liked images)
- Tags or categories on prompts
- Cross-device sync (local-first stays)
- Waveform visualization (play/pause only for now)
