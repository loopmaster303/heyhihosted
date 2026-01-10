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

export async function requestSignedUpload(
  filename: string,
  contentType?: string,
  options?: SignedUploadOptions
): Promise<SignedUploadResponse> {
  const response = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      contentType,
      sessionId: options?.sessionId,
      folder: options?.folder,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to sign upload');
  }

  return data as SignedUploadResponse;
}

export async function uploadToSignedUrl(uploadUrl: string, file: Blob, contentType?: string) {
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }
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
  options?: SignedUploadOptions
): Promise<SignedUploadResponse> {
  const signed = await requestSignedUpload(filename, contentType, options);
  await uploadToSignedUrl(signed.uploadUrl, file, contentType);
  return signed;
}

export async function requestSignedRead(key: string): Promise<SignedReadResponse> {
  const response = await fetch('/api/upload/sign-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to sign read');
  }

  return data as SignedReadResponse;
}
