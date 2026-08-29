import { assetOrigin, isInScope, ALL_ORIGINS } from './asset-origin';

describe('assetOrigin', () => {
  it('erkennt Create am Sentinel', () => {
    expect(assetOrigin({ conversationId: '__playground__' })).toBe('create');
  });

  it('erkennt Chat an einer echten Konversations-ID', () => {
    expect(assetOrigin({ conversationId: 'chat-1' })).toBe('chat');
  });

  // Zuordnung per Ausschluss, siehe Befund B5: Compose speichert ohne
  // conversationId. Altbestand kann ebenfalls hier landen.
  it('ordnet fehlende conversationId Compose zu', () => {
    expect(assetOrigin({ conversationId: undefined })).toBe('compose');
  });

  it('behandelt den leeren String wie fehlend', () => {
    expect(assetOrigin({ conversationId: '' })).toBe('compose');
  });
});

describe('isInScope', () => {
  it('ohne Filter ist alles im Bereich', () => {
    expect(isInScope({ conversationId: '__playground__' })).toBe(true);
    expect(isInScope({ conversationId: 'chat-1' })).toBe(true);
  });

  it('mit Filter nur die genannten Herkuenfte', () => {
    expect(isInScope({ conversationId: 'chat-1' }, ['chat'])).toBe(true);
    expect(isInScope({ conversationId: '__playground__' }, ['chat'])).toBe(false);
  });

  it('ALL_ORIGINS deckt alle drei ab', () => {
    expect([...ALL_ORIGINS].sort()).toEqual(['chat', 'compose', 'create']);
  });
});
