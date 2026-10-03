import { isContentRejection } from './upstream-rejection';

// Live belegt am 2026-09-10 gegen ein gpt-image-Modell. Genau dieser Body kam
// als wiederholtes 4xx aus dem Media-Ingest zurueck und wurde vorher zu
// PROVIDER_UNAVAILABLE — also zu dem Rat, in ein paar Minuten denselben Prompt
// erneut zu senden.
test('erkennt die Absage des Sicherheitsfilters', () => {
  expect(isContentRejection(400, 'Your request was rejected by the safety system.')).toBe(true);
  expect(isContentRejection(422, '{"error":"content_policy_violation"}')).toBe(true);
  expect(isContentRejection(400, 'This prompt violates our policy.')).toBe(true);
  expect(isContentRejection(400, 'The output was flagged as unsafe content.')).toBe(true);
});

// Der 403 "not allowed for this API key" spricht ueber einen Schluessel, nicht
// ueber den Inhalt. Wuerde er hier durchrutschen, laese der Nutzer beim
// Modellwechsel den Satz "aendere den Prompt" — der Prompt war nie das Problem.
test('laesst Schluessel- und Guthabenfehler unangetastet', () => {
  expect(isContentRejection(403, "Model 'kontext' is not allowed for this API key")).toBe(false);
  expect(isContentRejection(402, 'API key budget too low')).toBe(false);
  expect(isContentRejection(400, 'unknown parameter: disable_safety_checker')).toBe(false);
  expect(isContentRejection(500, 'Internal server error')).toBe(false);
});

// Ein 500er mit dem Wort "safety" im Body ist ein Ausfall, keine Ablehnung:
// der Status entscheidet mit, sonst wartet der Nutzer auf einen Fehler, den
// er selbst beheben muesste.
test('wertet nur 400, 422 und 451 als Inhaltsablehnung', () => {
  const body = 'rejected by the safety system';
  expect(isContentRejection(400, body)).toBe(true);
  expect(isContentRejection(451, body)).toBe(true);
  expect(isContentRejection(500, body)).toBe(false);
  expect(isContentRejection(429, body)).toBe(false);
});
