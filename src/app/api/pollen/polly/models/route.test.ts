const httpsGetMock = jest.fn();
const resolvePollenKeyMock = jest.fn((_request?: Request): string | undefined => undefined);

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request?: Request) => resolvePollenKeyMock(request),
}));

jest.mock('@/lib/https-post', () => ({
  httpsGet: (...args: unknown[]) => httpsGetMock(...args),
}));

describe('/api/pollen/polly/models route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    httpsGetMock.mockReset();
    resolvePollenKeyMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('returns 401 when no Pollinations key is available', async () => {
    resolvePollenKeyMock.mockReturnValue(undefined);
    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/pollen/polly/models', { method: 'GET' }));

    expect(response.status).toBe(401);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/missing pollinations api key/i) }),
      expect.objectContaining({ status: 401 }),
    );
    expect(httpsGetMock).not.toHaveBeenCalled();
  });

  it('proxies the Pollinations models endpoint', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    httpsGetMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ data: [{ id: 'polly' }] }),
    });
    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/pollen/polly/models', { method: 'GET' }));

    expect(response.status).toBe(200);
    expect(httpsGetMock).toHaveBeenCalledWith(
      'https://gen.pollinations.ai/v1/models',
      expect.objectContaining({
        Authorization: 'Bearer sk_test',
      }),
    );
    await expect(response.json()).resolves.toEqual({ data: [{ id: 'polly' }] });
  });
});

export {};
