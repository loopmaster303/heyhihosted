import { ERROR_CODES } from './error-codes';
import { describeError } from './describe-error';

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

test('PRUNA_API_ERROR nennt ctx.field beim Namen', () => {
  const d = describeError('PRUNA_API_ERROR', { modelLabel: 'Seedream 4', field: 'voellig_unbekanntes_feld' });
  expect(d!.satz).toContain('voellig_unbekanntes_feld');
});

// Die Karte rendert den Satz als Klartext (Gallery.tsx: `{run.message}`), es
// gibt dort keinen Markdown-Laeufer. Ein Sternchenpaar oder ein Backtick kam
// deshalb woertlich beim Nutzer an. Live am 2026-09-10 gesehen: "**Dieses
// Modell** hat die Anfrage abgelehnt".
test('kein Satz enthaelt Markdown-Zeichen, die die Karte woertlich zeigt', () => {
  const ctx = { modelLabel: 'Seedream 4', field: 'seed', retryAfterSeconds: 19 };
  for (const code of ERROR_CODES) {
    const satz = describeError(code, ctx)!.satz;
    expect(satz).not.toContain('**');
    expect(satz).not.toContain('`');
  }
});

test('RATE_LIMITED nennt retryAfterSeconds', () => {
  const d = describeError('RATE_LIMITED', { retryAfterSeconds: 19 });
  expect(d!.satz).toContain('19');
});

test('VALIDATION_ERROR mit field prompt ergibt „Der Prompt fehlt.“', () => {
  const d = describeError('VALIDATION_ERROR', { field: 'prompt' });
  expect(d!.satz).toBe('Der Prompt fehlt.');
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

// Live belegt am 2026-09-10: gpt-image antwortet 400 "Your request was rejected
// by the safety system". Vorher wurde daraus PROVIDER_UNAVAILABLE — also der
// Rat, in ein paar Minuten denselben Prompt erneut zu senden, der immer wieder
// abgelehnt wird. Der Satz muss die Ablehnung beim Namen nennen.
test('CONTENT_REJECTED nennt die Ablehnung und den Ausweg statt eines Ausfalls', () => {
  const d = describeError('CONTENT_REJECTED', { modelLabel: 'GPT Image 2.5 Flare' });
  expect(d!.satz).toContain('GPT Image 2.5 Flare');
  expect(d!.satz).toContain('Sicherheitsfilter');
  expect(d!.satz).toContain('Prompt');
  expect(d!.satz).not.toContain('antwortet gerade nicht');
  expect(d!.aktion).toBe('pick-model');
});
