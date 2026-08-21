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
      where: (col: string) => ({
        equals: (val: string) => ({
          reverse: () => ({
            sortBy: async () => (col === 'conversationId' && val === '__playground__' ? mockRows : []),
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

const PENDING = {
  prompt: 'ein Fuchs',
  modelId: 'flux',
  startedAt: Date.now(),
  isVideo: false,
  aspectRatio: '16:9',
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

  it('shows a pending card instead of the empty state while generating', async () => {
    render(<Gallery selectedId={null} onSelect={jest.fn()} pending={PENDING} />);
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Generiere');
    expect(status).toHaveTextContent('flux');
    expect(screen.queryByText('Noch nichts generiert')).not.toBeInTheDocument();
  });

  it('shows a failed card with retry and dismiss actions', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    const onDismiss = jest.fn();
    render(
      <Gallery
        selectedId={null}
        onSelect={jest.fn()}
        failed={{ prompt: 'x', modelId: 'flux', isVideo: false, message: 'HTTP 401' }}
        onRetryFailed={onRetry}
        onDismissFailed={onDismiss}
      />,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('HTTP 401');

    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
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
