import { isInScope } from '@/lib/assets/asset-origin';
import type { Asset } from '@/lib/services/database';

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: 'a',
    remoteUrl: 'https://x/1.png',
    contentType: 'image/png',
    timestamp: 1,
    ...overrides,
  };
}

describe('Bereichsauswahl der Galerie-Query', () => {
  const rows = [
    asset({ id: 'chat', conversationId: 'chat-1' }),
    asset({ id: 'create', conversationId: '__playground__' }),
    asset({ id: 'compose', conversationId: undefined }),
  ];

  it('ohne Filter liefert die Query alle drei Herkuenfte', () => {
    expect(rows.filter((a) => isInScope(a)).map((a) => a.id))
      .toEqual(['chat', 'create', 'compose']);
  });

  it('Filter "chat" blendet Create und Compose aus', () => {
    expect(rows.filter((a) => isInScope(a, ['chat'])).map((a) => a.id))
      .toEqual(['chat']);
  });

  // Kehrt den geloeschten Test von 2026-08 um: Create-Assets ueberleben ein
  // "alles loeschen" NICHT mehr, wenn der Filter sie zeigt (Entscheidung E5.3).
  it('Filter "create" waehlt Create-Assets fuer das Massenloeschen aus', () => {
    expect(rows.filter((a) => isInScope(a, ['create'])).map((a) => a.id))
      .toEqual(['create']);
  });
});
