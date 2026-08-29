/**
 * Gallery unit tests: empty state, pending placeholder, failed card with
 * retry/dismiss, and that stored params travel with the selected item.
 * lucide is proxied because jest does not transform node_modules.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

let mockRows: Record<string, unknown>[] = [];

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      orderBy: () => ({
        reverse: () => ({
          filter: (pred: (a: Record<string, unknown>) => boolean) => ({
            limit: () => ({
              toArray: async () => mockRows.filter(pred),
            }),
          }),
        }),
      }),
    },
  },
}));

const createURL = jest.fn(() => 'blob:playground/1');
const releaseURL = jest.fn();
jest.mock('@/lib/blob-manager', () => ({
  BlobManager: {
    createURL: (...args: unknown[]) => createURL(...(args as [])),
    releaseURL: (...args: unknown[]) => releaseURL(...(args as [])),
  },
}));

import { Gallery } from './Gallery';

const RUNNING = {
  id: 'run-1',
  prompt: 'ein Fuchs',
  modelId: 'flux',
  startedAt: Date.now(),
  isVideo: false,
  aspectRatio: '16:9',
  status: 'running' as const,
};

describe('Gallery', () => {
  beforeEach(() => {
    mockRows = [];
    createURL.mockClear();
    releaseURL.mockClear();
  });

  it('shows the empty state when nothing exists and nothing is running', async () => {
    render(<Gallery selectedId={null} onSelect={jest.fn()} />);
    expect(await screen.findByText('Noch nichts generiert')).toBeInTheDocument();
  });

  it('shows a running card instead of the empty state while generating', async () => {
    render(<Gallery selectedId={null} onSelect={jest.fn()} runs={[RUNNING]} />);
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Generiere');
    expect(status).toHaveTextContent('flux');
    expect(screen.queryByText('Noch nichts generiert')).not.toBeInTheDocument();
  });

  it('renders one card per parallel run and cancels only the one asked for', async () => {
    const user = userEvent.setup();
    const onCancelRun = jest.fn();
    render(
      <Gallery
        selectedId={null}
        onSelect={jest.fn()}
        runs={[RUNNING, { ...RUNNING, id: 'run-2', modelId: 'zimage' }]}
        onCancelRun={onCancelRun}
      />,
    );

    const cards = await screen.findAllByRole('status');
    expect(cards).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Nicht mehr warten' })[1]);
    expect(onCancelRun).toHaveBeenCalledWith('run-2');
  });

  // Auf dem Telefon gibt es kein Hover: der Grund fuer den Abbruch darf nicht
  // nur in einem `title` stecken, sondern muss sichtbar auf der Karte stehen.
  it('nennt den Grund fuer "Nicht mehr warten" sichtbar, nicht nur im title', () => {
    render(
      <Gallery
        selectedId={null}
        onSelect={jest.fn()}
        runs={[{
          id: 'r1', prompt: 'p', modelId: 'p-video', startedAt: Date.now(),
          isVideo: true, status: 'running',
        }]}
        onCancelRun={jest.fn()}
      />,
    );
    const knopf = screen.getByRole('button', { name: 'Nicht mehr warten' });
    expect(knopf).not.toHaveAttribute('title');
    expect(
      screen.getByText('Der Lauf läuft beim Anbieter weiter und wird berechnet.'),
    ).toBeVisible();
  });

  it('shows a failed card with retry and dismiss actions', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    const onDismiss = jest.fn();
    render(
      <Gallery
        selectedId={null}
        onSelect={jest.fn()}
        runs={[{ ...RUNNING, status: 'failed', message: 'HTTP 401' }]}
        onRetryRun={onRetry}
        onDismissRun={onDismiss}
      />,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('HTTP 401');

    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(onRetry).toHaveBeenCalledWith('run-1');

    await user.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(onDismiss).toHaveBeenCalledWith('run-1');
  });

  // Pruna ohne Pollen-Key liefert rohe Bytes; das Asset liegt dann als Blob in
  // IndexedDB und hat keine remoteUrl. Ohne diesen Pfad blieb es unsichtbar.
  it('renders blob-backed assets that have no remoteUrl', async () => {
    mockRows = [{
      id: 'b1',
      blob: new Blob(['x'], { type: 'image/png' }),
      contentType: 'image/png',
      prompt: 'ein Dachs',
      modelId: 'p-image',
      conversationId: '__playground__',
      timestamp: 2,
    }];

    render(<Gallery selectedId={null} onSelect={jest.fn()} />);

    const card = await screen.findByRole('button', { name: /ein Dachs/ });
    expect(card.querySelector('img')).toHaveAttribute('src', 'blob:playground/1');
    expect(createURL).toHaveBeenCalledTimes(1);
  });

  it('releases the blob urls it created when it unmounts', async () => {
    mockRows = [{
      id: 'b1',
      blob: new Blob(['x'], { type: 'image/png' }),
      contentType: 'image/png',
      prompt: 'ein Dachs',
      modelId: 'p-image',
      conversationId: '__playground__',
      timestamp: 2,
    }];

    const { unmount } = render(<Gallery selectedId={null} onSelect={jest.fn()} />);
    await screen.findByRole('button', { name: /ein Dachs/ });

    unmount();
    expect(releaseURL).toHaveBeenCalledWith('blob:playground/1');
  });

  it('skips assets that have neither a remoteUrl nor a blob', async () => {
    mockRows = [{
      id: 'c1',
      contentType: 'image/png',
      prompt: 'ein Geist',
      modelId: 'flux',
      conversationId: '__playground__',
      timestamp: 3,
    }];

    render(<Gallery selectedId={null} onSelect={jest.fn()} />);
    expect(await screen.findByText('Noch nichts generiert')).toBeInTheDocument();
  });

  it('passes stored params along when an item is selected', async () => {
    const user = userEvent.setup();
    mockRows = [{
      id: 'a1',
      remoteUrl: 'https://x/a.png',
      contentType: 'image/png',
      prompt: 'ein Fuchs',
      modelId: 'flux',
      conversationId: '__playground__',
      timestamp: 1,
      params: { seed: 7 },
    }];
    const onSelect = jest.fn();
    render(<Gallery selectedId={null} onSelect={onSelect} />);

    const card = await screen.findByRole('button', { name: /ein Fuchs/ });
    await user.click(card);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', params: { seed: 7 } }),
    );
  });
});
