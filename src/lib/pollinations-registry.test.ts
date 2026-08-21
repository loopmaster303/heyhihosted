import { findRegistryModel, _clearRegistryCacheForTesting } from './pollinations-registry';

const PAID = [{ name: 'flux' }, { name: 'nanobanana', paid_only: true }];
const FREE = [{ name: 'flux' }];

describe('pollinations-registry', () => {
  beforeEach(() => {
    _clearRegistryCacheForTesting();
    global.fetch = jest.fn();
  });

  it('caches per key instead of sharing one entry across callers', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => FREE })
      .mockResolvedValueOnce({ ok: true, json: async () => PAID });

    // Anonym zuerst: sieht das bezahlte Modell nicht.
    expect(await findRegistryModel('nanobanana')).toBeUndefined();
    // Mit Key darf derselbe Aufruf nicht auf der anonymen Antwort sitzenbleiben.
    expect(await findRegistryModel('nanobanana', 'key-a')).toEqual({ name: 'nanobanana', paid_only: true });
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
  });

  it('serves a repeated lookup for the same key from the cache', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => PAID });

    await findRegistryModel('flux', 'key-a');
    await findRegistryModel('nanobanana', 'key-a');

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('treats an upstream failure as an unknown model', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    expect(await findRegistryModel('flux')).toBeUndefined();
  });
});
