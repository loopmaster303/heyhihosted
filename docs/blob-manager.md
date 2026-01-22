# BlobManager Documentation

## Overview

The `BlobManager` is a global singleton that manages blob URLs to prevent memory leaks in the application. It provides automatic cleanup, reference counting, and debugging capabilities.

## Why BlobManager?

When using `URL.createObjectURL()`, the browser creates a reference to the blob in memory. If `URL.revokeObjectURL()` is never called, the blob stays in memory even after the component unmounts, causing memory leaks.

BlobManager solves this by:
- Tracking all created blob URLs in a central registry
- Reference counting for shared blobs
- Automatic cleanup on component unmount
- Periodic cleanup of old URLs
- Global cleanup on page unload

## Usage

### Basic Usage with React Hooks

```typescript
import { useBlobUrl } from '@/hooks/useBlobUrl';

function MyComponent({ blob }: { blob: Blob }) {
  const url = useBlobUrl(blob, 'my-component');

  return <img src={url || ''} alt="Blob image" />;
}
```

### Multiple Blobs

```typescript
import { useBlobUrls } from '@/hooks/useBlobUrl';

function Gallery({ blobs }: { blobs: Blob[] }) {
  const urls = useBlobUrls(blobs, 'gallery');

  return (
    <div>
      {urls.map((url, i) => (
        <img key={i} src={url || ''} alt={`Image ${i}`} />
      ))}
    </div>
  );
}
```

### Direct Usage

```typescript
import { BlobManager } from '@/lib/blob-manager';

// Create a blob URL
const url = BlobManager.createURL(blob, 'context-name');

// Use the URL...

// Release when done
BlobManager.releaseURL(url);
```

### Reference Counting

```typescript
// First component creates the URL
const url = BlobManager.createURL(blob); // refCount = 1

// Second component retains it
BlobManager.retainURL(url); // refCount = 2

// First component unmounts
BlobManager.releaseURL(url); // refCount = 1 (URL still valid)

// Second component unmounts
BlobManager.releaseURL(url); // refCount = 0 (URL revoked)
```

## API Reference

### Core Methods

#### `createURL(blob: Blob, context?: string): string`

Creates a blob URL and registers it in the manager.

- **blob**: The blob to create a URL for
- **context**: Optional context string for debugging (e.g., 'gallery', 'chat')
- **Returns**: Object URL string

#### `releaseURL(url: string): void`

Decrements reference count and revokes URL if count reaches 0.

- **url**: The blob URL to release

#### `retainURL(url: string): void`

Increments reference count for an existing URL.

- **url**: The blob URL to retain

#### `forceRevoke(url: string): void`

Force revokes a URL regardless of reference count. Use with caution!

- **url**: The blob URL to revoke

### Cleanup Methods

#### `cleanupOld(maxAgeMs?: number): number`

Cleans up all blob URLs older than specified age.

- **maxAgeMs**: Maximum age in milliseconds (default: 5 minutes)
- **Returns**: Number of URLs cleaned up

#### `revokeAll(): void`

Revokes all registered blob URLs. Called automatically on page unload.

### Debugging

#### `getStats(): Stats`

Returns statistics about managed blob URLs.

```typescript
interface Stats {
  totalURLs: number;
  totalSize: number;
  byContext: Record<string, number>;
  oldestAge: number;
}
```

#### `debug(): void`

Logs current state to console (dev only).

Example output:
```
[BlobManager] Stats: {
  totalURLs: 12,
  totalSizeMB: "4.52",
  byContext: { gallery: 8, chat: 4 },
  oldestAgeMin: "3.25"
}
```

## Automatic Cleanup

BlobManager includes automatic cleanup mechanisms:

### 1. Page Unload
All blob URLs are revoked when the user leaves the page.

### 2. Periodic Cleanup
Every 5 minutes, URLs older than 5 minutes are automatically cleaned up.

### 3. Component Unmount
When using `useBlobUrl` or `useBlobUrls`, URLs are released on component unmount.

## Integration Points

BlobManager is integrated into:

- **`useAssetUrl`**: Asset URL loading hook
- **`DatabaseService.getAssetUrl()`**: Database asset URL retrieval
- **`useBlobUrl`**: React hook for blob URL management
- **`useBlobUrls`**: React hook for multiple blob URLs

## Performance Considerations

- **Reference Counting**: Multiple components can safely share the same blob URL
- **Automatic Cleanup**: Prevents memory leaks from forgotten blob URLs
- **Context Tracking**: Helps identify which parts of the app create the most blob URLs
- **Size Tracking**: Monitor total memory usage from blobs

## Best Practices

1. **Always use hooks in React components**:
   ```typescript
   const url = useBlobUrl(blob, 'component-name');
   ```

2. **Provide context strings for debugging**:
   ```typescript
   BlobManager.createURL(blob, 'gallery-preview');
   ```

3. **Use `releaseURL` in cleanup**:
   ```typescript
   useEffect(() => {
     const url = BlobManager.createURL(blob);
     return () => BlobManager.releaseURL(url);
   }, [blob]);
   ```

4. **Check stats in development**:
   ```typescript
   // In browser console
   BlobManager.debug();
   ```

5. **Don't use `forceRevoke` unless necessary**:
   - Reference counting handles most cases
   - Use only for emergency cleanup

## Troubleshooting

### Memory still growing?

1. Check stats: `BlobManager.debug()`
2. Look for contexts with high counts
3. Verify components call `releaseURL` in cleanup
4. Check for direct `URL.createObjectURL` calls not using BlobManager

### Blob URLs not working?

1. Verify blob is valid before creating URL
2. Check that URL hasn't been revoked prematurely
3. Ensure component isn't unmounting too early
4. Use `retainURL` if multiple components need the same URL

## Migration from Legacy Code

**Before** (Manual cleanup):
```typescript
useEffect(() => {
  let objectUrl: string | null = null;

  if (blob) {
    objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
  }

  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [blob]);
```

**After** (BlobManager):
```typescript
const url = useBlobUrl(blob, 'my-component');
```

## Example: Gallery Component

```typescript
import { useBlobUrls } from '@/hooks/useBlobUrl';
import { useEffect } from 'react';
import { BlobManager } from '@/lib/blob-manager';

function Gallery({ assets }: { assets: Asset[] }) {
  // Extract blobs
  const blobs = assets.map(a => a.blob).filter(Boolean);

  // Create managed URLs
  const urls = useBlobUrls(blobs, 'gallery');

  // Debug in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      BlobManager.debug();
    }
  }, [urls]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {urls.map((url, i) => (
        <img key={i} src={url || ''} alt={`Asset ${i}`} />
      ))}
    </div>
  );
}
```
