/**
 * `/api/sound` startet Laeufe auf einer GPU, die der Betreiber bezahlt, und
 * war bis 2026-09-03 die einzige Route im Repo ohne Test. Diese Suite deckt
 * die Validierung, die Grenzwerte und die Fehlercodes ab — nicht das Modell.
 *
 * Der Modal-Endpunkt wird ueber `fetch` gemockt; ein echter Aufruf wuerde
 * einen abrechenbaren Lauf starten.
 */
const checkRateLimitMock = jest.fn(() => ({ ok: true, retryAfterSeconds: 0 }));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...(args as [])),
}));

const OLD_ENV = { ...process.env };

/**
 * jsdom kennt `Response.json` nicht als statische Methode, `NextResponse.json`
 * braucht sie aber. Dasselbe Polyfill nutzt compose/route.test.ts.
 */
const responseJson = jest.fn(
  (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  }),
);

function post(body: unknown): Request {
  return new Request('http://localhost/api/sound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function modalAntwortet(status: number, payload: unknown) {
  global.fetch = jest.fn(async () => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })) as unknown as typeof fetch;
}

/**
 * Body und Status aus dem Polyfill-Mock lesen statt aus `res.json()`: in jsdom
 * traegt die zurueckgegebene Response keinen lesbaren Body. Dasselbe macht
 * compose/route.test.ts.
 */
function letzteAntwort(): { body: Record<string, unknown>; status: number } {
  const call = responseJson.mock.calls.at(-1);
  return {
    body: (call?.[0] ?? {}) as Record<string, unknown>,
    status: (call?.[1] as ResponseInit | undefined)?.status ?? 200,
  };
}

/** Die Route liest die Env beim Modul-Laden — deshalb pro Test neu importieren. */
async function ladeRoute() {
  jest.resetModules();
  return import('./route');
}

describe('/api/sound', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    process.env.MODAL_ACESTEP_URL = 'https://workspace--acestep.modal.test';
    process.env.MODAL_ACESTEP_KEY = 'test-key';
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', { configurable: true, value: responseJson });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = { ...OLD_ENV };
  });

  describe('POST — Validierung', () => {
    it('verlangt Tags und nennt das Feld', async () => {
      const { POST } = await ladeRoute();
      await POST(post({ prompt: '   ' }) as never);
      expect(letzteAntwort().status).toBe(400);
      expect(letzteAntwort().body).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: { field: 'tags' },
      });
    });

    it('weist zu lange Tags mit Grenze ab', async () => {
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x'.repeat(513) }) as never);
      expect(letzteAntwort().status).toBe(400);
      expect(letzteAntwort().body).toMatchObject({
        code: 'SOUND_FIELD_TOO_LONG',
        details: { field: 'tags', limit: 512 },
      });
    });

    it('weist zu lange Lyrics mit Grenze ab', async () => {
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'dub techno', lyrics: 'x'.repeat(5001) }) as never);
      expect(letzteAntwort().status).toBe(400);
      expect(letzteAntwort().body).toMatchObject({
        code: 'SOUND_FIELD_TOO_LONG',
        details: { field: 'lyrics', limit: 5000 },
      });
    });

    it('weist Lyrics ab, die kein Text sind', async () => {
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'dub techno', lyrics: 42 }) as never);
      expect(letzteAntwort().status).toBe(400);
      expect(letzteAntwort().body).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: { field: 'lyrics' },
      });
    });
  });

  describe('POST — Grenzwerte', () => {
    it('klemmt Dauer und Varianten in den erlaubten Bereich', async () => {
      modalAntwortet(200, { data: { task_id: 'abcdef1234', status: 'queued' } });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'dub techno', duration: 9999, batch: 99 }) as never);

      expect(letzteAntwort().status).toBe(200);
      expect(letzteAntwort().body).toMatchObject({ duration: 240, batch: 8 });

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(init.body as string)).toMatchObject({ audio_duration: 240, batch_size: 8 });
    });

    it('faengt unsinnige Zahlen mit den Vorgaben auf', async () => {
      modalAntwortet(200, { data: { task_id: 'abcdef1234' } });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x', duration: 'viel', batch: null }) as never);
      expect(letzteAntwort().body).toMatchObject({ duration: 30, batch: 4 });
    });

    // Ohne Lyrics ist ein Lauf instrumental — das leitet die Route selbst ab,
    // damit der Client es nicht behaupten muss.
    it('leitet instrumental aus fehlenden Lyrics ab', async () => {
      modalAntwortet(200, { data: { task_id: 'abcdef1234' } });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x' }) as never);
      expect(letzteAntwort().body).toMatchObject({ instrumental: true });

      modalAntwortet(200, { data: { task_id: 'abcdef1234' } });
      await POST(post({ prompt: 'x', lyrics: '[verse]\nText' }) as never);
      expect(letzteAntwort().body).toMatchObject({ instrumental: false });
    });
  });

  describe('POST — Fehlerwege', () => {
    it('sagt es, wenn Modal nicht eingerichtet ist', async () => {
      delete process.env.MODAL_ACESTEP_URL;
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x' }) as never);
      expect(letzteAntwort().status).toBe(503);
      expect(letzteAntwort().body).toMatchObject({ code: 'SOUND_NOT_CONFIGURED' });
    });

    it('gibt das Rate-Limit mit Retry-After weiter', async () => {
      checkRateLimitMock.mockReturnValue({ ok: false, retryAfterSeconds: 42 });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x' }) as never);
      const { body, status } = letzteAntwort();
      expect(status).toBe(429);
      expect(body).toMatchObject({ code: 'RATE_LIMITED' });
      const init = responseJson.mock.calls.at(-1)?.[1] as ResponseInit;
      expect((init.headers as Record<string, string>)['Retry-After']).toBe('42');
    });

    it('5xx von Modal ist ein Anbieterausfall', async () => {
      modalAntwortet(503, { error: 'container starting' });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x' }) as never);
      expect(letzteAntwort().body).toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    });

    // 200 ohne task_id ist ein gebrochener Vertrag, kein Ausfall.
    it('200 ohne Task-Id wird zu 502 SOUND_BACKEND_ERROR', async () => {
      modalAntwortet(200, { data: {} });
      const { POST } = await ladeRoute();
      await POST(post({ prompt: 'x' }) as never);
      expect(letzteAntwort().status).toBe(502);
      expect(letzteAntwort().body).toMatchObject({ code: 'SOUND_BACKEND_ERROR' });
    });
  });

  describe('GET — Abfrage', () => {
    function get(query: string): Request {
      return new Request(`http://localhost/api/sound${query}`);
    }

    it('verlangt eine plausible Task-Id', async () => {
      const { GET } = await ladeRoute();
      for (const q of ['', '?taskId=', '?taskId=kurz', '?taskId=../etc/passwd']) {
        await GET(get(q) as never);
        expect(letzteAntwort().status).toBe(400);
        expect(letzteAntwort().body).toMatchObject({
          code: 'VALIDATION_ERROR',
          details: { field: 'taskId' },
        });
      }
    });

    it('reicht die Task-Antwort durch', async () => {
      modalAntwortet(200, { data: [{ status: 1, result: '[]' }] });
      const { GET } = await ladeRoute();
      await GET(get('?taskId=abcdef1234') as never);
      expect(letzteAntwort().status).toBe(200);
      expect(letzteAntwort().body).toMatchObject({ data: [{ status: 1 }] });
    });
  });
});
