import { POST } from './route';

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => 'sk_test'),
}));

describe('/api/media/ingest route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects disallowed source URLs before fetching', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network access not allowed'));

    const request = new Request('http://localhost/api/media/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: 'http://127.0.0.1:3000/pwn.png',
        kind: 'image',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('forwards the resolved Pollinations auth header when fetching the source media', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'content-length': '2048',
          'content-type': 'image/png',
        }),
        arrayBuffer: async () => Uint8Array.from({ length: 2048 }, () => 1).buffer,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          id: 'media-key',
          url: 'https://media.pollinations.ai/media-key',
          contentType: 'image/png',
        }),
      } as Response);

    const request = new Request('http://localhost/api/media/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: 'https://gen.pollinations.ai/image/example.png',
        kind: 'image',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      'https://gen.pollinations.ai/image/example.png',
      expect.objectContaining({
        redirect: 'follow',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test',
        }),
      }),
    );
  });
});
