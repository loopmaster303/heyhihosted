import { GET } from './route';
import { MAX_UPLOAD_BYTES } from '@/lib/upload/constants';

describe('/api/proxy-image route', () => {
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

  it('rejects disallowed remote urls', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network access not allowed'));

    const response = await GET(
      new Request('http://localhost/api/proxy-image?url=http://127.0.0.1:3000/x.png')
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('proxies allowed image responses', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(bytes, {
        status: 200,
        headers: {
          'content-type': 'image/png',
          'content-length': '3',
        },
      }) as any
    );

    const response = await GET(
      new Request('http://localhost/api/proxy-image?url=https://media.pollinations.ai/x.png')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(await response.arrayBuffer()).toEqual(bytes);
  });

  it('rejects non-image response content types', async () => {
    const arrayBuffer = jest.fn();
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer,
    } as any);

    const response = await GET(
      new Request('http://localhost/api/proxy-image?url=https://media.pollinations.ai/not-image')
    );

    expect(response.status).toBe(415);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it('rejects oversized images from Content-Length before reading the body', async () => {
    const arrayBuffer = jest.fn();
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': String(MAX_UPLOAD_BYTES + 1),
      }),
      arrayBuffer,
    } as any);

    const response = await GET(
      new Request('http://localhost/api/proxy-image?url=https://media.pollinations.ai/too-large.png')
    );

    expect(response.status).toBe(413);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it('rejects oversized image bodies when Content-Length is missing', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: async () => new ArrayBuffer(MAX_UPLOAD_BYTES + 1),
    } as any);

    const response = await GET(
      new Request('http://localhost/api/proxy-image?url=https://media.pollinations.ai/no-length.jpg')
    );

    expect(response.status).toBe(413);
  });
});
