import { act, renderHook, waitFor } from '@testing-library/react';
import { usePlaygroundModels } from './usePlaygroundModels';

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn(() => ({ pollenKey: '' })) }));
import { useProviderMode } from '@/hooks/useProviderMode';

const originalFetch = global.fetch;

describe('usePlaygroundModels', () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns pruna entries when provider is pruna, no fetch', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pruna', setProviderMode: jest.fn(), prunaAvailable: true });
    global.fetch = jest.fn() as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.entries.every((e) => e.provider === 'pruna')).toBe(true);
    // E-A: zimage ist deaktiviert (BYOP-only) — 'p-image' als Pruna-Beleg.
    expect(result.current.entries.some((e) => e.id === 'p-image')).toBe(true);
    expect(result.current.entries.some((e) => e.id === 'zimage')).toBe(false);
  });

  it('fetches live models when provider is pollinations', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify([{ name: 'z-image', title: 'Z-Image Turbo', runnable: true, output_modalities: ['image'], input_modalities: ['text'], paid_only: false }]),
        { status: 200 }
      )
    ) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries.some((e) => e.id === 'z-image' && e.provider === 'pollinations')).toBe(true);
  });

  // Live belegt 2026-09-10: der Betreiber-Schluessel darf 'flux' nicht bedienen
  // (403). Die Auswahl darf es deshalb gar nicht erst anbieten — der Nutzer
  // saehe sonst einen Fehler erst nach dem Senden.
  it('verwirft Modelle ausserhalb der Freigabe des Schluessels', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify([
          { name: 'black-forest-labs/flux.1-dev', title: 'Flux Dev', runnable: false, output_modalities: ['image'], input_modalities: ['text'], paid_only: false },
          { name: 'nanobanana-2', title: 'Nano Banana 2', runnable: false, output_modalities: ['image'], input_modalities: ['text'], paid_only: true },
        ]),
        { status: 200 }
      )
    ) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // flux.1-dev ist kein kuratierter Klassiker der Auswahlliste -> gesperrt und weg.
    expect(result.current.entries.some((e) => e.id === 'black-forest-labs/flux.1-dev')).toBe(false);
    // 'nanobanana-2' bleibt als gesperrte Bezahl-Auswahl stehen.
    expect(result.current.entries.find((e) => e.id === 'nanobanana-2')).toMatchObject({
      paidOnly: true,
      runnableOnKey: false,
    });
  });

  it('falls back to config when live fetch fails', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () => new Response('boom', { status: 500 })) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fallbackActive).toBe(true);
    expect(result.current.entries.length).toBeGreaterThan(0);
    // Der Rueckfall ist die kuratierte Freiliste des Betreiber-Schluessels
    // (live belegt 2026-09-10) — nicht alles, was die Config als isFree fuehrt.
    const ids = result.current.entries.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['z-image', 'gpt-image-2', 'klein']));
    expect(ids).not.toContain('flux');
    expect(ids).not.toContain('gpt-image');
    expect(ids).not.toContain('gptimage-large');
  });
});
