/**
 * BlobManager
 *
 * Global registry for blob URLs to prevent memory leaks.
 * Tracks all created blob URLs and provides automatic cleanup.
 */

interface BlobEntry {
  url: string;
  blob: Blob;
  refCount: number;
  createdAt: number;
  context?: string; // Optional context for debugging
}

class BlobManagerClass {
  private registry = new Map<string, BlobEntry>();
  private urlToId = new Map<string, string>();

  /**
   * Create a blob URL and register it.
   * @param blob The blob to create a URL for
   * @param context Optional context string for debugging (e.g., 'gallery', 'chat')
   * @returns Object URL string
   */
  createURL(blob: Blob, context?: string): string {
    const url = URL.createObjectURL(blob);
    const id = this.generateId();

    this.registry.set(id, {
      url,
      blob,
      refCount: 1,
      createdAt: Date.now(),
      context,
    });

    this.urlToId.set(url, id);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[BlobManager] Created: ${id} (${context || 'unknown'}) - Total: ${this.registry.size}`);
    }

    return url;
  }

  /**
   * Increment reference count for an existing URL.
   * Useful when multiple components use the same blob.
   */
  retainURL(url: string): void {
    const id = this.urlToId.get(url);
    if (id) {
      const entry = this.registry.get(id);
      if (entry) {
        entry.refCount++;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[BlobManager] Retained: ${id} - RefCount: ${entry.refCount}`);
        }
      }
    }
  }

  /**
   * Decrement reference count and revoke URL if count reaches 0.
   * @param url The blob URL to release
   */
  releaseURL(url: string): void {
    const id = this.urlToId.get(url);
    if (!id) {
      // URL not managed by BlobManager, revoke directly
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore errors (URL might already be revoked)
      }
      return;
    }

    const entry = this.registry.get(id);
    if (!entry) return;

    entry.refCount--;

    if (entry.refCount <= 0) {
      URL.revokeObjectURL(entry.url);
      this.registry.delete(id);
      this.urlToId.delete(url);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[BlobManager] Revoked: ${id} (${entry.context || 'unknown'}) - Total: ${this.registry.size}`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[BlobManager] Released: ${id} - RefCount: ${entry.refCount}`);
      }
    }
  }

  /**
   * Force revoke a URL regardless of reference count.
   * Use with caution!
   */
  forceRevoke(url: string): void {
    const id = this.urlToId.get(url);
    if (id) {
      const entry = this.registry.get(id);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        this.registry.delete(id);
        this.urlToId.delete(url);

        if (process.env.NODE_ENV === 'development') {
          console.log(`[BlobManager] Force revoked: ${id}`);
        }
      }
    }
  }

  /**
   * Clean up all blob URLs older than specified age.
   * @param maxAgeMs Maximum age in milliseconds (default: 5 minutes)
   */
  cleanupOld(maxAgeMs: number = 5 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, entry] of this.registry.entries()) {
      if (now - entry.createdAt > maxAgeMs) {
        URL.revokeObjectURL(entry.url);
        this.registry.delete(id);
        this.urlToId.delete(entry.url);
        cleaned++;
      }
    }

    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[BlobManager] Cleaned up ${cleaned} old URLs`);
    }

    return cleaned;
  }

  /**
   * Revoke all registered blob URLs.
   * Use on app unmount or navigation.
   */
  revokeAll(): void {
    for (const entry of this.registry.values()) {
      URL.revokeObjectURL(entry.url);
    }

    const count = this.registry.size;
    this.registry.clear();
    this.urlToId.clear();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[BlobManager] Revoked all ${count} URLs`);
    }
  }

  /**
   * Get statistics about managed blob URLs.
   */
  getStats(): {
    totalURLs: number;
    totalSize: number;
    byContext: Record<string, number>;
    oldestAge: number;
  } {
    let totalSize = 0;
    const byContext: Record<string, number> = {};
    let oldestAge = 0;
    const now = Date.now();

    for (const entry of this.registry.values()) {
      totalSize += entry.blob.size;
      const ctx = entry.context || 'unknown';
      byContext[ctx] = (byContext[ctx] || 0) + 1;
      const age = now - entry.createdAt;
      if (age > oldestAge) oldestAge = age;
    }

    return {
      totalURLs: this.registry.size,
      totalSize,
      byContext,
      oldestAge,
    };
  }

  /**
   * Log current state (dev only).
   */
  debug(): void {
    if (process.env.NODE_ENV === 'development') {
      const stats = this.getStats();
      console.log('[BlobManager] Stats:', {
        ...stats,
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
        oldestAgeMin: (stats.oldestAge / 1000 / 60).toFixed(2),
      });
    }
  }

  private generateId(): string {
    return `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const BlobManager = new BlobManagerClass();

// Automatic cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    BlobManager.revokeAll();
  });

  // Periodic cleanup of old URLs (every 5 minutes)
  setInterval(() => {
    BlobManager.cleanupOld();
  }, 5 * 60 * 1000);
}
