import { resolveReferenceUrls } from './reference-utils';
import { resolvePollinationsMediaUrl } from './pollinations-media';
import type { UploadedReference } from '@/types';

jest.mock('./pollinations-media', () => ({
  resolvePollinationsMediaUrl: jest.fn(),
}));

const resolvePollinationsMediaUrlMock = jest.mocked(resolvePollinationsMediaUrl);

describe('resolveReferenceUrls', () => {
  beforeEach(() => {
    resolvePollinationsMediaUrlMock.mockReset();
  });

  it('passes through references without a key', async () => {
    const result = await resolveReferenceUrls([{ url: 'https://media.example/a.png' }]);
    expect(result).toEqual(['https://media.example/a.png']);
    expect(resolvePollinationsMediaUrlMock).not.toHaveBeenCalled();
  });

  it('keeps fresh keyed references without refreshing', async () => {
    const ref: UploadedReference = {
      url: 'https://media.example/fresh.png',
      key: 'k1',
      expiresAt: Date.now() + 10 * 60_000,
    };

    const result = await resolveReferenceUrls([ref]);
    expect(result).toEqual(['https://media.example/fresh.png']);
    expect(resolvePollinationsMediaUrlMock).not.toHaveBeenCalled();
  });

  it('refreshes stale keyed references', async () => {
    resolvePollinationsMediaUrlMock.mockResolvedValue({ mediaUrl: 'https://media.example/refreshed.png' } as never);
    const ref: UploadedReference = {
      url: 'https://media.example/stale.png',
      key: 'k2',
      expiresAt: Date.now() - 1000,
    };

    const result = await resolveReferenceUrls([ref]);
    expect(resolvePollinationsMediaUrlMock).toHaveBeenCalledWith('k2');
    expect(result).toEqual(['https://media.example/refreshed.png']);
  });

  it('falls back to the old URL when the refresh fails', async () => {
    resolvePollinationsMediaUrlMock.mockRejectedValue(new Error('down'));
    const ref: UploadedReference = {
      url: 'https://media.example/stale.png',
      key: 'k3',
      expiresAt: Date.now() - 1000,
    };

    const result = await resolveReferenceUrls([ref]);
    expect(result).toEqual(['https://media.example/stale.png']);
  });

  it('skips empty references and entries without any usable URL', async () => {
    resolvePollinationsMediaUrlMock.mockResolvedValue({ mediaUrl: '' } as never);
    const refs = [
      null as unknown as UploadedReference,
      { url: '', key: 'k4', expiresAt: Date.now() - 1000 },
    ];

    const result = await resolveReferenceUrls(refs);
    expect(result).toEqual([]);
  });
});
