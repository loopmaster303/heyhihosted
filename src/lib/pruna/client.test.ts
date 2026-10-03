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

  // Der Feldname ist die einzige verwertbare Information in der Pruna-400 —
  // er wandert strukturiert in details.field (Tabelle Zeile 2).
  it('extracts the rejected field name from a Pruna 400 into details.field', async () => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        message: 'property input validation failed: additional properties forbidden, found voellig_unbekanntes_feld',
      }),
    } as Response);

    await expect(generateViaPruna('wan-t2v', { prompt: 'x', duration: 5 })).rejects.toMatchObject({
      statusCode: 400,
      code: 'PRUNA_API_ERROR',
      details: { field: 'voellig_unbekanntes_feld' },
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

  // Aufgabe 3: das Mapping selbst stammt aus Aufgabe 1 (src/config/pruna-models.ts).
  // Diese Tests laufen gegen die echte Konfiguration (nur fetch ist gemockt) und
  // belegen den vom Plan geforderten Regressionsschutz: Header, Async-Modus,
  // numerische fps, Auto-Dauer und die Feld-Whitelist.
  describe('p-video-2 mapping (real config, mocked fetch)', () => {
    it('submits Model: p-video-2 without Try-Sync (async dispatch)', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-1' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2', { prompt: 'a car driving' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.pruna.ai/v1/predictions',
        expect.objectContaining({
          headers: expect.objectContaining({ Model: 'p-video-2' }),
        }),
      );
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers).not.toHaveProperty('Try-Sync');
    });

    it('sends fps as a number even when the field arrives as a string', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-2' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2', { prompt: 'a car driving', params: { fps: '48' } });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input.fps).toBe(48);
      expect(typeof body.input.fps).toBe('number');
    });

    it('omits duration entirely in auto mode, even with conflicting values on both levels', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-3' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2', {
        prompt: 'a car driving',
        duration: 7,
        params: { duration_auto: true, duration: 3 },
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input).not.toHaveProperty('duration');
    });

    it('prefers the validated top-level duration over a conflicting params.duration', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-5' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2', {
        prompt: 'a car driving',
        duration: 5,
        params: { duration: 99 },
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input.duration).toBe(5);
    });

    it('does not forward UI-only fields (duration_auto, width, height, output_format) to Pruna', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-4' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2', {
        prompt: 'a car driving',
        width: 1024,
        height: 576,
        params: {
          duration_auto: false,
          width: 1024,
          height: 576,
          output_format: 'mp4',
          resolution: '1080p',
          fps: 48,
        },
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input).not.toHaveProperty('duration_auto');
      expect(body.input).not.toHaveProperty('width');
      expect(body.input).not.toHaveProperty('height');
      expect(body.input).not.toHaveProperty('output_format');
      expect(body.input.resolution).toBe('1080p');
      expect(body.input.fps).toBe(48);
    });
  });

  describe('p-video-2-pro mapping (real config, mocked fetch)', () => {
    it('submits Model: p-video-2-pro without Try-Sync and keeps input.mode independent of transport', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-pro-1' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2-pro', {
        prompt: 'a car driving',
        params: { mode: 'quality' },
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.pruna.ai/v1/predictions');
      expect(init.headers).toEqual(expect.objectContaining({ Model: 'p-video-2-pro' }));
      expect(init.headers).not.toHaveProperty('Try-Sync');
      const body = JSON.parse(init.body);
      expect(body.input.mode).toBe('quality');
      expect(body.input).toEqual({
        prompt: 'a car driving',
        duration: 5,
        resolution: '768p',
        mode: 'quality',
        prompt_upsampler: 'turbo',
        aspect_ratio: '16:9',
      });
    });

    it('sends only documented Pro fields and preserves resolution and reference frame order', async () => {
      process.env.PRUNA_API_KEY = 'test-pruna-key';
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'starting', id: 'pv2-pro-2' }),
      } as Response);
      global.fetch = fetchMock as unknown as typeof fetch;

      await generateViaPruna('p-video-2-pro', {
        prompt: 'a car driving',
        seed: 0,
        duration: 15,
        image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
        params: {
          resolution: '480p',
          mode: 'cost',
          prompt_upsampler: 'off',
          aspect_ratio: '9:16',
          fps: 48,
          duration_auto: true,
          width: 1024,
          height: 576,
          output_format: 'mp4',
          audio: true,
          save_audio: true,
          prompt_upsampling: true,
          draft: false,
        },
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input).toEqual({
        prompt: 'a car driving',
        duration: 15,
        resolution: '480p',
        mode: 'cost',
        prompt_upsampler: 'off',
        image: 'https://example.com/start.jpg',
        last_frame_image: 'https://example.com/end.jpg',
        seed: 0,
      });
      expect(Object.keys(body.input)).not.toEqual(expect.arrayContaining([
        'fps', 'duration_auto', 'draft', 'save_audio', 'audio', 'prompt_upsampling',
        'width', 'height', 'output_format', 'aspect_ratio',
      ]));
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
