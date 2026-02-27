import { getPollenHeaders } from '@/lib/pollen-key';

// Backward-compatible shapes (legacy S3 naming retained to avoid broad refactors).
export interface SignedUploadResponse {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

export interface SignedReadResponse {
  downloadUrl: string;
  expiresIn: number;
}

export interface SignedUploadOptions {
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

// Deprecated in hard-cut mode: upload is now one-step via /api/media/upload.
export async function requestSignedUpload(
  _filename: string,
  _contentType?: string,
  _options?: SignedUploadOptions
): Promise<SignedUploadResponse> {
  throw new Error('requestSignedUpload is no longer supported. Use uploadFileToS3WithKey() directly.');
}

// Deprecated in hard-cut mode: upload URLs are no longer used.
export async function uploadToSignedUrl(_uploadUrl: string, _file: Blob, _contentType?: string) {
  throw new Error('uploadToSignedUrl is no longer supported. Use uploadFileToS3WithKey() directly.');
}

export async function uploadFileToS3(
  file: Blob,
  filename: string,
  contentType?: string,
  options?: SignedUploadOptions
): Promise<string> {
  const signed = await uploadFileToS3WithKey(file, filename, contentType, options);
  return signed.downloadUrl;
}

export async function uploadFileToS3WithKey(
  file: Blob,
  filename: string,
  contentType?: string,
  _options?: SignedUploadOptions
): Promise<SignedUploadResponse> {
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
    uploadUrl: '',
    downloadUrl: media.url,
    key: media.id,
    expiresIn: IMMUTABLE_EXPIRES_SECONDS,
  };
}

export async function requestSignedRead(key: string): Promise<SignedReadResponse> {
  return {
    downloadUrl: getMediaUrlFromKey(key),
    expiresIn: IMMUTABLE_EXPIRES_SECONDS,
  };
}
