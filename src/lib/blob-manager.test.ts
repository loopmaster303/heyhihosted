import { BlobManager } from './blob-manager';

function makeBlob(size = 8): Blob {
  return new Blob([new Uint8Array(size)], { type: 'image/png' });
}

describe('BlobManager', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let urlCounter: number;

  beforeEach(() => {
    urlCounter = 0;
    revokeObjectURLMock = jest.fn();
    createObjectURLMock = jest.fn(() => `blob:test-${++urlCounter}`);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    });
    BlobManager.revokeAll();
    revokeObjectURLMock.mockClear();
  });

  afterAll(() => {
    BlobManager.revokeAll();
  });

  it('creates and registers a blob URL', () => {
    const url = BlobManager.createURL(makeBlob(), 'test');
    expect(url).toBe('blob:test-1');

    const stats = BlobManager.getStats();
    expect(stats.totalURLs).toBe(1);
    expect(stats.byContext.test).toBe(1);
  });

  it('keeps the URL alive until every consumer released it', () => {
    const url = BlobManager.createURL(makeBlob());

    BlobManager.retainURL(url);
    BlobManager.releaseURL(url);
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    BlobManager.releaseURL(url);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(url);
    expect(BlobManager.getStats().totalURLs).toBe(0);
  });

  it('revokes unmanaged URLs directly', () => {
    BlobManager.releaseURL('blob:foreign');
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:foreign');
  });

  it('forceRevoke removes an entry regardless of refcount', () => {
    const url = BlobManager.createURL(makeBlob());
    BlobManager.retainURL(url);

    BlobManager.forceRevoke(url);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(url);
    expect(BlobManager.getStats().totalURLs).toBe(0);
  });

  // Documents current behavior: createURL registers with refCount 1 and
  // releaseURL removes entries once they reach 0, so every registered entry
  // is "still referenced" and cleanupOld never cleans anything.
  // KNOWN LATENT BUG — cleanupOld is effectively dead code. Fixing it needs a
  // product decision (e.g. track released-but-unrevokeable URLs separately).
  it('cleanupOld never revokes entries that still hold references', () => {
    const url = BlobManager.createURL(makeBlob());
    BlobManager.retainURL(url);

    const future = Date.now() + 10 * 60_000;
    jest.spyOn(Date, 'now').mockReturnValue(future);
    try {
      expect(BlobManager.cleanupOld(5 * 60_000)).toBe(0);
      expect(revokeObjectURLMock).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('revokeAll clears the registry', () => {
    BlobManager.createURL(makeBlob());
    BlobManager.createURL(makeBlob());

    BlobManager.revokeAll();
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2);
    expect(BlobManager.getStats().totalURLs).toBe(0);
  });
});
