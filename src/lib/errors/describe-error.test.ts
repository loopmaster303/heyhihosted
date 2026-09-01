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

// Live belegt am 2026-09-01: `kontext` antwortet 403 mit "Model 'kontext' is
// not allowed for this API key". Gemeint ist der Schluessel des Betreibers.
// Ohne eigenen Satz las der Nutzer diesen englischen Rohtext.
test('POLLEN_MODEL_NOT_ALLOWED nennt das Modell und den eigenen Schluessel als Ausweg', () => {
  const d = describeError('POLLEN_MODEL_NOT_ALLOWED', { modelLabel: 'kontext' });
  expect(d!.satz).toContain('kontext');
  expect(d!.satz).toContain('Pollen-Schlüssel');
  expect(d!.aktion).toBe('settings');
});

test('PROVIDER_UNAVAILABLE sagt, dass es nicht an der Eingabe liegt', () => {
  const d = describeError('PROVIDER_UNAVAILABLE', {});
  expect(d!.satz).toContain('nicht an deiner Eingabe');
  expect(d!.aktion).toBe('retry');

  const mitWartezeit = describeError('PROVIDER_UNAVAILABLE', { retryAfterSeconds: 42 });
  expect(mitWartezeit!.satz).toContain('42');
});
