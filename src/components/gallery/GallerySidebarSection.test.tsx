import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GallerySidebarSection from './GallerySidebarSection';

jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/hooks/useGalleryAssets', () => ({
  useGalleryAssets: () => ({
    assets: [
      {
        id: 'img-1',
        prompt: 'Sunset over the sea',
        contentType: 'image/png',
        modelId: 'flux',
        timestamp: Date.now(),
        starred: false,
      },
      {
        id: 'track-1',
        prompt: 'Warm synthwave loop',
        contentType: 'audio/mpeg',
        modelId: 'elevenmusic',
        timestamp: Date.now(),
        starred: false,
      },
    ],
    isLoading: false,
    deleteAsset: jest.fn(),
    clearAllAssets: jest.fn(),
    toggleStarred: jest.fn(),
  }),
}));

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
        'nav.gallery': 'Output',
        'gallery.openItem': 'Open output',
        'gallery.toggle': 'Toggle output',
        'gallery.emptyShort': 'No output yet.',
        'gallery.clearConfirm': 'Clear output?',
        'gallery.clearButton': 'Clear',
        'gallery.closePanel': 'Close output',
        'gallery.emptyPanel': 'No output in this area yet.',
        'gallery.loading': 'Loading output...',
        'gallery.tabImages': 'Images',
        'gallery.tabTracks': 'Tracks',
        'gallery.emptyTracksHint': 'Generate music in Compose mode.',
        'gallery.openFull': 'open full output →',
        'gallery.copyPrompt.noPromptTitle': 'No prompt',
        'gallery.copyPrompt.noPromptDesc': 'No prompt is stored for this asset.',
        'gallery.copyPrompt.successTitle': 'Prompt copied',
        'gallery.copyPrompt.successDesc': 'The prompt is in your clipboard.',
        'gallery.copyPrompt.errorTitle': 'Copy failed',
        'gallery.copyPrompt.errorDesc': 'Please try again.',
        'action.close': 'Close',
        'action.copyPrompt': 'Copy prompt',
        'action.download': 'Download',
        'action.delete': 'Delete',
      }[key] || key),
  }),
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

describe('GallerySidebarSection', () => {
  it('uses Output naming and keeps the overlay as the primary quick-access surface', async () => {
    const user = userEvent.setup();

    render(<GallerySidebarSection />);

    expect(screen.getByText('Output')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle output' }));

    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'open full output →' })).toBeInTheDocument();
  });
});
