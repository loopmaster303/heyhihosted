import { ApiError } from '@/lib/api-error-handler';
import { isBudgetExhaustedError } from '@/lib/pollen-cost-guard';
import { isContentRejection } from '@/lib/errors/upstream-rejection';

const POLLINATIONS_IMAGE_V1_URL = 'https://gen.pollinations.ai/v1/images/generations';

interface GeneratePollinationsImageInput {
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
  safe?: boolean;
  transparent?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'hd';
  negative_prompt?: string;
  image?: string | string[];
  apiKey?: string;
  /**
   * Kam der Schluessel aus dem Request des Nutzers? Ohne diese Angabe sieht
   * diese Funktion nur "irgendein Schluessel war da" und kann einen leeren
   * Betreiber-Topf nicht von einem leeren Nutzer-Topf unterscheiden. Live
   * belegt am 2026-09-10: der Betreiber-Schluessel hat 0.0000 Budget, der
   * Nutzer las aber "Dein Pollen-Guthaben reicht fuer dieses Modell nicht." —
   * ein Satz ueber ein Konto, das er nicht hat.
   */
  hasUserKey?: boolean;
}

interface PollinationsImageV1Response {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  } | string;
}

function toImageSize(width?: number, height?: number): string {
  return `${width || 1024}x${height || 1024}`;
}

/**
 * Status -> Fehlercode. Ohne Code kann der Client nicht uebersetzen und faellt
 * auf Status plus englischen Rohtext zurueck. Vier Faelle sind live belegt und
 * tragen deshalb einen:
 *
 * - 401 kein/abgelehnter Schluessel. Immer derselbe Rat: eigener Schluessel.
 * - 402 Guthaben. Wessen Guthaben, entscheidet der benutzte Schluessel: der
 *   eigene (`POLLEN_INSUFFICIENT`), der des Betreibers
 *   (`POLLEN_SERVER_BUDGET`) oder gar keins (`POLLEN_KEY_REQUIRED`). Der
 *   Server-Fall ist unten live belegt und wird vorher einmal anonym versucht.
 * - 403 Modell nicht erlaubt. Wieder entscheidet der Schluessel: der Rohtext
 *   ("not allowed for this API key") meint bei einem Betreiber-Lauf unseren
 *   Schluessel und bei einem BYOP-Lauf den des Nutzers. Zwei Codes, weil der
 *   Satz sonst dem Nutzer einen fremden Schluessel erklaeren wuerde.
 * - 5xx der Anbieter ist weg.
 */
function codeForStatus(status: number, usedOwnKey: boolean, serverKeyWarLeer: boolean): string | undefined {
  if (status === 401) return 'POLLEN_KEY_REQUIRED';
  if (status === 402) {
    if (usedOwnKey) return 'POLLEN_INSUFFICIENT';
    return serverKeyWarLeer ? 'POLLEN_SERVER_BUDGET' : 'POLLEN_KEY_REQUIRED';
  }
  if (status === 403) {
    return usedOwnKey ? 'POLLEN_MODEL_NOT_ALLOWED_OWN_KEY' : 'POLLEN_MODEL_NOT_ALLOWED';
  }
  if (status >= 500) return 'PROVIDER_UNAVAILABLE';
  return undefined;
}

export async function generatePollinationsImage(input: GeneratePollinationsImageInput): Promise<string> {
  const payload = {
    model: input.model,
    prompt: input.prompt,
    size: toImageSize(input.width, input.height),
    ...(input.seed !== undefined ? { seed: input.seed } : {}),
    ...(input.nologo !== undefined ? { nologo: input.nologo } : {}),
    ...(input.enhance !== undefined ? { enhance: input.enhance } : {}),
    ...(input.safe !== undefined ? { safe: input.safe } : {}),
    ...(input.transparent !== undefined ? { transparent: input.transparent } : {}),
    ...(input.quality ? { quality: input.quality } : {}),
    ...(input.negative_prompt ? { negative_prompt: input.negative_prompt } : {}),
    ...(input.image ? { image: input.image } : {}),
    response_format: 'url',
  };

  const response = await fetch(POLLINATIONS_IMAGE_V1_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  // Ein leerer Betreiber-Schluessel antwortet hier 402. Frueher folgte darauf
  // ein zweiter Versuch ohne Schluessel. Der ist seit der Messung vom
  // 2026-09-10 sinnlos: `POST /v1/images/generations` antwortet ohne
  // Schluessel mit 401 ("A valid API key is required") — einen anonymen Weg
  // zur Generierung gibt es nicht mehr. Er verschleierte nur die Ursache, denn
  // der Nutzer sah am Ende den 401 statt des 402, der wirklich vorlag.
  //
  // Die Erkennung bleibt: nur sie unterscheidet "der Topf des Betreibers ist
  // leer" (POLLEN_SERVER_BUDGET) von "du brauchst einen eigenen Schluessel".
  let serverKeyWarLeer = false;
  if (!response.ok && input.apiKey && input.hasUserKey !== true) {
    const rohtext = await response.clone().text().catch(() => '');
    serverKeyWarLeer = isBudgetExhaustedError(response.status, rohtext);
  }

  const result = await response.json().catch(() => ({})) as PollinationsImageV1Response;
  if (!response.ok) {
    const detail = typeof result.error === 'string'
      ? result.error
      : result.error?.message || 'Unknown Pollinations image generation error';
    const code = codeForStatus(response.status, input.hasUserKey === true, serverKeyWarLeer);
    // Der Sicherheitsfilter des Anbieters ist kein Ausfall: bei 400 mit
    // "rejected by the safety system" waere codeForStatus ohne Code, und der
    // Client zeigte Status plus englischen Rohtext statt eines Rats.
    const endgueltig = isContentRejection(response.status, detail) ? 'CONTENT_REJECTED' : code;
    throw new ApiError(response.status, `Pollinations API error: ${detail}`, endgueltig, { modelLabel: input.model });
  }

  const firstAsset = result.data?.[0];
  if (firstAsset?.url) {
    return firstAsset.url;
  }

  if (firstAsset?.b64_json) {
    return `data:image/png;base64,${firstAsset.b64_json}`;
  }

  throw new ApiError(502, 'Pollinations API error: missing image output');
}
