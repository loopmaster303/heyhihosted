/**
 * @jest-environment node
 */
import { httpsPost, httpsFetchBinary, httpsPostStream } from '../https-post';

describe('https-post — schlichter fetch statt Kindprozess', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('sends headers and body unchanged and returns status plus text', async () => {
    const fetchMock = jest.fn(async () => new Response('{"ok":true}', { status: 201 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await httpsPost('https://gen.example/v1/chat', { Authorization: 'Bearer sk_x', 'Content-Type': 'application/json' }, '{"a":1}');

    expect(res).toEqual({ status: 201, body: '{"ok":true}' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://gen.example/v1/chat');
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}', headers: { Authorization: 'Bearer sk_x', 'Content-Type': 'application/json' } });
  });

  it('turns a timeout into a readable error', async () => {
    global.fetch = jest.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'TimeoutError' });
    }) as unknown as typeof fetch;

    await expect(httpsFetchBinary('https://gen.example/audio', {}, 1234)).rejects.toThrow('timed out after 1234ms');
  });

  it('returns binary bodies with their content type', async () => {
    global.fetch = jest.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/mpeg' } })) as unknown as typeof fetch;
    const res = await httpsFetchBinary('https://gen.example/audio');
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('audio/mpeg');
    expect([...res.buffer]).toEqual([1, 2, 3]);
  });

  it('streams the body after the headers arrived', async () => {
    global.fetch = jest.fn(async () => new Response('data: hi\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } })) as unknown as typeof fetch;
    const res = await httpsPostStream('https://gen.example/v1/chat', {}, '{}');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/event-stream');
    expect(await new Response(res.stream).text()).toBe('data: hi\n\n');
  });
});
