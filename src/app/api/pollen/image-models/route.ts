import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { fetchImageModelsRaw, _clearRegistryCacheForTesting } from '@/lib/pollinations/image-model-registry';

// Cache und Upstream liegen jetzt im geteilten Registry-Modul — die
// enhance-prompt-Route liest dieselbe Antwort fuer ihren generischen Prompt.
export const _clearCacheForTesting = _clearRegistryCacheForTesting;

export async function GET(request: Request) {
  const { body, contentType, status } = await fetchImageModelsRaw(resolvePollenKey(request));
  return new Response(body, { status, headers: { 'content-type': contentType } });
}
