import { GET } from './route';

describe('/api/capabilities route', () => {
  const originalPrunaApiKey = process.env.PRUNA_API_KEY;
  const originalResponseJson = Response.json;
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  afterEach(() => {
    if (originalPrunaApiKey === undefined) {
      delete (process.env as any).PRUNA_API_KEY;
    } else {
      process.env.PRUNA_API_KEY = originalPrunaApiKey;
    }
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: originalResponseJson,
    });
  });

  it('reports Pruna availability when PRUNA_API_KEY is configured', async () => {
    process.env.PRUNA_API_KEY = 'test-key';

    await GET();
    const body = responseJson.mock.calls.at(-1)?.[0];

    expect(body).toEqual({ prunaAvailable: true });
  });

  it('does not leak key material when Pruna is unavailable', async () => {
    delete (process.env as any).PRUNA_API_KEY;

    await GET();
    const body = responseJson.mock.calls.at(-1)?.[0];

    expect(body).toEqual({ prunaAvailable: false });
    expect(JSON.stringify(body)).not.toContain('test-key');
  });
});
