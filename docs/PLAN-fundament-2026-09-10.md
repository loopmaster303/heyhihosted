# Plan D — Fundament: CI, A11y-Nachweis, Testbasis

## Ziel

Der Nutzer merkt nach der Umsetzung ruhigeres Verhalten an den Stellen, die reduziert animieren und auf Doppelklicks reagieren, ohne dass sich die Oberfläche ändert. Der Betreiber sieht bei jedem Push einen Lauf, der Typen, Lint und Tests prüft, und bekommt für Barrierefreiheit eine wiederholbare Zahl aus dem Testlauf statt einer Lighthouse-Momentaufnahme. Der Entwickler hat für die fünf Module, an denen Strang A arbeitet, erstmals Verhaltenstests und kann `typecheck`, `lint` und `test` in CI laufen lassen, ohne sie lokal zu starten.

## Befunde in diesem Strang

| ID | Befund in einem Satz | Beleg (Datei:Zeile) | Grad (P0/P1/P2) |
| --- | --- | --- | --- |
| D1 | Für Tests, Lint und Typen läuft kein CI-Lauf: `.github/workflows/` enthält ausschließlich `registry-check.yml`, und der startet nur montags per Cron und auf Zuruf, obwohl `package.json` die Skripte `build`, `lint`, `typecheck` und `test` bereitstellt. | `.github/workflows/registry-check.yml:8-10`; `package.json:7-11` | P1 |
| D2 | Das A11y-Gate ist keines: `check-ux.sh` startet Lighthouse nur bei laufendem Dev-Server, prüft nur `/unified` und endet immer mit Exit-Code 0; `jest-axe` fehlt im Repo. | `scripts/audit/check-ux.sh:13`, `:23`, `:35-44`, `:59-65`; `package.json:19-65` (kein Treffer für `jest-axe`) | P2 |
| D3 | Die 121 Testdateien unter `src/` laufen nur, wenn jemand sie lokal startet; die fünf Module aus Strang A haben keinen Verhaltenstest, `database.ts` wird nur auf Importierbarkeit geprüft. | `rg --files src -g '*.test.ts*'` zählt 121 Dateien; `src/lib/services/__tests__/chat-smoke.test.ts:9-11` | P1 |
| D4 | Der zentrale matchMedia-Mock setzt `matches` fest auf `false`, damit sind alle Zweige für reduzierte Bewegung in Tests unerreichbar. | `jest.setup.ts:11-25`, feste Antwort in `:15` | P2 |
| D5 | Die vorhandenen Audit-Werkzeuge (`audit.sh`, `check-doc-drift.sh`, LaunchAgent) hängen an keinem CI-Lauf, und `check-build.sh` meldet Lint-Fehler als Warnung statt als Fehler. | `scripts/audit/check-build.sh:24`, `:33`; `scripts/audit/audit.sh:144-149`; `scripts/audit/com.heyhihosted.audit.plist` | P2 |
| D6 | Für die Entscheidungen der anderen Stränge fehlt eine gemeinsame Testbasis: `fake-indexeddb` und `jest-axe` sind nicht installiert, geteilte Testhelfer gibt es nicht, Schemamigration, Tastaturbedienung von Radiogruppen und Fehlercode-Vertrag sind nirgends prüfbar. | `package.json:19-65` (keine Treffer); `jest.setup.ts:1-42`; `src/components/chat/input/InlineModeSwitch.tsx:97` | P2 |

D1 und D2 sind im Audit mit diesen Graden benannt. D3 bis D6 habe ich aus §8 des Audits (`docs/DEEP_AUDIT_2026-09-10.md:224-244`) abgeleitet und selbst eingestuft. D3 steht auf P1, weil ohne Test jede Änderung an `database.ts` und den vier Hooks nur behauptet werden kann.

### Abweichungen vom Audit

- Der Audit nennt für den matchMedia-Mock `jest.setup.ts:22-38`. Der Mock-Block steht tatsächlich in `jest.setup.ts:11-25`; die Zeilen 30-41 enthalten den `crypto.randomUUID`-Patch, die Datei hat 42 Zeilen. Die Angabe ist inhaltlich richtig und um neun Zeilen verschoben. Die Auditdatei bleibt unverändert, die Abweichung steht hier.
- Alle übrigen übernommenen Angaben stimmen am aktuellen Stand: `.github/workflows/registry-check.yml:8-10` zeigt nur `schedule` und `workflow_dispatch`; `scripts/audit/check-ux.sh:13` prüft `curl -s --max-time 3 http://localhost:3000`; `:23` nennt als Ziel nur `http://localhost:3000/unified`; `package.json:7-11` führt `build`, `lint`, `typecheck`, `test`. Die Angabe `check-ux.sh:13-31` aus dem Auftrag umschließt den Block korrekt; die Bewertungsschwelle selbst liegt in `:35-44`, der Ausgabeblock in `:59-65`.
- `scripts/audit/check-ux.sh` hat 65 Zeilen und endet nach dem Ausgabeblock ohne `exit`; der Exit-Code 0 stammt damit vom abschließenden `cat`.

## Wellen

### W1 — CI-Lauf und erste Verhaltenstests (additiv, risikoarm)

**Ziel.** Jeder Push auf `main` und jeder Pull Request bekommt einen Lauf mit `typecheck`, `lint` und `test`; der matchMedia-Mock kann reduzierte Bewegung abbilden; die fünf Module aus Strang A haben erste Verhaltenstests, die ohne Netz, ohne Zugangsdaten und ohne Dev-Server laufen.

**Schritte.**

1. `.github/workflows/ci.yml` (neu) — Trigger `push` auf `main` plus `pull_request`, `permissions: contents: read`, ein `concurrency`-Block mit `cancel-in-progress: true`, Node 22 wie in `.github/workflows/registry-check.yml:24`, `actions/setup-node` mit `cache: npm`, danach drei Jobs `typecheck`, `lint` und `test` mit `npm ci` und je einem Befehl aus `package.json:9-11`. Warum: heute läuft gar nichts; drei parallele Jobs halten die Wanduhr unter der Marke aus dem Bewertungsteil. Der Lockfile-Abgleich ist sauber (`package-lock.json:2` und `:8` führen `name: nextn` wie `package.json:2`), `npm ci` ist damit tauglich.
2. `src/test-utils/match-media.ts` (neu) und `jest.setup.ts:11-25` — der Mock bleibt eine `jest.fn()` mit Standardantwort `matches: false`, zusätzlich setzt ein Setter die Antwort pro Query. Die Ausnahme lautet: enthält die Query `prefers-reduced-motion: reduce`, antwortet der Mock mit `true`. Warum: `src/hooks/useMediaQuery.ts:5` liest `matches` direkt aus dem Snapshot (`useSyncExternalStore` in `:17`), deshalb muss die Antwort query-spezifisch sein. Eine pauschale Antwort würde `src/app/create/PlaygroundShell.tsx:175` (`min-width: 1280px`) und `src/components/page/LandingView.tsx:36-37` (`max-height: 819px`, `max-height: 699px`) umschalten und die bestehenden Tests in `src/app/create/PlaygroundShell.test.tsx:130-141` und `:244-252` brechen.
3. `fake-indexeddb` als devDependency und `src/lib/services/__tests__/database.test.ts` (neu) — `import 'fake-indexeddb/auto'` steht vor dem Import von `@/lib/services/database`, weil `src/lib/services/database.ts:77` (`export const db = new HeyHiDatabase()`) die Datenbank beim Import öffnet. Geprüft wird Verhalten: eine Datenbank im Schema `version(3)` (`database.ts:61-66`) mit Asset-Datensätzen ohne `starred` befüllen, mit der App-Version öffnen und nach `toggleStarred` (`:183`) über den Index aus `version(4)` (`:68-73`) wiederfinden; `deleteConversation` (`:113-119`) entfernt Nachrichten und Assets der Konversation und lässt fremde Datensätze stehen; `saveAsset` (`:164-166`) überschreibt einen vorhandenen Datensatz vollständig. Warum: das ist die Testbasis für die Migrationen aus Strang A (D6).
4. `src/lib/services/__tests__/asset-fallback-service.test.ts` (neu) — Reihenfolge der Kette Blob → `remoteUrl` → `storageKey` (`asset-fallback-service.ts:61`, `:72`, `:85`), das Flag `needsCleanup` auf dem Blob-Pfad (`:61`) und die Cache-Bedingung in `downloadAndCacheAsset` gegen `SMALL_BLOB_SKIP_BYTES` (`:151`, Konstante importiert in `:13`). Warum: diese drei Entscheidungen entscheiden beim Reload darüber, ob ein erzeugtes Bild sichtbar bleibt (P0 2.1 des Audits).
5. `src/hooks/useAssetUrl.test.tsx` (neu) — genau ein `createURL` pro Auflösung, `releaseURL` beim Unmount (`src/hooks/useAssetUrl.ts:79`) und beim Wechsel der `assetId`, Fehlerzustand `Asset URL could not be resolved` bei fehlender Antwort (`:58`). Warum: die Blob-Freigabe ist heute nur behauptet; geprüft werden Aufrufzahlen und Reihenfolge, nicht der innere Aufbau.
6. `src/hooks/useChatPersistence.test.tsx` (neu) — Laden über `DatabaseService.getFullConversation`, Speichern über `saveFullConversation` (`src/hooks/useChatPersistence.ts:43`), Metadaten-Update über `getConversation` (`:50`), Rückgabe von `isInitialLoadComplete` (`:74`). Warum: der Haken hängt an IndexedDB und wird heute in zwei Testdateien gemockt; ohne eigenen Test ist er die einzige Persistenzschicht ohne Nachweis.
7. `src/hooks/useComposeMusicState.test.tsx` (neu) — zwei Aufrufe von `generateMusic` unmittelbar hintereinander, gezählt über ein gemocktes `fetch` auf `/api/compose`; der still geschluckte Fehler beim Speichern des Assets (`src/hooks/useComposeMusicState.ts:109`) bekommt eine eigene Zusicherung; die Rückgabeform deckt sich mit `mockComposeToolState` aus `src/app/unified/page.test.tsx:9-23` und `useComposeMusicState.ts:177`. Warum: `isGenerating` wird in `:49` gesetzt und nirgends als Guard gelesen; der Test hält diesen Ist-Zustand fest, damit Strang A den Guard später gegen einen roten Test einbauen kann.

**Dauer.** 3 Halbtage.

**Abnahmekriterium.** Ein Test-Pull-Request zeigt einen grünen Lauf von `typecheck`, `lint` und `test`, und die neuen Testdateien laufen ohne Netz, Zugangsdaten und Dev-Server.

**Einfacher gesagt.** Es entsteht ein Knopf, der bei jedem Push von selbst nachsieht, und fünf bisher blinde Stellen bekommen je einen Test, der echtes Verhalten nachstellt.

**Warum.** Ohne Lauf bleibt jede spätere Änderung eine Behauptung; ohne den Helfer ist der Pfad für reduzierte Bewegung nicht ausführbar; ohne die fünf Tests hat Strang A keine Grundlage für Migrationen und Freigabe-Logik.

### W2 — A11y-Nachweis und Anbindung der Audit-Werkzeuge

**Ziel.** Neue Verstöße in den drei Radiogruppen aus P0 2.4 fallen im Jest-Lauf auf, und die vorhandenen Werkzeuge bekommen eine Route und einen Ausgangswert statt einer Note ohne Folge.

**Schritte.**

1. `jest-axe` als devDependency, `package.json:5-18` — neues Skript `test:a11y`, das Jest auf die drei neuen Dateien startet; kein Browser, kein Dev-Server, kein Netz. Warum: `scripts/audit/check-ux.sh:13` startet Lighthouse nur bei erreichbarem `localhost:3000`, und `:22` lädt Lighthouse zur Laufzeit aus dem Netz; für einen CI-Lauf ist das untauglich, während jest-axe dieselben Regeln im DOM prüft.
2. `src/components/chat/input/InlineModeSwitch.a11y.test.tsx` (neu) — rendert die Radiogruppe (`src/components/chat/input/InlineModeSwitch.tsx:97`, `:104-106`) und prüft per `axe`, dass Rolle, Label und `tabIndex` vollständig sind. Die Datei importiert nur React, `useLanguage`, `cn` und `AsciiSignature` (`:1-7`) und braucht keinen Paket-Stub.
3. `src/components/chat/input/ImageParamOptions.a11y.test.tsx` (neu) — dieselbe Prüfung für beide Radiogruppen, Seitenverhältnis (`ImageParamOptions.tsx:92`, `:99-101`) und Dauer (`:119`, `:126-128`); Importe laut `:3-8` ebenfalls stubfrei.
4. `src/components/chat/input/ResearchDepthBadges.a11y.test.tsx` (neu) — Prüfung für die Radiogruppe der Recherchetiefe (`ResearchDepthBadges.tsx:48`, `:55-57`); braucht den im Repo üblichen `lucide-react`-Stub (`src/app/create/create.e2e.test.tsx:10-16`).
5. Baseline festhalten: Liste der heute gefundenen Verstöße in `docs/a11y-baseline.md` mit Datum und Komponente. Die Schwelle lautet danach: kein neuer Verstoß in den drei Dateien. Warum: der Audit nennt die Radiogruppen als zusammenhängende Gruppe; eine Baseline macht den Fortschritt sichtbar, ohne bestehende Befunde zu verstecken.
6. `scripts/audit/check-ux.sh:23` — Routenliste auf `/`, `/unified` und `/create` erweitern, die Note aus `:35-44` in eine Variable ziehen, Schalter `--strict` ergänzen, der bei `MIN_SCORE < 70` mit Exit-Code 1 endet; ohne Schalter bleibt alles wie heute. Warum: der Lauf endet heute nach `:59-65` immer mit Exit 0, darauf kann kein Werkzeug reagieren. Die Regelkonfiguration in `eslint.config.mjs` gehört zu Strang B und bleibt hier unangetastet.

**Dauer.** 3 Halbtage.

**Abnahmekriterium.** Ein Pull Request, der in einer der drei Radiogruppen das `aria-label` entfernt, färbt `test:a11y` rot, und `bash scripts/audit/check-ux.sh` nennt drei Routen und endet ohne `--strict` weiterhin mit 0.

**Einfacher gesagt.** Statt einer Punktzahl von außen bekommt das Repo eine Prüfung, die bei jedem Testlauf im DOM nachsieht und neue Lücken sofort meldet.

**Warum.** Lighthouse misst eine Momentaufnahme mit Browser und Netz; die Radiogruppen aus dem Audit sind reine DOM-Verträge, die ein Test in Millisekunden prüft.

### W3 — Pflichtprüfungen und sichtbare Änderungen

**Ziel.** `typecheck` und `test` werden Pflicht vor dem Merge; Build und eine harte Lighthouse-Schwelle kommen hinzu, sobald die Laufzeiten gemessen sind.

**Schritte.**

1. Branch-Protection im GitHub-Repo — `typecheck` und `test` als erforderliche Prüfungen eintragen, `lint` als erforderlich erst nach der Messung aus W1. Warum: ein grüner Lauf ohne Folge ändert nichts am Merge-Verhalten. Diese Entscheidung ist eine Einbahnstraße, die Check-Namen werden nach außen sichtbar.
2. `.github/workflows/ci.yml` — vierter Job `build` mit `npm run build` (`package.json:7`), ausgelöst auf `main` nach dem Merge und wöchentlich per Cron, zunächst berichtend. Warum: `next build` findet Fehler, die `tsc --noEmit` nicht sieht, etwa in Route-Segmenten und Server-Code; die Laufzeit ist ungemessen und darf die Pflichtprüfung nicht in die Länge ziehen.
3. `package.json:11` und `ci.yml` — `test:a11y` wird Teil von `npm run test` und damit rot bei neuen Verstößen. Warum: eine Prüfung, die man getrennt startet, wird übersehen.
4. `scripts/audit/audit.sh:144-149` — den UX-Bericht in die Gesamtbewertung aufnehmen, nachdem rund dreißig Läufe eine stabile Note zeigen; danach `--strict` im lokalen 08:00-Lauf (`scripts/audit/com.heyhihosted.audit.plist`) aktivieren. Warum: eine harte Schwelle auf einer schwankenden Messung erzeugt Fehlalarme und wird nach kurzer Zeit abgeschaltet.

**Dauer.** 1,5 Halbtage.

**Abnahmekriterium.** Ein Push mit einem Typfehler kann ohne grünen `typecheck` nicht gemergt werden, und der Build-Job läuft berichtend, ohne die Pflichtprüfung zu blockieren.

**Einfacher gesagt.** Aus dem Beobachten wird eine Bedingung für den Merge, und alles, was langsam oder unruhig misst, bleibt zunächst Beobachtung.

**Warum.** Pflichtprüfungen kosten Nerven, wenn sie flackern; erst die Messung, dann die Schwelle.

## Realitätscheck

### Berührte Verträge und Haken, namentlich

- `jest.config.ts:15` (`setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`) gilt für alle 124 Testdateien (121 unter `src/`, dazu `next.config.test.ts` und zwei unter `scripts/audit/`). Der neue Helfer antwortet standardmäßig wie der heutige Mock, deshalb ändert sich für bestehende Tests nichts.
- `(window.matchMedia as jest.Mock)` in `src/app/create/PlaygroundShell.test.tsx:132` und `:244`: der Mock bleibt eine `jest.fn()` pro Query. Die beiden Tests überschreiben ihn weiterhin mit eigenen Implementierungen, der Helfer schreibt nur den Ausgangszustand.
- `src/hooks/useMediaQuery.ts:5` und `:17`: der Snapshot liest beim Rendern, deshalb muss der Helfer vor dem Rendern gesetzt sein. `src/hooks/useMediaQuery.test.tsx` baut einen eigenen Mock und bleibt unberührt.
- `src/components/ascii/ascii.test.tsx` setzt `window.matchMedia` per `Object.defineProperty`; der Helfer verwendet `jest.fn().mockImplementation` und kollidiert damit nicht.
- `mockComposeToolState` in `src/app/unified/page.test.tsx:9-23` ist der Formvertrag des Rückgabeobjekts (`src/hooks/useComposeMusicState.ts:177`). Der neue Test prüft dieselben Keys; eine Umbenennung bricht zuerst den Test, danach die Seite.
- `src/lib/services/database.ts:77`: der Modulimport öffnet die Datenbank. Neue Tests laden `fake-indexeddb/auto` vorher; ohne diese Reihenfolge scheitert der Test mit `indexedDB is not defined`. Für alle anderen Testdateien bleibt das Modul gemockt wie bisher, etwa in `src/app/create/PlaygroundShell.test.tsx:66` und `src/lib/services/output-service.test.ts:4`.
- `src/lib/services/database.ts:113-119`: `deleteConversation` löscht Nachrichten und Assets. Der Test hält dieses Verhalten fest, weil es den Kern von P0 2.2 beschreibt.
- `src/hooks/useAssetUrl.ts:79` und `:99`: Freigabe beim Unmount und beim manuellen Aktualisieren. Der Test prüft Aufrufzahlen von `BlobManager.createURL` und `BlobManager.releaseURL`; die Vorgehensweise im Repo zeigt `src/lib/blob-manager.test.ts:1-28`.
- `src/hooks/useComposeMusicState.ts:109` (`}).catch(() => {})`): ein Fehler aus `OutputService.saveGeneratedAsset` erzeugt heute keinen Hinweis an den Nutzer. Der Test hält diesen Ist-Zustand fest; die Entscheidung darüber fällt in Strang A.
- `scripts/audit/check-build.sh:24` und `:33`: Lint-Fehler erscheinen als ⚠️ und fließen so in `BUILD_LINT_STATUS` ein. Solange das gilt, darf `lint` in CI nicht Pflicht sein.
- `scripts/audit/check-ux.sh:59-65`: der Ausgabeblock ist die letzte Anweisung, der Exit-Code stammt vom `cat`. Der Umbau mit `--strict` lässt den Standardpfad unverändert, damit der LaunchAgent `com.heyhihosted.audit` weiterläuft.
- `.github/workflows/registry-check.yml:8-10`: der bestehende Wochenlauf bleibt unverändert; `ci.yml` ergänzt ihn.
- `package.json:2` und `package-lock.json:2`: beide führen `name: nextn`. `npm ci` in CI setzt diese Übereinstimmung voraus.

### Was ist die einfachere Variante?

Ein einzelner CI-Job mit `npm ci`, danach `npm run typecheck`, `npm run lint` und `npm run test` hintereinander. Weniger YAML, ein Cache, eine Statuszeile. Der Preis ist die Wanduhr, weil sich die drei Laufzeiten addieren; bei einem kleinen Repo ist das die bessere Wahl. Bei 121 Testdateien unter `src/` bleibt es bei drei Jobs.

Zweitens: das A11y-Gate zunächst auf die drei Komponenten aus P0 2.4 begrenzen, statt eine Route in einem echten Browser zu rendern. Der Ausbau auf weitere Komponenten folgt, wenn die Baseline steht.

### Welche Entscheidung ist eine Einbahnstraße?

Die Branch-Protection. Sobald `typecheck` und `test` Pflicht sind, hängt jeder Merge an einem Lauf, und die Check-Namen werden nach außen sichtbar; eine Umbenennung erfordert einen Eingriff in den Repo-Einstellungen, den nur Berechtigte vornehmen können. Deshalb steht sie in W3 und erst nach zwei Wochen grüner Läufe. Zweitens die Lighthouse-Schwelle: eine harte Grenze auf einer schwankenden Note wird nach den ersten Fehlalarmen dauerhaft abgeschaltet.

### Wo lauert Verschlimmbesserung?

- `npm run lint` ist `eslint .` (`package.json:9`) und läuft über das gesamte Repo einschließlich `scripts/`. Ob das heute fehlerfrei ist, hat niemand gemessen; `scripts/audit/check-build.sh:24` meldet Fehler nur als Warnung. Die Schwelle kommt nach einer Messung, nicht davor.
- `eslint.config.mjs` und die `jsx-a11y`-Regeln gehören zu Strang B. Zwei Stränge an derselben Datei erzeugen bei jedem Rebase einen Konflikt.
- Eine pauschale Antwort `matches: true` im Mock schaltet `src/app/create/PlaygroundShell.tsx:175` und `src/components/page/LandingView.tsx:36-37` um und bricht bestehende Tests.
- `fake-indexeddb` in `jest.setup.ts` würde Dexie in allen 124 Testdateien öffnen, jeden Lauf verlangsamen und Fehler in Modulen verdecken, die mit Datenbank nichts zu tun haben. Der Import gehört in die Testdateien, die wirklich eine Datenbank brauchen.
- Der `--strict`-Modus von `check-ux.sh` in CI: das Skript startet Lighthouse per `npx` (`scripts/audit/check-ux.sh:22`) und braucht Chrome plus Dev-Server; das wäre eine wöchentliche Fehlerquelle ohne Erkenntnis für die DOM-Verträge des Audits.

### Wie lange darf der CI-Lauf dauern?

Marke: **sechs Minuten** pro Job, harte Obergrenze **zehn Minuten**. Ein Lauf, der regelmäßig länger braucht, wird nicht mehr abgewartet, sondern später oder gar nicht gelesen; ab diesem Punkt kostet er mehr, als er verhindert. Erwartung am aktuellen Bestand: `test` drei bis sechs Minuten (124 Dateien, knapp 16.500 Testzeilen über `src/`, jsdom und SWC-Transformation dominieren die Zeit), `typecheck` ein bis zwei Minuten, `lint` ein bis zwei Minuten. Mit drei parallelen Jobs bleibt die Wanduhr bei der längsten Einzelzeit und damit unter der Marke. Nach dem ersten echten Lauf wird die gemessene Dauer hier fortgeschrieben; erst danach wird entschieden, ob `build` in den Pflichtlauf kommt.

### Was blockiert, was berichtet?

Blockierend ab dem ersten Tag: `npm run typecheck` und `npm run test`. Beide laufen deterministisch, ohne Netz und ohne Zugangsdaten; die Testdateien setzen `fetch` und Schlüssel selbst, etwa `src/lib/pruna/client.test.ts:4-15` und `src/lib/resolve-pruna-key.test.ts:4-11`. Damit greifen in CI auch die stillen Rückfälle auf Betreiberverhalten nicht, die `src/lib/resolve-pollen-key.ts:13-15` und `src/lib/resolve-pruna-key.ts:5` bei fehlendem Schlüssel erlauben.

Blockierend nach Messung: `npm run lint` mit Fehlern; Warnungen blockieren nie.

Berichtend: `node scripts/check-model-registry.mjs` im bestehenden Wochenlauf, `bash scripts/audit/check-ux.sh` ohne `--strict`, `bash scripts/audit/check-doc-drift.sh`, `check-deps.sh`, `check-security.sh` und der Build-Job aus W3.

Nicht im Pflichtlauf: `npm run build`. `next build` braucht Server-Kompilierung und Routenanalyse; die Typen deckt `tsc --noEmit` ab, alles Weitere am Build ist Laufzeitverhalten, das nicht bei jedem Push gemessen werden muss.

### Welche Tests lohnen sich nicht?

- `src/lib/services/__tests__/chat-smoke.test.ts:9-11` (`expect(DatabaseService).toBeDefined()`) beweist, dass ein Modul importierbar ist. Der Test wird durch die neuen Verhaltenstests ersetzt.
- Ein Test für `throw new Error('No mediaUrl in response')` in `src/lib/services/asset-fallback-service.ts:113`: der Zweig ist unerreichbar, weil `resolvePollinationsMediaUrl` (`src/lib/upload/pollinations-media.ts:76-81`) immer ein Ergebnis liefert und nie wirft. Ein solcher Test prüft toten Code; die Lücke gehört als Befund in den Plan von Strang A.
- Tests, die die Store-Zeichenketten aus `src/lib/services/database.ts:61-66` und `:68-73` in derselben Form wiederholen. Prüfenswert ist die Migration mit echten Daten.
- Tests, die `BlobManager.cleanupOld` als wirksam beschreiben: `src/lib/blob-manager.test.ts:70-80` hält bereits fest, dass die Methode nichts freigibt. Eine zweite Zusicherung derselben Aussage hilft niemandem.
- Tests, die `useMediaQuery` über `addEventListener`-Spione nachbauen. Der Zustand ist über `matches` steuerbar; der Nachbau bindet den Test an den inneren Aufbau.
- Snapshot-Tests auf gerenderte Komponenten mit Tailwind-Klassen. Bei 121 bestehenden Testdateien ohne einen einzigen Snapshot wäre das der Einstieg in eine Pflegepflicht, die bei jeder Klassennamen-Änderung neu erzeugt werden muss.

## Verifikation

Kommandos, lokal und seriell ausgeführt:

```
npm run typecheck
npm run lint
npm run test
npx jest src/lib/services/__tests__/database.test.ts
npx jest src/lib/services/__tests__/asset-fallback-service.test.ts
npx jest src/hooks/useAssetUrl.test.tsx
npx jest src/hooks/useChatPersistence.test.tsx
npx jest src/hooks/useComposeMusicState.test.tsx
npx jest src/components/chat/input/InlineModeSwitch.a11y.test.tsx
npx jest src/components/chat/input/ImageParamOptions.a11y.test.tsx
npx jest src/components/chat/input/ResearchDepthBadges.a11y.test.tsx
```

Nach dem Push: `gh run list --workflow=ci.yml --limit 5`, bei Rot `gh run view --log-failed`; nach W3 `gh pr checks <nummer>`.

Neue Testdateien und ihr Prüfinhalt:

- `src/lib/services/__tests__/database.test.ts` — Migration von Schema 3 auf 4 mit erhaltenen Datensätzen und nutzbarem `starred`-Index, Löschtransaktion für Nachrichten und Assets, Überschreib-Semantik von `saveAsset`.
- `src/lib/services/__tests__/asset-fallback-service.test.ts` — Reihenfolge Blob → remote → storageKey, `needsCleanup` nur auf dem Blob-Pfad, Cache-Bedingung gegen `SMALL_BLOB_SKIP_BYTES`.
- `src/hooks/useAssetUrl.test.tsx` — eine Blob-URL pro Auflösung, Freigabe beim Unmount und beim Wechsel der `assetId`, Fehlerzustand ohne Absturz.
- `src/hooks/useChatPersistence.test.tsx` — Laden, Speichern, Metadaten-Update und die Rückgabe `isInitialLoadComplete`.
- `src/hooks/useComposeMusicState.test.tsx` — Doppelaufruf von `generateMusic`, stiller Fehlerpfad beim Speichern des Assets, Form der Rückgabe.
- `src/components/chat/input/InlineModeSwitch.a11y.test.tsx`, `.../ImageParamOptions.a11y.test.tsx`, `.../ResearchDepthBadges.a11y.test.tsx` — keine `axe`-Verstöße in den Radiogruppen.

Manuelle Schritte:

- `bash scripts/audit/check-ux.sh` einmal ohne Dev-Server (Erwartung: `UX_STATUS=⏭️`, Exit 0) und einmal mit laufendem Dev-Server (Erwartung: drei Routen, ohne `--strict` weiterhin Exit 0).
- `npm run audit:run` und den Block `UX_STATUS`/`UX_A11Y` mit dem Wert vor der Änderung vergleichen (`scripts/audit/audit.sh:144-149`).
- Ein Test-Pull-Request mit entferntem `aria-label` in `src/components/chat/input/InlineModeSwitch.tsx:97` muss `test:a11y` rot färben.
- Ein Test-Pull-Request mit einem absichtlichen Typfehler muss `typecheck` rot färben und nach W3 den Merge blockieren.

## Nicht in diesem Plan

- Die Regelkonfiguration in `eslint.config.mjs` einschließlich `jsx-a11y` (Strang B). D liefert den Lauf und die Schwelle.
- Änderungen an `src/lib/services/database.ts`, `src/lib/services/asset-fallback-service.ts`, `src/hooks/useAssetUrl.ts`, `src/hooks/useChatPersistence.ts` und `src/hooks/useComposeMusicState.ts` (Strang A). D schreibt Tests, die den heutigen Stand festhalten.
- Das `code`-Feld, das Idempotenz-Merkmal und die Antwortverträge der API-Routen (Strang C). D liefert nur das Muster für Routen-Tests.
- Eine Dexie-Tabelle für Läufe, das Rezeptformat, Browser-Automatisierung und Deployment.
- Änderungen an `docs/DEEP_AUDIT_2026-09-10.md` und `AGENTS.md`.

## Offene Fragen an den Nutzer

1. Ist das GitHub-Repo unter `loopmaster303/heyhihosted` öffentlich oder privat? Bei einem privaten Repo laufen die Läufe gegen das monatliche Minutenbudget des Kontos; davon hängt ab, ob drei parallele Jobs oder ein einzelner Job die richtige Form ist.
2. Darf `lint` von Anfang an blockieren, oder soll er bis zur ersten Messung berichten? `npm run lint` läuft über das gesamte Repo (`package.json:9`), und `scripts/audit/check-build.sh:24` meldet Fehler heute nur als Warnung.
3. Darf `fake-indexeddb` als devDependency hinzukommen, oder sollen die Datenbank-Tests warten, bis Strang A das Schema ohnehin anfasst?
