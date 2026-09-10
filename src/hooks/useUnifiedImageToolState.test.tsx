import { act, renderHook, waitFor } from '@testing-library/react';
import { useUnifiedImageToolState } from './useUnifiedImageToolState';
import { getChatImageModelIds } from '@/config/unified-image-models';
import { uploadFileToPollinationsMedia } from '@/lib/upload/pollinations-media';

jest.mock('@/lib/upload/pollinations-media', () => {
  const actual = jest.requireActual('@/lib/upload/pollinations-media');
  return {
    ...actual,
    uploadFileToPollinationsMedia: jest.fn(),
  };
});

jest.mock('@/config/unified-image-models', () => {
  const actual = jest.requireActual('@/config/unified-image-models');
  return {
    ...actual,
    getChatImageModelIds: jest.fn(actual.getChatImageModelIds),
  };
});

const mockGetChatImageModelIds =
  getChatImageModelIds as jest.MockedFunction<typeof getChatImageModelIds>;

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
    mockGetChatImageModelIds.mockClear();
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

  // A6, Nachtrag aus der Abnahme: Die Wahl im Chat stand nur im Speicher des
  // Tabs. Der Picker las beim Start allein `defaultImageModelId` und schrieb
  // beim Wechsel nichts, deshalb stand nach einem Reload wieder der Standard da.
  it('liest die gespeicherte Chat-Auswahl statt des Standards', async () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('flux'));
    localStorage.setItem('chatSelectedImageModel', JSON.stringify('gpt-image'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.selectedModelId).toBe('gpt-image');
    });
  });

  it('schreibt eine Auswahl im Chat in den Chat-Schluessel', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => expect(result.current.availableModels.length).toBeGreaterThan(0));
    await act(async () => { result.current.setSelectedModelId('gpt-image'); });

    await waitFor(() => {
      expect(result.current.selectedModelId).toBe('gpt-image');
    });
    expect(localStorage.getItem('chatSelectedImageModel')).toBe(JSON.stringify('gpt-image'));
  });

  it('faellt auf den Standard zurueck, wenn die Chat-Auswahl nicht in der Chat-Liste steht', async () => {
    localStorage.setItem('defaultImageModelId', JSON.stringify('flux'));
    localStorage.setItem('chatSelectedImageModel', JSON.stringify('p-video'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.selectedModelId).toBe('flux');
    });
  });

  // T7 (Phase 3, R1): gespeicherte Auswahlen auf entfernte IDs dürfen keine
  // Fehler erzeugen. Die Hydration läuft nach dem Mount, deshalb gilt: die
  // gewählte Modell-ID ist immer in availableModels, und der Normalizer
  // entfernt die Leiche einer bekannten entfernten ID aus dem localStorage.
  it.each([
    'ltx-2',
    'grok-video',
    'veo-1080p',
    'pollinations-wan-fast',
  ])('recovers a persisted removed model id (%s) without an error', async (persisted) => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pollinations'));
    localStorage.setItem('defaultImageModelId', JSON.stringify(persisted));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.providerMode).toBe('pollinations');
      expect(result.current.availableModels.length).toBeGreaterThan(0);
      expect(result.current.availableModels).toContain(result.current.selectedModelId);
    });
    expect(JSON.parse(localStorage.getItem('defaultImageModelId') ?? '""')).not.toBe(persisted);
  });

  it('keeps an unknown persisted model id from breaking the selection', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pollinations'));
    localStorage.setItem('defaultImageModelId', JSON.stringify('definitely-not-a-model'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.availableModels).toContain(result.current.selectedModelId);
    });
  });

  it('keeps the selected model when switching provider — the chat list does not follow the switch', async () => {
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

    // Phase 7: die Chat-Auswahl ist providerunabhaengig. Der Wechsel
    // dreht das gewaehlte Modell nicht mehr still um.
    await waitFor(() => {
      expect(result.current.providerMode).toBe('pruna');
      expect(result.current.selectedModelId).toBe('flux');
    });
  });

  it('fuehrt im Chat nur die schluesselfreie Bildauswahl, auch mit Pruna-Schluessel', async () => {
    // E7-3: der Pruna-Schluessel darf im Chat nichts aufblaettern.
    localStorage.setItem('prunaApiKey', 'pruna_test_1234567890');
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect([...result.current.availableModels].sort()).toEqual(['flux', 'gpt-image', 'klein']);
    });
  });

  it('faellt auf flux zurueck, wenn das gespeicherte Standardmodell nicht im Chat gefuehrt wird', async () => {
    // Der SettingsPopover im Create schreibt denselben Schluessel und kennt
    // die volle Liste. Der Chat darf daran nicht haengenbleiben.
    localStorage.setItem('defaultImageModelId', JSON.stringify('p-video'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.selectedModelId).toBe('flux');
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

  // A5: Zwei Klicks auf denselben Platz erzeugten zwei Uploads, und der
  // zweite Lauf ueberschrieb das Ergebnis des ersten.
  it('verwirft den zweiten Klick, solange der erste Upload laeuft', async () => {
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pollinations'));
    localStorage.setItem('defaultImageModelId', JSON.stringify('gpt-image'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    let releaseUpload: (media: unknown) => void = () => {};
    const uploadMock = uploadFileToPollinationsMedia as jest.Mock;
    uploadMock.mockReset();
    uploadMock.mockImplementation(
      () => new Promise((resolve) => { releaseUpload = resolve; }),
    );

    const { result } = renderHook(() => useUnifiedImageToolState());

    // gpt-image ist das einzige Modell der Chat-Liste mit Referenz-Upload.
    await act(async () => { result.current.setSelectedModelId('gpt-image'); });
    await waitFor(() => expect(result.current.selectedModelId).toBe('gpt-image'));

    const file = new File(['pixel'], 'referenz.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Parameters<
      typeof result.current.handleFileChange
    >[0];

    let firstUpload: Promise<void> = Promise.resolve();
    await act(async () => {
      firstUpload = result.current.handleFileChange(event);
    });

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(uploadMock).toHaveBeenCalledTimes(1);

    releaseUpload({ mediaUrl: 'https://media.example/ref.png', key: 'uploads/ref.png', expiresIn: 3600 });
    await act(async () => { await firstUpload; });

    // Die Sperre wird wieder freigegeben: sonst bliebe jeder spaetere Upload haengen.
    await waitFor(() => expect(result.current.uploadedImages).toHaveLength(1));
    expect(result.current.isUploading).toBe(false);
  });
});
