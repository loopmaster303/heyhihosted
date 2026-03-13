import { GET } from './route';

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
});
