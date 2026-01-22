# AssetFallbackService Documentation

## Overview

The `AssetFallbackService` provides a comprehensive fallback chain for asset URL resolution with automatic retry logic and background caching. It ensures assets are always accessible even when vault data is missing or URLs expire.

## Problem It Solves

In a local-first architecture with remote asset storage, several issues can occur:
1. **Missing Blobs**: Asset metadata exists but blob is not in IndexedDB
2. **Expired S3 URLs**: Signed URLs expire after a certain time
3. **Network Failures**: Temporary network issues prevent asset loading
4. **Offline Access**: User needs assets when offline

AssetFallbackService addresses all these issues with intelligent fallback and retry mechanisms.

## Fallback Priority Chain

```
1. Local Blob (fastest, no network)
   ↓ (if missing)
2. Remote URL (direct, no signing)
   ↓ (if missing)
3. S3 Signed URL via storageKey (with retry)
   ↓ (if all fail)
4. Download and cache in background
```

## API Reference

### Core Function

#### `resolveAssetUrl(assetId: string, options?: FallbackOptions): Promise<AssetUrlResult>`

Resolves an asset ID to a usable URL with comprehensive fallback logic.

**Parameters**:
- `assetId`: The asset ID to resolve
- `options`: Configuration options
  - `maxRetries`: Max retry attempts for S3 signing (default: 3)
  - `retryDelay`: Base delay between retries in ms (default: 1000)
  - `downloadMissingBlob`: Auto-download and cache if blob missing (default: true)

**Returns**: Promise resolving to:
```typescript
interface AssetUrlResult {
  url: string | null;
  source: 'blob' | 'remote' | 's3-signed' | 'downloaded';
  needsCleanup: boolean; // true if BlobManager cleanup required
}
```

**Example**:
```typescript
import { resolveAssetUrl } from '@/lib/services/asset-fallback-service';

const result = await resolveAssetUrl('asset-id-123', {
  maxRetries: 3,
  downloadMissingBlob: true
});

if (result.url) {
  console.log(`Asset loaded from: ${result.source}`);
  // Use result.url
}
```

### Helper Functions

#### `refreshAssetUrl(assetId: string): Promise<string | null>`

Refreshes an expired or invalid asset URL. Useful when a displayed URL suddenly fails.

**Example**:
```typescript
import { refreshAssetUrl } from '@/lib/services/asset-fallback-service';

const newUrl = await refreshAssetUrl('asset-id-123');
if (newUrl) {
  // Update displayed asset
}
```

#### `precacheAssets(assetIds: string[]): Promise<void>`

Pre-caches multiple assets in the background. Downloads and stores blobs for offline access.

**Example**:
```typescript
import { precacheAssets } from '@/lib/services/asset-fallback-service';

// Precache gallery assets
await precacheAssets(['id1', 'id2', 'id3']);
console.log('Gallery assets cached for offline use');
```

## React Hooks

### `useAssetUrl(assetId?: string, initialUrl?: string)`

Enhanced hook for asset URL management with automatic fallback and retry.

**Returns**:
```typescript
{
  url: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>; // Manual refresh function
}
```

**Example**:
```typescript
import { useAssetUrl } from '@/hooks/useAssetUrl';

function AssetImage({ assetId }: { assetId: string }) {
  const { url, isLoading, error, refresh } = useAssetUrl(assetId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <button onClick={refresh}>Retry</button>;

  return <img src={url || ''} alt="Asset" />;
}
```

### `useAssetPrecache(assetIds: string[], enabled?: boolean)`

Hook to precache multiple assets in the background.

**Returns**:
```typescript
{
  isPrecaching: boolean;
  precachedCount: number;
}
```

**Example**:
```typescript
import { useAssetPrecache } from '@/hooks/useAssetPrecache';

function Gallery({ assets }: { assets: Asset[] }) {
  const assetIds = assets.map(a => a.id);
  const { isPrecaching, precachedCount } = useAssetPrecache(assetIds);

  return (
    <div>
      {isPrecaching && <div>Caching {precachedCount}/{assetIds.length}...</div>}
      {/* Gallery content */}
    </div>
  );
}
```

## GalleryService Integration

### `getResolvedAssetUrl(id: string): Promise<string | null>`

Convenience method on GalleryService that wraps `resolveAssetUrl`.

**Example**:
```typescript
import { GalleryService } from '@/lib/services/gallery-service';

const url = await GalleryService.getResolvedAssetUrl('asset-id-123');
```

### `verifyAndRepairAssets(assetIds: string[]): Promise<number>`

Bulk repair operation for assets with missing blobs.

**Example**:
```typescript
import { GalleryService } from '@/lib/services/gallery-service';

// Repair all gallery assets
const repairedCount = await GalleryService.verifyAndRepairAssets(assetIds);
console.log(`Repaired ${repairedCount} assets`);
```

## Retry Logic

The service uses **exponential backoff** for retries:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1000ms |
| 2nd retry | 2000ms |
| 3rd retry | 4000ms |

**Example flow**:
```
Initial attempt → Fail (network error)
Wait 1s → Retry 1 → Fail (still down)
Wait 2s → Retry 2 → Fail (still down)
Wait 4s → Retry 3 → Success!
```

## Background Caching

When `downloadMissingBlob: true` (default), the service automatically downloads and caches assets in the background:

1. **First Access**: Returns remote/S3 URL immediately (fast)
2. **Background**: Downloads blob and stores in IndexedDB
3. **Next Access**: Returns local blob URL (faster, offline-capable)

**Benefits**:
- Fast initial load (no blocking download)
- Offline access after first load
- Reduced bandwidth on subsequent loads
- Improved performance

## Error Handling

The service handles various error scenarios gracefully:

### Network Failures
```typescript
// Automatic retry with exponential backoff
const result = await resolveAssetUrl('asset-id', { maxRetries: 3 });
```

### Expired S3 URLs
```typescript
// Refreshes signed URL automatically
const { refresh } = useAssetUrl('asset-id');
await refresh(); // Get new signed URL
```

### Missing Assets
```typescript
const result = await resolveAssetUrl('non-existent-id');
if (!result.url) {
  console.log('Asset not found');
}
```

## Performance Considerations

### Parallel Loading
```typescript
// Bad: Sequential loading
for (const id of assetIds) {
  await resolveAssetUrl(id);
}

// Good: Parallel loading
await Promise.all(
  assetIds.map(id => resolveAssetUrl(id))
);
```

### Precaching Strategy
```typescript
// Precache gallery assets on mount
useAssetPrecache(visibleAssetIds, true);

// Defer non-visible assets
useEffect(() => {
  const timer = setTimeout(() => {
    precacheAssets(hiddenAssetIds);
  }, 5000); // Wait 5s after initial render

  return () => clearTimeout(timer);
}, [hiddenAssetIds]);
```

### Memory Management
- Uses `BlobManager` for automatic cleanup
- Blob URLs are revoked when components unmount
- Periodic cleanup of old URLs every 5 minutes

## Best Practices

### 1. Use Hooks in React Components
```typescript
// ✅ Good
function MyComponent({ assetId }: { assetId: string }) {
  const { url } = useAssetUrl(assetId);
  return <img src={url || ''} />;
}

// ❌ Bad
function MyComponent({ assetId }: { assetId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    resolveAssetUrl(assetId).then(r => setUrl(r.url));
  }, [assetId]);

  return <img src={url || ''} />;
}
```

### 2. Handle Loading and Error States
```typescript
function AssetViewer({ assetId }: { assetId: string }) {
  const { url, isLoading, error, refresh } = useAssetUrl(assetId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorView onRetry={refresh} message={error} />;
  if (!url) return <Placeholder />;

  return <img src={url} alt="Asset" />;
}
```

### 3. Precache for Better UX
```typescript
function Gallery({ assets }: { assets: Asset[] }) {
  // Precache visible assets
  const visibleIds = assets.slice(0, 10).map(a => a.id);
  useAssetPrecache(visibleIds, true);

  return (
    <div>
      {assets.map(asset => (
        <AssetCard key={asset.id} assetId={asset.id} />
      ))}
    </div>
  );
}
```

### 4. Manual Refresh for Expired URLs
```typescript
function AssetImage({ assetId }: { assetId: string }) {
  const { url, refresh } = useAssetUrl(assetId);

  const handleError = async () => {
    console.log('Image failed to load, refreshing URL...');
    await refresh();
  };

  return <img src={url || ''} onError={handleError} />;
}
```

## Troubleshooting

### Assets Not Loading

**Symptom**: `url` is `null` after loading

**Possible Causes**:
1. Asset doesn't exist in database
2. No valid source (no blob, remoteUrl, or storageKey)
3. Network failure on all retry attempts
4. S3 sign-read API failing

**Solution**:
```typescript
const { url, error } = useAssetUrl('asset-id');
if (!url) {
  console.error('Asset failed to load:', error);
  // Check database for asset existence
  // Verify S3 credentials
  // Check network connectivity
}
```

### Slow Loading

**Symptom**: Assets take long time to appear

**Possible Causes**:
1. No local blob cached (network fetch required)
2. S3 signing API is slow
3. Large asset files

**Solution**:
```typescript
// Precache assets ahead of time
useAssetPrecache(assetIds, true);

// Or use progressive loading
<img
  src={lowResUrl}
  onLoad={() => setShowHighRes(true)}
/>
{showHighRes && <img src={highResUrl} />}
```

### Memory Leaks

**Symptom**: Browser memory grows over time

**Possible Causes**:
1. Direct `URL.createObjectURL` usage (not using BlobManager)
2. Not cleaning up blob URLs

**Solution**:
- Always use `useAssetUrl` hook (handles cleanup automatically)
- Or manually use `BlobManager.releaseURL()` in cleanup
- Check BlobManager stats: `BlobManager.debug()`

## Integration Example

Complete example showing all features:

```typescript
import { useAssetUrl } from '@/hooks/useAssetUrl';
import { useAssetPrecache } from '@/hooks/useAssetPrecache';
import { GalleryService } from '@/lib/services/gallery-service';

function GalleryView({ assets }: { assets: Asset[] }) {
  // Precache visible assets
  const visibleIds = assets.slice(0, 20).map(a => a.id);
  const { isPrecaching, precachedCount } = useAssetPrecache(visibleIds);

  // Repair missing blobs on mount
  useEffect(() => {
    const allIds = assets.map(a => a.id);
    GalleryService.verifyAndRepairAssets(allIds).then(count => {
      console.log(`Repaired ${count} assets`);
    });
  }, [assets]);

  return (
    <div>
      {isPrecaching && (
        <div>Caching assets: {precachedCount}/{visibleIds.length}</div>
      )}

      {assets.map(asset => (
        <AssetCard key={asset.id} assetId={asset.id} />
      ))}
    </div>
  );
}

function AssetCard({ assetId }: { assetId: string }) {
  const { url, isLoading, error, refresh } = useAssetUrl(assetId);

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <ErrorCard>
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </ErrorCard>
    );
  }

  if (!url) return <Placeholder />;

  return (
    <img
      src={url}
      alt="Gallery asset"
      onError={refresh} // Auto-refresh on image error
    />
  );
}
```
