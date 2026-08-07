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
    expect(result.current.entries.some((e) => e.id === 'zimage')).toBe(true);
  });

  it('fetches live models when provider is pollinations', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () => new Response(JSON.stringify([{ id: 'flux', outputModalities: ['image'], inputModalities: ['text'] }]), { status: 200 })) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries.some((e) => e.id === 'flux' && e.provider === 'pollinations')).toBe(true);
  });

  it('falls back to config when live fetch fails', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () => new Response('boom', { status: 500 })) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fallbackActive).toBe(true);
    expect(result.current.entries.length).toBeGreaterThan(0);
  });
});
