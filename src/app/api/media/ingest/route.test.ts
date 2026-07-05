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

  it('rejects an arbitrary public https source URL that is not in the Pollinations allowlist', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network access not allowed'));

    const request = new Request('http://localhost/api/media/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: 'https://evil.example.com/pwn.png',
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
        redirect: 'manual',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test',
        }),
      }),
    );
  });

  it('rejects a redirect to a private URL before following it', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({
        location: 'http://127.0.0.1:3000/secret',
      }),
      arrayBuffer: async () => new ArrayBuffer(0),
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

    expect(response.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a redirect to an internal hostname before following it', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({
        location: 'http://metadata.internal/latest/meta-data',
      }),
      arrayBuffer: async () => new ArrayBuffer(0),
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

    expect(response.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('follows a safe public redirect without leaking auth and returns the ingested media', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({
          location: 'https://cdn.example.com/image.png',
        }),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response)
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
        redirect: 'manual',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test',
        }),
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      'https://cdn.example.com/image.png',
      expect.objectContaining({
        redirect: 'manual',
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it('rejects a redirect response that is missing a Location header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
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

    expect(response.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects too many redirects', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const u = typeof url === 'string' ? url : (url as URL).href;
      const counter = Number(new URL(u).searchParams.get('c') || '0');
      return {
        ok: false,
        status: 302,
        headers: new Headers({
          location: `https://gen.pollinations.ai/image/example.png?c=${counter + 1}`,
        }),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as Response;
    });

    const request = new Request('http://localhost/api/media/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: 'https://gen.pollinations.ai/image/example.png?c=0',
        kind: 'image',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(6);
  });
});
