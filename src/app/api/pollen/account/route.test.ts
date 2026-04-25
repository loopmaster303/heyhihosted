import { GET } from './route';

const resolvePollenKeyMock = jest.fn();

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (...args: unknown[]) => resolvePollenKeyMock(...args),
}));

describe('/api/pollen/account route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    resolvePollenKeyMock.mockReset();
    jest.restoreAllMocks();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('returns 401 when no valid BYOP key is available', async () => {
    resolvePollenKeyMock.mockReturnValue(undefined);

    const response = await GET(
      new Request('http://localhost/api/pollen/account', { method: 'GET' }),
    );

    expect(response.status).toBe(401);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringMatching(/Missing Pollinations API key/i),
      }),
      expect.objectContaining({ status: 401 }),
    );
  });

  it('returns normalized account information from Pollinations', async () => {
    resolvePollenKeyMock.mockReturnValue('sk_test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          balance: 12,
          expires_at: '2026-04-01T00:00:00.000Z',
          expires_in: 1440,
          valid: true,
          key_type: 'oauth',
          pollen_budget: 99,
          rate_limit_enabled: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ) as any,
    );

    const response = await GET(
      new Request('http://localhost/api/pollen/account', { method: 'GET' }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://gen.pollinations.ai/account/balance',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test',
        }),
      }),
    );
    expect(responseJson).toHaveBeenCalledWith(
      {
        balance: 12,
        expiresAt: '2026-04-01T00:00:00.000Z',
        expiresIn: 1440,
        valid: true,
        keyType: 'oauth',
        pollenBudget: 99,
        rateLimitEnabled: true,
      },
      undefined,
    );
  });
});
