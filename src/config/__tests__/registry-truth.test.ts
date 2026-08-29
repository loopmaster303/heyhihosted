/**
 * T1 + T2 — Modellwahrheit gegen den eingecheckten Registry-Schnappschuss.
 *
 * Der Schnappschuss wird von `scripts/check-model-registry.mjs --update-snapshot`
 * erzeugt und trägt sein Ziehungsdatum in `fetchedAt`. Die Tests laufen offline;
 * ob die Live-Registry inzwischen weitergezogen ist, zeigt der wöchentliche
 * GitHub-Action-Lauf des Skripts (Frage 3, Entscheidung B).
 *
 * F1: Kein geführtes Modell ist "unbekannt" — jede Pollinations-ID muss in
 *     der Registry als `name` oder `alias` existieren, jede Pruna-ID ein
 *     PRUNA_MODEL_MAP-Mapping haben.
 * F2/F3: isFree ⇔ live nicht paid_only. Pruna + isFree:true ist per
 *     Nutzerentscheidung (BYOP-only, 2026-08-28) ausgeschlossen.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { PRUNA_MODEL_IDS, isPrunaModel } from '@/config/pruna-models';
import {
  VISIBLE_POLLINATIONS_MODEL_IDS,
  AVAILABLE_POLLINATIONS_MODELS,
  AVAILABLE_COMPOSE_MODELS,
} from '@/config/chat-options';
import snapshot from '@/config/__fixtures__/registry-snapshot.json';

const SNAPSHOT_PATH = path.join(__dirname, '..', '__fixtures__', 'registry-snapshot.json');

type SnapshotModel = {
  name: string;
  aliases?: string[];
  paid_only?: boolean;
  output_modalities?: string[];
};

const imageModels = snapshot.image as SnapshotModel[];
const audioModels = snapshot.audio as SnapshotModel[];
const textModels = snapshot.text as SnapshotModel[];

function findEntry(models: SnapshotModel[], id: string): SnapshotModel | undefined {
  return (
    models.find((m) => m.name === id) ??
    models.find((m) => Array.isArray(m.aliases) && m.aliases.includes(id))
  );
}

describe('registry truth (F1): geführte Modelle existieren', () => {
  test('Schnappschuss trägt ein Ziehungsdatum', () => {
    expect(typeof snapshot.fetchedAt).toBe('string');
    expect(Number.isNaN(Date.parse(snapshot.fetchedAt as string))).toBe(false);
  });

  test.each(
    UNIFIED_IMAGE_MODELS.filter((m) => m.provider === 'pollinations'),
  )('image/%s existiert in der Pollinations-Registry (name oder alias)', (model) => {
    // Sichtbarkeitsregel wie getVisualizeModelGroups: enabled (Default true)
    // oder byopVisible !== false. VACE (byopVisible: false) ist bewusst draußen.
    const enabled = model.enabled ?? true;
    if (!enabled && model.byopVisible === false) return;
    expect(findEntry(imageModels, model.id)).toBeDefined();
  });

  test.each([...PRUNA_MODEL_IDS])('pruna/%s hat ein PRUNA_MODEL_MAP-Mapping', (id) => {
    expect(isPrunaModel(id)).toBe(true);
  });

  test.each([...VISIBLE_POLLINATIONS_MODEL_IDS])(
    'text/%s existiert in der Text-Registry',
    (id) => {
      expect(findEntry(textModels, id)).toBeDefined();
    },
  );

  test.each(AVAILABLE_COMPOSE_MODELS.map((m) => m.id))('audio/%s existiert in der Audio-Registry', (id) => {
    expect(findEntry(audioModels, id)).toBeDefined();
  });
});

describe('registry truth (F2/F3): kostenlos heißt kostenlos', () => {
  test('jede isFree-Pollinations-ID ist live nicht paid_only — und umgekehrt', () => {
    for (const model of UNIFIED_IMAGE_MODELS) {
      if (model.provider !== 'pollinations') continue;
      const live = findEntry(imageModels, model.id);
      if (!live) continue; // Existenz prüft F1
      if (model.isFree === true) {
        expect(`image/${model.id}: live paid_only=${live.paid_only}`).toBe(
          `image/${model.id}: live paid_only=${undefined}`,
        );
      }
      if (live.paid_only !== true && (model.enabled ?? true) && model.isFree !== true) {
        // F3: live kostenlos, aber als schlüsselpflichtig geführt — nur bei
        // aktiven Modellen ein Verstoß; deaktivierte sind bewusst eingefroren.
        expect(`image/${model.id}: isFree=${model.isFree}`).toBe(
          `image/${model.id}: isFree=true`,
        );
      }
    }
  });

  test('kein Pruna-Modell ist als kostenlos geführt (BYOP-only, 2026-08-28)', () => {
    for (const model of UNIFIED_IMAGE_MODELS) {
      if (model.provider !== 'pruna') continue;
      expect(`pruna/${model.id}: isFree=${model.isFree}`).toBe(`pruna/${model.id}: isFree=false`);
    }
  });

  test('Chat-Modelle tragen isFree konsistent zur Registry', () => {
    for (const model of AVAILABLE_POLLINATIONS_MODELS) {
      if (!model.isFree) continue;
      const live = findEntry(textModels, model.id);
      expect(live).toBeDefined();
      expect(`text/${model.id}: live paid_only=${live?.paid_only}`).toBe(
        `text/${model.id}: live paid_only=${undefined}`,
      );
    }
  });
});

describe('Schnappschuss-Hygiene', () => {
  test('die Fixture liegt im Repo und ist parsebar (dieser Import)', () => {
    const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
    expect(Array.isArray(raw.image)).toBe(true);
    expect(Array.isArray(raw.text)).toBe(true);
    expect(Array.isArray(raw.audio)).toBe(true);
  });
});
