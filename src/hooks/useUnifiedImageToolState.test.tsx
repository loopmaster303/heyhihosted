import { act, renderHook, waitFor } from '@testing-library/react';
import { useUnifiedImageToolState } from './useUnifiedImageToolState';
import { getVisualizeModelGroupsForProvider } from '@/config/unified-image-models';

jest.mock('@/config/unified-image-models', () => {
  const actual = jest.requireActual('@/config/unified-image-models');
  return {
    ...actual,
    getVisualizeModelGroupsForProvider: jest.fn(actual.getVisualizeModelGroupsForProvider),
  };
});

const mockGetVisualizeModelGroupsForProvider =
  getVisualizeModelGroupsForProvider as jest.MockedFunction<typeof getVisualizeModelGroupsForProvider>;

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

let mockHasPollenKey = true;
jest.mock('./useHasPollenKey', () => ({
  useHasPollenKey: () => mockHasPollenKey,
}));

describe('useUnifiedImageToolState provider persistence', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    mockHasPollenKey = true;
    mockGetVisualizeModelGroupsForProvider.mockClear();
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

  it('enables Pruna from a local key even without a server key', async () => {
    localStorage.setItem('prunaApiKey', 'pruna_test_1234567890');
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => expect(result.current.prunaAvailable).toBe(true));
    act(() => result.current.setProviderMode('pruna'));
    await waitFor(() => expect(result.current.providerMode).toBe('pruna'));
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

  it('uses Pruna availability rather than the Pollen key for Pruna visibility', async () => {
    mockHasPollenKey = false;
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);
    renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(mockGetVisualizeModelGroupsForProvider).toHaveBeenCalledWith('pruna', { includeByopHidden: true });
    });
  });

  it('initializes migrated Pruna duration from temporal control metadata', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);
    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => expect(result.current.providerMode).toBe('pruna'));
    act(() => result.current.setSelectedModelId('wan-t2v'));

    await waitFor(() => expect(result.current.formFields.duration).toBe(5));
  });

  it('initializes audio-enabled Pruna video models with audio on', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);
    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => expect(result.current.providerMode).toBe('pruna'));
    act(() => result.current.setSelectedModelId('p-video-animate'));

    await waitFor(() => expect(result.current.formFields.audio).toBe(true));
  });

  it('preserves an explicit Pruna audio default instead of using capability as the default', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);
    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => expect(result.current.providerMode).toBe('pruna'));
    act(() => result.current.setSelectedModelId('p-video'));

    await waitFor(() => expect(result.current.formFields.audio).toBe(false));
  });
});
