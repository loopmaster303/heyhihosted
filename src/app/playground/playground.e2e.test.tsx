/**
 * E2E-style integration test for the Playground generate flow:
 * model list → model select → prompt → send → asset save under the sentinel.
 *
 * fetch is a jest spy, Dexie is bypassed via the database module mock, and the
 * ESM-only ui packages (lucide, Radix, vaul, framer) are stubbed because jest
 * does not transform node_modules.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
jest.mock('@/hooks/useHasPollenKey', () => ({ useHasPollenKey: () => true }));
jest.mock('@/hooks/useHasPrunaKey', () => ({ useHasPrunaKey: () => false }));

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      where: () => ({
        equals: () => ({
          reverse: () => ({ sortBy: async () => [] }),
        }),
      }),
    },
  },
}));

import { PlaygroundShell } from './PlaygroundShell';
import { OutputService } from '@/lib/services/output-service';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';

const MODELS = [
  { id: 'flux', outputModalities: ['image'], inputModalities: ['text'], name: 'Flux' },
  { id: 'wan-i2v', outputModalities: ['video'], inputModalities: ['text', 'image'], name: 'Wan I2V' },
];

function mockFetchModels() {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => MODELS });
}

async function typePromptAndSend(prompt: string) {
  // Wait for the model list rather than a specific label: the display name is
  // resolved from the local config, so it need not match the live id.
  await waitFor(() => expect(screen.queryByText('Lädt…')).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: prompt } });
  fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
}

describe('playground e2e: generate flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false,
    });
    (usePollenKey as jest.Mock).mockReturnValue({
      pollenKey: '', isConnected: false, connectManual: jest.fn(), disconnect: jest.fn(),
      accountInfo: null, refreshAccount: jest.fn(), isLoadingAccount: false,
    });
  });

  it('generates and saves the asset under the playground sentinel', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    mockFetchModels();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'https://x/out.png' }),
    });

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://x/out.png',
        prompt: 'ein roter Fuchs',
        conversationId: PLAYGROUND_CONVERSATION_ID,
        isVideo: false,
        params: expect.any(Object),
      })
    );
  });

  it('shows a pending card in the gallery while the request is in flight', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    mockFetchModels();
    let resolveGenerate: ((v: unknown) => void) | undefined;
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((res) => { resolveGenerate = res; }),
    );

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');

    // Solange die Route nicht antwortet, steht die Lade-Karte in der Galerie
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Generiere');
    expect(status).toHaveTextContent(/flux/i);

    resolveGenerate?.({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'https://x/out.png' }),
    });

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  });

  // params werden nach localStorage geschrieben; der Modellwechsel-Effekt hat
  // sie beim Mount mit den Schema-Defaults ueberschrieben.
  it('sends the params stored for this model instead of the schema defaults', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    localStorage.setItem('playgroundState', JSON.stringify({
      mode: 't2i',
      modelId: 'Flux',
      prompt: '',
      params: { aspect_ratio: '16:9' },
      uploads: [],
      sourceVideo: null,
    }));
    mockFetchModels();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'https://x/out.png' }),
    });

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(2));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(body.aspectRatio).toBe('16:9');
  });

  it('drops stored params that the current schema no longer knows', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    localStorage.setItem('playgroundState', JSON.stringify({
      mode: 't2i',
      modelId: 'Flux',
      prompt: '',
      params: { aspect_ratio: '16:9', long_gone_field: 'x' },
      uploads: [],
      sourceVideo: null,
    }));
    mockFetchModels();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'https://x/out.png' }),
    });

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(2));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(body.params).toEqual({ aspect_ratio: '16:9' });
  });

  it('surfaces an error and saves nothing when the response carries no media url', async () => {
    const save = jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    mockFetchModels();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');

    expect(await screen.findByRole('alert')).toHaveTextContent('generate response missing videoUrl/imageUrl');
    // Die Fehler-Karte bietet den direkten Neuversuch an
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  // "Erneut versuchen" schickte den aktuellen Composer-Zustand, nicht den Lauf,
  // der gescheitert war.
  it('retries the failed run, not whatever the composer holds now', async () => {
    jest.spyOn(OutputService, 'saveGeneratedAsset').mockResolvedValue('mock-asset-id');
    mockFetchModels();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'upstream kaputt' }),
    });

    render(<PlaygroundShell />);
    await typePromptAndSend('ein roter Fuchs');
    await screen.findByRole('button', { name: 'Erneut versuchen' });

    // Der Nutzer tippt weiter, bevor er den Neuversuch anstoesst.
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'etwas ganz anderes' } });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ imageUrl: 'https://x/out.png' }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(3));
    const retryBody = JSON.parse((global.fetch as jest.Mock).mock.calls[2][1].body);
    expect(retryBody.prompt).toBe('ein roter Fuchs');
  });
});
