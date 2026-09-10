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
});
