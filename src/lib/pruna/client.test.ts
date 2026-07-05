import { generateViaPruna, uploadPrunaFile, downloadPrunaResult } from './client';

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

  it('throws PRUNA_MISSING_STATUS when async poll succeeds without a generation URL', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pred-123' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'succeeded', generation_url: '' }),
      } as Response);

    await expect(generateViaPruna('wan-t2v', { prompt: 'test', duration: 5 })).rejects.toMatchObject({
      statusCode: 502,
      message: 'Pruna prediction succeeded but returned no generation URL',
      code: 'PRUNA_MISSING_STATUS',
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
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
