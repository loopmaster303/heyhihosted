import { DELETE } from './route';

const resolvePollenKeyMock = jest.fn();

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request: Request) => resolvePollenKeyMock(request),
}));

describe('/api/media/delete route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));
  const originalFetch = global.fetch;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resolvePollenKeyMock.mockReset();
    resolvePollenKeyMock.mockReturnValue('sk_test');
    global.fetch = jest.fn();
    responseJson.mockClear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  const makeRequest = (key?: string) => {
    const url = key === undefined
      ? 'http://localhost/api/media/delete'
      : `http://localhost/api/media/delete?key=${encodeURIComponent(key)}`;
    return new Request(url, { method: 'DELETE' });
  };

  it('rejects a missing key with 400', async () => {
    const response = await DELETE(makeRequest());

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(['', 'abc/def', '..', 'a..b', '%2e%2e', 'key?x', 'key#y'])(
    'rejects the invalid key %s with 400',
    async (key) => {
      const response = await DELETE(makeRequest(key));

      expect(response.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    },
  );

  it('rejects a missing Pollinations API key with 401', async () => {
    resolvePollenKeyMock.mockReturnValue('');

    const response = await DELETE(makeRequest('abc123'));

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards a DELETE with Bearer auth for a valid key', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await DELETE(makeRequest('abc123'));

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://media.pollinations.ai/abc123',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test',
        }),
      }),
    );
  });

  it('treats an upstream 404 as success (already gone)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 404 }));

    const response = await DELETE(makeRequest('abc123'));

    expect(response.status).toBe(200);
  });

  it.each([401, 403])('maps upstream %i to ApiError', async (status) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status }));

    const response = await DELETE(makeRequest('abc123'));

    expect(response.status).toBe(status);
  });

  it('maps other upstream errors to 502 without leaking upstream error text', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('upstream internals', { status: 500 }),
    );

    const response = await DELETE(makeRequest('abc123'));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe('Upstream media delete failed (500)');
    expect(body.error).not.toContain('upstream internals');
  });
});
