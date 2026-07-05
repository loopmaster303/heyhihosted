import { act, renderHook, waitFor } from '@testing-library/react';
import { useUnifiedImageToolState } from './useUnifiedImageToolState';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('./useHasPollenKey', () => ({
  useHasPollenKey: () => true,
}));

describe('useUnifiedImageToolState provider persistence', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('hydrates the persisted Pruna provider mode when Pruna is available', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.providerMode).toBe('pruna');
      expect(result.current.prunaAvailable).toBe(true);
    });
  });

  it('resets a persisted Pruna provider mode when Pruna is unavailable', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.providerMode).toBe('pollinations');
      expect(result.current.prunaAvailable).toBe(false);
      expect(localStorage.getItem('heyhi-provider-mode')).toBe(JSON.stringify('pollinations'));
    });
  });

  it('falls back from persisted zimage to flux in Pollinations mode', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pollinations'));
    localStorage.setItem('defaultImageModelId', JSON.stringify('zimage'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.providerMode).toBe('pollinations');
      expect(result.current.selectedModelId).toBe('flux');
    });
  });

  it('resets the selected model when switching to a provider that does not contain it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.prunaAvailable).toBe(true);
      expect(result.current.selectedModelId).toBe('flux');
    });

    act(() => {
      result.current.setProviderMode('pruna');
    });

    await waitFor(() => {
      expect(result.current.providerMode).toBe('pruna');
      expect(result.current.selectedModelId).toBe(result.current.availableModels[0]);
      expect(result.current.selectedModelId).not.toBe('flux');
    });
  });
});
