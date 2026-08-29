import { ERROR_CODES } from './error-codes';
import { describeError, describeUnknown } from './describe-error';

test('gibt für jeden bekannten Code einen nicht-leeren deutschen Satz ohne undefined/null', () => {
  for (const code of ERROR_CODES) {
    const d = describeError(code, {});
    expect(d).not.toBeNull();
    expect(d!.satz.length).toBeGreaterThan(0);
    expect(d!.satz).not.toContain('undefined');
    expect(d!.satz).not.toContain('null');
  }
});

test('gibt für unbekannten Code null zurück (Fallback)', () => {
  expect(describeError(undefined, {})).toBeNull();
  expect(describeError('GIBT_ES_NICHT', {})).toBeNull();
});

test('MISSING_PRUNA_KEY nennt ctx.modelLabel', () => {
  const d = describeError('MISSING_PRUNA_KEY', { modelLabel: 'Seedream 4' });
  expect(d!.satz).toContain('Seedream 4');
});

test('PRUNA_API_ERROR nennt ctx.field in Mono-Optik', () => {
  const d = describeError('PRUNA_API_ERROR', { modelLabel: 'Seedream 4', field: 'voellig_unbekanntes_feld' });
  expect(d!.satz).toContain('`voellig_unbekanntes_feld`');
});

test('RATE_LIMITED nennt retryAfterSeconds', () => {
  const d = describeError('RATE_LIMITED', { retryAfterSeconds: 19 });
  expect(d!.satz).toContain('19');
});

test('VALIDATION_ERROR mit field prompt ergibt „Der Prompt fehlt.“', () => {
  const d = describeError('VALIDATION_ERROR', { field: 'prompt' });
  expect(d!.satz).toBe('Der Prompt fehlt.');
});

test('describeUnknown nennt den Status und den Rohtext', () => {
  const d = describeUnknown(502, 'error code: 502');
  expect(d.satz).toContain('502');
  expect(d.satz).toContain('error code: 502');
});
