import { fetchAndStoreRemoteMedia } from '../server-media-ingest';

describe('fetchAndStoreRemoteMedia abort handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('does not fetch when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      fetchAndStoreRemoteMedia({
        sourceUrl: 'https://media.pollinations.ai/abc.png',
        apiKey: 'sk_test',
        kind: 'image',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ statusCode: 499 });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('forwards the abort signal to the source fetch', async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    global.fetch = jest.fn(async (_url: string, opts: any) => {
      receivedSignal = opts?.signal;
      controller.abort();
      const err = new Error('aborted');
      (err as any).name = 'AbortError';
      throw err;
    }) as any;

    await expect(
      fetchAndStoreRemoteMedia({
        sourceUrl: 'https://media.pollinations.ai/abc.png',
        apiKey: 'sk_test',
        kind: 'image',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ statusCode: 499 });

    expect(receivedSignal).toBe(controller.signal);
  });
});

/**
 * Vorher stand im Log und in der Antwort nur "Timed out waiting for media" —
 * ohne Status, Content-Type oder Hinweis, was die Quelle stattdessen geschickt
 * hat. Diese Faelle pruefen, dass der Grund mitgeliefert wird.
 */
describe('fetchAndStoreRemoteMedia Fehlerdiagnose', () => {
  const originalFetch = global.fetch;

  const asArrayBuffer = (text: string) => new TextEncoder().encode(text).buffer;

  const responseMock = (status: number, contentType: string, body: string) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name === 'content-type' ? contentType : null),
    },
    arrayBuffer: async () => asArrayBuffer(body),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('bricht bei wiederholtem 5xx frueh ab und nennt Status und Body', async () => {
    global.fetch = jest.fn(async () =>
      responseMock(503, 'application/json', '{"error":"model overloaded"}'),
    ) as unknown as typeof fetch;

    const promise = fetchAndStoreRemoteMedia({
      sourceUrl: 'https://image.pollinations.ai/prompt/test',
      kind: 'image',
    });
    const rejection = expect(promise).rejects.toMatchObject({ statusCode: 502 });

    await jest.advanceTimersByTimeAsync(2500);
    await rejection;
    await expect(promise).rejects.toThrow(/status 503/);
    await expect(promise).rejects.toThrow(/model overloaded/);
  });

  it('nennt bei Zeitueberschreitung die letzte Antwort der Quelle', async () => {
    global.fetch = jest.fn(async () =>
      responseMock(200, 'text/html', '<html>gateway wartet</html>'),
    ) as unknown as typeof fetch;

    const promise = fetchAndStoreRemoteMedia({
      sourceUrl: 'https://image.pollinations.ai/prompt/test',
      kind: 'image',
    });
    const rejection = expect(promise).rejects.toMatchObject({ statusCode: 504 });

    for (let i = 0; i < 61; i += 1) {
      await jest.advanceTimersByTimeAsync(2000);
    }

    await rejection;
    await expect(promise).rejects.toThrow(/content-type text\/html/);
    await expect(promise).rejects.toThrow(/gateway wartet/);
  });

  // Live belegt am 2026-09-10: gpt-image antwortet 400 "Your request was
  // rejected by the safety system". Vorher wurde daraus PROVIDER_UNAVAILABLE
  // ("Der Anbieter antwortet gerade nicht ... erneut versuchen") — der Nutzer
  // haette denselben Prompt endlos wiederholt.
  it('nennt einen abgelehnten Inhalt beim Namen statt eines Ausfalls', async () => {
    global.fetch = jest.fn(async () => responseMock(
      400,
      'application/json',
      '{"success":false,"error":{"message":"Your request was rejected by the safety system."}}',
    )) as unknown as typeof fetch;

    const promise = fetchAndStoreRemoteMedia({
      sourceUrl: 'https://image.pollinations.ai/prompt/test',
      kind: 'image',
      // Der Aufrufer kennt das Modell, das Ingest nicht — ohne diesen Namen
      // liest der Nutzer nur "Der Anbieter hat den Prompt abgelehnt."
      modelLabel: 'GPT Image 2.5 Flare',
    });
    const rejection = expect(promise).rejects.toMatchObject({
      statusCode: 400,
      code: 'CONTENT_REJECTED',
      details: { modelLabel: 'GPT Image 2.5 Flare' },
    });

    await jest.advanceTimersByTimeAsync(2500);
    await rejection;
    await expect(promise).rejects.toThrow(/safety system/);
  });

});

/**
 * Der Ausweichpfad sitzt im Poll-Loop. Hier laufen die echten Timer: eine
 * Runde mit 402 auf den Server-Schluessel, danach die Runde ohne ihn.
 *
 * Live belegt am 2026-09-10: mit leerem Betreiber-Schluessel antwortet
 * Pollinations auf jede Medien-URL mit 402, ohne ihn liefert dasselbe freie
 * Modell ein Bild. Vorher lief die Abfrage 120 s in den Timeout.
 */
describe('fetchAndStoreRemoteMedia Ausweichpfad ohne Server-Schluessel', () => {
  const originalFetch = global.fetch;
  const asArrayBuffer = (text: string) => new TextEncoder().encode(text).buffer;
  const responseMock = (status: number, contentType: string, body: string) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name === 'content-type' ? contentType : null),
    },
    arrayBuffer: async () => asArrayBuffer(body),
  });
  const budgetBody = JSON.stringify({
    error: { message: 'API key budget too low. This request costs ~0.0020 pollen, but this key has 0.0000.' },
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('laesst den Server-Schluessel bei leerem Budget fallen und holt das Bild anonym', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // 1000 Bytes sind die Untergrenze (SMALL_BLOB_SKIP_BYTES); darunter gilt
    // eine Antwort als noch nicht fertig und die Schleife pollt weiter.
    const bild = 'B'.repeat(1200);
    const uploadAntwort = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ id: 'stored-1', url: 'https://media.pollinations.ai/stored-1' }),
    };
    // Die Quelle liefert das Bild, der Media-Upload danach das gespeicherte
    // Ergebnis. Beides laeuft ueber dasselbe fetch.
    const fetchMock = jest.fn(
      async (url: string, _init?: RequestInit): Promise<unknown> => (
        String(url).endsWith('/upload') ? uploadAntwort : responseMock(200, 'image/jpeg', bild)
      ),
    );
    fetchMock.mockResolvedValueOnce(responseMock(402, 'application/json', budgetBody));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchAndStoreRemoteMedia({
      sourceUrl: 'https://media.pollinations.ai/abc.png',
      apiKey: 'server-key-ohne-budget',
      kind: 'image',
      fallbackToAnonymous: true,
    });

    expect(result.url).toBe('https://media.pollinations.ai/stored-1');
    const quellen = fetchMock.mock.calls.filter(([url]) => String(url).includes('media.pollinations.ai'));
    expect(quellen.length).toBeGreaterThanOrEqual(2);
    expect(quellen[0]![1]!.headers).toHaveProperty('Authorization', 'Bearer server-key-ohne-budget');
    expect(quellen[1]![1]!.headers).not.toHaveProperty('Authorization');
  });

  it('haelt den Schluessel, wenn der Aufrufer den Ausweichpfad nicht erlaubt', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const controller = new AbortController();
    const fetchMock = jest.fn(async (_url: string, _init?: RequestInit): Promise<unknown> => {
      // Zweiter Abruf: der Test endet per Abbruch, statt 120 s zu warten.
      controller.abort();
      const err = new Error('aborted');
      (err as any).name = 'AbortError';
      throw err;
    });
    fetchMock.mockResolvedValueOnce(responseMock(402, 'application/json', budgetBody));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchAndStoreRemoteMedia({
      sourceUrl: 'https://media.pollinations.ai/abc.png',
      apiKey: 'sk_user',
      kind: 'image',
      signal: controller.signal,
    })).rejects.toMatchObject({ statusCode: 499 });

    expect(fetchMock.mock.calls[0]![1]!.headers).toHaveProperty('Authorization', 'Bearer sk_user');
  });
});
