import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';

const ACCOUNT_URL = '/api/pollen/account';
const CAPABILITIES_URL = '/api/capabilities';
const MODELS_URL = '/api/pollen/image-models';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function callsTo(url: string): unknown[][] {
  return (global.fetch as jest.Mock).mock.calls.filter(([target]) => target === url);
}

/**
 * Der Beleg fuer den Auftrag: die Zahl der gemounteten Instanzen darf die Zahl
 * der Netzwerk-Calls nicht mehr bestimmen. Vorher brachten sechs Instanzen
 * sechs Anfragen pro Minute an dieselben Routen.
 */
describe('geteilter Client-Datenpfad', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = jest.fn(async (url: string) => {
      if (url === ACCOUNT_URL) return jsonResponse({ balance: 5, valid: true });
      if (url === CAPABILITIES_URL) return jsonResponse({ prunaAvailable: true });
      if (url === MODELS_URL) return jsonResponse([]);
      throw new Error(`unerwartete Anfrage: ${url}`);
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    // Raeumt die Modul-Puffer: der naechste Test startet ohne Altlast.
    cleanup();
    localStorage.clear();
  });

  it('zwei pollenKey-Instanzen loesen genau eine Konto-Anfrage aus', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');

    const { result } = renderHook(() => ({ a: usePollenKey(), b: usePollenKey() }));

    await waitFor(() => expect(result.current.a.keyStatus).toBe('ok'));
    expect(result.current.b.keyStatus).toBe('ok');
    expect(callsTo(ACCOUNT_URL)).toHaveLength(1);
  });

  it('zwei providerMode-Instanzen loesen genau eine capabilities-Anfrage aus', async () => {
    const { result } = renderHook(() => ({ a: useProviderMode(), b: useProviderMode() }));

    await waitFor(() => expect(result.current.a.prunaAvailable).toBe(true));
    expect(result.current.b.prunaAvailable).toBe(true);
    expect(callsTo(CAPABILITIES_URL)).toHaveLength(1);
  });

  it('zwei playgroundModels-Instanzen loesen genau eine Modell-Anfrage aus', async () => {
    const { result } = renderHook(() => ({
      a: usePlaygroundModels(),
      b: usePlaygroundModels(),
    }));

    await waitFor(() => expect(result.current.a.loading).toBe(false));
    expect(result.current.b.loading).toBe(false);
    expect(result.current.b.entries.length).toBeGreaterThan(0);
    expect(callsTo(MODELS_URL)).toHaveLength(1);
  });

  it('drosselt den Fokus-Refresh auf das Fenster', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    renderHook(() => usePollenKey());
    await waitFor(() => expect(callsTo(ACCOUNT_URL)).toHaveLength(1));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Der letzte Abruf lag im selben Fenster — kein zweiter Call.
    expect(callsTo(ACCOUNT_URL)).toHaveLength(1);
  });

  it('verbindet und trennt in allen Instanzen', async () => {
    const { result } = renderHook(() => ({ a: usePollenKey(), b: usePollenKey() }));
    expect(callsTo(ACCOUNT_URL)).toHaveLength(0);

    await act(async () => {
      result.current.a.connectManual('sk_test_key');
    });

    await waitFor(() => expect(result.current.b.isConnected).toBe(true));
    await waitFor(() => expect(result.current.b.keyStatus).toBe('ok'));
    expect(callsTo(ACCOUNT_URL)).toHaveLength(1);

    await act(async () => {
      result.current.b.disconnect();
    });

    expect(result.current.a.isConnected).toBe(false);
    expect(result.current.a.keyStatus).toBe('none');
    expect(result.current.b.keyStatus).toBe('none');
  });

  it('vergiftet den Puffer nach einem Fehlschlag nicht', async () => {
    localStorage.setItem('pollenApiKey', 'sk_test');
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('offline');
    });

    const { result } = renderHook(() => usePollenKey());

    await waitFor(() => expect(result.current.keyStatus).toBe('unverifiable'));
    expect(callsTo(ACCOUNT_URL)).toHaveLength(1);

    await act(async () => {
      await result.current.refreshAccount();
    });

    await waitFor(() => expect(result.current.keyStatus).toBe('ok'));
    expect(callsTo(ACCOUNT_URL)).toHaveLength(2);
  });
});

