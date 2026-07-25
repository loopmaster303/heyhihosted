const resolvePollenKeyMock = jest.fn();

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request: Request) => resolvePollenKeyMock(request),
}));

describe('/api/media/upload route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));
  const originalFetch = global.fetch;

  beforeEach(() => {
    resolvePollenKeyMock.mockReset();
    resolvePollenKeyMock.mockReturnValue('sk_test');
    global.fetch = jest.fn();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects missing Pollinations API key before reading the body', async () => {
    const { POST } = await import('./route');
    resolvePollenKeyMock.mockReturnValue('');
    const request = new Request('http://localhost/api/media/upload', { method: 'POST' });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects oversized uploads from Content-Length before parsing form data', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: {
        'content-length': String(10 * 1024 * 1024 + 1),
      },
    });
    const formDataSpy = jest.spyOn(request, 'formData');

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects empty files', async () => {
    const { POST } = await import('./route');
    const formData = new FormData();
    formData.append('file', new File([], 'empty.png', { type: 'image/png' }));
    const request = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
    });
    jest.spyOn(request, 'formData').mockResolvedValueOnce(formData);

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts a raw file body and forwards it upstream as multipart form-data', async () => {
    const { POST } = await import('./route');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: 'media-id',
        url: 'https://media.pollinations.ai/media-id',
        contentType: 'image/png',
        size: 11,
      }),
    });
    const request = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: 'image-bytes',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const upstreamInit = (global.fetch as jest.Mock).mock.calls[0]?.[1] as RequestInit;
    const upstreamFile = (upstreamInit.body as FormData).get('file');

    expect(upstreamInit.body).toBeInstanceOf(FormData);
    expect(upstreamFile).toBeInstanceOf(File);
    expect((upstreamFile as File).type).toBe('image/png');
    expect((upstreamFile as File).size).toBe(11);
  });

  it('keeps accepting multipart uploads', async () => {
    const { POST } = await import('./route');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: 'legacy-id',
        url: 'https://media.pollinations.ai/legacy-id',
        contentType: 'image/jpeg',
        size: 6,
      }),
    });
    const formData = new FormData();
    formData.append('file', new File(['legacy'], 'legacy.jpg', { type: 'image/jpeg' }));
    const request = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
    });
    jest.spyOn(request, 'formData').mockResolvedValueOnce(formData);

    const response = await POST(request);
    const upstreamInit = (global.fetch as jest.Mock).mock.calls[0]?.[1] as RequestInit;
    const upstreamFile = (upstreamInit.body as FormData).get('file');

    expect(response.status).toBe(200);
    expect(upstreamFile).toBeInstanceOf(File);
    expect((upstreamFile as File).name).toBe('legacy.jpg');
  });

  it('forwards upstream upload failures', async () => {
    const { POST } = await import('./route');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => JSON.stringify({ error: 'upstream down' }),
    });
    const formData = new FormData();
    formData.append('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }));
    const request = new Request('http://localhost/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
    });
    jest.spyOn(request, 'formData').mockResolvedValueOnce(formData);

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe('upstream down');
  });
});
