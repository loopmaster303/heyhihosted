const getAssetMock = jest.fn();
const saveAssetMock = jest.fn();

jest.mock('@/lib/services/database', () => ({
  DatabaseService: {
    getAsset: (...args: unknown[]) => getAssetMock(...args),
    saveAsset: (...args: unknown[]) => saveAssetMock(...args),
  },
}));

jest.mock('@/lib/blob-manager', () => ({
  BlobManager: { createURL: jest.fn(() => 'blob:asset') },
}));

jest.mock('@/lib/pollen-key', () => ({
  getPollenHeaders: () => ({ Authorization: 'Bearer test' }),
}));

jest.mock('@/lib/upload/pollinations-media', () => ({
  resolvePollinationsMediaUrl: jest.fn(async () => ({
    mediaUrl: 'https://media.pollinations.ai/built',
  })),
}));

import { resolveAssetUrl } from '@/lib/services/asset-fallback-service';

/**
 * Der Hintergrund-Cache darf den Nutzer nicht mit Fehlern zuschuetten: er lief
 * bisher fuer jedes gerenderte Asset und fuer jede URL, auch fuer Ziele, die
 * der Browser gar nicht laden darf.
 */
describe('AssetFallback Hintergrund-Cache', () => {
  const originalFetch = global.fetch;

  const flushWork = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    getAssetMock.mockReset();
    saveAssetMock.mockReset();
    saveAssetMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('laedt eine fremde Host-URL nicht im Hintergrund', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    getAssetMock.mockResolvedValue({
      id: 'asset-fremd',
      remoteUrl: 'https://api.pruna.ai/v1/files/abc.png',
      contentType: 'image/png',
    });

    const result = await resolveAssetUrl('asset-fremd');
    await flushWork();

    expect(result).toEqual({
      url: 'https://api.pruna.ai/v1/files/abc.png',
      source: 'remote',
      needsCleanup: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('startet fuer dieselbe Asset-Id nur einen Download', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => ({ size: 4096, type: 'image/png' }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    getAssetMock.mockResolvedValue({
      id: 'asset-dedupe',
      remoteUrl: 'https://media.pollinations.ai/abc.png',
      contentType: 'image/png',
    });

    await Promise.all([
      resolveAssetUrl('asset-dedupe'),
      resolveAssetUrl('asset-dedupe'),
      resolveAssetUrl('asset-dedupe'),
      resolveAssetUrl('asset-dedupe'),
    ]);
    await flushWork();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('versucht einen gescheiterten Download nicht sofort erneut', async () => {
    const fetchMock = jest.fn(async () => {
      throw new TypeError('Load failed');
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    getAssetMock.mockResolvedValue({
      id: 'asset-retry',
      remoteUrl: 'https://media.pollinations.ai/abc.png',
      contentType: 'image/png',
    });

    await resolveAssetUrl('asset-retry');
    await flushWork();
    await resolveAssetUrl('asset-retry');
    await flushWork();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
