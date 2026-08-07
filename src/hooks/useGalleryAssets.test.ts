import { isGalleryAsset } from './useGalleryAssets';
import type { Asset } from '@/lib/services/database';

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: 'a',
    remoteUrl: 'https://x/1.png',
    contentType: 'image/png',
    timestamp: 1,
    ...overrides,
  };
}

describe('isGalleryAsset (sentinel filter)', () => {
  it('excludes playground-sentinel assets from the main gallery', () => {
    expect(isGalleryAsset(asset({ conversationId: '__playground__' }))).toBe(false);
  });

  it('keeps regular (chat) assets in the main gallery', () => {
    expect(isGalleryAsset(asset({ conversationId: 'chat-1' }))).toBe(true);
  });

  it('keeps assets with no conversationId', () => {
    expect(isGalleryAsset(asset({ conversationId: undefined }))).toBe(true);
  });

  it('isGalleryAsset also gates clearAllAssets — playground assets survive bulk clear', () => {
    const playground = asset({ id: 'p', conversationId: '__playground__' });
    const chat = asset({ id: 'c', conversationId: 'chat-1' });
    const survives = [playground, chat].filter(a => !isGalleryAsset(a));
    expect(survives).toEqual([playground]);
  });
});
