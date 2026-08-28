import { generateViaPruna, fetchPrunaPredictionStatus, uploadPrunaFile, downloadPrunaResult } from './client';

describe('Pruna client', () => {
  const originalFetch = global.fetch;
  const originalPrunaApiKey = process.env.PRUNA_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalPrunaApiKey === undefined) {
      delete (process.env as any).PRUNA_API_KEY;
    } else {
      process.env.PRUNA_API_KEY = originalPrunaApiKey;
    }
    jest.restoreAllMocks();
  });

  it('accepts sync Pruna generation_url arrays and uses the first URL', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'succeeded',
        generation_url: ['https://api.pruna.ai/v1/predictions/delivery/output.jpeg'],
      }),
    } as Response);

    const result = await generateViaPruna('wan-image-small', {
      prompt: 'a red cube',
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
    });

    expect(result).toEqual({
      generationUrl: 'https://api.pruna.ai/v1/predictions/delivery/output.jpeg',
      contentType: 'image/jpeg',
    });
  });

  it('accepts sync Pruna generation_url strings', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'succeeded',
        generation_url: 'https://api.pruna.ai/v1/predictions/delivery/output.png',
      }),
    } as Response);

    const result = await generateViaPruna('p-image', {
      prompt: 'a blue cube',
      aspectRatio: '1:1',
    });

    expect(result).toEqual({
      generationUrl: 'https://api.pruna.ai/v1/predictions/delivery/output.png',
      contentType: 'image/png',
    });
  });

  it('throws PRUNA_UPLOAD_MISSING_URL when upload responds 2xx without a valid URL', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ urls: { get: '' } }),
    } as Response);

    await expect(uploadPrunaFile(Buffer.from('fake'), 'fake.png')).rejects.toMatchObject({
      statusCode: 502,
      message: 'Pruna file upload succeeded but returned no valid URL',
      code: 'PRUNA_UPLOAD_MISSING_URL',
    });
  });

  it('throws PRUNA_PREDICTION_FAILED when Pruna submit returns an immediate failed status', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'failed', error: 'Safety filter triggered' }),
    } as Response);

    await expect(
      generateViaPruna('p-image', { prompt: 'disallowed content', aspectRatio: '1:1' }),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Pruna prediction failed: Safety filter triggered',
      code: 'PRUNA_PREDICTION_FAILED',
    });
  });

  // Kein Request wartet mehr auf ein Video: der Submit endet bei der Lauf-Id,
  // die Statusabfrage ist eine einzelne Runde, die der Browser wiederholt.
  it('returns the prediction id for an async model without polling', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'starting', id: 'pred-123' }),
    } as Response);

    await expect(generateViaPruna('wan-t2v', { prompt: 'test', duration: 5 }))
      .resolves.toEqual({ predictionId: 'pred-123' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('derives the prediction id from get_url when the submit omits the id', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'starting',
        get_url: 'https://api.pruna.ai/v1/predictions/status/pred-456',
      }),
    } as Response);

    await expect(generateViaPruna('vace', { prompt: 'test' }))
      .resolves.toEqual({ predictionId: 'pred-456' });
  });

  it('reports a still-running prediction as pending', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'processing' }),
    } as Response);

    await expect(fetchPrunaPredictionStatus('vace', 'pred-123')).resolves.toBe('pending');
  });

  it('throws PRUNA_MISSING_STATUS when a prediction succeeds without a generation URL', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'succeeded', generation_url: '' }),
    } as Response);

    await expect(fetchPrunaPredictionStatus('wan-t2v', 'pred-123')).rejects.toMatchObject({
      statusCode: 502,
      message: 'Pruna prediction succeeded but returned no generation URL',
      code: 'PRUNA_MISSING_STATUS',
    });
  });

  // Die Id landet in einer URL — ein Pfad darin wuerde die Abfrage umlenken.
  it('rejects a prediction id that is not an opaque token', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn();

    await expect(fetchPrunaPredictionStatus('vace', '../../files/secret')).rejects.toMatchObject({
      statusCode: 400,
      code: 'PRUNA_INVALID_ID',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits VACE to the standard Pruna host and never the retired shared host', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'starting', id: 'vace-prediction' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'succeeded',
          generation_url: 'https://api.pruna.ai/v1/predictions/delivery/vace.mp4',
        }),
      } as Response);

    await generateViaPruna('vace', { prompt: 'consistent character' });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.pruna.ai/v1/predictions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Model: 'vace' }),
      }),
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('api.sharedservices.pruna.ai'),
      expect.anything(),
    );
  });

  it('wraps an initial VACE submit fetch rejection as a safe Pruna network error', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError('fetch failed: getaddrinfo ENOTFOUND api.sharedservices.pruna.ai'),
    );

    await expect(
      generateViaPruna('vace', { prompt: 'consistent character' }),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Unable to reach Pruna API while submitting vace',
      code: 'PRUNA_NETWORK_ERROR',
    });
  });

  it('preserves an aborted initial submit as a Pruna cancellation error', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    const controller = new AbortController();
    controller.abort();
    global.fetch = jest.fn().mockRejectedValue(
      new DOMException('This operation was aborted', 'AbortError'),
    );

    await expect(
      generateViaPruna('vace', { prompt: 'consistent character' }, controller.signal),
    ).rejects.toMatchObject({
      statusCode: 499,
      message: 'Pruna prediction aborted',
      code: 'PRUNA_ABORTED',
    });
  });

  describe('downloadPrunaResult redirect policy', () => {
    it('rejects a generation URL pointing at a private/internal host', async () => {
      global.fetch = jest.fn() as any;
      await expect(
        downloadPrunaResult('http://169.254.169.254/latest/meta-data', 'KEY'),
      ).rejects.toMatchObject({ code: 'PRUNA_UNSAFE_URL' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not follow a redirect to a private host', async () => {
      const fetchMock = jest.fn(async () => ({
        status: 302,
        ok: false,
        headers: { get: (k: string) => (k === 'location' ? 'http://127.0.0.1/secret' : null) },
      })) as any;
      global.fetch = fetchMock;

      await expect(
        downloadPrunaResult('https://api.pruna.ai/gen/abc', 'SECRETKEY'),
      ).rejects.toMatchObject({ code: 'PRUNA_UNSAFE_REDIRECT' });
      // Only the initial fetch happened; the private redirect target was never fetched.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('downloads from a valid public generation URL', async () => {
      global.fetch = jest.fn(async () => ({
        status: 200,
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('data').buffer,
        headers: { get: (k: string) => (k === 'content-type' ? 'image/png' : null) },
      })) as any;

      const result = await downloadPrunaResult('https://api.pruna.ai/gen/abc', 'KEY');
      expect(result.contentType).toBe('image/png');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });
});
