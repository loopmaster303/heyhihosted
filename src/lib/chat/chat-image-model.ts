import { DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { getChatImageModelIds } from '@/config/unified-image-models';

/**
 * Welches Modell ein Bild im Chat malt. Erlaubt ist nur, was die Chat-Regel
 * fuehrt (frei, Pollinations, Bild — getChatImageModelGroups). Ein gespeicherter
 * Wunsch ausserhalb dieser Regel faellt still auf den Standard zurueck: der Chat
 * verspricht nie ein Modell, das ohne Schluessel nicht laeuft.
 */
export function resolveChatImageModelId(preferred?: string | null): string {
  const allowed = getChatImageModelIds();
  if (preferred && allowed.includes(preferred)) return preferred;
  if (allowed.includes(DEFAULT_IMAGE_MODEL)) return DEFAULT_IMAGE_MODEL;
  return allowed[0] ?? DEFAULT_IMAGE_MODEL;
}
