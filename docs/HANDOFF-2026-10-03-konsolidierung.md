# Konsolidierter Stand — 2026-10-03

Branch: `codex/consolidate-ui`. Basis enthält das aktuelle GitHub-main und die
Branches zu PR #17, #19 und #20 sowie die UI-Variante „Eine Fläche“.

## Ergebnis

- Gemeinsame Hülle für Chat und Create, Verlauf/Galerie/Einstellungen als Sheets.
- P-Video 2 und P-Video 2 Pro einschließlich lokaler Integration und aktueller
  Request-/Dauer-Helfer. Create bleibt unter `src/components/playground/`.
- Aufräumstand aus #18 bleibt erhalten; beim Merge entfernte historische Dokumente
  wurden nicht wieder als Archiv eingeführt.
- Nova-Reel und Registry-Action entfernt. Direkter HTTP-Transport mit Beschränkung
  auf `https://gen.pollinations.ai`, ohne Kindprozess.
- Spätere main-Fixes erhalten: Ressourcen-Deduplizierung, Fehlervertrag,
  Referenz-Uploads, einmalige Chat-Wiederherstellung, deaktivierte automatische
  Memory-Extraktion, korrekter Sound-Prompt und Original-Tags in der Galerie.
- Next und eslint-config-next auf mindestens 16.3.8; Lockfile aktualisiert.
- Galerie-Bilder und Videos lassen sich auch per Tastatur öffnen.

## Nachweise

- Typprüfung bestanden.
- Jest: 120 Suiten, 1110 Tests bestanden.
- ESLint: keine Fehler und keine Warnungen.
- Produktionsbuild unter Next 16.3.8 bestanden.
- Lokaler Dev-Server auf Port 3000; Umgebungsdateien sind Symlinks auf das Hauptrepo.

## Sicherung und Grenzen

Sicherung der lokalen Diffs, Index-Diffs und unversionierten Dateien:
`/Users/johnmeckel/heyhi-backups/20261003-190732-consolidation`.
Die ursprünglichen Worktrees bleiben unverändert als Rückfallstände erhalten.
Das Hauptrepo wurde nur auf den bereits veröffentlichten Aufräumstand vorgezogen.

Kein Produktionsdeployment, keine echte kostenpflichtige Erzeugung und kein
Telefon-/Browser-Abnahmelauf in dieser Sitzung. Die zuvor dokumentierten
Release-Gates bleiben offen, soweit dafür reale Nutzer-/Anbieterprüfungen fehlen.
Die Paketprüfung meldet weiterhin Schwachstellen in weiteren Abhängigkeiten;
der kritische Next-Befund ist nach dem Update entfernt. Größere Jest-/Tailwind-
Migrationen gehören in eigene Änderungen.
