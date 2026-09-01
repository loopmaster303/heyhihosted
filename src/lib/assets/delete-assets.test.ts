const del = jest.fn(async (_id: string) => {});
const bulkDel = jest.fn(async (_ids: string[]) => {});
const get = jest.fn(async (_id: string) => undefined as { id: string; conversationId?: string; storageKey?: string } | undefined);
let rows: { id: string; conversationId?: string; storageKey?: string }[] = [];
let pollenHeaders: Record<string, string> = {};

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      delete: (id: string) => del(id),
      bulkDelete: (ids: string[]) => bulkDel(ids),
      get: (id: string) => get(id),
      filter: (pred: (a: unknown) => boolean) => ({
        primaryKeys: async () => rows.filter(pred).map((r) => r.id),
      }),
    },
  },
}));

jest.mock('@/lib/pollen-key', () => ({
  getPollenHeaders: () => pollenHeaders,
}));

import { assetIdsInScope, deleteAssetById, deleteAssetsInScope } from './delete-assets';

beforeEach(() => {
  del.mockClear();
  bulkDel.mockClear();
  get.mockClear();
  (global.fetch as jest.Mock).mockClear();
  pollenHeaders = { 'X-Pollen-Key': 'sk_user' };
  rows = [
    { id: 'c1', conversationId: 'chat-1' },
    { id: 'p1', conversationId: '__playground__' },
    { id: 'm1', conversationId: undefined },
  ];
});

beforeAll(() => {
  global.fetch = jest.fn(async () => new Response(null, { status: 200 }));
});

describe('delete-assets', () => {
  it('assetIdsInScope respektiert den Bereich', async () => {
    expect(await assetIdsInScope(['create'])).toEqual(['p1']);
    expect(await assetIdsInScope()).toEqual(['c1', 'p1', 'm1']);
  });

  it('deleteAssetById loescht genau eine Zeile', async () => {
    await deleteAssetById('c1');
    expect(del).toHaveBeenCalledWith('c1');
    expect(bulkDel).not.toHaveBeenCalled();
  });

  it('deleteAssetById ruft den Proxy mit dem storageKey auf und loescht die Zeile', async () => {
    get.mockResolvedValueOnce({ id: 'c1', conversationId: 'chat-1', storageKey: 'abc123' });

    await deleteAssetById('c1');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/media/delete?key=abc123',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(del).toHaveBeenCalledWith('c1');
  });

  // F1: Ohne diesen Header faellt resolvePollenKey serverseitig auf den
  // Betreiber-Schluessel zurueck. Der hat an fremden Medien keine Rechte —
  // die Loeschung scheitert still und die externe Kopie bleibt zehn Jahre.
  it('deleteAssetById schickt den BYOP-Schluessel an den Proxy', async () => {
    get.mockResolvedValueOnce({ id: 'c1', conversationId: 'chat-1', storageKey: 'abc123' });

    await deleteAssetById('c1');

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ 'X-Pollen-Key': 'sk_user' });
  });

  it('deleteAssetById kommt ohne hinterlegten Schluessel aus', async () => {
    pollenHeaders = {};
    get.mockResolvedValueOnce({ id: 'c1', conversationId: 'chat-1', storageKey: 'abc123' });

    await deleteAssetById('c1');

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({});
    expect(del).toHaveBeenCalledWith('c1');
  });

  it('deleteAssetById ohne storageKey ruft den Proxy nicht auf', async () => {
    get.mockResolvedValueOnce({ id: 'c1', conversationId: 'chat-1' });

    await deleteAssetById('c1');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith('c1');
  });

  it('deleteAssetById faehrt fort, wenn der Proxy fehlschlaegt', async () => {
    get.mockResolvedValueOnce({ id: 'c1', conversationId: 'chat-1', storageKey: 'abc123' });
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await deleteAssetById('c1');

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith('c1');
    consoleWarnSpy.mockRestore();
  });

  // Kehrt das Verhalten von vor Phase 5 um: Create-Assets ueberlebten ein
  // "alles loeschen" (Entscheidung E5.3).
  it('deleteAssetsInScope loescht genau die Ids im Bereich', async () => {
    const n = await deleteAssetsInScope(['create']);
    expect(del).toHaveBeenCalledWith('p1');
    expect(bulkDel).not.toHaveBeenCalled();
    expect(n).toBe(1);
  });

  it('deleteAssetsInScope ohne Bereich loescht alles', async () => {
    const n = await deleteAssetsInScope();
    expect(del).toHaveBeenCalledWith('c1');
    expect(del).toHaveBeenCalledWith('p1');
    expect(del).toHaveBeenCalledWith('m1');
    expect(bulkDel).not.toHaveBeenCalled();
    expect(n).toBe(3);
  });

  // F2: Vorher eine Schleife mit einer Netzrunde je Zeile. Der Fortschritt
  // ist das, was ein langer Lauf der Oberflaeche schuldet.
  it('deleteAssetsInScope meldet Fortschritt fuer jede Zeile', async () => {
    const steps: Array<[number, number]> = [];

    const n = await deleteAssetsInScope(undefined, (done, total) => steps.push([done, total]));

    expect(n).toBe(3);
    expect(steps).toHaveLength(3);
    expect(steps.every(([, total]) => total === 3)).toBe(true);
    expect(steps.map(([done]) => done).sort()).toEqual([1, 2, 3]);
  });

  it('deleteAssetsInScope haelt die Nebenlaeufigkeitsgrenze ein', async () => {
    rows = Array.from({ length: 20 }, (_, i) => ({ id: `a${i}`, conversationId: 'chat-1' }));

    let inFlight = 0;
    let peak = 0;
    get.mockImplementation(async (id: string) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 0));
      inFlight -= 1;
      return { id, conversationId: 'chat-1', storageKey: `k-${id}` };
    });

    const n = await deleteAssetsInScope();

    expect(n).toBe(20);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(6);
  });
});
