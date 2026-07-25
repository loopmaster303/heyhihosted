import { ApiError } from '@/lib/api-error-handler';

/** The part of Request/Response this helper needs — both satisfy it. */
interface StreamableBody {
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Read a request or response body into memory, aborting as soon as it exceeds
 * `maxBytes`.
 *
 * `arrayBuffer()` buffers the whole payload before its size can be checked, so
 * a peer that omits or understates `content-length` can force the server to
 * allocate arbitrary memory. Streaming lets us stop at the limit.
 */
export async function readBodyWithLimit(
  source: StreamableBody,
  maxBytes: number,
  tooLargeMessage: string,
): Promise<Buffer> {
  const declaredLength = Number(source.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError(413, tooLargeMessage, 'UPLOAD_TOO_LARGE');
  }

  const body = source.body;
  if (!body) {
    // No stream available (e.g. a body-less request, or a polyfilled Request in
    // tests) — fall back to the buffered read, which the length check guards.
    const buffer = Buffer.from(await source.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new ApiError(413, tooLargeMessage, 'UPLOAD_TOO_LARGE');
    }
    return buffer;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new ApiError(413, tooLargeMessage, 'UPLOAD_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}
