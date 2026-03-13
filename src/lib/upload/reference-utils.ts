import type { UploadedReference } from '@/types';
import { resolvePollinationsMediaUrl } from '@/lib/upload/pollinations-media';

const DEFAULT_STALE_BUFFER_MS = 60_000;

export async function resolveReferenceUrls(
  references: UploadedReference[],
  staleBufferMs: number = DEFAULT_STALE_BUFFER_MS
): Promise<string[]> {
  const now = Date.now();
  const resolved: string[] = [];

  for (const ref of references) {
    if (!ref) continue;
    if (!ref.key) {
      if (ref.url) resolved.push(ref.url);
      continue;
    }

    const expiresAt = ref.expiresAt ?? 0;
    const isFresh = !expiresAt || expiresAt - now > staleBufferMs;
    if (isFresh) {
      if (ref.url) resolved.push(ref.url);
      continue;
    }

    try {
      const media = await resolvePollinationsMediaUrl(ref.key);
      if (media.mediaUrl) {
        resolved.push(media.mediaUrl);
        continue;
      }
    } catch (error) {
      console.warn('[resolveReferenceUrls] Failed to refresh media URL:', error);
    }

    if (ref.url) resolved.push(ref.url);
  }

  return resolved.filter(Boolean);
}
