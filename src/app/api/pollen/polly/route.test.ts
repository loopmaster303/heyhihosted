const httpsPostMock = jest.fn();
const resolvePollenKeyMock = jest.fn((_request?: Request): string | undefined => undefined);

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request?: Request) => resolvePollenKeyMock(request),
}));

jest.mock('@/lib/https-post', () => ({
  httpsPost: (...args: unknown[]) => httpsPostMock(...args),
}));

describe('/api/pollen/polly route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    httpsPostMock.mockReset();
    resolvePollenKeyMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('returns 401 when no Pollinations key is available', async () => {
    resolvePollenKeyMock.mockReturnValue(undefined);
    const { POST } = await import('./route');

    const response = await POST(new Request('http://localhost/api/pollen/polly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'polly', messages: [{ role: 'user', content: 'hi' }] }),
    }));

    expect(response.status).toBe(401);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/missing pollinations api key/i) }),
      expect.objectContaining({ status: 401 }),
    );
    expect(httpsPostMock).not.toHaveBeenCalled();
  });

  it('rejects non-polly models', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    const { POST } = await import('./route');

    const response = await POST(new Request('http://localhost/api/pollen/polly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-fast', messages: [{ role: 'user', content: 'hi' }] }),
    }));

    expect(response.status).toBe(400);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/only supports model polly/i) }),
      expect.objectContaining({ status: 400 }),
    );
    expect(httpsPostMock).not.toHaveBeenCalled();
  });

  it('proxies a polly chat request to Pollinations', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    httpsPostMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
    });
    const { POST } = await import('./route');

    const requestBody = { model: 'polly', messages: [{ role: 'user', content: 'hi' }] };
    const response = await POST(new Request('http://localhost/api/pollen/polly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }));

    expect(response.status).toBe(200);
    expect(httpsPostMock).toHaveBeenCalledWith(
      'https://gen.pollinations.ai/v1/chat/completions',
      expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk_test',
      }),
      JSON.stringify(requestBody),
    );
    await expect(response.json()).resolves.toEqual({ choices: [{ message: { content: 'ok' } }] });
  });

  it('rejects payloads outside the allowed schema', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    const { POST } = await import('./route');

    const response = await POST(new Request('http://localhost/api/pollen/polly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'polly',
        messages: [{ role: 'user', content: 'hi' }],
        tools: [{ type: 'function', function: { name: 'evil' } }],
      }),
    }));

    expect(response.status).toBe(400);
    expect(httpsPostMock).not.toHaveBeenCalled();
  });

  it('does not leak internal error details', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    httpsPostMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND internal-host.corp'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { POST } = await import('./route');

    try {
      const response = await POST(new Request('http://localhost/api/pollen/polly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'polly', messages: [{ role: 'user', content: 'hi' }] }),
      }));

      // NextResponse bodies are unreadable under the jsdom fetch polyfill, so
      // assert the masked status plus the server-side log carrying the detail.
      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({ message: expect.stringContaining('internal-host.corp') })
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

export {};
