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

  // Live belegt am 2026-09-10: ein Schluessel ohne Guthaben sah 2 von 82
  // Modellen. Eine Auswahlliste, die nur diese Sicht zeigt, versteckt 23
  // kostenlose Modelle vor jedem Nutzer ohne eigenen Schluessel.
  it('liefert die Vereinigung: Freigaben des Schluessels plus oeffentlicher Katalog', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    const GEKEYT = [{ name: 'tongyi-mai/z-image-turbo', paid_only: false }];
    const KATALOG = [
      { name: 'tongyi-mai/z-image-turbo', paid_only: false },
      { name: 'qwen/qwen-image-3', paid_only: true },
    ];
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(GEKEYT), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(KATALOG), { status: 200 })) as unknown as typeof fetch;

    const res = await GET(new Request('http://localhost/api/pollen/image-models'));
    const models = (await res.json()) as Array<{ name: string }>;

    expect(res.status).toBe(200);
    expect(models.map((m) => m.name)).toEqual(['tongyi-mai/z-image-turbo', 'qwen/qwen-image-3']);
    // Die zweite Sicht ist der oeffentliche Katalog — ohne Schluessel.
    expect((global.fetch as jest.Mock).mock.calls[1][1].headers.Authorization).toBeUndefined();
  });

  it('meldet 503, wenn keine Sicht antwortet', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(new Response('gateway down', { status: 502 })) as unknown as typeof fetch;

    const res = await GET(new Request('http://localhost/api/pollen/image-models'));

    expect(res.status).toBe(503);
    expect(((await res.json()) as { code: string }).code).toBe('PROVIDER_UNAVAILABLE');
    warn.mockRestore();
  });
});
