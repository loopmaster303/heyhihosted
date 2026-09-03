/**
 * Der Audio-Proxy traegt den Schluessel des BETREIBERS und ist oeffentlich
 * erreichbar. Bis 2026-09-03 pruefte er `path` nur auf `startsWith('/')` —
 * damit war jeder GET-Endpunkt des ACE-Step-Servers durchgereicht,
 * authentifiziert mit einem Schluessel, den der Aufrufer nie sieht.
 *
 * Diese Suite haelt die Allowlist fest. Sie ist der Grund, warum die Route
 * existiert, und die einzige Stelle, an der ein Fehler direkt Fremdzugriff
 * bedeutet.
 */
import { isAllowedAudioPath } from './route';

describe('isAllowedAudioPath', () => {
  it('laesst Ergebnispfade durch — mit Query, Unterpfad und blank', () => {
    expect(isAllowedAudioPath('/v1/audio')).toBe(true);
    expect(isAllowedAudioPath('/v1/audio?path=/tmp/outputs/a.mp3')).toBe(true);
    expect(isAllowedAudioPath('/v1/audio/abc.mp3')).toBe(true);
  });

  it('weist die Steuer-Endpunkte des ACE-Step-Servers ab', () => {
    for (const p of ['/release_task', '/query_result', '/docs', '/openapi.json', '/']) {
      expect(isAllowedAudioPath(p)).toBe(false);
    }
  });

  // `/v1/audiofoo` faengt mit dem Praefix an, ist aber ein anderer Endpunkt.
  // Ohne Grenzpruefung wuerde eine reine startsWith-Regel ihn durchlassen.
  it('verwechselt kein Praefix mit einem Pfadsegment', () => {
    expect(isAllowedAudioPath('/v1/audiofoo')).toBe(false);
    expect(isAllowedAudioPath('/v1/audio-internal')).toBe(false);
  });

  it('weist protokoll- und hostartige Eingaben ab', () => {
    for (const p of ['//evil.test/x', 'https://evil.test/x', 'v1/audio', '']) {
      expect(isAllowedAudioPath(p)).toBe(false);
    }
  });

  it('weist Aufstiege ab, auch aus dem erlaubten Praefix', () => {
    expect(isAllowedAudioPath('/v1/audio/../release_task')).toBe(false);
    expect(isAllowedAudioPath('/v1/audio?path=../../etc/passwd')).toBe(false);
  });
});
