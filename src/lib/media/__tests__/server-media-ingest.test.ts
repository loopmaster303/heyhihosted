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
