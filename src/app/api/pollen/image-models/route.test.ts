const resolvePollenKeyMock = jest.fn((_r?: Request): string | undefined => undefined);
jest.mock('@/lib/resolve-pollen-key', () => ({ resolvePollenKey: (r?: Request) => resolvePollenKeyMock(r) }));

import { GET, _clearCacheForTesting } from './route';

const originalFetch = global.fetch;
const URL_MODELS = 'http://localhost/api/pollen/image-models';

/**
 * Die kanonische Freiliste des Betreiber-Schluessels, live gemessen am
 * 2026-09-10 gegen gen.pollinations.ai/image/models: genau diese fuenf Modelle
 * bedient der Schluessel. Hier als Ausschnitt mit Aliasen.
 */
const FREIE_SICHT = [
  {
    name: 'tongyi-mai/z-image-turbo',
    aliases: ['z-image', 'z-image-turbo', 'zimage'],
    paid_only: false,
  },
];

/** Die Bezahl-Auswahl des Katalogs — genau diese Eintraege muessen gesperrt erscheinen. */
const BEZAHL_KLASSIKER = [
  'nanobanana-2',
  'nanobanana-pro',
  'grok-imagine',
  'grok-imagine-pro',
  'grok-imagine-image-2.0',
  'seedream5',
  'qwen-image-3',
  'gptimage',
  'gptimage-large',
  'flux',
  'veo',
  'grok-imagine-video-1.5',
  'seedance-2.5',
];

interface AntwortEintrag {
  name: string;
  aliases?: string[];
  paid_only?: boolean;
  runnable?: boolean;
}

/** Der Anbieter antwortet mit der Sicht, die zu diesem Schluessel passt. */
function anbieterAntwort(models: unknown[]): Response {
  return new Response(JSON.stringify(models), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('/api/pollen/image-models', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    _clearCacheForTesting();
    resolvePollenKeyMock.mockReturnValue(undefined);
    global.fetch = jest.fn(async () => anbieterAntwort(FREIE_SICHT)) as unknown as typeof fetch;
  });
  afterAll(() => { global.fetch = originalFetch; });

  it('proxies without Authorization when no key present', async () => {
    const res = await GET(new Request(URL_MODELS));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
    // Die Sicht kommt unveraendert an und traegt zusaetzlich ihre Freigabe.
    const models = (await res.json()) as AntwortEintrag[];
    expect(models[0]).toMatchObject({ name: 'tongyi-mai/z-image-turbo', runnable: true });
  });

  it('forwards Authorization when key present', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    await GET(new Request(URL_MODELS));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer sk-abc');
  });

  it('serves the cached body on the second call within 60s', async () => {
    await GET(new Request(URL_MODELS));
    await GET(new Request(URL_MODELS));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // WARUM ueber Alias geprueft wird: der Betreiber-Schluessel liefert
  // 'black-forest-labs/flux.2-klein-4b' mit den Aliasen 'flux-klein' und
  // 'klein' (live belegt 2026-09-10). Ein Vergleich nur ueber den Namen haelt
  // 'klein' fuer gesperrt und blendet ein Modell aus, das einwandfrei laeuft.
  it('stempelt die Freigabe ueber Name und Alias', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    global.fetch = jest.fn(async () => anbieterAntwort([
      { name: 'black-forest-labs/flux.2-klein-4b', aliases: ['flux-klein', 'klein'], paid_only: false },
    ])) as unknown as typeof fetch;

    const res = await GET(new Request(URL_MODELS));
    const models = (await res.json()) as AntwortEintrag[];

    expect(res.status).toBe(200);
    expect(models[0].runnable).toBe(true);
    // Lauffaehig ist nur die Sicht des Schluessels; 'klein' ist ein Alias und
    // bekommt keinen eigenen Eintrag, schon gar keinen gesperrten.
    expect(models.filter((m) => m.runnable).map((m) => m.name)).toEqual(['black-forest-labs/flux.2-klein-4b']);
    expect(models.filter((m) => m.runnable === false).map((m) => m.name)).toEqual(BEZAHL_KLASSIKER);
  });

  // Die kuratierten Klassiker sind der einzige Grund, warum die Route ueberhaupt
  // einen gesperrten Eintrag ausliefert: ohne sie saehe ein Nutzer mit eigenem
  // Guthaben nicht, was er kaufen koennte.
  it('haengt die kuratierten Bezahl-Klassiker gesperrt an', async () => {
    const res = await GET(new Request(URL_MODELS));
    const models = (await res.json()) as AntwortEintrag[];

    const gesperrt = models.filter((m) => m.runnable === false);
    expect(gesperrt.map((m) => m.name)).toEqual(BEZAHL_KLASSIKER);
    // Gesperrt heisst immer auch bezahlt — sonst waere der Eintrag nur kaputt.
    expect(gesperrt.every((m) => m.paid_only === true)).toBe(true);
  });

  // Live belegt am 2026-09-10: die Vereinigung lieferte 82 Modelle, von denen
  // der Betreiber-Schluessel genau 5 bedienen durfte. Der Rest scheiterte erst
  // bei der Generierung mit 403 ("Model 'flux' is not allowed for this API key")
  // — und 'flux' war der Vorgabewert des Chats. Die Liste beantwortet deshalb
  // nur noch eine Frage: was kann der Aufrufer wirklich generieren? Die
  // Berechtigungsfilterung macht der Anbieter selbst.
  it('liefert nur die Sicht des Schluessels, nicht die Vereinigung', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    const GEKEYT = [
      { name: 'tongyi-mai/z-image-turbo', paid_only: false },
      { name: 'openai/gpt-image-2', paid_only: false },
    ];
    global.fetch = jest.fn().mockResolvedValue(anbieterAntwort(GEKEYT)) as unknown as typeof fetch;

    const res = await GET(new Request(URL_MODELS));
    const models = (await res.json()) as AntwortEintrag[];

    expect(res.status).toBe(200);
    expect(models.filter((m) => m.runnable).map((m) => m.name))
      .toEqual(['tongyi-mai/z-image-turbo', 'openai/gpt-image-2']);
    // Genau ein Abruf: der oeffentliche Katalog wird nicht mehr dazugeholt.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer sk-abc');
  });

  it('meldet 503, wenn keine Sicht antwortet', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(new Response('gateway down', { status: 502 })) as unknown as typeof fetch;

    const res = await GET(new Request(URL_MODELS));

    expect(res.status).toBe(503);
    expect(((await res.json()) as { code: string }).code).toBe('PROVIDER_UNAVAILABLE');
    warn.mockRestore();
  });
});
