/**
 * Integration smoke test for PlaygroundShell — the only wiring layer of the
 * Playground. Covers the loading state, the presence of every core control,
 * and the send gating. The generate flow itself lives in playground.e2e.test.tsx.
 *
 * usePlaygroundState runs for real so the shell's actual wiring is exercised.
 * Everything that reaches for ESM-only packages (lucide, the Radix/vaul/framer
 * based ui components) is stubbed — jest does not transform node_modules.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DropdownMenuItem: ({ children, onSelect, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) => (
    <button onClick={onSelect} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/popup', () => ({
  ModalPopup: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (open ? <div>{children}</div> : null),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: (props: Record<string, unknown>) => <input type="range" {...props} />,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'de', setLanguage: jest.fn() }),
}));

jest.mock('@/hooks/usePlaygroundModels', () => ({ usePlaygroundModels: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/useHasPollenKey', () => ({ useHasPollenKey: () => true }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: () => false }));

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
              sortBy: async () => (col === 'conversationId' && val === '__playground__' ? rows : []),
            }),
          }),
        }),
      },
    },
  };
});

import { PlaygroundShell } from './PlaygroundShell';
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

function mockHooks(overrides: Record<string, unknown> = {}) {
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
    isConnected: false,
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

    expect(screen.getByText('Lädt…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
  });

  it('renders every core control once a model is loaded', async () => {
    render(<PlaygroundShell />);

    // Provider picker
    expect(screen.getAllByText('Pollinations').length).toBeGreaterThan(0);
    // Mode tabs
    expect(screen.getByRole('tab', { name: 't2i' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    // Model picker resolved the dummy entry
    expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0);
    // Prompt bar
    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
    // Topbar actions
    expect(screen.getByRole('button', { name: 'Einstellungen' })).toBeInTheDocument();
    // Gallery renders the stored row
    expect(await screen.findByText('gflux')).toBeInTheDocument();
  });

  it('keeps Senden disabled while the prompt is empty', async () => {
    render(<PlaygroundShell />);
    await waitFor(() => expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
  });

  it('enables Senden after typing a prompt', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);
    await waitFor(() => expect(screen.getAllByText('Dummy Flux').length).toBeGreaterThan(0));

    await user.type(screen.getByLabelText('Prompt'), 'ein roter Fuchs');

    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled();
  });

  it('opens the settings dialog from the topbar', async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));

    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
  });
});
