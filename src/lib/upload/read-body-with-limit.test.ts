import { ReadableStream } from 'node:stream/web';
import { readBodyWithLimit } from '@/lib/upload/read-body-with-limit';
import { ApiError } from '@/lib/api-error-handler';

const TOO_LARGE = 'too large';

function streamingRequest(chunks: Uint8Array[], headers: HeadersInit = {}): Request {
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index++]);
    },
  });

  return {
    body,
    headers: new Headers(headers),
    arrayBuffer: async () => {
      throw new Error('arrayBuffer must not be used when a stream is available');
    },
  } as unknown as Request;
}

describe('readBodyWithLimit', () => {
  it('returns the full body when it stays under the limit', async () => {
    const request = streamingRequest([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);

    const buffer = await readBodyWithLimit(request, 100, TOO_LARGE);

    expect([...buffer]).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects an oversized declared content-length without reading the stream', async () => {
    const request = streamingRequest([new Uint8Array([1])], { 'content-length': '999' });

    await expect(readBodyWithLimit(request, 10, TOO_LARGE)).rejects.toMatchObject({
      statusCode: 413,
      code: 'UPLOAD_TOO_LARGE',
    });
  });

  it('aborts mid-stream when no content-length is declared', async () => {
    // The whole point: a chunked upload can lie by omission, so the limit has
    // to be enforced while reading rather than after buffering everything.
    const chunks = Array.from({ length: 10 }, () => new Uint8Array(4));
    const request = streamingRequest(chunks);

    await expect(readBodyWithLimit(request, 12, TOO_LARGE)).rejects.toBeInstanceOf(ApiError);
  });

  it('stops reading once the limit is passed', async () => {
    let produced = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        produced++;
        controller.enqueue(new Uint8Array(8));
      },
    });
    const request = { body, headers: new Headers() } as unknown as Request;

    await expect(readBodyWithLimit(request, 16, TOO_LARGE)).rejects.toBeInstanceOf(ApiError);
    expect(produced).toBeLessThan(10);
  });
});
