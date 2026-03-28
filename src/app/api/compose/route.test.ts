const httpsFetchBinaryMock = jest.fn();
const resolvePollenKeyMock = jest.fn((_request?: Request) => '');

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request: Request) => resolvePollenKeyMock(request),
}));

jest.mock('@/lib/https-post', () => ({
  httpsFetchBinary: (...args: unknown[]) => httpsFetchBinaryMock(...args),
}));

describe('/api/compose route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    jest.resetModules();
    httpsFetchBinaryMock.mockReset();
    resolvePollenKeyMock.mockReset();
    resolvePollenKeyMock.mockReturnValue('');
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('rejects unknown compose models with a 400 response', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'lofi sunset',
        model: 'definitely-not-real',
      }),
    });

    const response = await POST(request as any);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown or unavailable pollinations compose model/i);
    expect(httpsFetchBinaryMock).not.toHaveBeenCalled();
  });

  it('caps duration at 120s without a pollen key', async () => {
    const { POST } = await import('./route');
    resolvePollenKeyMock.mockReturnValue('');
    httpsFetchBinaryMock.mockResolvedValueOnce({
      status: 200,
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
    });

    const request = new Request('http://localhost/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'lofi sunset', model: 'elevenmusic', duration: 300 }),
    });

    await POST(request as any);
    expect(httpsFetchBinaryMock).toHaveBeenCalledWith(
      expect.stringContaining('duration=120'),
      expect.any(Object),
    );
  });

  it('allows full duration with a pollen key', async () => {
    const { POST } = await import('./route');
    resolvePollenKeyMock.mockReturnValue('sk_test_key');
    httpsFetchBinaryMock.mockResolvedValueOnce({
      status: 200,
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
    });

    const request = new Request('http://localhost/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'lofi sunset', model: 'elevenmusic', duration: 300 }),
    });

    await POST(request as any);
    expect(httpsFetchBinaryMock).toHaveBeenCalledWith(
      expect.stringContaining('duration=300'),
      expect.objectContaining({ Authorization: 'Bearer sk_test_key' }),
    );
  });

  it('rejects suno as an unknown model with 400', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'lofi sunset', model: 'suno' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    expect(httpsFetchBinaryMock).not.toHaveBeenCalled();
  });

  it('returns 414 when the compose prompt exceeds the GET endpoint URL limit', async () => {
    const { POST } = await import('./route');
    resolvePollenKeyMock.mockReturnValue('sk_test_key');
    const request = new Request('http://localhost/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'x'.repeat(3000),
        model: 'elevenmusic',
      }),
    });

    const response = await POST(request as any);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(414);
    expect(body.error).toMatch(/compose prompt too long/i);
    expect(httpsFetchBinaryMock).not.toHaveBeenCalled();
  });
});

export {};
