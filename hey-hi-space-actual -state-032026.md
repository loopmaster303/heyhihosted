# hey.hi Space Actual State 03/2026

Verifiziert am 2026-03-13.

## Zielbild

hey.hi ist aktuell eine lokale, Pollinations-zentrierte AI-Workbench auf Basis von Next.js 16, TypeScript und Dexie. Der Produktkern ist nicht mehr in getrennten Oberflaechen verteilt, sondern in einer einheitlichen App-Shell zusammengezogen, die Landing und Chat als zwei Zustandsbilder derselben Anwendung behandelt.

## Aktueller Produktzustand

- Die App laeuft faktisch ueber eine Unified-Shell: `/` und `/chat` re-exporten beide auf die Unified-App, waehrend `landing` und `chat` intern in `src/app/unified/page.tsx` umgeschaltet werden.
- Sichtbare Modi laut aktuellem Audit-Baseline-Stand: `standard`, `visualize`, `compose`, `research`.
- Code-Mode existiert weiter, ist aber ein interner Response-Mode und kein eigener sichtbarer Produktmodus.
- Sichtbare Compose-Baseline ist aktuell `elevenmusic`.
- Sichtbare Bild-/Video-Modelle sind aktuell: `flux`, `zimage`, `gpt-image`, `imagen-4`, `grok-image`, `grok-video`.
- Mehrere Modell-IDs existieren weiterhin im Code, sind aber bewusst deaktiviert oder versteckt, damit die UI konservativ auf reale Verfuegbarkeit reagiert.

## Architektur

### 1. App-Shell und Zustandsgrenzen

- Der Page-Layer in `src/app/unified/page.tsx` orchestriert App-State, Landing-to-Chat-Handoff und Dialoge.
- Der eigentliche Chat-Kern lebt in `src/components/ChatProvider.tsx`.
- `useChatState()` aggregiert Persistence, UI-State, Media-State und Migration.
- Der Zuschnitt ist insgesamt sinnvoll: Shell oben, Provider in der Mitte, reine Hilfsmodule im `src/lib/chat`-Bereich unten.

Kurz gesagt:
Die Codebase wirkt nicht wie unkontrolliertes Spaghetti, sondern wie eine bereits entwirrte Architektur, die noch aktive Konsolidierung betreibt.

### 2. Persistenz

- Datenhaltung ist local-first ueber Dexie.
- Es gibt vier Kernbereiche in IndexedDB: `conversations`, `messages`, `memories`, `assets`.
- Alte Chat-Historie aus LocalStorage wird beim Start weiterhin ueber eine Migration in IndexedDB ueberfuehrt.
- UI-Praeferenzen und einzelne Default-Settings liegen weiterhin in LocalStorage.

Warum das wichtig ist:
Die Produktidentitaet "deine Daten bleiben lokal" ist nicht nur Doku, sondern technisch wirklich im Kern umgesetzt.

### 3. Chat-Pipeline

- Der Chat-Sendepfad ist modularisiert ueber `chat-capability-resolution`, `chat-context-window`, `chat-prompt-builder`, `chat-send-coordinator` und `chat-send-orchestrator`.
- Das ist ein gutes Zeichen: Request-Aufbereitung, Mode-Entscheidung, Kontextfenster und Finalisierung sind nicht mehr als ein monolithischer Handler gebaut.
- Chat-Antworten laufen aktuell JSON-first, nicht als echtes Server-Streaming.
- Der Client simuliert Streaming-Kompatibilitaet fuer die UI, obwohl serverseitig ein finaler JSON-Block geliefert wird.

Einfach erklaert:
Die App fuehlt sich wie Streaming an, technisch ist es im Moment aber eher ein sauber verpackter Non-Streaming-Flow.

### 4. Bild-, Video- und Asset-Pipeline

- Generierung laeuft ueber Pollinations-nahe API-Routen wie `/api/generate`, `/api/compose`, `/api/media/upload`, `/api/media/ingest`.
- Referenzbilder und Uploads werden ueber die aktuelle Upload-Pipeline abgewickelt.
- Generierte Assets werden ueber `GalleryService.saveGeneratedAsset()` in Media Storage ingestet und lokal als Asset-Metadaten gespeichert.
- `AssetFallbackService` loest Assets ueber eine klare Fallback-Kette auf:
  `blob -> remoteUrl -> storageKey/media -> background cache`.
- Offline-/Fallback-Denken ist also real im Code angelegt, nicht nur konzeptionell.

## Routing, Search und Research

- Die Search-/Research-Entscheidung wurde sichtbar bereinigt.
- `resolveChatSearchStrategy()` unterscheidet jetzt klar zwischen:
  - `direct`
  - `delegated-live-search`
  - `delegated-deep-research`
- `SmartRouter` erkennt Suchintentionen ueber Trigger fuer Zeitbezug, News, Empfehlungen, Events, Search-/Research-Formulierungen in Deutsch und Englisch.
- Wichtig: Die aktuelle Route waehlt nun einen Request-Pfad, statt Search-Routing und Web-Context doppelt hintereinander zu machen.

Warum das gut ist:
Das reduziert Latenz, Kosten und Fehlerflaeche deutlich gegenueber einem Doppel-Call-Ansatz.

## Modell-Governance

- Die Modell-Governance ist inzwischen deutlich konservativer.
- Sichtbarkeit wird zentral ueber Konfiguration und `enabled`-Flags gesteuert.
- Alte oder instabile Modelle sind oft noch im Registry-Code vorhanden, aber nicht mehr sichtbar.
- `useUnifiedImageToolState()` normalisiert Legacy-Modell-IDs und faengt Drift aus alten Persistenzwerten ab.

Das ist die richtige Richtung, weil:
Produktwahrheit sonst sehr schnell von echter Upstream-Verfuegbarkeit entkoppelt.

## Security-Stand

### Positiv

- Remote-Media-Fetches sind gehaertet.
- Es gibt jetzt eine zentrale Remote-Media-Policy mit Host-Allowlist und Schutz gegen private/localhost-Ziele.
- `/api/media/ingest` validiert `sourceUrl` frueh, bevor die Route irgendetwas von beliebigen Hosts herunterlaedt.

### Rest-Risiken

- BYOP-Key-Handling bleibt funktional, aber XSS-sensitiv.
- Pollinations-Keys werden clientseitig in LocalStorage gehalten.
- Der Browser reicht sie ueber `X-Pollen-Key` an Serverrouten weiter.
- Das ist fuer das aktuelle Produktmodell akzeptabel, aber nicht "gehardet".

Kurz gesagt:
Die grobe SSRF-/Remote-Fetch-Kante wurde entschraerft. Die groessere verbleibende Security-Baustelle ist jetzt Key-Storage und Header-Forwarding.

## Doku- und Wahrheitslage

- Es gibt einen frischen Rebaseline- und Audit-Stand vom 2026-03-13.
- Der neue Audit dokumentiert Baseline, Findings und Prioritaeten deutlich ehrlicher als aeltere, gemischte Narrative.
- Gleichzeitig existieren noch einzelne Drift-Spuren:
  - Legacy-Namen wie `s3-upload`
  - Doku, die nicht ueberall exakt denselben aktuellen Stand abbildet
  - mindestens ein ueberzaehlig wirkendes Legacy-Dependency (`replicate`) in `package.json`

Das bedeutet:
Die Richtung stimmt, aber Naming und Dokumentationswahrheit muessen weiter konsolidiert werden, damit kuenftige Arbeit nicht auf Halbwahrheiten aufsetzt.

## Repo-Gesundheit

Zum Zeitpunkt dieser Analyse:

- `npm run typecheck`: gruen
- `npm run build`: gruen
- `jest --runInBand`: gruen
- Teststand: 26 Test-Suites, 87 Tests, alles erfolgreich

Arbeitsbaum:

- Branch: `main`
- Stark in Bewegung
- 37 geaenderte Dateien
- 14 untracked Dateien

Warum das wichtig ist:
Die Codebase ist technisch gesund, aber in einer aktiven Umbauphase. Aussagen ueber "den aktuellen Zustand" muessen deshalb immer mitdenken, dass lokale Rebaseline-/Audit-Arbeit parallel schon laeuft.

## Realistisches Gesamturteil

hey.hi ist aktuell keine chaotische Bastel-App, sondern eine schon recht klar strukturierte Local-First-AI-Oberflaeche mit Pollinations als hartem Runtime-Rueckgrat. Der produktive Kern ist testbar, buildbar und architektonisch nachvollziehbar.

Die grossen offenen Themen liegen derzeit weniger in "funktioniert es ueberhaupt?" und mehr in diesen drei Bereichen:

1. Produktwahrheit dauerhaft zentral halten
2. Security bei BYOP-Key-Handling weiter haerten
3. Legacy-Namen, alte Narrative und interne Drift weiter abbauen

## In einem einfachen Satz

Der aktuelle State ist: funktional gesund, architektonisch brauchbar, lokal-first konsequent, Pollinations-fokussiert, aber noch mitten in einer ehrlichen Konsolidierungsphase.
