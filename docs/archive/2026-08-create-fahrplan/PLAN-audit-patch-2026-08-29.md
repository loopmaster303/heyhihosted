# Patch-Plan — Audit-Befunde aus Phase 0–3 abarbeiten

**Datum:** 2026-08-29
**Branch:** `main`, HEAD `fcb1124`, Arbeitsbaum offen mit **49 Einträgen**
**Grundlage:** Audit von `FAHRPLAN-create.md`, `LAUNCH_CRITERIA.md`, den Phasenplänen 0–4
und den Handoffs zu Phase 0–3, geprüft gegen den Code, die Live-Registry und den
Live-Deploy am 2026-08-28/29.
**Art:** Plan. Ausführung in einer eigenen Sitzung.

**Ausführungsform: Subagent-Driven Development.** Der Hauptagent führt keinen der
Arbeitspakete selbst aus. Er delegiert jedes Paket einzeln an einen Worker-Subagenten,
prüft dessen Ergebnis gegen das Fertig-Kriterium und geht erst dann zum nächsten Paket.
Details in Abschnitt 1.

---

## 1. Ausführungsregeln

### 1.1 Skill und Ablauf

Der Hauptagent lädt zu Beginn `superpowers:subagent-driven-development` und folgt ihm.
Der Ablauf je Paket ist immer derselbe:

1. Hauptagent liest das Paket unten und gibt es **wörtlich** an einen Worker.
2. Worker arbeitet nur die genannten Dateien an, führt die genannte Verifikation aus
   und meldet Ergebnis plus Verifikationsausgabe zurück.
3. Hauptagent prüft das Fertig-Kriterium selbst nach — er glaubt dem Worker nicht,
   er führt die Verifikation nochmal aus.
4. Erst dann das nächste Paket.

**Kein Worker committet.** Commits macht ausschließlich der Hauptagent, und nur in
Paket **P0** und am Ende.

### 1.2 Modellwahl der Worker

| Ausführende Umgebung | Worker-Modell |
|---|---|
| Claude Code (dieses Repo, `Agent`-Tool) | **Sonnet 5** — `model: "sonnet"` im Agent-Aufruf |
| OpenCode oder ein anderer Coding-Agent | **GLM 5.3 Flash** oder **DeepSeek Flash** |

Der Hauptagent (Orchestrator) bleibt auf dem stärkeren Modell. Die Pakete sind so
geschnitten, dass ein günstiger Worker sie ohne eigene Urteilsbildung schafft: jedes
nennt die Datei, die exakte Änderung und die Prüfung. Wo ein Paket eine Entscheidung
verlangt, steht die Entscheidung **schon im Paket** — der Worker trifft keine.

### 1.3 Verbote für Worker

- Keine Datei anfassen, die im Paket nicht genannt ist.
- Kein „nebenbei aufräumen", kein Umformatieren, keine Umbenennung von Symbolen.
- Kein `git commit`, kein `git push`, kein `git stash`.
- Nicht `src/components/playground/`, `src/lib/playground/`, `PlaygroundShell`,
  die `playground.*`-Schlüsselnamen oder `PLAYGROUND_CONVERSATION_ID` umbenennen —
  das steht in `LAUNCH_CRITERIA.md` Bereich M ausdrücklich nicht zur Debatte.
- Bei Unklarheit: abbrechen und zurückmelden, nicht raten.

### 1.4 Verifikation

Der volle Durchlauf ist:

```bash
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build
```

Ausgangsstand vor dem ersten Paket: **109 Suiten, 851 Tests grün**, lint und `tsc`
sauber, Build erfolgreich. Die Testzahl darf in keinem Paket sinken.

---

## 2. Reihenfolge

```
P0 (Commits)  ──►  W1 W2 W3 W4 W9 W10   (Doku, parallel möglich)
                   │
                   └──►  W5 W6 W7        (Code, seriell)

E1 E2 E3  = Entscheidungen. Nicht delegierbar, siehe Abschnitt 5.
```

**P0 blockiert alles.** Solange 49 Dateien offen liegen, ist jeder weitere Diff
unlesbar — dieselbe Lage, die Phase 0 eine ganze Sitzung gekostet hat, und der
`scripts/worktree-guard.sh` schlägt bereits an (Schwelle 25).

W1–W4, W9, W10 fassen nur `docs/` und die Wahrheitsdokumente an und können parallel
laufen, **wenn** je Paket getrennte Dateien betroffen sind. Das ist unten so geschnitten.
W5–W7 fassen Code an und laufen seriell.

---

## 3. Paket P0 — Arbeitsbaum sortieren *(Hauptagent, nicht delegieren)*

**Befund:** 49 offene Einträge aus zwei Sitzungen. Der Phase-3-Plan hat genau diesen
Zustand als Startverbot formuliert; Phase 3 sitzt jetzt selbst darin.

**Auftrag:** In fünf thematische Commits überführen, jeder für sich grün:

| # | Inhalt | Dateien |
|---|---|---|
| 1 | Modellwahrheit (Config + Registry-Auflösung) | `src/config/unified-image-models.ts`, `unified-model-configs.ts`, `ui-constants.ts`, `enhancement-prompts.ts`, `chat-options.ts`, `src/lib/pollinations-registry.ts`, `src/lib/playground/model-source.ts`, `src/hooks/useUnifiedImageToolState.ts`, `src/hooks/useComposeMusicState.ts`, `src/app/api/compose/route.ts`, `src/app/api/enhance-prompt/route.ts` + zugehörige Tests |
| 2 | Prüfwerkzeug | `scripts/check-model-registry.mjs`, `src/config/__fixtures__/`, `src/config/__tests__/registry-truth.test.ts`, `registry-consistency.test.ts`, `.github/workflows/registry-check.yml` |
| 3 | Pollenwall im Chat | `src/components/chat/input/ModelSelector.tsx`, `src/components/playground/ModelPicker.tsx`, `src/config/translations.ts` |
| 4 | Route `/playground` → `/create` | `src/app/create/*` (Renames), `src/components/layout/AppSidebar.tsx`, `next.config.ts`, `next.config.test.ts` |
| 5 | Wahrheitsdokumente | `CLAUDE.md`, `README.md`, `AGENTS.md`, `GEMINI.md`, `HANDOFF.md`, `docs/*.md` |

`next-env.d.ts` ist Autogen-Rauschen und gehört in keinen Commit — auschecken.

**Fertig, wenn:** `git status --porcelain -uall` ist leer, jeder der fünf Commits ist
einzeln gebaut und grün, gepusht.

**Achtung:** Es lief zwischenzeitlich eine zweite Sitzung auf demselben Arbeitsbaum.
Vor dem Sortieren prüfen, ob noch eine offen ist.

---

## 4. Arbeitspakete für Worker

### W1 — Statuswahrheit vereinheitlichen

**Befund:** Vier Quellen sagen Verschiedenes über den Phasenstand. `CLAUDE.md` — das
Dokument, das jede Sitzung zuerst liest — steht auf „Phase 0 is done" und ist damit
drei Phasen alt. Es kennt `LAUNCH_CRITERIA.md` überhaupt nicht.

**Dateien:** `CLAUDE.md`, `docs/FAHRPLAN-create.md`, `HANDOFF.md`, `docs/README.md`

**Exakte Änderungen:**

1. `CLAUDE.md`, Punkt 5 unter „Start Here": „**Phase 0 is done**" ersetzen durch
   „**Phases 0–3 are done** (2026-08-28/29). Read
   [docs/LAUNCH_CRITERIA.md](docs/LAUNCH_CRITERIA.md) — it is the release gate and the
   status of record; the Fahrplan describes the way there, not the state." Danach auf
   `docs/HANDOFF-2026-08-28-phase-3.md` als jüngsten Handoff verweisen statt auf
   Phase 0.
2. `docs/FAHRPLAN-create.md`: Die Überschriften `### Phase 1 — …` und
   `### Phase 2 — …` bekommen denselben Marker wie Phase 0 und 3, also
   ` · ✅ ERLEDIGT am 2026-08-28`. Phase 2 zusätzlich mit einem Satz: die eigene Domain
   ist am 2026-08-29 entfallen, Create liegt unter `/create`.
3. `HANDOFF.md`: In der Phasentabelle die Zeilen **1** und **2** genauso durchstreichen
   wie 0 und 3, jeweils mit `— **erledigt am 2026-08-28**`.
4. `docs/README.md`, Abschnitt „Start Here": eine Zeile für
   `HANDOFF-2026-08-28-phase-1.md` ergänzen (fehlt als einziger Phasen-Handoff).

**Verifikation:**
```bash
grep -n "Phase 0 is done" CLAUDE.md; grep -c "ERLEDIGT\|erledigt" docs/FAHRPLAN-create.md
```
**Fertig, wenn:** Der erste `grep` findet nichts. In `FAHRPLAN-create.md` tragen die
Phasen 0, 1, 2, 3 einen Marker. `docs/README.md` nennt alle vier Phasen-Handoffs.

---

### W2 — Die Registry-Tabelle im Fahrplan als historisch kennzeichnen

**Befund:** `docs/FAHRPLAN-create.md` Zeilen ~58–76 tragen den Registry-Befund vom
2026-08-26 und sagen unter anderem `gpt-image` → „existiert nicht". `gpt-image`
existiert und ist eines von genau drei kostenlosen Modellen. Die Tabelle widerspricht
dem Ergebnis von Phase 3 und steht in dem Dokument, auf das `CLAUDE.md` als aktiven
Plan zeigt.

**Datei:** `docs/FAHRPLAN-create.md` (nur der Abschnitt „Live-Registry-Befund (2026-08-26)")

**Exakte Änderung:** Über den Abschnitt einen Block setzen:

> **⚠ Historisch — Stand 2026-08-26, überholt.** Phase 3 hat die Modellwahrheit am
> 2026-08-28 gegen die Live-Registry gezogen und durch ein Prüfmittel ersetzt. Die
> Zahlen und Einzelbefunde unten sind seitdem mehrfach falsch geworden (`gpt-image`
> existiert und ist frei; die Zählung ging 74 → 70 → 77 in drei Tagen). Aktuelle
> Wahrheit: `node scripts/check-model-registry.mjs`, siehe `CLAUDE.md`, Abschnitt
> „Modellwahrheit prüfen".

Den Abschnittsinhalt selbst **nicht** löschen und **nicht** korrigieren — er belegt,
warum Phase 3 nötig war.

**Verifikation:** `sed -n '/Live-Registry-Befund/,/^## /p' docs/FAHRPLAN-create.md | head -20`
**Fertig, wenn:** Der Warnblock steht direkt unter der Abschnittsüberschrift.

---

### W3 — `LAUNCH_CRITERIA.md`: Status setzen und die heimatlosen Gates verorten

**Befund zwei:** Fünf Gate-Kriterien tragen „phasenlos" und haben damit keinen
Bauauftrag: **L-I.1, L-I.2, L-K.1, L-K.2, L-K.3**. Sie blockieren die Freigabe, aber
keine Phase des Fahrplans erzeugt sie. Phase 1 hat geprüft, dass jede Phase einem
Kriterium zuzuordnen ist — die Gegenrichtung nie.

**Befund eins:** Das Dokument ist seit seiner Entstehung nie angefasst worden. Kopf sagt
„Letzte Prüfung: keine", alle Kriterien stehen auf „offen" — auch L-B.1 bis L-B.3, die
der Phase-3-Handoff selbst als erfüllt bezeichnet.

**Datei:** `docs/LAUNCH_CRITERIA.md`

**Exakte Änderungen — die Zuordnung ist entschieden, nicht abzuwägen:**

1. Kopffeld: `**Letzte Prüfung:** 2026-08-29 · **Geprüft von:** Audit Phase 0–3`
2. Status setzen:
   - **L-A.2, L-A.3** → `erledigt (2026-08-28)` — Rückweg (`← chat` in der
     Create-Kopfzeile) und Hinweg (Sidebar-Link) existieren und sind getestet.
   - **L-A.4** → `erledigt (2026-08-29)`
   - **L-B.1, L-B.2, L-B.3** → `erledigt (2026-08-28, Phase 3)`
   - **L-A.1, L-A.5, L-B.4** → bleiben `offen` (brauchen eine Browser-Sicht)
   - Alle übrigen bleiben `offen`.
3. Bei jedem der fünf phasenlosen Kriterien die Zeile `Herkunft: phasenlos` ersetzen:
   - **L-I.1** → `Herkunft: Abschlussprüfung vor der Freigabe`
   - **L-I.2** → `Herkunft: Phase 7` (Chat entschlanken — dort wird die Modellauswahl
     ohnehin angefasst; die Pollenwall aus Phase 3 ist die halbe Miete)
   - **L-K.1** → `Herkunft: Abschlussprüfung vor der Freigabe`
   - **L-K.2** → `Herkunft: Phase 4` (Fehlerklarheit — gleiche Dateien, gleiche Denkarbeit)
   - **L-K.3** → `Herkunft: Phase 4`
4. In der Tabelle „Zuordnung Phase → Kriterien" die Zeilen für Phase 4 und Phase 7
   um die verschobenen Kriterien ergänzen und die Zeile „— | Kostenrisiko | phasenlos"
   auf L-K.1 reduzieren; eine Zeile „— | Abschlussprüfung | L-I.1, L-K.1" ergänzen.
5. Freigaberegel im Kopf: den Satz um einen Halbsatz ergänzen, dass L-I.1 und L-K.1
   erst unmittelbar vor der Freigabe geprüft werden, weil sie den fertigen Stand messen.

**Verifikation:** `grep -c "phasenlos" docs/LAUNCH_CRITERIA.md`
**Fertig, wenn:** Der Zähler steht auf 0 in den `Herkunft:`-Zeilen, und
`grep -c "Status: offen" docs/LAUNCH_CRITERIA.md` ist um 6 kleiner als vorher.

---

### W4 — Den Phase-3-Handoff korrigieren

**Befund:** Der Handoff behauptet in seiner Dateitabelle: „**tote Schlüssel entfernt:**
`playground.title`, `playground.cancel`, `playground.enhance`". Der Diff zeigt: nicht
angefasst, alle drei stehen weiter in beiden Sprachblöcken. Handoffs sind die Prüfspur —
eine falsche Zeile darin schickt die nächste Sitzung auf die falsche Fährte.

**Datei:** `docs/HANDOFF-2026-08-28-phase-3.md`

**Exakte Änderung:** In der Zeile zu `src/config/translations.ts` den Teil
„**tote Schlüssel entfernt:** `playground.title`, `playground.cancel`,
`playground.enhance` (Phase-2-Erbe)" ersetzen durch:
„*Korrektur 2026-08-29:* die drei toten Schlüssel `playground.title`,
`playground.cancel`, `playground.enhance` wurden **nicht** entfernt — die Zeile war
falsch. Sie stehen weiter im Baum (Paket W6 des Audit-Patch-Plans)."

Sonst nichts am Handoff ändern.

**Verifikation:** `grep -n "tote Schlüssel entfernt" docs/HANDOFF-2026-08-28-phase-3.md`
**Fertig, wenn:** kein Treffer.

---

### W5 — Die Testlücke schließen, aus der `qwen-image` kam

**Befund:** `registry-truth.test.ts` bindet `PRUNA_MODEL_IDS` an `PRUNA_MODEL_MAP`.
Nicht geprüft ist die Richtung, aus der der eigentliche Fehler kam: ein Eintrag in
`UNIFIED_IMAGE_MODELS` mit `provider: 'pruna'`, der **kein** Mapping hat (oder
umgekehrt: `provider: 'pollinations'` bei einer ID, die im Map steht). Genau so wurde
`qwen-image` als kostenlos angeboten, zu Pruna dispatcht und antwortete mit 503.
Heute sauber — nichts hält es fest.

**Datei:** `src/config/__tests__/registry-truth.test.ts` (nur ergänzen)

**Exakte Änderung:** Im `describe('registry truth (F1): geführte Modelle existieren')`
einen Test ergänzen:

```ts
test('provider und PRUNA_MODEL_MAP widersprechen sich nicht', () => {
  const prunaOhneMapping = UNIFIED_IMAGE_MODELS
    .filter((m) => m.provider === 'pruna' && !isPrunaModel(m.id))
    .map((m) => m.id);
  const gemapptOhneProvider = UNIFIED_IMAGE_MODELS
    .filter((m) => m.provider !== 'pruna' && isPrunaModel(m.id))
    .map((m) => m.id);
  expect({ prunaOhneMapping, gemapptOhneProvider })
    .toEqual({ prunaOhneMapping: [], gemapptOhneProvider: [] });
});
```

Begründung als Kommentar darüber: Der Dispatch in `/api/generate` entscheidet über
`isPrunaModel()`, der Referenz-Upload über `selectedModelInfo.provider`. Gehen die
beiden auseinander, läuft die Erzeugung woanders hin als der Upload.

**Verifikation:** `CI=1 npx jest --silent src/config/__tests__/registry-truth.test.ts`
**Fertig, wenn:** Die Suite ist grün und enthält einen Test mehr als vorher.

---

### W6 — Die drei toten Übersetzungsschlüssel wirklich entfernen

**Befund:** `playground.title`, `playground.cancel`, `playground.enhance` haben null
Konsumenten. Die Kopfzeile im Create schreibt „create" hart, der Abbrechen-Knopf in
`Gallery.tsx` schreibt „Abbrechen" hart.

**Datei:** `src/config/translations.ts` (nur diese)

**Exakte Änderung:** In **beiden** Sprachblöcken (DE ~Zeile 57/61/62, EN ~Zeile
319/323/324) die drei Zeilen `'playground.title'`, `'playground.cancel'`,
`'playground.enhance'` löschen. `playground.sidebarLink`, `playground.prunaEmpty`,
`playground.fallbackNotice`, `playground.generate` **bleiben** — die haben Konsumenten.

**Verifikation:**
```bash
grep -c "playground.title\|playground.cancel\|playground.enhance" src/config/translations.ts
CI=1 npx jest --silent && npx tsc --noEmit
```
**Fertig, wenn:** Der Zähler steht auf 0, Tests und `tsc` sind grün.

---

### W7 — L-K.3: „Abbrechen" sagt die Unwahrheit

**Befund:** `src/components/playground/Gallery.tsx:98` beschriftet den Knopf mit
„Abbrechen". Der Klick bricht den `AbortController` des Client-Pollings ab — der
Pruna-Lauf auf der Gegenseite läuft weiter und wird abgerechnet. Pruna hat keinen
Cancel-Endpunkt. `LAUNCH_CRITERIA.md` L-K.3 verbietet genau diese Beschriftung.

**Dateien:** `src/components/playground/Gallery.tsx`,
`src/components/playground/Gallery.test.tsx`, `src/app/create/create.e2e.test.tsx`,
`src/components/playground/PromptBar.test.tsx`

**Exakte Änderung:**

1. Beschriftung `Abbrechen` → `Nicht mehr warten`.
2. Direkt darunter ein `title`-Attribut bzw. eine kleine Zeile mit dem Grund:
   `Der Lauf läuft beim Anbieter weiter und wird berechnet.`
3. In den drei Testdateien die Selektoren
   `getByRole('button', { name: 'Abbrechen' })` auf den neuen Namen ziehen. Die
   Testlogik nicht ändern.

**Nicht ändern:** die Funktionsnamen `onCancel` / `onCancelRun` — das ist der
technische Vorgang und der heißt korrekt so.

**Verifikation:**
```bash
grep -rn "Abbrechen" src/components/playground src/app/create
CI=1 npx jest --silent
```
**Fertig, wenn:** Kein `Abbrechen` mehr in den genannten Pfaden, 851 Tests grün.

---

### W9 — Phase 4 im Fahrplan um das nachziehen, was Phase 3 gefunden hat

**Befund zwei Dinge:**

1. Der Phase-3-Handoff vererbt an Phase 4 ein Async-Protokoll für
   **Pollinations**-Videos (Beleg: `nova-reel` bricht live nach 125 s mit 524 ab, der
   Dispatch ist synchron; das 202-Protokoll deckt nur Pruna). Der Fahrplan-Abschnitt
   Phase 4 kennt das nicht.
2. Nach Phase 3 gibt es **kein kostenloses Videomodell mehr** — von 16 aktiven
   Einträgen sind drei ohne Schlüssel nutzbar, alle drei Bild (`flux`, `gpt-image`,
   `klein`). Für Musik steht die Pollenwall ausdrücklich als gewollt im Fahrplan; für
   Video steht das nirgends.

**Datei:** `docs/FAHRPLAN-create.md` (nur der Abschnitt „Phase 4")

**Exakte Änderung:** Zwei Aufzählungspunkte ergänzen:

- `Async-Protokoll für Pollinations-Videos: der Dispatch ist heute synchron und läuft
  in ein 524, bevor ein Ergebnis da ist (nova-reel, live 2026-08-28, 125 s). Das
  202-Protokoll deckt nur Pruna ab. Ohne diesen Punkt bleibt jedes kostenlose
  Videomodell abgeschaltet.`
- `Folge daraus, ausdrücklich zu entscheiden: Video ist seit Phase 3 vollständig
  schlüsselpflichtig. Entweder das bleibt so und wird wie die Musik als gewollte
  Pollenwall aufgeschrieben, oder Phase 4 holt nova-reel über das Async-Protokoll
  zurück. Siehe Entscheidung E1 im Audit-Patch-Plan.`

**Verifikation:** `sed -n '/### Phase 4/,/### Phase 5/p' docs/FAHRPLAN-create.md`
**Fertig, wenn:** Beide Punkte stehen im Phase-4-Abschnitt.

---

### W10 — Die Vorbedingungen der Phasenpläne 3 und 4 entstauben

**Befund:** Beide Pläne tragen im Kopf „HEAD `f880389`, Arbeitsbaum offen, 95 Einträge"
und ein Startverbot, das längst erfüllt ist. Der Phase-3-Plan ist inzwischen ausgeführt;
sein Abschnitt 0 ist tot. Drei Sitzungen in Folge mussten das je neu feststellen.

**Dateien:** `docs/PLAN-phase-3-modellwahrheit.md`, `docs/PLAN-phase-4-fehlerklarheit.md`

**Exakte Änderung:** Je einen Block direkt unter den Kopf setzen, den Rest unberührt:

- Phase 3: `> **Ausgeführt am 2026-08-28.** Ergebnis und Abweichungen:
  [HANDOFF-2026-08-28-phase-3.md](HANDOFF-2026-08-28-phase-3.md). Abschnitt 0
  (Vorbedingung) ist erledigt und nur noch historisch.`
- Phase 4: `> **Kopfstand veraltet.** Geplant wurde gegen `f880389` plus offenen
  Arbeitsbaum; Phase 0–3 sind seitdem gelandet. Vor der Ausführung gegen den
  aktuellen HEAD prüfen. Der Abhängigkeitsabschnitt „Phase 3 kommt zuerst" ist erfüllt.
  Neu hinzugekommen: Async-Protokoll für Pollinations-Videos und die Kriterien L-K.2 /
  L-K.3 (siehe Audit-Patch-Plan).`

**Verifikation:** `head -20 docs/PLAN-phase-3-modellwahrheit.md docs/PLAN-phase-4-fehlerklarheit.md`
**Fertig, wenn:** Beide Blöcke stehen.

---

## 5. Was nicht delegierbar ist — drei Entscheidungen für den Betreiber

Diese drei gehören **nicht** in ein Worker-Paket. Sie brauchen eine Antwort, dann wird
daraus ein Paket.

### E1 — Bleibt Video hinter der Pollenwall?

Nach Phase 3: kein kostenloses Videomodell. `nova-reel` wäre registry-frei, scheitert
aber am synchronen Dispatch (524 nach 125 s). Zwei Wege:

- **A:** So lassen. Dann wie bei der Musik im Fahrplan als gewollte Entscheidung
  aufschreiben, und `LAUNCH_CRITERIA.md` bekommt ein Kriterium, dass die Oberfläche das
  vor dem Absenden sagt.
- **B:** Phase 4 baut das Async-Protokoll für Pollinations und holt `nova-reel` zurück.
  Deutlich mehr Arbeit als der Rest von Phase 4.

### E2 — L-K.2: Hinweis vor einem nicht abbrechbaren Pruna-Lauf

Das Kriterium verlangt, dass die Oberfläche **vor** dem Absenden sagt, dass ein
Pruna-Lauf nicht abbrechbar ist und abgerechnet wird. Heute gibt es nichts davon.
Offene Frage ist die Form: ein Bestätigungsschritt vor jedem Pruna-Start (nervt bei
jedem Lauf) oder eine dauerhafte Zeile an der Sendeleiste, sobald ein Pruna-Modell
gewählt ist (leiser, wird aber überlesen). Empfehlung: die dauerhafte Zeile, plus ein
einmaliger Bestätigungsschritt beim ersten Pruna-Lauf pro Browser.

### E3 — Ist Create zweisprachig oder deutsch?

Nur `ModelPicker` benutzt `t()`. Alles andere im Create ist hart deutsch — Knöpfe,
Leerzustände, `aria-label`. Der Prüfweg von L-A.4 spricht von „Oberfläche in DE und EN";
ein EN-Create gibt es faktisch nicht. Entweder wird das nachgezogen (eigenes Paket,
etwa 15 Zeichenketten) oder es kommt als „Create ist deutschsprachig" nach Bereich M.
Solange keins von beidem passiert, behauptet das Gate-Dokument etwas Falsches.

---

## 6. Kleinbefunde ohne eigenes Paket

Bewusst nicht eingeplant, hier festgehalten, damit sie nicht verlorengehen:

- `normalizeLegacyImageModelId` (`src/hooks/useUnifiedImageToolState.ts`) führt
  `imagen`→`zimage`, `flux-2-pro`→`kontext`, `grok-image`→`grok-imagine`. Alle drei
  Ziele hat Phase 3 auf `enabled: false` gesetzt. Folgenlos, weil `initialModelId` auf
  `flux` zurückfällt — aber der gespeicherte Default bleibt ein toter Wert.
- Die Pollenwall im Chat hängt an `useHasPollenKey()`, also am **Vorhandensein** eines
  Schlüssels, nicht an seiner Gültigkeit. Ein beliebiger Text öffnet die Wand und
  liefert 402. Gehört zu L-C.3 in Phase 4.
- `src/config/unified-model-configs.ts` trägt sechs Geister (`flux-2-dev`, `dirtberry`,
  `imagen-4`, `klein-large`, `seedance`, `seedream5`). Sie sind in
  `registry-consistency.test.ts` als dokumentierte Ausnahme sichtbar. Entfernen braucht
  einen eigenen Auftrag.
- `acestep`: noch 7 Treffer in `src/`. Gehört zu Phase 8, L-G.4 verlangt null.
- `vercel.json` ist weiterhin `{}` — `maxDuration` ist Altlast 7 und gehört zu Phase 4.

---

## 7. Fertig-Kriterium des ganzen Plans

- `git status --porcelain -uall` ist leer, alles gepusht.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` sauber; **mindestens 852 Tests**
  grün (851 + der neue aus W5).
- `grep -rn "Phase 0 is done" CLAUDE.md` findet nichts.
- `grep -n "Herkunft: phasenlos" docs/LAUNCH_CRITERIA.md` findet nichts.
- `grep -rn "Abbrechen" src/components/playground src/app/create` findet nichts.
- E1, E2, E3 sind beantwortet und die Antwort steht in `LAUNCH_CRITERIA.md` oder im
  Fahrplan — nicht nur im Chatverlauf.
