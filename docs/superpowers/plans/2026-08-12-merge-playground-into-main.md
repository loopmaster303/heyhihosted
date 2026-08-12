# Merge-Plan: heyhihosted-playground nach heyhihosted (main)

**Datum:** 2026-08-12
**Branches:** `playground/redesign` (Worktree: `/Users/johnmeckel/heyhihosted-playground`) → `main`
**Autor:** Codex (Session 2026-08-12)
**Zielgruppe:** Frischer Coding-Agent — ausführbar ohne Rückfragen.

---

## 1. Ziel

- HeyHi main bleibt die Single App.
- Playground wird Route `/playground` in main, mit Sidebar-Link auf der Mainpage.
- Beide funktionstüchtig, alle Session-Fixes (Aspect Ratio, Safety-Filter, Generation-Status, Details) drin.
- **Kein Push, kein Deploy, keine neuen Features.** Nur Merge + Verifikation.

---

## 2. Ist-Zustand (verifiziert, Stand 2026-08-12)

| | heyhihosted (main) | heyhihosted-playground (Worktree) |
|---|---|---|
| HEAD | `b929e3e` | `226aa14` auf `playground/redesign` |
| Commits über main | – | 77 (Basis == main HEAD) |
| Working Tree | **26 modified + 27 untracked** | 3 modified (Safety/Aspect-Fixes) |

**Wichtig — 5 Kernfakten:**

1. Merge-Basis `b929e3e` == main HEAD → Branch ist sauberer Add-on, kein Commit-Divergenz.
2. Sidebar-Link (`/playground` in `AppSidebar.tsx`) ist im Branch **fertig gebaut**.
3. Main hat **keine** Playground-Route. Alles kommt mit dem Merge rein: 74 Dateien, +10.773 Zeilen.
4. Branch bringt **keine neuen Dependencies** (`package-lock.json` unverändert).
5. `playground/multimedia` und 3. Worktree `playground/multimedia-b` bleiben unangetastet (Rollback-Anker).

---

## 3. Was der main-WIP konkret enthält (für die Merge-Entscheidung)

Stand: 26 modified + 27 untracked auf `main`. Ohne dieses Wissen kann ein frischer Agent die Konflikte nicht richtig auflösen. Kurzbeschreibung je Gruppe:

| Gruppe | Dateien | Was sie tun |
|---|---|---|
| **Chat-Input-Redesign** | `ChatInput.tsx` (+578), `UploadBadges.tsx` (+135), `AttachmentPreviewRow.tsx` (neu), `UploadBadges.test.tsx` (neu), `ChatInput.test.tsx` (neu), `AttachmentPreviewRow.test.tsx` (neu), `UnifiedMobileDrawer.tsx` (+neu) | Mobile/Upload-Preview-Rework; neuer Attachment-Preview-Row, Badges |
| **Visualize-Logik** | `useUnifiedImageToolState.ts` (+46), `VisualizeInlineHeader.tsx` (+71), `InlineParamsContainer.tsx` (+52), `ComposeInlineHeader.tsx` (+23) | Duration-Default via `getDefaultDurationSeconds`, `shouldIncludeByopHidden`-Entitlements, BYOP-Sichtbarkeit |
| **Modell-Konfig** | `unified-image-models.ts` (+108), `unified-model-configs.ts` (−15), `model-invariants.test.ts` (+101) | `TemporalControl`-Typ + `temporalControl`-Feld; Duration aus Konfig entfernt (serverseitig) |
| **Pruna-Client** | `lib/pruna/client.ts` (+30), `client.test.ts` (+64) | Client-Fixes (zu verifizieren gegen Branch) |
| **Route / generate** | `route.ts` (+62), `route.test.ts` (+250) | Duration-Validierung (`temporalControl`), `provider === 'pruna'`-Erkennung |
| **Services** | `chat-service.ts` (+12), `chat-service.test.ts` (+60) | Nachrichten-Persistenz-Fix |
| **Doku** | 5 Pläne/Specs (untracked) | Param-Schema, VACE, Playground-Pläne |
| **Sonstiges** | `next-env.d.ts`, `next.config.ts`, `scripts/pruna-smoke-check.mjs`, `PersonalizationSidebarSection.tsx`, `unified-input.tsx`, `translations.ts` | Origins-Listen, Smoke-Check, Übersetzungen |

**Regel für alle Konflikte:** WIP = Chat/Upload/Visualize-Arbeit, Branch = Playground-Arbeit. Beide Seiten sind legitim — **nichts wegwerfen**. Bei echten Gegensätzen (z.B. `unified-model-configs.ts` Duration-Felder): WIP-Version behalten, weil sie die serverseitige Übersetzung bereits etabliert hat.

---

## 4. Konflikt-Overlap (12 Dateien) — Auflösung im Detail

| Datei | WIP (main) | Branch (playground) | Auflösung |
|---|---|---|---|
| `next.config.ts` | +18 Zeilen `allowedDevOrigins` (Cloud-Workstations) | +14 Zeilen (`allowedDevOrigins` Tailscale/LAN) | **Beide Listen vereinen** — alle Hostnamen behalten |
| `src/app/api/generate/route.ts` | `temporalControl`-Duration-Validierung, `prunaEligible = provider === 'pruna'` | Registry-Fallback, `findRegistryModel`, `fetchAndStoreRemoteMedia` (Auth-Fix) | **Beide behalten, händisch** — WIP-Block vor Branch-Block |
| `src/app/api/generate/route.test.ts` | +250 Testzeilen (Duration-Validierung) | +14 Testzeilen | Konsolidieren — keine Zeile löschen ohne Lauf |
| `src/config/pruna-models.ts` | `DISABLE_SAFETY_CHECKER`/`DISABLE_SAFETY_FILTER`-Konstanten, `endpoint`-Feld entfernt | Vollständige Param-Schemata, Safety-Flags pro Modell, `aspect_ratio`-Stripping (12×) | **Branch gewinnt** — WIP-Konstanten nur übernehmen wenn im Branch fehlend (prüfen: `npm test`) |
| `src/config/__tests__/pruna-models.test.ts` | +145 Testzeilen | +96 Testzeilen | Konsolidieren nach Code-Merge |
| `src/config/unified-image-models.ts` | `TemporalControl`, `temporalControl`, `ProviderEntitlements`, `getDefaultDurationSeconds` | Playground-Model-Ergänzungen, +44 | **Beide vereinen** — kein Wegwerfen |
| `src/config/translations.ts` | +22 Zeilen | +18 Zeilen (`playground.*`) | Beide vereinen |
| 5× Doku (Pläne/Specs) | untracked | im Branch committet | Branch-Version |

---

## 5. Durchführung (6 Phasen, mit Akzeptanzkriterien)

### Phase 0 — Pending Fixes committen (im Worktree)

Die 3 dirty Dateien (`next-env.d.ts`, `next.config.ts`, `src/config/pruna-models.ts`) gehören zum Merge-Content.

```bash
cd /Users/johnmeckel/heyhihosted-playground
npm run typecheck && npm test          # VOR Commit: muss grün sein
git add -A && git commit -m "fix(playground): upscale safety flag + UI aspect ratio wins over params bag"
```

**Fertig wenn:** `git status --porcelain` im Worktree leer, Typecheck 0 Fehler, Tests grün.

### Phase 1 — main-WIP auf Checkpoint-Branch sichern

```bash
cd /Users/johnmeckel/heyhihosted
git switch -c wip/aug12-chat-upload-visualize
git add -A && git commit -m "wip: chat/upload/visualize checkpoint vor Playground-Merge"
git switch main
```

**Fertig wenn:** `git log --oneline -1` zeigt den Commit, `git status --porcelain` leer.

### Phase 2 — Merge

```bash
git merge --no-ff playground/redesign     # sauberer Add-on
git merge wip/aug12-chat-upload-visualize # WIP zurück → Konflikte in Overlap-Dateien
```

Auflösung exakt in dieser Reihenfolge (Tabelle aus Abschnitt 4):

1. `src/config/pruna-models.ts` → Branch-Version
2. `src/app/api/generate/route.ts` → beide Hälften (WIP-Block Bearbeiter-lokal, siehe Tabelle)
3. `next.config.ts` → beide `allowedDevOrigins`-Listen
4. `src/config/unified-image-models.ts` + `translations.ts` → beide Diffs
5. Tests → konsolidieren nach Code-Merge
6. Doku → Branch-Version

**Fertig wenn:** `git status` sauber, `git log --oneline --graph -5` zeigt Merge-Commit mit beiden Eltern.

### Phase 3 — Sidebar & Navigation

- Desktop: Playground-Button existiert in `AppSidebar.tsx` (Zeile ~119). **Prüfen: mobile Nav hat ebenfalls Link?** Wenn nein → nachrüsten (gleiches Muster wie Desktop, `Sheet`/`MobileNav`).
- `translations.ts`: `playground.sidebarLink` vorhanden? Wenn nein → ergänzen (de/en).
- Root `/` und `/playground` im selben App-Layout, kein Provider-Wechsel.

**Fertig wenn:** Mobile-Nav zeigt Playground-Link, Übersetzungen da, beide Routen rendern.

### Phase 4 — Verifikation (strikt serial, 8GB MacBook)

Reihenfolge nicht überspringen — jeder Schritt baut auf dem vorherigen auf:

1. `npm run lint` → 0 Fehler
2. `npm run typecheck` → sauber
3. `npm test` → ≥ 493 Tests grün
4. `npm run build` → komplett durchlaufen
5. Dev-Server starten: `/` → 200, `/playground` → 200, **kein Hydration-Error** in Browser-Konsole
6. Smoke-Tests (manuell, mit Key aus localStorage):
   - Pollinations-Generation → Spinner während Laufzeit, Ergebnis, Details-Panel mit Download/Nochmal/Referenz
   - Pruna-Generation: mind. `p-image`, `qwen-image`, `wan-t2v`, `p-video` → Safety-Flags echt raus (Request in Network-Tab prüfen)
   - Fehlerfall → Failed-Card mit Retry sichtbar

**Fertig wenn:** alle 6 Schritte grün.

### Phase 5 — Abschluss

- Handoff in `docs/superpowers/handoffs/` aktualisieren (was gemergt, was offen)
- `playground/multimedia` + Worktree `multimedia-b` nicht anfassen
- **Kein Push, kein Deploy** — wartet auf explizites „go" vom User

**Fertig wenn:** Merge-Commit auf main, Arbeitsbaum sauber, Doku aktualisiert, keine offenen Fragen.

---

## 6. Fehler- und Rollback-Prozedur

| Situation | Aktion |
|---|---|
| Merge-Konflikt zu komplex, nicht sicher lösbar | `git merge --abort`, Zustand melden, **nicht** raten |
| Typecheck/Tests nach Merge rot | Fehler lokal fixen, nicht mergen |
| Dev-Server hängt (bekannt bei tailscale/cross-origin) | Logs prüfen, `allowedDevOrigins` ergänzen, neu starten |
| WIP auf Checkpoint verloren gegangen | `git checkout wip/aug12-chat-upload-visualize -- .` |
| Kompletter Reset nötig | `git reset --hard b929e3e` (nur mit expliziter Freigabe!) |

---

## 7. Nicht-Ziele (explizit draußen)

- Chat-Slim (Compose raus, Visualize auf 1-3 Modelle reduzieren)
- Neue Modelle, neue Provider, Design-Änderungen am Playground
- Push zu Remote, Deploy, PR-Erstellung

---

## 8. Beginn

Der Account/Ordner ist `/Users/johnmeckel/heyhihosted`. Der Worktree `/Users/johnmeckel/heyhihosted-playground` existiert bereits und zeigt auf `playground/redesign`. Erster Befehl: prüfen, dass ist-Zustand mit Abschnitt 2 übereinstimmt (`git status` in beiden Repos), dann Phase 0.
