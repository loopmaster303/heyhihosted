/**
 * Der Quellvideo-Upload war auf jedem Weg kaputt: multipart an eine Route, die
 * multipart mit 415 ablehnt, und selbst danach der falsche Endpunkt — das
 * einzige Modell mit `sourceVideo` ist `vace`, ein Pruna-Modell. Gescheitert ist
 * er in jedem Fall, sichtbar war davon nichts.
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
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: (props: Record<string, unknown>) => <input type="range" {...props} />,
}));
jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'de', setLanguage: jest.fn() }),
}));
jest.mock('./ProviderSelect', () => ({ ProviderSelect: () => null }));

import { PlaygroundSidebarContent } from './PlaygroundSidebar';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';

// vace ist das einzige Modell mit sourceVideo — und es kommt von Pruna.
const VACE: PlaygroundModelEntry = {
  id: 'vace',
  name: 'VACE',
  provider: 'pruna',
  kind: 'video',
  supportsReference: true,
  requiresReference: false,
  maxImages: 3,
  unmapped: false,
  supportsEndFrame: false,
  supportsAudio: false,
  paidOnly: true,
  community: false,
};

function renderSidebar(onSourceVideo = jest.fn()) {
  render(
    <PlaygroundSidebarContent
      state={{
        mode: 't2v',
        modelId: 'vace',
        prompt: '',
        params: {},
        uploads: [],
        sourceVideo: null,
      }}
      entries={[VACE]}
      currentModel={VACE}
      loading={false}
      fallbackActive={false}
      onMode={jest.fn()}
      onModel={jest.fn()}
      onParams={jest.fn()}
      onUploads={jest.fn()}
      onSourceVideo={onSourceVideo}
    />,
  );
  return onSourceVideo;
}

function pickVideo() {
  const input = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
  const file = new File([new Uint8Array([1, 2, 3])], 'clip.mp4', { type: 'video/mp4' });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('PlaygroundSidebar source video upload', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://pruna/clip.mp4' }),
    });
  });

  it('uploads to the Pruna route with the stored key, as a raw body', async () => {
    localStorage.setItem('prunaApiKey', 'pruna_secret');
    const onSourceVideo = renderSidebar();

    pickVideo();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/pruna/upload');
    expect(url).toContain('filename=clip.mp4');
    expect(init.headers['X-Pruna-Key']).toBe('pruna_secret');
    expect(init.headers['Content-Type']).toBe('video/mp4');
    // Nie wieder FormData — /api/media/upload antwortet darauf mit 415.
    expect(init.body).toBeInstanceOf(File);
    expect(init.body).not.toBeInstanceOf(FormData);

    await waitFor(() => expect(onSourceVideo).toHaveBeenCalledWith('https://pruna/clip.mp4'));
  });

  it('shows the server error instead of swallowing it into the console', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'A Pruna API key is required' }),
    });
    const onSourceVideo = renderSidebar();

    pickVideo();

    expect(await screen.findByRole('alert')).toHaveTextContent('A Pruna API key is required');
    expect(onSourceVideo).not.toHaveBeenCalled();
  });
});
