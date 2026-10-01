# Handoff — Playground in main gemergt

**Datum:** 2026-08-12
**Branch:** `main` in `/Users/johnmeckel/heyhihosted`
**Status:** Merge abgeschlossen, gepusht, live auf `chat.hey-hi.cloud/playground`.

---

## Was passiert ist

- `playground/redesign` (77 Commits) in `main` gemergt.
- WIP-Checkpoint `wip/aug12-chat-upload-visualize` (Chat/Upload/Visualize-WIP) ebenfalls gemergt.
- Merge-Konflikte in 12 Dateien aufgelöst.

## Finale Merge-Commits

1. `0e53503` — `merge: integrate playground/redesign + WIP checkpoint into main`
2. `efe997f` — `fix(merge): pruna model payloads after merge`

## Nach dem Merge gefixt

- Doppelte `disable_safety_checker` Keys in `wan-t2v`/`wan-i2v` entfernt.
- Verwaiste `endpoint: 'default'` Felder in `p-image-ideogram`/`p-flux-klein` entfernt (Interface hat `endpoint` nicht mehr).
- Duplizierte `allowedDevOrigins`-Blöcke in `next.config.ts` vereint.
- `route.test.ts`: Fallback-Tests korrigiert — Pruna-Fehler werden zurückgegeben, nicht in Pollinations-Fallbacks umgewandelt.
- `wan-t2v`: verlorenes `num_frames` wiederhergestellt.
- `wan-i2v`: `aspect_ratio` entfernt (Wan-I2V-API kennt das Feld nicht).
- Docs-Konflikt in `2026-08-07-multimedia-playground.md` aufgelöst (HEAD/Branch-Version behalten).

## Verifikation

- `npm run lint` → 0 Fehler
- `npm run typecheck` → sauber
- `npm test` → **588 Tests grün** / 90 Suiten
- `npm run build` → erfolgreich, `/playground` Route sichtbar
- Dev-Server: `http://localhost:3000/` → 200, `http://localhost:3000/playground` → 200
- Keine Konfliktmarker mehr (`git diff --check` sauber)

## Noch offen / Rückstände

- Push + Deploy erledigt; Live-Smoke-Tests durch User bestätigt (Pollinations + Pruna inkl. i2i-Upload).
- `heyhihosted-playground` und `heyhihosted-playground-b` Worktrees wurden entfernt.
- `playground/multimedia` Worktree ist historisch; wurde nicht mehr benötigt.
