const resolvePollenKeyMock = jest.fn((_r?: Request): string | undefined => undefined);
jest.mock('@/lib/resolve-pollen-key', () => ({ resolvePollenKey: (r?: Request) => resolvePollenKeyMock(r) }));

import { GET, _clearCacheForTesting } from './route';

const originalFetch = global.fetch;

describe('/api/pollen/image-models', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    _clearCacheForTesting();
    resolvePollenKeyMock.mockReturnValue(undefined);
    global.fetch = jest.fn(async () => new Response(JSON.stringify([{ id: 'flux' }]), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  });
  afterAll(() => { global.fetch = originalFetch; });

  it('proxies without Authorization when no key present', async () => {
    const res = await GET(new Request('http://localhost/api/pollen/image-models'));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(await res.json()).toEqual([{ id: 'flux' }]);
  });

  it('forwards Authorization when key present', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    await GET(new Request('http://localhost/api/pollen/image-models'));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer sk-abc');
  });

  it('serves the cached body on the second call within 60s', async () => {
    await GET(new Request('http://localhost/api/pollen/image-models'));
    await GET(new Request('http://localhost/api/pollen/image-models'));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
