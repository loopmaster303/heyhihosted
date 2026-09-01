/**
 * L-K.1. Der Regressionsschutz gegen ein Leck, das am 2026-09-01 live offen
 * stand: `resolvePollenKey` faellt fuer jede Anfrage auf den Server-Schluessel
 * zurueck, und keine Route fragte, was das Modell kostet. `claude-fast`
 * antwortete keylos mit 200, `seedance-2.0` lief 125 s auf Betreiberkosten.
 */
import { hasUserKey, textModelIsPaid, visualModelIsPaid, assertKeyForPaidModel } from './pollen-cost-guard';

const mitKey = () => new Request('https://x.test', { headers: { 'X-Pollen-Key': 'sk_user' } });
const ohneKey = () => new Request('https://x.test');

describe('hasUserKey', () => {
  it('erkennt einen eigenen Schluessel und leeres Gerede', () => {
    expect(hasUserKey(mitKey())).toBe(true);
    expect(hasUserKey(ohneKey())).toBe(false);
    expect(hasUserKey(new Request('https://x.test', { headers: { 'X-Pollen-Key': '   ' } }))).toBe(false);
  });
});

describe('textModelIsPaid', () => {
  it('sperrt die live schluesselpflichtigen Modelle', () => {
    for (const id of ['claude-fast', 'gemini-fast', 'gemini-search', 'mistral']) {
      expect(textModelIsPaid(id)).toBe(true);
    }
  });

  it('laesst die freien durch — allen voran die Vorgabe', () => {
    for (const id of ['deepseek', 'nova-fast', 'kimi']) {
      expect(textModelIsPaid(id)).toBe(false);
    }
  });

  // Ein unbekanntes Modell lehnt die Route ohnehin ab. Hier zu sperren waere
  // eine zweite Fehlerquelle mit schlechterer Meldung.
  it('sperrt Unbekanntes nicht', () => {
    expect(textModelIsPaid('gibtsnicht')).toBe(false);
  });
});

describe('visualModelIsPaid', () => {
  it('folgt der Live-Registry, wenn sie paid_only sagt', () => {
    expect(visualModelIsPaid('was-auch-immer', true)).toBe(true);
  });

  it('sperrt die schluesselpflichtigen Pollinations-Eintraege der Config', () => {
    for (const id of ['veo', 'seedance-2.0', 'wan-pro']) {
      expect(visualModelIsPaid(id)).toBe(true);
    }
  });

  it('laesst die drei freien Bildmodelle durch', () => {
    for (const id of ['flux', 'gpt-image', 'klein']) {
      expect(visualModelIsPaid(id)).toBe(false);
    }
  });

  // Pruna hat serverseitig gar keinen Schluessel — dieser Pfad ist strukturell
  // dicht und braucht die Sperre nicht. Sie hier zu ziehen wuerde die
  // praezisere Meldung MISSING_PRUNA_KEY verdraengen.
  it('mischt sich bei Pruna nicht ein', () => {
    expect(visualModelIsPaid('p-image')).toBe(false);
  });
});

describe('assertKeyForPaidModel', () => {
  it('laesst ein freies Modell ohne Schluessel durch', () => {
    expect(() => assertKeyForPaidModel(ohneKey(), 'flux', false)).not.toThrow();
  });

  it('laesst ein kostenpflichtiges Modell MIT eigenem Schluessel durch', () => {
    expect(() => assertKeyForPaidModel(mitKey(), 'claude-fast', true)).not.toThrow();
  });

  it('wirft 402 mit POLLEN_KEY_REQUIRED, wenn der Schluessel fehlt', () => {
    expect(() => assertKeyForPaidModel(ohneKey(), 'claude-fast', true)).toThrow();
    try {
      assertKeyForPaidModel(ohneKey(), 'claude-fast', true);
    } catch (e) {
      expect(e).toMatchObject({
        statusCode: 402,
        code: 'POLLEN_KEY_REQUIRED',
        details: { modelLabel: 'claude-fast' },
      });
    }
  });
});
