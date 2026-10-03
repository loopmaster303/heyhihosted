import { act, renderHook } from '@testing-library/react';
import { useComposeMusicState } from './useComposeMusicState';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    language: 'de',
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/hooks/useHasPollenKey', () => ({
  useHasPollenKey: () => true,
}));

jest.mock('@/lib/services/output-service', () => ({
  OutputService: { saveGeneratedAsset: jest.fn(async () => undefined) },
}));

describe('useComposeMusicState', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // A5: Zwei Klicks auf "Erzeugen" starteten zwei Laeufe, die sich denselben
  // Ergebnisplatz teilten.
  it('laesst einen zweiten Aufruf waehrend eines laufenden Auftrags fallen', async () => {
    const pending = new Promise<Response>(() => {});
    const fetchMock = jest.fn((...args: unknown[]) => {
      void args;
      return pending;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useComposeMusicState());

    await act(async () => {
      void result.current.generateMusic('erster Auftrag');
    });
    expect(result.current.isGenerating).toBe(true);

    let secondResult: string | null = 'nicht zurueckgesetzt';
    await act(async () => {
      secondResult = await result.current.generateMusic('zweiter Auftrag');
    });

    expect(secondResult).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/compose');
  });
});
