import {
  forgetPrunaReferencePreview,
  getPrunaReferencePreviews,
  isPrunaReferenceUrl,
  rememberPrunaReferencePreview,
} from './pruna-reference-preview';

const HANDLE =
  'https://api.pruna.ai/v1/files/NTNlZjczNmEtNzM1Mi00NTliLWIzZWYtMDc3ZWM1NzM3YTQ4.jpeg';

describe('isPrunaReferenceUrl', () => {
  it('erkennt die Handles aus Prunas urls.get', () => {
    expect(isPrunaReferenceUrl(HANDLE)).toBe(true);
  });

  // Alles andere laedt der Browser direkt; ein Cache dafuer waere Umweg.
  it('laesst direkt ladbare URLs in Ruhe', () => {
    expect(isPrunaReferenceUrl('https://media.pollinations.ai/abc.png')).toBe(false);
    expect(isPrunaReferenceUrl('blob:http://localhost/preview')).toBe(false);
    expect(isPrunaReferenceUrl('')).toBe(false);
  });
});

/**
 * Der Cache ist eine Bequemlichkeit, kein Vertrag: ohne IndexedDB — Server,
 * jsdom, Privatmodus — darf nichts werfen. Upload und Generate-Request laufen
 * unveraendert weiter, nur die Vorschau fehlt.
 */
describe('Vorschau-Cache ohne IndexedDB', () => {
  it('findet in jsdom kein IndexedDB', () => {
    expect(typeof indexedDB).toBe('undefined');
  });

  it('legt nichts ab und wirft nicht', async () => {
    const file = new Blob(['x'], { type: 'image/png' });

    await expect(rememberPrunaReferencePreview(HANDLE, file)).resolves.toBeUndefined();
  });

  it('liest einen leeren Cache', async () => {
    const previews = await getPrunaReferencePreviews([HANDLE, 'https://media.pollinations.ai/abc.png']);

    expect(previews.size).toBe(0);
  });

  it('entfernt nichts und wirft nicht', async () => {
    await expect(forgetPrunaReferencePreview(HANDLE)).resolves.toBeUndefined();
  });
});
