import {
  readStoredRuns,
  removeStoredRun,
  RUN_MAX_AGE_MS,
  saveStoredRun,
  type StoredRun,
} from './run-store';

function run(overrides: Partial<StoredRun>): StoredRun {
  return {
    runId: 'run-1',
    predictionId: 'pred-1',
    model: 'vace',
    prompt: 'ein roter fuchs',
    params: { aspect_ratio: '16:9' },
    isVideo: true,
    startedAt: Date.now(),
    body: { model: 'vace', prompt: 'ein roter fuchs' },
    ...overrides,
  };
}

describe('run-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('speichert, liest und entfernt einen Lauf', () => {
    saveStoredRun(run({ runId: 'a' }));
    saveStoredRun(run({ runId: 'b' }));

    expect(readStoredRuns().map((r) => r.runId)).toEqual(['a', 'b']);

    removeStoredRun('a');
    expect(readStoredRuns().map((r) => r.runId)).toEqual(['b']);

    removeStoredRun('b');
    expect(readStoredRuns()).toEqual([]);
    expect(localStorage.getItem('heyhi.prunaRuns.v1')).toBeNull();
  });

  it('verwirft abgelaufene Eintraege beim Lesen, ohne sie aufzuheben', () => {
    saveStoredRun(run({ runId: 'fresh' }));
    saveStoredRun(run({ runId: 'stale', startedAt: Date.now() - RUN_MAX_AGE_MS - 1000 }));

    expect(readStoredRuns().map((r) => r.runId)).toEqual(['fresh']);

    // Der zweite Lauf liest nur noch den ueberlebenden Eintrag.
    expect(readStoredRuns().map((r) => r.runId)).toEqual(['fresh']);
  });

  it('ersetzt einen Eintrag mit derselben runId statt ihn zu duplizieren', () => {
    saveStoredRun(run({ runId: 'a', predictionId: 'pred-1' }));
    saveStoredRun(run({ runId: 'a', predictionId: 'pred-2' }));

    const stored = readStoredRuns();
    expect(stored).toHaveLength(1);
    expect(stored[0].predictionId).toBe('pred-2');
  });

  it('ertraegt kaputten Storage-Inhalt wie einen leeren Store', () => {
    localStorage.setItem('heyhi.prunaRuns.v1', '{{{nonsense');
    expect(readStoredRuns()).toEqual([]);

    localStorage.setItem('heyhi.prunaRuns.v1', JSON.stringify({ version: 2, runs: [] }));
    expect(readStoredRuns()).toEqual([]);

    localStorage.setItem('heyhi.prunaRuns.v1', JSON.stringify({ version: 1, runs: [{ nope: true }] }));
    expect(readStoredRuns()).toEqual([]);
  });

  it('behaelt den Retry-Kontext unveraendert bei (R2 = a)', () => {
    const body = { model: 'wan-t2v', prompt: 'x', params: { aspect_ratio: '16:9' } };
    saveStoredRun(run({ body }));

    expect(readStoredRuns()[0].body).toEqual(body);
  });
});
