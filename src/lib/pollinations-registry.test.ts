import { lookupRegistryModel, _clearRegistryCacheForTesting } from './pollinations-registry';

/** Die Sicht EINES Schluessels: berechtigungsgefiltert, kennt nur flux. */
const KEYED = [{ name: 'flux' }];
/** Der Katalog ohne Schluessel: vollstaendig, mit paid_only. */
const KATALOG = [{ name: 'flux' }, { name: 'qwen/qwen-image-3', paid_only: true }];

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

  // Der Kern des Fehlers vom 2026-09-10: die Sicht mit Schluessel ist gefiltert
  // (Betreiber-Schluessel ohne Guthaben: 2 Eintraege), der Katalog ohne
  // Schluessel ist es nicht (82). Wer nur die gefilterte Sicht fragt, macht aus
  // jedem nicht bezahlbaren Modell ein "gibt es nicht".
  it('fragt den Katalog, wenn die Sicht des Schluessels das Modell nicht kennt', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(upstream(KEYED))
      .mockResolvedValueOnce(upstream(KATALOG));

    expect(await lookupRegistryModel('qwen/qwen-image-3', 'key-a')).toEqual({
      status: 'found',
      model: { name: 'qwen/qwen-image-3', paid_only: true },
    });

    // Der zweite Abruf muss ohne Schluessel laufen — mit ihm kaeme wieder nur
    // die gefilterte Sicht zurueck.
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][1].headers.Authorization).toBe('Bearer key-a');
    expect(calls[1][1].headers.Authorization).toBeUndefined();
  });

  it('nimmt den Treffer aus der Sicht des Schluessels, ohne den Katalog zu fragen', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(upstream(KEYED));

    expect(await lookupRegistryModel('flux', 'key-a')).toEqual({ status: 'found', model: { name: 'flux' } });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('caches per key and reuses the catalog across callers', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(upstream(KATALOG))
      .mockResolvedValueOnce(upstream(KEYED));

    // Anonymer Aufruf: nur der Katalog.
    expect(await lookupRegistryModel('qwen/qwen-image-3')).toEqual({
      status: 'found',
      model: { name: 'qwen/qwen-image-3', paid_only: true },
    });
    // Mit Schluessel: dessen Sicht, danach der Katalog aus dem Puffer.
    expect(await lookupRegistryModel('qwen/qwen-image-3', 'key-a')).toEqual({
      status: 'found',
      model: { name: 'qwen/qwen-image-3', paid_only: true },
    });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
  });

  it('serves a repeated lookup for the same key from the cache', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(upstream(KATALOG));

    await lookupRegistryModel('flux', 'key-a');
    await lookupRegistryModel('qwen/qwen-image-3', 'key-a');

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('meldet missing nur, wenn beide Sichten geantwortet haben', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(upstream(KATALOG));

    expect(await lookupRegistryModel('gibt-es-nicht', 'key-a')).toEqual({ status: 'missing' });
  });

  it('macht aus einem Ausfall kein "Modell unbekannt"', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'upstream down',
      headers: { get: () => 'text/plain' },
    });

    expect(await lookupRegistryModel('flux', 'key-a')).toEqual({ status: 'unavailable', reason: 'upstream' });
  });

  it('bricht einen haengenden Abruf nach dem Timeout ab', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockImplementation((_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const abbruch = new Error('aborted');
          abbruch.name = 'AbortError';
          reject(abbruch);
        });
      }));

    const lauf = lookupRegistryModel('flux');
    jest.advanceTimersByTime(6_000);

    await expect(lauf).resolves.toEqual({ status: 'unavailable', reason: 'timeout' });
    jest.useRealTimers();
  });

  it('wertet JSON-Muell nicht als "Modell unbekannt"', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html>challenge</html>',
      headers: { get: () => 'text/html' },
    });

    expect(await lookupRegistryModel('flux')).toEqual({ status: 'unavailable', reason: 'parse' });
  });

  it('wertet eine leere Liste nicht als "Modell unbekannt"', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(upstream([]));

    expect(await lookupRegistryModel('flux')).toEqual({ status: 'unavailable', reason: 'empty' });
  });

  // Befund B3 (Phase 3): die Registry führt Aliase — `gpt-image` löst zu
  // `gptimage` auf, `veo-1080p` zu `veo`. Ohne Alias-Auflösung liefen solche
  // IDs in einen 400, obwohl der Anbieter sie bedient.
  it('resolves provider aliases via lookupRegistryModel', async () => {
    const WITH_ALIASES = [
      { name: 'gptimage', aliases: ['gpt-image'], paid_only: false },
      { name: 'veo', aliases: ['veo-1080p', 'veo-3.1-fast'], paid_only: true },
    ];
    (global.fetch as jest.Mock).mockResolvedValue(upstream(WITH_ALIASES));

    expect(await lookupRegistryModel('gpt-image')).toEqual({
      status: 'found',
      model: {
      name: 'gptimage',
      aliases: ['gpt-image'],
      paid_only: false,
      },
    });
    expect(await lookupRegistryModel('veo-3.1-fast')).toEqual({
      status: 'found',
      model: { name: 'veo', aliases: ['veo-1080p', 'veo-3.1-fast'], paid_only: true },
    });
    expect(await lookupRegistryModel('gptimage')).toEqual({
      status: 'found',
      model: { name: 'gptimage', aliases: ['gpt-image'], paid_only: false },
    });
  });
});
