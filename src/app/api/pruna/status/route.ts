import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';
import { resolvePrunaKey } from '@/lib/resolve-pruna-key';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { fetchPrunaPredictionStatus } from '@/lib/pruna/client';
import { deliverPrunaResult } from '@/lib/pruna/deliver';
import { getPrunaModelMapping } from '@/config/pruna-models';
import { getUnifiedModel } from '@/config/unified-image-models';

/**
 * Statusabfrage fuer einen laufenden Pruna-Auftrag.
 *
 * `/api/generate` liefert bei allem, was nicht sofort fertig ist, nur die
 * Lauf-Id; der Browser fragt hier nach. Solange gerechnet wird, antwortet die
 * Route mit 202 — ist das Ergebnis da, mit genau derselben Antwort, die
 * `/api/generate` bei einem schnellen Lauf schickt.
 */
export async function GET(request: Request) {
  try {
    const prunaApiKey = resolvePrunaKey(request);
    if (!prunaApiKey) throw new ApiError(503, 'A Pruna API key is required', 'MISSING_PRUNA_KEY');

    const params = new URL(request.url).searchParams;
    const predictionId = params.get('id') ?? '';
    const model = params.get('model') ?? '';

    if (!predictionId) throw new ApiError(400, 'Missing prediction id', 'PRUNA_MISSING_ID');
    if (!getPrunaModelMapping(model)) {
      throw new ApiError(400, `Unknown Pruna model: ${model}`, 'UNKNOWN_PRUNA_MODEL');
    }

    const result = await fetchPrunaPredictionStatus(model, predictionId, prunaApiKey, request.signal);
    if (result === 'pending') {
      return NextResponse.json({ pending: true, predictionId }, { status: 202 });
    }

    const pollenKey = resolvePollenKey(request);
    return await deliverPrunaResult({
      result,
      prunaApiKey,
      pollenKey: pollenKey && pollenKey.trim() ? pollenKey : undefined,
      isVideo: getUnifiedModel(model)?.kind === 'video',
      signal: request.signal,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
