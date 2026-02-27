import { getPollenHeaders } from '@/lib/pollen-key';

export interface IngestResponse {
  key: string;
  contentType: string;
}

export async function ingestGeneratedAsset(
  sourceUrl: string,
  sessionId: string,
  kind?: 'image' | 'video'
): Promise<IngestResponse> {
  const response = await fetch('/api/media/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
    body: JSON.stringify({ sourceUrl, sessionId, kind }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to ingest asset');
  }

  return data as IngestResponse;
}
