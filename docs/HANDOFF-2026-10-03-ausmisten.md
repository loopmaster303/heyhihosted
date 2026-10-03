# HANDOFF 2026-10-03 — Ausmisten, und wo alles steht

**Für:** den nächsten lokalen Agenten. **Stand:** `main` nach dem Merge von PR #18.

> Fortsetzung: [Konsolidierung](HANDOFF-2026-10-03-konsolidierung.md). Die unten genannten offenen Branch-Stände sind dort zusammengeführt.

## In drei Sätzen

PR #18 hat toten Code, zwei Radix-Pakete, drei API-Routen ohne Aufrufer, Repo-Ballast und rund
85 abgeschlossene Doku-Dateien gelöscht und einen Test repariert, der auf `main` rot war. Parallel
liegen zwei weitere Stände, die noch nicht auf `main` sind: PR #17 (P-Video 2 / 2 Pro) und der
Branch `claude/pensive-ramanujan-j2l7in` mit der UI-Variante „Eine Fläche". Die wichtigste
offene Entscheidung ist, wie diese Variante nach `main` kommt.

## Was PR #18 gemacht hat

- **Code:** 8 unbenutzte Dateien (`InlineChatImage`, `VisualCorner`, `GrainOverlay`,
  `ModeButtonOverlay`, `Skeleton`, `ui/label`, `ui/scroll-area`, `scripts/pruna-smoke-check.mjs`),
  10 ungenutzte Modell-Icons, tote Funktionen ohne Aufrufer (`getModelsByKind`, `getFreeModels`,
  `getStandardModels`, `getAdvancedModels`, `getVisualizeModelGroupsForProvider`,
  `isKnownPollinationsVisualModelId`, `httpsFetchBinaryPost`, `precacheAssets`, `requireEnv`,
  `isApiError`, `ContextualPopup`, `AsciiWave`, `AsciiMarker` u. a.).
- **Pakete:** `@radix-ui/react-label`, `@radix-ui/react-scroll-area` raus; `eslint` explizit als
  devDependency. `ts-node` bleibt (Jest braucht es für `jest.config.ts`).
- **Routen:** `/api/pollen/polly`, `/api/pollen/polly/models`, `/api/proxy-image`.
- **Ballast:** `.eslintrc.json`, `.idx/`, `apphosting.yaml`, `conductor/`, `.sisyphus/`, `tmp/`,
  Root-`HANDOFF.md`, `scripts/audit/` mit allen `audit:*`-Skripten, `setup:pollicode`.
  Die wöchentliche Registry-Action (`scripts/check-model-registry.mjs`) bleibt.
- **Doku:** Phasenpläne 0–7 und ihre Handoffs, Alt-Audits, `docs/archive|plans|handoffs|superpowers|design`.
  Gelöscht, nicht archiviert; alles liegt in der Git-Historie (`docs/README.md` sagt, wie man es
  zurückholt). Behalten, weil `LAUNCH_CRITERIA.md` darauf zeigt: `PLAN-phase-6-create-telefon.md`,
  `streaming-status.md`.
- **Fix:** `/api/generate` weist ein abgeschaltetes Pruna-Modell (vace) jetzt mit 400 ab, bevor es
  in den Registry-Zweig fällt. Vorher war `route.test.ts` › „rejects the disabled vace model" auf
  `main` rot (500 statt 400).

**Gate nach dem Merge von `main`:** `lint` 0 Fehler (11 a11y-Warnungen, beabsichtigt seit
`045cb82`), `tsc` 0, **1054 Tests in 128 Suiten grün**, `build` grün.

## Offene Stände — zuerst lesen

### 1. PR #17 — P-Video 2 / 2 Pro (Draft)

Branch `codex/p-video-2-pro-create`. Das ist E0 aus dem Entschlackungsplan („Playground Meck
sichern"). Er legt einen neuen Plan unter `docs/superpowers/plans/` an. Diesen Ordner gibt es auf
`main` nicht mehr; beim Merge die Datei flach nach `docs/` legen (`PLAN-p-video-2-pro-2026-09-23.md`).
Nach #18 braucht #17 einen Merge von `main`; Konflikte sind vor allem in `docs/` und
`unified-image-models.ts` zu erwarten.

### 2. Branch `claude/pensive-ramanujan-j2l7in` — die UI-Variante „Eine Fläche"

Das ist die UI-Überarbeitung vom 2026-10-01. Sie ist **gebaut, nicht nur geplant**, liegt aber
nur auf dem Branch, ohne PR. Basis `a61feed`; sie kennt weder die 28 Commits, die heute auf `main`
kamen, noch #17 oder #18.

- Plan auf dem Branch: `docs/PLAN-entschlackung-2026-10-01.md` (Teil A E0–E8 Entschlackung,
  Teil B E9–E15 eine Hülle für Chat und Create).
- Stand und Fallstricke: `docs/HANDOFF-2026-10-01-eine-flaeche.md` auf dem Branch.
- Kern: Chat und Create als zwei Räume in einer Hülle (`AppShell`, Routengruppe `(app)`),
  Verlauf/Galerie/Einstellungen als Sheets (vaul), Visualize und Compose aus dem Chat raus,
  `PlaygroundShell.tsx` nach `src/components/playground/` umgezogen.
- **E7** dort: `https-post.ts` per `fetch` statt Kindprozess, `public/scripts/auth-proxy.js`
  gelöscht. Das ist der größte offene Cloud-Gewinn (siehe unten) und auf `main` noch nicht drin.
- **Überschneidung mit #18:** E1 (Ballast) und E2 (Doku) machen fast dasselbe. Unterschied: die
  Variante **archiviert** Doku unter `docs/archive/`, #18 **löscht**. Beim Zusammenführen gilt
  `main`: gelöscht ist gelöscht; ihre Umbenennungen nach `docs/archive/` entfallen. Ihre
  geschrumpften Logos (12 MB → 124 KB) übernehmen.
- Ungeprüft laut eigenem Handoff: echte Erzeugung gegen Pollinations/Pruna, echtes Telefon, axe
  über die ganze Seite, Vercel-Vorschau.

**Empfohlene Reihenfolge:** erst #17 auf `main`, dann die Variante per Merge von `main` auf ihren
Stand bringen (nicht rebasen) und als PR öffnen. Ihr Handoff warnt selbst: der Video-2-Pro-Stand
trifft dort auf den Umzug von `PlaygroundShell.tsx` und muss von Hand zusammengeführt werden.
Ob die Variante überhaupt nach `main` soll, ist **Johns Entscheidung**, sie ist nicht gefallen.

### 3. Pläne vom 2026-09-10/11 auf `main`

`DEEP_AUDIT_2026-09-10.md` und die Pläne A–D plus Modell- und LLM-Kuration. Teilweise
umgesetzt (a11y, Fehlervertrag, Ressourcen-Store). Vor neuer Arbeit prüfen, was davon die
Variante schon anders gelöst hat, damit nichts doppelt gebaut wird.

## Offene Cloud-Punkte (aus dem Befund `ausmisten/befund-2026-10-03.md`)

1. **Kindprozess pro Chat-Request** und dadurch das ganze Repo in jeder Server-Funktion
   (`https-post.ts` baut den Pfad dynamisch). Gelöst auf der Variante (E7), nicht auf `main`.
2. **Syntax-Highlighter** lädt ~945 KB auf der Startseite (`MarkdownRenderer.tsx` importiert den
   vollen `Prism`). Abhilfe: `PrismLight` oder `next/dynamic`.
3. **Modell-Icons** 1024 px für 14–24 px Anzeige, ~10 MB. Gelöst auf der Variante.
4. **`vercel.json`** gibt allen API-Routen 300 s; seit dem 202-Polling brauchen das nur noch
   `compose`, `sound`, ggf. `generate`.
5. **Rate-Limit** zählt im Speicher pro Instanz, auf Vercel praktisch wirkungslos. Produktentscheidung.
6. **Kein CI-Gate** für PRs (Plan D vom 2026-09-10 beschreibt es).

## Fallstricke

- `knip` meldet `ts-node`, `public/scripts/auth-proxy.js` und `eslint-config-next` als unbenutzt.
  Alle drei werden gebraucht (Jest-Config, Laufzeit-Spawn, `eslint.config.mjs`). Auth-Proxy fällt
  erst mit E7 weg.
- Neue Doku flach in `docs/` mit Präfix (`PLAN-`, `HANDOFF-`), keine Unterordner.
- Das Repo hat keine PR-CI. Vor jedem Push lokal `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
