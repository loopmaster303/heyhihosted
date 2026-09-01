import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryPanel } from './GalleryPanel';
import type { Asset } from '@/lib/services/database';

jest.mock('@/hooks/useAssetUrl', () => ({
  useAssetUrl: (assetId: string) => ({
    url: `https://example.com/${assetId}`,
    isLoading: false,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        'gallery.clearButton': 'Leeren',
        'gallery.closePanel': 'Output schließen',
        'gallery.tabImages': 'Images',
        'gallery.tabTracks': 'Tracks',
        'gallery.clearConfirmChat': '{count} Objekte aus Chat und Compose löschen?',
        'gallery.clearConfirmAll': '{count} Objekte über ALLE Herkünfte löschen?',
        'gallery.clearConfirmCreate': '{count} Objekte aus Create löschen?',
        'gallery.filterAll': 'alles',
        'gallery.filterChat': 'chat',
        'gallery.filterCreate': 'create',
        'gallery.emptyTracks': 'Noch keine Tracks.',
        'gallery.emptyPanel': 'Noch kein Output in diesem Bereich.',
        'nav.gallery': 'Output',
      }[key] ?? key),
  }),
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => (
      <svg data-icon={String(prop)} {...iconProps} />
    );
    Icon.displayName = String(prop);
    return Icon;
  },
}));

const asset: Asset = {
  id: 'asset-1',
  prompt: 'Sunset over the sea',
  contentType: 'image/png',
  modelId: 'flux',
  timestamp: Date.now(),
  starred: false,
};

const renderPanel = (origins: readonly ('chat' | 'compose' | 'create')[] | undefined) =>
  render(
    <GalleryPanel
      isOpen
      onClose={() => {}}
      assets={[asset]}
      totalAssetCount={7}
      origins={origins}
      onOriginsChange={() => {}}
      onDelete={() => {}}
      onClearAll={() => {}}
      onToggleStar={() => {}}
    />,
  );

describe('GalleryPanel clear confirmation', () => {
  beforeEach(() => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
  });

  it('names Chat and Compose and uses the honest total for the default scope', async () => {
    renderPanel(['chat', 'compose']);

    await userEvent.click(screen.getByRole('button', { name: 'Leeren' }));

    expect(window.confirm).toHaveBeenCalledWith(
      '7 Objekte aus Chat und Compose löschen?',
    );
  });

  it('names all origins and uses the honest total when the scope is undefined', async () => {
    renderPanel(undefined);

    await userEvent.click(screen.getByRole('button', { name: 'Leeren' }));

    expect(window.confirm).toHaveBeenCalledWith(
      '7 Objekte über ALLE Herkünfte löschen?',
    );
  });

  it('names Create for the create-only scope', async () => {
    renderPanel(['create']);

    await userEvent.click(screen.getByRole('button', { name: 'Leeren' }));

    expect(window.confirm).toHaveBeenCalledWith(
      '7 Objekte aus Create löschen?',
    );
  });
});
