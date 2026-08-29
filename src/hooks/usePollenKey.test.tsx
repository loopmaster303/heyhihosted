import { act, renderHook, waitFor } from '@testing-library/react';
import { usePollenKey } from './usePollenKey';

describe('usePollenKey', () => {
  const originalLocation = window.location;
  const originalHistoryReplaceState = window.history.replaceState;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as any;
    localStorage.clear();
    window.history.replaceState = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        hash: '',
        pathname: '/unified',
        search: '',
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/unified',
      },
    });
  });

  afterEach(() => {
    window.history.replaceState = originalHistoryReplaceState;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('refreshes account info through the same-origin account route', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          balance: 5,
          expiresAt: '2026-04-01T00:00:00.000Z',
          expiresIn: 60,
          valid: true,
          keyType: 'oauth',
          pollenBudget: 10,
          rateLimitEnabled: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    renderHook(() => usePollenKey());

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/pollen/account',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Pollen-Key': 'sk_test',
          }),
        }),
      ),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://enter.pollinations.ai/api/account/balance',
      expect.anything(),
    );
  });

  it('connectManual ignores invalid keys', async () => {
    const { result } = renderHook(() => usePollenKey());

    await act(async () => {
      result.current.connectManual('bad key with spaces');
    });

    expect(localStorage.getItem('pollenApiKey')).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  // Drei Lampenzustaende: 403 (fehlende account:usage-Berechtigung) ist KEIN
  // Trennungsfall — nur 401 faerbt rot (F5, Befund A).
  it('reports keyStatus ok when the account route answers 200', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ balance: 5 }), { status: 200 }));

    const { result } = renderHook(() => usePollenKey());
    await waitFor(() => expect(result.current.keyStatus).toBe('ok'));
  });

  it('reports keyStatus rejected on 401', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'bad key' }), { status: 401 }));

    const { result } = renderHook(() => usePollenKey());
    await waitFor(() => expect(result.current.keyStatus).toBe('rejected'));
  });

  it('reports keyStatus unverifiable on 403 and keeps the plain-text reason', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    fetchMock.mockResolvedValue(new Response(
      JSON.stringify({ error: "API key does not have 'account:usage' permission" }),
      { status: 403 },
    ));

    const { result } = renderHook(() => usePollenKey());
    await waitFor(() => expect(result.current.keyStatus).toBe('unverifiable'));
    expect(result.current.keyDetail).toContain('account:usage');
  });

  it('starts with keyStatus none and returns there after disconnect', async () => {
    const { result } = renderHook(() => usePollenKey());
    expect(result.current.keyStatus).toBe('none');

    localStorage.setItem('pollenApiKey', 'sk_test');
    await act(async () => {
      result.current.disconnect();
    });
    expect(result.current.keyStatus).toBe('none');
  });
});
