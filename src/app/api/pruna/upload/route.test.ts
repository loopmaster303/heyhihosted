import { POST } from './route';

const uploadPrunaFileMock = jest.fn();
jest.mock('@/lib/pruna/client', () => ({
  uploadPrunaFile: (...args: unknown[]) => uploadPrunaFileMock(...args),
}));
jest.mock('@/lib/resolve-pruna-key', () => ({
  resolvePrunaKey: (request: Request) => request.headers.get('X-Pruna-Key'),
}));

describe('/api/pruna/upload', () => {
  const originalResponseJson = Response.json;
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));
  beforeEach(() => {
    uploadPrunaFileMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });
  afterEach(() => Object.defineProperty(Response, 'json', { configurable: true, value: originalResponseJson }));

  it('uploads raw media with the resolved user key', async () => {
    uploadPrunaFileMock.mockResolvedValue('https://api.pruna.ai/v1/files/ref');
    const response = await POST(new Request('http://localhost/api/pruna/upload?filename=ref.png', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Pruna-Key': 'user_pruna_1234567890' },
      body: new Uint8Array([1, 2, 3]),
    }));

    expect(response.status).toBe(200);
    expect(responseJson.mock.calls.at(-1)?.[0]).toEqual({ url: 'https://api.pruna.ai/v1/files/ref' });
    expect(uploadPrunaFileMock).toHaveBeenCalledWith(expect.any(Buffer), 'ref.png', 'user_pruna_1234567890');
  });

  it('rejects missing keys and non-media content', async () => {
    const missingKey = await POST(new Request('http://localhost/api/pruna/upload?filename=ref.png', {
      method: 'POST', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array([1]),
    }));
    expect(missingKey.status).toBe(503);

    const invalidType = await POST(new Request('http://localhost/api/pruna/upload?filename=ref.txt', {
      method: 'POST', headers: { 'Content-Type': 'text/plain', 'X-Pruna-Key': 'user_pruna_1234567890' }, body: 'x',
    }));
    expect(invalidType.status).toBe(400);
  });
});
