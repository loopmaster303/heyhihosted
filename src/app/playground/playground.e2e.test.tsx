/**
 * E2E-style integration test for the Playground generate flow:
 * model list → model select → prompt → generate → asset save.
 * Uses the repo's established mocking conventions (see
 * ApiKeyField.test.tsx / Gallery.test.tsx): hooks are mocked, fetch is
 * a jest spy, Dexie is bypassed via the database module mock.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaygroundShell } from './PlaygroundShell';
import { OutputService } from '@/lib/services/output-service';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'en', setLanguage: jest.fn() }),
}));

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: jest.fn() }));
jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      where: () => ({
        equals: () => ({
          reverse: () => ({
            sortBy: async () => [],
          }),
        }),
      }),
    },
  },
}));

import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';

const MODELS = [
  { id: 'flux', outputModalities: ['image'], inputModalities: ['text'], name: 'Flux' },
  { id: 'wan-i2v', outputModalities: ['video'], inputModalities: ['text', 'image'], name: 'Wan I2V' },
];

function mockFetchModels() {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => MODELS,
  });
}

describe('playground e2e: generate flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', connectManual: jest.fn(), disconnect: jest.fn(), accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false, isConnected: false });
  });

  it('selects flux, generates, and saves the asset under the playground sentinel', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    mockFetchModels();
    // /api/generate returns JSON with an image URL
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'blob:mock' }),
    });

    render(<PlaygroundShell />);

    // Model list populates the select; choose Flux
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose model/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /choose model/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /flux/i }).slice(-1)[0]);

    // Type a prompt and hit Generate
    fireEvent.change(screen.getByPlaceholderText(/describe what you want to see/i), { target: { value: 'a red fox' } });
    fireEvent.click(screen.getByRole('button', { name: 'playground.generate' }));

    // Generate request went out with the flux model
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"flux"'),
        }),
      );
    });
    const body = JSON.parse(String((global.fetch as jest.Mock).mock.calls.find((c) => c[0] === '/api/generate')?.[1]?.body));
    expect(body).toEqual(expect.objectContaining({ model: 'flux', prompt: 'a red fox' }));

    // Asset was saved with the playground sentinel conversationId
    await waitFor(() => {
      expect(OutputService.saveGeneratedAsset).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: '__playground__', modelId: 'flux', isVideo: false }),
      );
    });

    // Hero shows the generated image
    expect(await screen.findByAltText('a red fox')).toBeInTheDocument();
  });
});
