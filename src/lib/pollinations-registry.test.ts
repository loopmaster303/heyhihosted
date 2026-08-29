import { findRegistryModel, _clearRegistryCacheForTesting } from './pollinations-registry';

const PAID = [{ name: 'flux' }, { name: 'nanobanana', paid_only: true }];
const FREE = [{ name: 'flux' }];

// Die Registry wird als Rohtext geholt und gecacht, damit `/api/generate` sie
// unveraendert durchreichen kann — der Mock muss deshalb `text()` bedienen.
const upstream = (models: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(models),
  headers: { get: () => 'application/json' },
});

describe('pollinations-registry', () => {
  beforeEach(() => {
    _clearRegistryCacheForTesting();
    global.fetch = jest.fn();
  });

  it('caches per key instead of sharing one entry across callers', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(upstream(FREE))
      .mockResolvedValueOnce(upstream(PAID));

    // Anonym zuerst: sieht das bezahlte Modell nicht.
    expect(await findRegistryModel('nanobanana')).toBeUndefined();
    // Mit Key darf derselbe Aufruf nicht auf der anonymen Antwort sitzenbleiben.
    expect(await findRegistryModel('nanobanana', 'key-a')).toEqual({ name: 'nanobanana', paid_only: true });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
  });

  it('serves a repeated lookup for the same key from the cache', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(upstream(PAID));

    await findRegistryModel('flux', 'key-a');
    await findRegistryModel('nanobanana', 'key-a');

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('treats an upstream failure as an unknown model', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    expect(await findRegistryModel('flux')).toBeUndefined();
  });

  // Befund B3 (Phase 3): die Registry führt Aliase — `gpt-image` löst zu
  // `gptimage` auf, `veo-1080p` zu `veo`. Ohne Alias-Auflösung liefen solche
  // IDs in einen 400, obwohl der Anbieter sie bedient.
  it('resolves provider aliases via findRegistryModel', async () => {
    const WITH_ALIASES = [
      { name: 'gptimage', aliases: ['gpt-image'], paid_only: false },
      { name: 'veo', aliases: ['veo-1080p', 'veo-3.1-fast'], paid_only: true },
    ];
    (global.fetch as jest.Mock).mockResolvedValue(upstream(WITH_ALIASES));

    expect(await findRegistryModel('gpt-image')).toEqual({
      name: 'gptimage',
      aliases: ['gpt-image'],
      paid_only: false,
    });
    expect(await findRegistryModel('veo-3.1-fast')).toEqual({
      name: 'veo',
      aliases: ['veo-1080p', 'veo-3.1-fast'],
      paid_only: true,
    });
    expect(await findRegistryModel('gptimage')).toEqual({
      name: 'gptimage',
      aliases: ['gpt-image'],
      paid_only: false,
    });
  });
});
