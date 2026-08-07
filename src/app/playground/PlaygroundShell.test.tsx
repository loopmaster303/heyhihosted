/**
 * Integration smoke test for PlaygroundShell — the only wiring layer of the
 * Playground. Covers: loading state, presence of every core component, and
 * the generate gating (disabled without prompt, enabled after typing).
 * No DOM snapshots; no generate-flow assertions (that's playground.e2e.test.tsx).
 *
 * Mocking follows the repo's established conventions (see
 * ProviderSwitch.test.tsx / playground.e2e.test.tsx): the model/key/provider
 * hooks are stubbed with the documented shapes, the database module is
 * bypassed for Gallery, and usePlaygroundState runs REAL so the shell's
 * actual wiring is exercised.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaygroundShell } from './PlaygroundShell';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'en', setLanguage: jest.fn() }),
}));

jest.mock('@/hooks/usePlaygroundModels', () => ({ usePlaygroundModels: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));

jest.mock('@/lib/services/database', () => {
  const rows = [
    { id: 'g1', remoteUrl: 'https://x/g.png', prompt: 'gallery item', modelId: 'gflux', conversationId: '__playground__', timestamp: 1, contentType: 'image/png' },
  ];
  return {
    db: {
      assets: {
        where: (col: string) => ({
          equals: (val: string) => ({
            reverse: () => ({
              sortBy: async (_field: string) => (col === 'conversationId' && val === '__playground__') ? rows : [],
            }),
          }),
        }),
      },
    },
  };
});

import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';

const DUMMY_MODEL = {
  id: 'flux',
  name: 'Dummy Flux',
  provider: 'pollinations' as const,
  kind: 'image' as const,
  supportsReference: false,
  requiresReference: false,
  maxImages: 0,
  unmapped: false,
};

function mockHooks(overrides: Partial<ReturnType<typeof usePlaygroundModels>> = {}) {
  (usePlaygroundModels as jest.Mock).mockReturnValue({
    entries: [DUMMY_MODEL],
    loading: false,
    error: null,
    fallbackActive: false,
    reload: jest.fn(),
    ...overrides,
  });
  (usePollenKey as jest.Mock).mockReturnValue({
    pollenKey: null,
    connectManual: jest.fn(),
    disconnect: jest.fn(),
  });
  (useProviderMode as jest.Mock).mockReturnValue({
    providerMode: 'pollinations',
    setProviderMode: jest.fn(),
    prunaAvailable: true,
  });
}

describe('PlaygroundShell smoke', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockHooks();
  });

  it('renders without crashing while the model list is loading', () => {
    mockHooks({ entries: [], loading: true });

    render(<PlaygroundShell />);

    expect(screen.getByRole('tab', { name: /pollinations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose model/i })).toBeDisabled();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'playground.generate' })).toBeDisabled();
  });

  it('renders all core components with a loaded model', async () => {
    render(<PlaygroundShell />);

    // ProviderSwitch
    expect(screen.getByRole('tablist', { name: /provider/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pollinations/i })).toHaveAttribute('aria-selected', 'true');
    // ApiKeyField
    expect(screen.getByLabelText(/pollinations key/i)).toBeInTheDocument();
    // ModeSwitch
    expect(screen.getByRole('tablist', { name: /mode/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 't2i' })).toHaveAttribute('aria-selected', 'true');
    // ModelSelect with the dummy model
    expect(screen.getByRole('button', { name: /choose model/i })).toBeEnabled();
    expect(screen.getByText('Dummy Flux')).toBeInTheDocument();
    // PromptPanel
    expect(screen.getByPlaceholderText(/describe what you want to see/i)).toBeInTheDocument();
    // Hero (empty state)
    expect(screen.getByText(/ready to generate/i)).toBeInTheDocument();
    // Gallery renders its live query result
    expect(await screen.findByRole('button', { name: /gflux/i })).toBeInTheDocument();
    // MobileBar
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/quick prompt/i)).toBeInTheDocument();
  });

  it('keeps Generate disabled while the prompt is empty', async () => {
    render(<PlaygroundShell />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose model/i })).toBeEnabled();
    });
    expect(screen.getByRole('button', { name: 'playground.generate' })).toBeDisabled();
  });

  it('enables Generate after typing a prompt', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /choose model/i })).toBeEnabled();
    });
    expect(screen.getByRole('button', { name: 'playground.generate' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/describe what you want to see/i), 'a red fox');

    expect(screen.getByRole('button', { name: 'playground.generate' })).toBeEnabled();
  });
});
