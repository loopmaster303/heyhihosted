# Phase 7 — Chat entschlanken: Implementierungsplan

> **Für ausführende Agenten:** Dieser Plan wird **als eine Einheit in einer Sitzung**
> ausgeführt, nicht per Subagent-Fächer. Begründung im Abschnitt „Warum kein
> Paketschnitt". Die Schritte tragen Checkboxen (`- [ ]`) zur Verfolgung.

**Ziel:** Der Chat bietet ausschließlich Bildmodelle an, die ohne Schlüssel laufen, und
benennt an der Modellauswahl selbst den Weg zur vollen Auswahl im Create.

**Architektur:** Eine neue Auswahlregel in `src/config/unified-image-models.ts` löst die
provider-abhängige Modellliste im Chat ab. Die Regel ist eine Filterbedingung
(`provider === 'pollinations' && kind === 'image' && isFree === true && enabled`), keine
Handliste — ändert sich der freie Tier, folgt der Chat von selbst. Die drei Chat-Verbraucher
lesen dieselbe Funktion, damit Picker, Mobil-Drawer und Hook nicht auseinanderlaufen
können. Der Übergang ins Create steht als beschriftete letzte Zeile im Modell-Panel.

**Tech-Stack:** Next.js 16 (App Router), TypeScript, React, Tailwind, Jest +
Testing Library.

**Grundlage:** Kein separates Spec-Dokument. Dieser Plan setzt um:

- [`FAHRPLAN-create.md`](FAHRPLAN-create.md), Abschnitt „Phase 7"
- [`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md), **L-F.1** und **L-I.2**
- Vier Betreiberentscheidungen aus dem Brainstorming dieser Sitzung (siehe unten)

**Ausgangsstand:** HEAD `625523c`, 109 Suiten / 852 Tests grün,
`node scripts/check-model-registry.mjs` meldet „Keine Abweichungen".

---

## Betreiberentscheidungen (2026-08-29, in dieser Sitzung getroffen)

| Frage | Entscheidung |
|---|---|
| **E7-1** Kriterium für Bildmodelle im Chat | **Regel statt Zahl: nur schlüsselfrei.** Heute `flux`, `gpt-image`, `klein`. Die Liste wächst auch mit Pollen-Schlüssel nicht. |
| **E7-2** Video im Chat | **Nein.** Video ist seit E1-A vollständig schlüsselpflichtig und lebt im Create. |
| **E7-3** Pruna im Chat | **Ganz raus.** Pruna lebt im Create. Schließt das L-I.2-Loch strukturell statt per Badge. |
| **E7-4** Übergang ins Create | **Letzte Zeile im Modell-Panel**, beschriftet „Alle Modelle im Create →". Der Sidebar-Link (L-A.3) bleibt daneben bestehen. |

---

## Globale Randbedingungen

Diese gelten für **jede** Aufgabe. Sie stammen aus `CLAUDE.md`, `AGENTS.md` und dem
Fahrplan und sind nicht verhandelbar.

- **Kein Modell wird gelöscht.** `UNIFIED_IMAGE_MODELS` bleibt unverändert. Die Reduktion
  ist eine *Auswahl beim Lesen*, keine Änderung der Wahrheit.
- **Kein `enabled`, `isFree` oder `byopVisible` wird angefasst.** `scripts/check-model-registry.mjs:81`
  und `src/config/__tests__/registry-truth.test.ts:57` lesen ausschließlich diese drei
  Felder. Wer sie zum Ausblenden missbraucht, verschiebt Modellwahrheit.
- **Nach jeder Aufgabe muss gelten:** `CI=1 npm test` grün und
  `node scripts/check-model-registry.mjs` meldet „Keine Abweichungen".
- **Der Provider-Schalter bleibt ein Listen-Filter.** Er wird nicht zu einem globalen
  Modus. Nach dieser Phase scopet er die Create-Modellliste und die Auswahl
  „Standard-Bildmodell" im `SettingsPopover` — die Chat-Bildauswahl folgt ihm nicht mehr,
  weil ihre Regel providerunabhängig formuliert ist. Das ist eine **Verengung** dessen,
  was er scopet, keine Ausweitung.
- **Keine Create-Datei wird angefasst.** Verboten sind `src/app/create/**`,
  `src/components/playground/**`, `src/lib/playground/**`, `src/hooks/usePlaygroundModels.ts`.
- **`src/components/settings/SettingsPopover.tsx` wird nicht angefasst** —
  `src/app/create/PlaygroundShell.tsx:505` rendert es. Eine Änderung dort veränderte die
  Create-Einstellungen mit und bräche die Unabhängigkeit dieser Phase.
- **Kein Commit ohne Freigabe des Betreibers.** Die Commit-Schritte stehen im Plan, werden
  aber erst nach ausdrücklicher Freigabe ausgeführt.
- **Schriftregel:** Modell-IDs und Zustände sind `font-mono`, Fließtext ist `font-body`.
  Die vorhandenen Klassen der berührten Stellen bleiben, wie sie sind.
- **Zweisprachig:** Der Chat ist DE/EN. Jeder neue sichtbare Text braucht beide Einträge in
  `src/config/translations.ts`.

---

## Ausgangslage — nachgemessen, nicht abgeschrieben

`getVisualizeModelGroups({})` liefert **16** Modelle in drei Gruppen (IMAGE FREE 3,
IMAGE ADVANCED 7, VIDEO ADVANCED 6). Diese 16 sieht im Chat aber nie jemand: der Chat ruft
`getVisualizeModelGroupsForProvider(providerMode, …)` und filtert zusätzlich gegen
`unifiedModelConfigs`. Was tatsächlich ankommt, hängt an zwei Schlüsseln:

| Schlüsselzustand | Was der Chat heute zeigt |
|---|---|
| kein Schlüssel, Provider Pollinations | **3** — `flux`, `gpt-image`, `klein`. Kein Video, kein Pruna. |
| Pollen-Schlüssel | **23** — 5 Bild frei, 10 Bild kostenpflichtig, 8 Video (darunter `nova-reel`, dokumentierter 524-Timeout) |
| Pruna-Schlüssel, Provider Pruna | **17** |
| **kein Schlüssel, Provider Pruna** | **13 Pruna-Modelle — ohne jede Kennzeichnung.** Das ist die L-I.2-Lücke. |

Der letzte Zustand ist erreichbar, sobald `prunaAvailable` wahr ist. Das ist ein
Nutzer-Pruna-Schlüssel **oder ein serverseitiger** (`src/app/api/capabilities/route.ts`).
Lokal steht `PRUNA_API_KEY` in `.env` und `.env.local`; in Produktion soll laut
Betreiberentscheidung 2026-08-28 keiner liegen — **das ist von hier aus nicht prüfbar**
und bleibt eine Restannahme (siehe „Offene Punkte").

Drei Befunde, die den Plan formen:

1. **`getChatImageModels()` existiert bereits und ist tot.**
   `src/config/unified-image-models.ts:619` führt `CHAT_IMAGE_MODEL_IDS = ['zimage','flux','gpt-image']`,
   `src/config/__tests__/model-invariants.test.ts:279` prüft das Ergebnis — und **keine
   UI-Datei ruft es auf**. Eine halbe Antwort auf Phase 7 liegt seit Längerem im Baum.
   Dieser Plan ersetzt sie (Aufgabe 1), statt eine zweite kuratierte Liste danebenzustellen.
2. **Zwei Verbrauchsstellen fehlten in der Auftragsbeschreibung.**
   `src/components/sidebar/PersonalizationSidebarSection.tsx:37` und
   `src/components/settings/SettingsPopover.tsx:53` bauen beide die Auswahl
   „Standard-Bildmodell" aus `getModelsByProvider(...)` — also aus der vollen Liste. Sie
   schreiben `defaultImageModelId`, und genau den liest `useUnifiedImageToolState.ts:89`
   als Startmodell des Chats. Wird nur der Picker gekürzt, kann jemand ein Standardmodell
   setzen, das der Chat nicht führt; der Hook fällt dann still auf `flux` zurück.
   `PersonalizationSidebarSection` hängt nur an `AppLayout`, und `AppLayout` wird von
   `/create` **nicht** gerendert — also chat-seitig und sicher anfassbar. `SettingsPopover`
   dagegen rendert Create mit und bleibt unangetastet; die Kreuzschreibung deckt der
   explizit getestete Fallback in Aufgabe 4 ab.
3. **Ein neues Config-Flag ist unnötig.** Die Entscheidung E7-1 ist als reine Filterregel
   formulierbar. Damit bleibt `UNIFIED_IMAGE_MODELS` buchstäblich unverändert und die
   Unberührtheit des Prüfmittels ist nicht bloß behauptet, sondern trivial.

---

## Warum kein Paketschnitt

Die Phase ist klein: vier Produktionsdateien und ein Übersetzungsblock. Der Schnitt in
Subagent-Pakete würde genau die Lücken *zwischen* Paketen erzeugen, vor denen
[`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md) warnt — die
Regel aus Aufgabe 1 und ihre drei Verbraucher sind eine einzige Zusicherung, die nur
gemeinsam hält. **Ein Thread, vier Aufgaben in Reihenfolge.** Die Aufgabengrenzen sind
Prüfgrenzen für einen menschlichen Gegenleser, keine Verteilgrenzen.

---

## Dateistruktur

**Geändert:**

| Datei | Verantwortung nach der Änderung |
|---|---|
| `src/config/unified-image-models.ts` | trägt die Chat-Auswahlregel als einzige Quelle; `getChatImageModels()` + `CHAT_IMAGE_MODEL_IDS` entfallen |
| `src/components/chat/input/ImageModelOptions.tsx` | Desktop-Picker: liest die Regel, trägt die Create-Zeile; `providerMode`/`prunaAvailable`-Props entfallen |
| `src/components/tools/visualize/VisualizeInlineHeader.tsx` | Mobil-Drawer: liest dieselbe Regel; „Mehr anzeigen"-Umschalter und `advancedGroups` entfallen, an ihrer Stelle steht die Create-Zeile |
| `src/hooks/useUnifiedImageToolState.ts` | `availableModels`, `initialModelId` und der Reset-Effekt lesen dieselbe Regel |
| `src/components/chat/ChatInput.tsx` | reicht die entfallenen Props nicht mehr durch (Zeilen 321 ff., 800 ff., 839 ff.) |
| `src/components/sidebar/PersonalizationSidebarSection.tsx` | „Standard-Bildmodell" zeigt dieselbe Chat-Auswahl |
| `src/config/translations.ts` | neuer Schlüssel `modelSelector.allModelsInCreate` (DE + EN) |

**Tests geändert / neu:**

| Datei | |
|---|---|
| `src/config/__tests__/model-invariants.test.ts` | ändern: alter `getChatImageModels`-Test → drei Tests auf die neue Regel |
| `src/components/chat/input/ImageModelOptions.test.tsx` | **neu** |
| `src/components/tools/visualize/VisualizeInlineHeader.test.tsx` | ändern: Mock umstellen |
| `src/hooks/useUnifiedImageToolState.test.tsx` | ändern: Mock umstellen, Fallback-Test ergänzen |

**Dokumente:** `docs/LAUNCH_CRITERIA.md`, `docs/FAHRPLAN-create.md`, `CLAUDE.md`,
`docs/README.md`.

**Ausdrücklich nicht angefasst:** `src/app/create/**`, `src/components/playground/**`,
`src/lib/playground/**`, `src/hooks/usePlaygroundModels.ts`,
`src/components/settings/SettingsPopover.tsx`, `src/hooks/useProviderMode.ts`,
`src/config/pruna-models.ts`, `scripts/check-model-registry.mjs`,
`src/config/__fixtures__/registry-snapshot.json`.

---

## Aufgabe 1: Die Chat-Auswahlregel in der Config

**Dateien:**
- Ändern: `src/config/unified-image-models.ts` (Zeilen 619–625 ersetzen, Rest anfügen)
- Ändern: `src/config/__tests__/model-invariants.test.ts` (Zeile 12 Import, Zeilen 278–285 Test)

**Schnittstellen:**
- Verbraucht: `UNIFIED_IMAGE_MODELS`, `VISUALIZE_GROUP_DEFINITIONS`, `VisualizeModelGroup`,
  `UnifiedImageModel` — alles bereits in dieser Datei.
- Liefert für Aufgaben 2–4:
  - `getChatImageModelGroups(): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }>`
  - `getChatImageModelIds(): string[]`
  Beide **ohne Parameter** — das ist Absicht und die eigentliche Zusicherung.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

In `src/config/__tests__/model-invariants.test.ts` den Import in Zeile 12 von
`getChatImageModels` auf `getChatImageModelGroups, getChatImageModelIds` umstellen und den
Test `'chat image model list stays curated and separate from the full Visualize registry'`
(Zeilen 278–285) durch diese drei ersetzen:

```ts
  test('die Chat-Bildauswahl ist genau der schluesselfreie Pollinations-Bildtier', () => {
    // E7-1: eine Regel, keine Handliste. Wird der Free-Tier erweitert
    // (z. B. kontext nach Freischaltung der Allowlist), waechst diese
    // Erwartung mit — und genau dann soll der Test brechen und gelesen werden.
    expect([...getChatImageModelIds()].sort()).toEqual(['flux', 'gpt-image', 'klein']);
  });

  test('die Chat-Bildauswahl waechst mit keinem Schluessel', () => {
    // Die Funktion nimmt keine Optionen entgegen. Das ist die Zusicherung:
    // ein Pollen- oder Pruna-Schluessel kann die Chat-Liste nicht aufblaehen.
    expect(getChatImageModelGroups).toHaveLength(0);
    expect(getChatImageModelGroups().map((group) => group.key)).toEqual(['image-free']);
  });

  test('kein Video und kein Pruna in der Chat-Auswahl', () => {
    // E7-2 und E7-3, strukturell statt per Badge.
    const models = getChatImageModelGroups().flatMap((group) => group.models);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.kind).toBe('image');
      expect(model.provider).toBe('pollinations');
      expect(model.isFree).toBe(true);
      expect(model.enabled ?? true).toBe(true);
    }
  });
```

> `expect(getChatImageModelGroups).toHaveLength(0)` prüft die **Stelligkeit der
> Funktion** (`Function.length`), nicht die Länge des Ergebnisses. Genau das ist gemeint:
> die Funktion darf keinen Optionsparameter haben.

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
CI=1 npm test -- --runInBand src/config/__tests__/model-invariants.test.ts
```

Erwartet: FAIL, `getChatImageModelGroups is not a function` bzw. ein
TypeScript-Importfehler auf `getChatImageModelIds`.

- [ ] **Schritt 3: Die Regel implementieren**

In `src/config/unified-image-models.ts` den Block ab Zeile 619 —

```ts
const CHAT_IMAGE_MODEL_IDS = ['zimage', 'flux', 'gpt-image'];
export function getChatImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    CHAT_IMAGE_MODEL_IDS.includes(m.id) &&
    m.kind === 'image' &&
    (m.enabled ?? true)
  );
}
```

— vollständig ersetzen durch:

```ts
/**
 * Die Bildauswahl im Chat (Phase 7).
 *
 * Eine Regel, keine Handliste: genau die Bildmodelle, die ohne Schluessel
 * laufen. Waechst der freie Tier, folgt der Chat von selbst; faellt eines
 * weg, verschwindet es hier ebenfalls. Die alte Handliste
 * CHAT_IMAGE_MODEL_IDS stand daneben, wurde von keiner Oberflaeche gelesen
 * und driftete deshalb unbemerkt (sie fuehrte 'zimage', das seit E-A
 * deaktiviert ist).
 *
 * Bewusst OHNE Optionsparameter. Ein Pollen- oder Pruna-Schluessel darf
 * diese Liste nicht aufblaehen — sonst ist der Chat wieder der volle
 * Katalog und L-F.1 faellt. Wer mehr will, geht ins Create.
 *
 * Video (E7-2) und Pruna (E7-3) sind hier strukturell nicht vertreten:
 * beides ist vollstaendig schluesselpflichtig. Damit ist die
 * Kennzeichnungspflicht aus L-I.2 fuer die Bildflaeche des Chats erfuellt,
 * ohne dass ein Badge sie tragen muss.
 *
 * Die Registry bleibt unberuehrt: enabled/isFree/byopVisible werden hier
 * nur GELESEN. scripts/check-model-registry.mjs und registry-truth.test.ts
 * sehen von dieser Funktion nichts.
 */
export function getChatImageModelGroups(): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  const models = UNIFIED_IMAGE_MODELS.filter((model) =>
    model.provider === 'pollinations' &&
    model.kind === 'image' &&
    model.isFree === true &&
    (model.enabled ?? true)
  );

  return VISUALIZE_GROUP_DEFINITIONS
    .filter((group) => group.key === 'image-free')
    .map((group) => ({ ...group, modelIds: models.map((model) => model.id), models }))
    .filter((group) => group.models.length > 0);
}

export function getChatImageModelIds(): string[] {
  return getChatImageModelGroups().flatMap((group) => group.modelIds);
}
```

- [ ] **Schritt 4: Tests laufen lassen und Erfolg bestätigen**

```bash
CI=1 npm test -- --runInBand src/config/__tests__/model-invariants.test.ts
```

Erwartet: PASS.

- [ ] **Schritt 5: Prüfen, dass niemand mehr auf die alte Funktion zeigt**

```bash
grep -rn "getChatImageModels\|CHAT_IMAGE_MODEL_IDS" src/
```

Erwartet: keine Treffer.

- [ ] **Schritt 6: Prüfmittel gegenprüfen**

```bash
node scripts/check-model-registry.mjs
```

Erwartet: `Keine Abweichungen — Modellwahrheit hält.`

```bash
CI=1 npm test -- --runInBand src/config/__tests__/registry-truth.test.ts
```

Erwartet: PASS.

- [ ] **Schritt 7: Commit (erst nach Freigabe)**

```bash
git add src/config/unified-image-models.ts src/config/__tests__/model-invariants.test.ts
git commit -m "feat(phase-7): Chat-Bildauswahl als Regel statt Handliste"
```

---

## Aufgabe 2: Der Desktop-Picker liest die Regel und benennt das Create

**Dateien:**
- Ändern: `src/components/chat/input/ImageModelOptions.tsx`
- Ändern: `src/config/translations.ts` (nach Zeile 142 DE, nach Zeile 401 EN)
- Ändern: `src/components/chat/ChatInput.tsx` (Zeilen 321–331)
- Neu: `src/components/chat/input/ImageModelOptions.test.tsx`

**Schnittstellen:**
- Verbraucht: `getChatImageModelGroups()` aus Aufgabe 1.
- Liefert: `ImageModelOptionsProps` ohne `providerMode` und ohne `prunaAvailable`:
  `{ selectedModelId: string; onModelChange: (modelId: string) => void; disabled?: boolean }`.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

Neue Datei `src/components/chat/input/ImageModelOptions.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImageModelOptions } from './ImageModelOptions';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

jest.mock('./ModelLogo', () => ({
  ModelLogo: () => <span data-testid="model-logo" />,
}));

describe('ImageModelOptions', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('zeigt genau die schluesselfreien Bildmodelle', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    const options = screen.getAllByRole('radio').map((el) => el.textContent);
    expect(options).toHaveLength(3);
    expect(options.join(' ')).toMatch(/Flux/);
    expect(options.join(' ')).toMatch(/GPT Image/);
    expect(options.join(' ')).toMatch(/Klein/);
  });

  it('zeigt kein Video- und kein Pruna-Modell', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    // E7-2 / E7-3: strukturell abwesend, nicht bloss ausgegraut.
    const body = screen.getByRole('radiogroup').textContent ?? '';
    for (const forbidden of ['P-Video', 'P-Image', 'Wan', 'Veo', 'Seedance', 'Nova Reel']) {
      expect(body).not.toContain(forbidden);
    }
    expect(screen.queryByText('VIDEO ADVANCED')).toBeNull();
    expect(screen.queryByText('IMAGE ADVANCED')).toBeNull();
  });

  it('benennt den Weg ins Create und fuehrt dorthin', () => {
    render(<ImageModelOptions selectedModelId="flux" onModelChange={jest.fn()} />);

    // L-F.1: der Verweis ist als Beschriftung vorhanden und fuehrt dorthin.
    const link = screen.getByRole('button', { name: 'modelSelector.allModelsInCreate' });
    link.click();
    expect(mockPush).toHaveBeenCalledWith('/create');
  });
});
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
CI=1 npm test -- --runInBand src/components/chat/input/ImageModelOptions.test.tsx
```

Erwartet: FAIL — der erste Test findet mehr oder andere Radios (die Komponente liest noch
`getVisualizeModelGroupsForProvider`), der dritte findet den Knopf nicht.

- [ ] **Schritt 3: Übersetzungen ergänzen**

In `src/config/translations.ts` nach Zeile 142 (DE-Block, direkt unter
`'modelSelector.pollenRequired'`):

```ts
        'modelSelector.allModelsInCreate': 'Alle Modelle im Create →',
```

Und nach Zeile 401 (EN-Block, an derselben Stelle):

```ts
        'modelSelector.allModelsInCreate': 'All models in Create →',
```

- [ ] **Schritt 4: Den Picker umstellen**

In `src/components/chat/input/ImageModelOptions.tsx`:

Den Importblock ersetzen — `useHasPollenKey`, `shouldIncludeByopHidden`,
`getVisualizeModelGroupsForProvider` und `ImageProvider` entfallen, `useRouter` kommt dazu:

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { ModelLogo } from './ModelLogo';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { getChatImageModelGroups } from '@/config/unified-image-models';
```

Die Props auf das Nötige kürzen:

```tsx
interface ImageModelOptionsProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ImageModelOptions: React.FC<ImageModelOptionsProps> = ({
  selectedModelId,
  onModelChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const router = useRouter();

  // Phase 7: der Chat fuehrt nur die schluesselfreie Bildauswahl. Der
  // Provider-Schalter scopet sie nicht mehr — die Regel ist
  // providerunabhaengig formuliert, damit ein Pruna-Schluessel im Chat
  // keine BYOP-Modelle aufblaettern kann.
  const groups = React.useMemo(
    () =>
      getChatImageModelGroups()
        .map(group => ({ ...group, models: group.models.filter(m => unifiedModelConfigs[m.id]) }))
        .filter(group => group.models.length > 0),
    [],
  );

  if (groups.length === 0) return null;
```

Der `groups.map(...)`-Rumpf bleibt unverändert. Der bisherige äußere
`<div role="radiogroup" …>` bekommt einen Wrapper, damit die Create-Zeile **außerhalb** der
Radiogruppe steht — ein Navigationsknopf zwischen Radios wäre falsche ARIA-Semantik:

```tsx
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t('modelSelector.title')} className="flex flex-col gap-3">
        {groups.map(group => (
          /* unveraendert */
        ))}
      </div>

      {/* Create-Zeile: L-F.1 verlangt den Weg dort, wo die Verkuerzung
          spuerbar wird — im Panel selbst, nicht nur in der Sidebar. */}
      <button
        type="button"
        onClick={() => router.push('/create')}
        className={cn(
          'self-start bg-transparent px-1 py-2 font-mono text-[9.5px] font-semibold',
          'uppercase tracking-[0.14em] text-muted-foreground transition-colors',
          'hover:text-foreground focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-primary',
        )}
      >
        {t('modelSelector.allModelsInCreate')}
      </button>
    </div>
  );
```

> Die Zeile trägt bewusst dieselbe Typografie wie die Gruppenüberschriften
> (`font-mono`, `text-[9.5px]`, `tracking-[0.14em]`, `uppercase`). Sie liest sich damit als
> weitere Gruppe — als Fortsetzung der Auswahl, nicht als Fußnote.

- [ ] **Schritt 5: Die Aufrufstelle in `ChatInput.tsx` nachziehen**

In `src/components/chat/ChatInput.tsx` die beiden Zeilen mit `providerMode=` und
`prunaAvailable=` aus dem `<ImageModelOptions …>`-Aufruf (Zeilen 321–331) entfernen. Der
Aufruf lautet danach:

```tsx
                    <ImageModelOptions
                        selectedModelId={visualizeToolState.selectedModelId}
                        onModelChange={(id) => {
                            visualizeToolState.setSelectedModelId(id);
                            toggleBadgeRow('model');
                        }}
                        disabled={visualizeControlsDisabled}
                    />
```

- [ ] **Schritt 6: Tests laufen lassen und Erfolg bestätigen**

```bash
CI=1 npm test -- --runInBand src/components/chat/input/ImageModelOptions.test.tsx
```

Erwartet: PASS, drei Tests.

- [ ] **Schritt 7: Typen prüfen**

```bash
npm run typecheck
```

Erwartet: keine Fehler. Schlägt es hier fehl, zeigt noch eine Stelle auf die entfernten
Props.

- [ ] **Schritt 8: Commit (erst nach Freigabe)**

```bash
git add src/components/chat/input/ImageModelOptions.tsx \
        src/components/chat/input/ImageModelOptions.test.tsx \
        src/components/chat/ChatInput.tsx \
        src/config/translations.ts
git commit -m "feat(phase-7): Desktop-Picker auf die Chat-Auswahl, Create-Zeile beschriftet"
```

---

## Aufgabe 3: Der Mobil-Drawer liest dieselbe Regel

**Dateien:**
- Ändern: `src/components/tools/visualize/VisualizeInlineHeader.tsx`
- Ändern: `src/components/tools/visualize/VisualizeInlineHeader.test.tsx` (Zeilen 87–99, 4)
- Ändern: `src/components/chat/ChatInput.tsx` (Zeilen 800 ff. und 839 ff.)

**Schnittstellen:**
- Verbraucht: `getChatImageModelGroups()` aus Aufgabe 1, `modelSelector.allModelsInCreate`
  aus Aufgabe 2.
- Liefert: `VisualizeInlineHeaderProps` **ohne** `providerMode` und `prunaAvailable`. Alle
  übrigen Props bleiben unverändert.

> **Warum der Umschalter entfällt:** die neue Regel liefert ausschließlich die Gruppe
> `image-free` mit `category: 'Standard'`. `advancedGroups` ist damit dauerhaft leer, und
> „Mehr anzeigen" öffnete einen leeren Bereich. Der Umschalter, der `expanded`-Zustand und
> die Icons `ChevronDown` und `Video` werden durch **diese** Änderung verwaist und gehen
> deshalb mit — kein Aufräumen fremder Altlasten.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

In `src/components/tools/visualize/VisualizeInlineHeader.test.tsx` den Mock in den Zeilen
87–99 ersetzen:

```tsx
  getChatImageModelGroups: jest.fn(() => [
    {
      key: 'image-free',
      label: 'IMAGE FREE',
      category: 'Standard',
      kind: 'image',
      modelIds: ['flux'],
      models: [{ id: 'flux', name: 'Flux.1 Fast' }],
    },
  ]),
```

Den Import in Zeile 4 und die Mock-Konstante in den Zeilen 99–100 entsprechend von
`getVisualizeModelGroupsForProvider` auf `getChatImageModelGroups` umbenennen, ebenso den
`mockClear()`-Aufruf im `beforeEach`. Danach diesen Test am Ende der `describe`-Klammer
ergänzen:

```tsx
  it('fuehrt im Modellbereich keine Advanced-Gruppe und keinen Mehr-anzeigen-Umschalter', () => {
    render(
      <VisualizeInlineHeader
        selectedModelId="flux"
        onModelChange={jest.fn()}
        currentModelConfig={{ id: 'flux', name: 'flux', outputType: 'image', inputs: [] } as never}
        formFields={{}}
        handleFieldChange={jest.fn()}
        setFormFields={jest.fn()}
        isPollenModel={false}
        isPollinationsVideo={false}
        section="model"
      />,
    );

    expect(screen.queryByText('visualize.showMore')).toBeNull();
    expect(screen.queryByText('visualize.showLess')).toBeNull();
  });
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
CI=1 npm test -- --runInBand src/components/tools/visualize/VisualizeInlineHeader.test.tsx
```

Erwartet: FAIL — der Mock zeigt auf eine Funktion, die die Komponente noch nicht ruft, und
`visualize.showMore` steht noch im Baum.

- [ ] **Schritt 3: Die Komponente umstellen**

In `src/components/tools/visualize/VisualizeInlineHeader.tsx`:

a) Im Import aus `@/config/unified-image-models` (Zeilen 8–15)
`getVisualizeModelGroupsForProvider`, `shouldIncludeByopHidden` und den Typ `ImageProvider`
streichen, `getChatImageModelGroups` aufnehmen. `useHasPollenKey` (Zeile 18) entfällt.
`useRouter` aus `next/navigation` kommt dazu. Aus dem `lucide-react`-Import (Zeile 4)
`ChevronDown` und `Video` streichen.

b) Die Props `providerMode` und `prunaAvailable` aus `VisualizeInlineHeaderProps` und aus
der Destrukturierung entfernen.

c) `const hasPollenKey = useHasPollenKey();` und
`const [expanded, setExpanded] = React.useState(true);` löschen,
`const router = useRouter();` einsetzen.

d) `modelGroups` ersetzen:

```tsx
  // Phase 7: derselbe Regelaufruf wie im Desktop-Picker. Beide Flaechen
  // MUESSEN dieselbe Funktion lesen — laufen sie auseinander, waehlt der
  // Hook ein Modell, das die eine Flaeche nicht anbietet.
  const modelGroups = React.useMemo(
    () =>
      getChatImageModelGroups()
        .map(group => ({
          ...group,
          models: group.models.filter(model => unifiedModelConfigs[model.id]),
        }))
        .filter(group => group.models.length > 0),
    [],
  );
```

e) `const advancedGroups = modelGroups.filter(group => group.category === 'Advanced');`
löschen. `standardGroups` bleibt.

f) Im `SelectContent` den Block `<div className="px-2 pb-2"> … </div>` mit dem
`setExpanded`-Knopf **sowie** den gesamten `{expanded && advancedGroups.map(…)}`-Block
löschen und an ihre Stelle setzen:

```tsx
            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={() => router.push('/create')}
                onMouseDown={(event) => event.preventDefault()}
                className="w-full py-2 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg hover:bg-muted/20 transition-colors"
              >
                {t('modelSelector.allModelsInCreate')}
              </button>
            </div>
```

> `onMouseDown={(event) => event.preventDefault()}` stand schon am Umschalter an derselben
> Stelle: ohne ihn schließt Radix das Select auf `mousedown`, bevor der Klick ankommt.

g) In der `SelectGroup`-Schleife über `standardGroups` steht
`const Icon = group.kind === 'image' ? ImageIcon : Video;`. Da `Video` entfällt und die
Regel nur Bildgruppen liefert: die `Icon`-Konstante löschen und im `SelectLabel` direkt
`<ImageIcon className="w-3 h-3" />` statt `<Icon className="w-3 h-3" />` schreiben. Eine
Konstante, die nur noch einen Wert annehmen kann, ist keine Konstante mehr.

- [ ] **Schritt 4: Die beiden Aufrufstellen in `ChatInput.tsx` nachziehen**

In `src/components/chat/ChatInput.tsx` in **beiden** `<VisualizeInlineHeader …>`-Aufrufen
(`section="model"` bei Zeile 800 ff. und `section="parameters"` bei Zeile 839 ff.) die
Zeilen `providerMode={visualizeToolState.providerMode}` und
`prunaAvailable={visualizeToolState.prunaAvailable}` entfernen.

- [ ] **Schritt 5: Tests laufen lassen und Erfolg bestätigen**

```bash
CI=1 npm test -- --runInBand src/components/tools/visualize/VisualizeInlineHeader.test.tsx
```

Erwartet: PASS. Die vorhandenen Video-Parameter-Tests (`renderVideoHeader('p-video', …)`)
prüfen `section="parameters"` und die Dauer-Semantik, nicht die Modellliste — sie müssen
unverändert grün bleiben. Werden sie rot, ist versehentlich der Parameterbereich mit
geändert worden.

- [ ] **Schritt 6: Typen prüfen**

```bash
npm run typecheck
```

Erwartet: keine Fehler.

- [ ] **Schritt 7: Commit (erst nach Freigabe)**

```bash
git add src/components/tools/visualize/VisualizeInlineHeader.tsx \
        src/components/tools/visualize/VisualizeInlineHeader.test.tsx \
        src/components/chat/ChatInput.tsx
git commit -m "feat(phase-7): Mobil-Drawer auf die Chat-Auswahl, Advanced-Umschalter entfaellt"
```

---

## Aufgabe 4: Hook und Standardmodell folgen derselben Regel

**Dateien:**
- Ändern: `src/hooks/useUnifiedImageToolState.ts` (Zeilen 79–106)
- Ändern: `src/hooks/useUnifiedImageToolState.test.tsx` (Zeilen 3–14 Mock)
- Ändern: `src/components/sidebar/PersonalizationSidebarSection.tsx` (Zeilen 37–44)

**Schnittstellen:**
- Verbraucht: `getChatImageModelIds()` aus Aufgabe 1, `getChatImageModelGroups()` für die
  Sidebar.
- Liefert: Der Rückgabewert von `useUnifiedImageToolState` bleibt **unverändert** —
  `providerMode`, `setProviderMode` und `prunaAvailable` werden weiter durchgereicht
  (`PersonalizationSidebarSection` und der Dispatch hängen daran). Nur `availableModels`
  ist jetzt die Chat-Auswahl.

> **Warum `SettingsPopover` außen vor bleibt:** `src/app/create/PlaygroundShell.tsx:505`
> rendert es. Es behält die volle, providergescopte Liste — richtig für Create. Schreibt
> jemand dort einen `defaultImageModelId`, den der Chat nicht führt, greift der Fallback
> unten. Genau diesen Fall prüft Schritt 1.

- [ ] **Schritt 1: Den fehlschlagenden Test schreiben**

In `src/hooks/useUnifiedImageToolState.test.tsx` den Mock in den Zeilen 3–14 ersetzen:

```tsx
import { getChatImageModelIds } from '@/config/unified-image-models';

jest.mock('@/config/unified-image-models', () => {
  const actual = jest.requireActual('@/config/unified-image-models');
  return {
    ...actual,
    getChatImageModelIds: jest.fn(actual.getChatImageModelIds),
  };
});

const mockGetChatImageModelIds =
  getChatImageModelIds as jest.MockedFunction<typeof getChatImageModelIds>;
```

Den `mockGetVisualizeModelGroupsForProvider.mockClear()` im `beforeEach` auf
`mockGetChatImageModelIds.mockClear()` umstellen. Dann diese beiden Tests am Ende der
`describe`-Klammer ergänzen:

```tsx
  it('fuehrt im Chat nur die schluesselfreie Bildauswahl, auch mit Pruna-Schluessel', async () => {
    // E7-3: der Pruna-Schluessel darf im Chat nichts aufblaettern.
    localStorage.setItem('prunaApiKey', 'pruna_test_1234567890');
    localStorage.setItem('heyhi-provider-mode', JSON.stringify('pruna'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: true }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect([...result.current.availableModels].sort()).toEqual(['flux', 'gpt-image', 'klein']);
    });
  });

  it('faellt auf flux zurueck, wenn das gespeicherte Standardmodell nicht im Chat gefuehrt wird', async () => {
    // Der SettingsPopover im Create schreibt denselben Schluessel und kennt
    // die volle Liste. Der Chat darf daran nicht haengenbleiben.
    localStorage.setItem('defaultImageModelId', JSON.stringify('p-video'));
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ prunaAvailable: false }),
    } as Response);

    const { result } = renderHook(() => useUnifiedImageToolState());

    await waitFor(() => {
      expect(result.current.selectedModelId).toBe('flux');
    });
  });
```

- [ ] **Schritt 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
CI=1 npm test -- --runInBand src/hooks/useUnifiedImageToolState.test.tsx
```

Erwartet: FAIL — der erste Test bekommt die 17 Pruna-Modelle, der zweite bleibt auf
`p-video` stehen.

- [ ] **Schritt 3: Den Hook umstellen**

In `src/hooks/useUnifiedImageToolState.ts`:

a) Im Import aus `@/config/unified-image-models` (ab Zeile 13)
`getVisualizeModelGroupsForProvider` und `shouldIncludeByopHidden` streichen,
`getChatImageModelIds` aufnehmen. `providerMode`, `setProviderMode` und `prunaAvailable`
aus `useProviderMode()` (Zeile 65) bleiben — sie werden weiter durchgereicht.

b) `availableModels` (Zeilen 79–85) ersetzen:

```tsx
    // Phase 7: der Chat fuehrt die schluesselfreie Bildauswahl, unabhaengig
    // vom Provider-Schalter. Der Schalter scopet weiterhin die Liste im
    // Create und im SettingsPopover — er ist und bleibt ein Listenfilter,
    // nur eben nicht mehr fuer diese Liste.
    const availableModels = useMemo(() => getChatImageModelIds(), []);
```

c) `initialModelId` (Zeilen 86–94) ersetzen — die Provider-Bedingung entfällt, weil die
Liste nur noch Pollinations führt:

```tsx
    const initialModelId = useMemo(() => {
        if (availableModels.includes(normalizedDefaultImageModelId)) {
            return normalizedDefaultImageModelId;
        }
        if (availableModels.includes(DEFAULT_IMAGE_MODEL)) return DEFAULT_IMAGE_MODEL;
        return availableModels[0] || DEFAULT_IMAGE_MODEL;
    }, [availableModels, normalizedDefaultImageModelId]);
```

d) Den Reset-Effekt (Zeilen 97–106) ersetzen:

```tsx
    // Faellt das gewaehlte Modell aus der Chat-Auswahl — etwa weil der
    // SettingsPopover im Create einen Standard geschrieben hat, den der Chat
    // nicht fuehrt — zurueck auf den Vorgabewert statt still ins Leere.
    useEffect(() => {
        setSelectedModelId(prev => {
            if (availableModels.includes(prev) || availableModels.length === 0) return prev;
            return availableModels.includes(DEFAULT_IMAGE_MODEL)
                ? DEFAULT_IMAGE_MODEL
                : availableModels[0];
        });
    }, [availableModels]);
```

- [ ] **Schritt 4: Die Auswahl „Standard-Bildmodell" in der Sidebar nachziehen**

In `src/components/sidebar/PersonalizationSidebarSection.tsx` den `imageModels`-Block
(Zeilen 37–44) ersetzen:

```tsx
  // Phase 7: dieselbe Auswahl wie der Chat-Picker. Ein Standardmodell, das
  // der Chat nicht fuehrt, waere ein Versprechen, das der Hook still
  // zurueckdreht — und ohne Schluessel ein unmarkiertes BYOP-Angebot (L-I.2).
  const imageModels = useMemo(
    () => getChatImageModelGroups()
      .flatMap(group => group.models)
      .filter(model => model.id in unifiedModelConfigs),
    []
  );
```

Den Import anpassen: `getModelsByProvider` und `shouldIncludeByopHidden` aus dem Import von
`@/config/unified-image-models` streichen (falls sie dort sonst nicht mehr gebraucht
werden — mit `grep -n "getModelsByProvider\|shouldIncludeByopHidden" src/components/sidebar/PersonalizationSidebarSection.tsx`
prüfen), `getChatImageModelGroups` aufnehmen. `providerMode`, `setProviderMode` und
`prunaAvailable` aus `useProviderMode()` (Zeile 27) **bleiben** — der Provider-Schalter in
dieser Datei (Zeilen 172–210) wird nicht angefasst.

- [ ] **Schritt 5: Tests laufen lassen und Erfolg bestätigen**

```bash
CI=1 npm test -- --runInBand src/hooks/useUnifiedImageToolState.test.tsx
```

Erwartet: PASS, inklusive der vorhandenen Provider-Persistenz-Tests — der Schalter selbst
verhält sich unverändert.

- [ ] **Schritt 6: Die volle Suite und beide Prüfmittel**

```bash
CI=1 npm test
```

Erwartet: alle Suiten grün. Referenz vor der Phase: 109 Suiten, 852 Tests. Danach 110
Suiten (die neue `ImageModelOptions.test.tsx`) und mehr Tests; **die Zahl der fehlgeschlagenen
Tests muss null sein** — die Gesamtzahl wird beim Abschluss abgelesen, nicht vorhergesagt.

```bash
npm run typecheck && npm run lint && node scripts/check-model-registry.mjs
```

Erwartet: keine Typfehler, keine Lint-Fehler, `Keine Abweichungen — Modellwahrheit hält.`

- [ ] **Schritt 7: Commit (erst nach Freigabe)**

```bash
git add src/hooks/useUnifiedImageToolState.ts \
        src/hooks/useUnifiedImageToolState.test.tsx \
        src/components/sidebar/PersonalizationSidebarSection.tsx
git commit -m "feat(phase-7): Hook und Standard-Bildmodell folgen der Chat-Auswahl"
```

---

## Aufgabe 5: Wahrheitsdokumente nachziehen

**Dateien:**
- Ändern: `docs/LAUNCH_CRITERIA.md` (L-F.1, L-I.2)
- Ändern: `docs/FAHRPLAN-create.md` (Phase-7-Block)
- Ändern: `CLAUDE.md` (Abschnitt „Visible image/video models")
- Ändern: `docs/README.md` (Zeile unter „Start Here")

- [ ] **Schritt 1: `LAUNCH_CRITERIA.md` — L-F.1 auf erledigt setzen**

Den Status von **L-F.1** von `offen` auf `erledigt (2026-08-29, Phase 7)` setzen und den
Prüfweg um den tatsächlichen Endzustand ergänzen:

> Prüfweg: Modell-Liste im Chat mit der Bestätigungsliste aus L-B.4 vergleichen; der
> Verweis ins Create ist als Beschriftung vorhanden und führt dorthin.
> **Endzustand seit Phase 7:** Der Chat führt `flux`, `gpt-image`, `klein` — die Regel
> „schlüsselfrei, Pollinations, Bild" in `getChatImageModelGroups()`. Video und Pruna sind
> strukturell abwesend (E7-2, E7-3). Der Verweis steht als letzte Zeile im Modell-Panel.

- [ ] **Schritt 2: `LAUNCH_CRITERIA.md` — L-I.2 ehrlich teilerledigen**

L-I.2 spannt über das ganze Produkt. Phase 7 schließt die Bild- und Videofläche, nicht die
Musik. Den Status **nicht** auf „erledigt" setzen, sondern:

> Status: teilweise — Text (Phase 3, Pollenwall im `ModelSelectorPanel`) und Bild/Video
> (Phase 7, strukturell: der Chat führt kein schlüsselpflichtiges Bild- oder Videomodell
> mehr) sind erfüllt. Offen bleibt der Musikmodus, siehe L-G.1 (Phase 8).

- [ ] **Schritt 3: `FAHRPLAN-create.md` — Phase 7 als erledigt markieren**

Im Block „### Phase 7 — Chat entschlanken (**P7**)" unter „Fertig, wenn:" ergänzen:

> **Erledigt am 2026-08-29.** Kriterium E7-1: schlüsselfrei statt Zahl. Kein Video (E7-2),
> kein Pruna (E7-3) im Chat. Übergang als letzte Zeile im Modell-Panel (E7-4). Plan:
> [`PLAN-phase-7-chat-entschlanken.md`](PLAN-phase-7-chat-entschlanken.md).

- [ ] **Schritt 4: `CLAUDE.md` — die Chat-Ausnahme benennen**

Im Abschnitt „### Visible image/video models" nach dem Absatz über die drei Flags einfügen:

> **Der Chat ist die Ausnahme.** Seit Phase 7 liest die Bildauswahl im Chat nicht
> `getVisualizeModelGroupsForProvider`, sondern `getChatImageModelGroups()` — eine Regel
> ohne Optionsparameter: Pollinations, Bild, `isFree`, `enabled`. Sie wächst mit keinem
> Schlüssel und folgt dem Provider-Schalter nicht. Video und Pruna leben im Create. Wer die
> Chat-Auswahl ändern will, ändert die Regel, nicht die Registry.

Im Abschnitt „## Provider Semantics" die Aufzählung der fünf lesenden Module korrigieren:
`useUnifiedImageToolState.ts` liest `useProviderMode` weiterhin (Durchreichung und
Dispatch), scopet damit aber nicht mehr die Chat-Modellliste.

- [ ] **Schritt 5: `docs/README.md` — den Zusatz „Not yet executed" entfernen**

Die Zeile für diesen Plan steht bereits unter „Start Here" (in der Planungssitzung vom
2026-08-29 eingefügt). Sie endet mit `**Not yet executed.**` — diesen Satz streichen und
durch `**Executed 2026-08-29.**` ersetzen.

- [ ] **Schritt 6: Commit (erst nach Freigabe)**

```bash
git add docs/LAUNCH_CRITERIA.md docs/FAHRPLAN-create.md CLAUDE.md docs/README.md \
        docs/PLAN-phase-7-chat-entschlanken.md
git commit -m "docs: Phase 7 in Fahrplan, Launch-Kriterien und CLAUDE.md nachgezogen"
```

---

## Abschlussprüfung

Erst wenn alle fünf Aufgaben stehen. Ergebnisse **mit den tatsächlichen Zahlen** notieren,
nicht mit den hier erwarteten.

- [ ] `CI=1 npm test` — null fehlgeschlagene Tests, Suiten- und Testzahl ablesen
- [ ] `npm run typecheck` — keine Fehler
- [ ] `npm run lint` — keine Fehler
- [ ] `npm run build` — geht durch
- [ ] `node scripts/check-model-registry.mjs` — „Keine Abweichungen"
- [ ] `git status` — keine unerwarteten Dateien
- [ ] **Unabhängigkeit nachweisen:**
  ```bash
  git diff --name-only main | grep -E "^(src/app/create/|src/components/playground/|src/lib/playground/|src/hooks/usePlaygroundModels|src/components/settings/SettingsPopover)"
  ```
  Erwartet: **keine Treffer.** Ist hier etwas, ist die Unabhängigkeit von Phase 4, 5 und 6
  verletzt.
- [ ] **L-F.1 von Hand prüfen** (`npm run dev`, Browser des Betreibers): Bildmodus im Chat
  öffnen, Modell-Panel öffnen — genau `flux`, `gpt-image`, `klein`, keine Gruppe
  „IMAGE ADVANCED", keine Gruppe „VIDEO ADVANCED", letzte Zeile „ALLE MODELLE IM CREATE →",
  Klick landet auf `/create`.
- [ ] **L-I.2 von Hand prüfen, drei Zustände:** frisches Profil ohne Schlüssel; nur
  Pollen-Schlüssel; nur Pruna-Schlüssel mit Provider-Schalter auf Pruna. In allen drei
  Fällen führt der Chat dieselben drei Modelle.
- [ ] Auch im Mobil-Drawer prüfen (375 px): dieselbe Liste, kein „Mehr anzeigen", die
  Create-Zeile sichtbar.

> **Browser-Verifikation:** `AGENTS.md` verbietet automatische Browserprüfung durch den
> Agenten, und der Betreiber hat den Browser selbst offen. Die drei Handprüfungen macht der
> Betreiber; der Agent fragt vorher, ob er sie stattdessen übernehmen soll.

---

## Offene Punkte und Restannahmen

Diese blockieren Phase 7 nicht, gehören aber ins nächste Handoff.

1. **L-B.4 ist offen.** L-F.1 verlangt „ausschließlich in **B** bestätigte Modelle" und
   verweist auf die Bestätigungsliste aus L-B.4 — deren Status ist `offen`, kein Modell hat
   bisher dokumentiert erzeugt. Dieser Plan setzt gegen das **Kriterium** um (strukturell
   schlüsselfrei), nicht gegen die noch nicht existierende Liste. Erzeugt einer der drei
   (`flux`, `gpt-image`, `klein`) bei der L-B.4-Prüfung nicht, muss er aus der Regel fallen
   — dann greift `enabled: false` in der Registry, und die Chat-Auswahl folgt von selbst.
   **Kein Codeeingriff nötig, aber die Prüfung steht aus.**
2. **Der serverseitige `PRUNA_API_KEY` in Produktion ist von hier aus nicht prüfbar.**
   Lokal steht er in `.env` und `.env.local`. Die Betreiberentscheidung vom 2026-08-28 sagt,
   dass in Produktion keiner liegt; die Vercel-Umgebung war in dieser Sitzung nicht
   einsehbar. Nach Phase 7 ist das für den Chat gleichgültig — die Regel ist
   providerunabhängig —, für L-K.1 bleibt es zu prüfen.
3. **`getVisualizeModelGroupsForProvider` bleibt bestehen.** Create und `SettingsPopover`
   lesen sie weiter. Sie wird durch diese Phase nicht tot.
4. **Die Gruppenbeschriftung „IMAGE FREE" bleibt**, obwohl der Chat nur noch freie Modelle
   führt. Sie stimmt und passt zur Create-Sprache; eine Umbenennung wäre eine eigene
   Textentscheidung ohne Nutzen hier.
5. **Der Provider-Schalter bleibt im Chat sichtbar** (`PersonalizationSidebarSection`,
   Zeilen 172–210), scopet dort aber nur noch das Create und die `SettingsPopover`-Auswahl.
   Ob er in der Chat-Sidebar überhaupt noch stehen soll, ist eine Produktentscheidung —
   nicht Teil dieser Phase, absichtlich nicht mitentschieden.
