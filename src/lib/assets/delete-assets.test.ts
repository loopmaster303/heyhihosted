const del = jest.fn(async (_id: string) => {});
const bulkDel = jest.fn(async (_ids: string[]) => {});
let rows: { id: string; conversationId?: string }[] = [];

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      delete: (id: string) => del(id),
      bulkDelete: (ids: string[]) => bulkDel(ids),
      filter: (pred: (a: unknown) => boolean) => ({
        primaryKeys: async () => rows.filter(pred).map((r) => r.id),
      }),
    },
  },
}));

import { assetIdsInScope, deleteAssetById, deleteAssetsInScope } from './delete-assets';

beforeEach(() => {
  del.mockClear();
  bulkDel.mockClear();
  rows = [
    { id: 'c1', conversationId: 'chat-1' },
    { id: 'p1', conversationId: '__playground__' },
    { id: 'm1', conversationId: undefined },
  ];
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

  // Kehrt das Verhalten von vor Phase 5 um: Create-Assets ueberlebten ein
  // "alles loeschen" (Entscheidung E5.3).
  it('deleteAssetsInScope loescht genau die Ids im Bereich', async () => {
    const n = await deleteAssetsInScope(['create']);
    expect(bulkDel).toHaveBeenCalledWith(['p1']);
    expect(n).toBe(1);
  });

  it('deleteAssetsInScope ohne Bereich loescht alles', async () => {
    const n = await deleteAssetsInScope();
    expect(bulkDel).toHaveBeenCalledWith(['c1', 'p1', 'm1']);
    expect(n).toBe(3);
  });
});
