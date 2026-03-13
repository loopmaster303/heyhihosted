import { getPollenHeaders } from '@/lib/pollen-key';

export interface PollinationsMediaUploadResult {
  mediaUrl: string;
  key: string;
  expiresIn: number;
}

export interface PollinationsMediaReadResult {
  mediaUrl: string;
  expiresIn: number;
}

export interface PollinationsMediaUploadOptions {
  sessionId?: string;
  folder?: string;
}

interface MediaUploadResponse {
  id: string;
  url: string;
  contentType: string;
  size: number;
  duplicate: boolean;
}

const IMMUTABLE_EXPIRES_SECONDS = 60 * 60 * 24 * 365 * 10;

function getMediaUrlFromKey(key: string): string {
  return `https://media.pollinations.ai/${encodeURIComponent(key)}`;
}

export async function uploadFileToPollinationsMedia(
  file: Blob,
  filename: string,
  contentType?: string,
  _options?: PollinationsMediaUploadOptions
): Promise<PollinationsMediaUploadResult> {
  const normalizedContentType = contentType || file.type || 'application/octet-stream';
  const uploadFile = file instanceof File
    ? file
    : new File([file], filename || `upload-${Date.now()}.bin`, { type: normalizedContentType });

  const formData = new FormData();
  formData.append('file', uploadFile, uploadFile.name || filename);

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { ...getPollenHeaders() },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to upload media');
  }

  const media = data as MediaUploadResponse;
  return {
    mediaUrl: media.url,
    key: media.id,
    expiresIn: IMMUTABLE_EXPIRES_SECONDS,
  };
}

export async function uploadFileToPollinationsMediaUrl(
  file: Blob,
  filename: string,
  contentType?: string,
  options?: PollinationsMediaUploadOptions
): Promise<string> {
  const media = await uploadFileToPollinationsMedia(file, filename, contentType, options);
  return media.mediaUrl;
}

export async function resolvePollinationsMediaUrl(key: string): Promise<PollinationsMediaReadResult> {
  return {
    mediaUrl: getMediaUrlFromKey(key),
    expiresIn: IMMUTABLE_EXPIRES_SECONDS,
  };
}
