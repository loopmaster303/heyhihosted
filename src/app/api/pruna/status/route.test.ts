import { GET } from './route';

const fetchPrunaPredictionStatusMock = jest.fn();
const deliverPrunaResultMock = jest.fn();
const resolvePollenKeyMock = jest.fn();

jest.mock('@/lib/pruna/client', () => ({
  fetchPrunaPredictionStatus: (...args: unknown[]) => fetchPrunaPredictionStatusMock(...args),
}));

jest.mock('@/lib/pruna/deliver', () => ({
  deliverPrunaResult: (...args: unknown[]) => deliverPrunaResultMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (...args: unknown[]) => resolvePollenKeyMock(...args),
}));

jest.mock('@/lib/resolve-pruna-key', () => ({
  resolvePrunaKey: (request: Request) => request.headers.get('X-Pruna-Key') || undefined,
}));

const withKey = (url: string) => new Request(url, { headers: { 'X-Pruna-Key': 'pru_test' } });

describe('/api/pruna/status route', () => {
  // NextResponse.json braucht das statische Response.json, das die Testumgebung
  // nicht mitbringt — dieselbe Ergaenzung wie in der generate-Route.
  const originalResponseJson = (Response as unknown as { json?: unknown }).json;
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeAll(() => {
    Object.defineProperty(Response, 'json', { configurable: true, value: responseJson });
  });

  afterAll(() => {
    Object.defineProperty(Response, 'json', { configurable: true, value: originalResponseJson });
  });

  beforeEach(() => {
    fetchPrunaPredictionStatusMock.mockReset();
    deliverPrunaResultMock.mockReset();
    responseJson.mockClear();
    resolvePollenKeyMock.mockReset().mockReturnValue('pollen-key');
  });

  it('answers 202 while the prediction is still running', async () => {
    fetchPrunaPredictionStatusMock.mockResolvedValueOnce('pending');

    const response = await GET(withKey('http://localhost/api/pruna/status?id=pred-1&model=vace'));

    expect(response.status).toBe(202);
    expect(responseJson.mock.calls.at(-1)?.[0]).toEqual({ pending: true, predictionId: 'pred-1' });
    expect(deliverPrunaResultMock).not.toHaveBeenCalled();
  });

  it('delivers the finished result exactly like the generate route does', async () => {
    fetchPrunaPredictionStatusMock.mockResolvedValueOnce({
      generationUrl: 'https://api.pruna.ai/v1/predictions/delivery/out.mp4',
      contentType: 'video/mp4',
    });
    deliverPrunaResultMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ videoUrl: 'https://media.pollinations.ai/done.mp4' })),
    );

    const response = await GET(withKey('http://localhost/api/pruna/status?id=pred-1&model=vace'));

    expect(response.status).toBe(200);
    expect(deliverPrunaResultMock).toHaveBeenCalledWith(expect.objectContaining({
      prunaApiKey: 'pru_test',
      pollenKey: 'pollen-key',
      isVideo: true,
    }));
  });

  it('requires a Pruna key', async () => {
    const response = await GET(new Request('http://localhost/api/pruna/status?id=pred-1&model=vace'));

    expect(response.status).toBe(503);
    expect(fetchPrunaPredictionStatusMock).not.toHaveBeenCalled();
  });

  // Das Modell steuert Download und Ausspielung — ein unbekanntes darf die
  // Route nicht bis zur Pruna-Abfrage durchlassen.
  it('rejects an unknown model before asking Pruna', async () => {
    const response = await GET(withKey('http://localhost/api/pruna/status?id=pred-1&model=not-a-model'));

    expect(response.status).toBe(400);
    expect(fetchPrunaPredictionStatusMock).not.toHaveBeenCalled();
  });

  it('rejects a missing prediction id', async () => {
    const response = await GET(withKey('http://localhost/api/pruna/status?model=vace'));

    expect(response.status).toBe(400);
    expect(fetchPrunaPredictionStatusMock).not.toHaveBeenCalled();
  });
});
