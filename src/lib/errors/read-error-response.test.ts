import { readErrorResponse } from './read-error-response';

const jsonResponse = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('liest {error: string} mit Code', async () => {
  const r = await readErrorResponse(jsonResponse({ error: 'Invalid request data', code: 'VALIDATION_ERROR' }));
  expect(r).toMatchObject({ status: 400, message: 'Invalid request data', code: 'VALIDATION_ERROR' });
  expect(r.raw).toContain('Invalid request data');
});

test('liest {error: {message, code}} — die Pollen-Form', async () => {
  const r = await readErrorResponse(jsonResponse({ error: { message: 'nope', code: 'FORBIDDEN' } }, 403));
  expect(r).toMatchObject({ status: 403, message: 'nope', code: 'FORBIDDEN' });
});

test('liest Nicht-JSON-Klartext — die Edge-Form', async () => {
  const r = await readErrorResponse(new Response('error code: 502', { status: 502 }));
  expect(r).toMatchObject({ status: 502, message: '', raw: 'error code: 502' });
});

test('liest Retry-After als retryAfterSeconds', async () => {
  const res = jsonResponse({ error: 'Too many requests' }, 429);
  res.headers.set('Retry-After', '19');
  const r = await readErrorResponse(res);
  expect(r.retryAfterSeconds).toBe(19);
});
