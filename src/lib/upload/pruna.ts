import { getPrunaHeaders } from '@/lib/pruna-key';

export async function uploadFileToPruna(file: File | Blob, filename?: string): Promise<string> {
  const safeFilename = filename || (file instanceof File ? file.name : 'upload.bin');
  const response = await fetch(`/api/pruna/upload?filename=${encodeURIComponent(safeFilename)}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...getPrunaHeaders(),
    },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.url !== 'string') {
    throw new Error(result.error || `Pruna upload failed (${response.status})`);
  }
  return result.url;
}
