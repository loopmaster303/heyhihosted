# Docs Map

Oben liegt nur, was gilt. Alles Erledigte liegt in **einem** Archiv: `archive/`.

## Was gilt

| Dokument | Wofür |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | **Laufzeitwahrheit.** Regeln und Fallstricke, gegen den Code geprüft. |
| [`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md) | **Release-Gate.** Darf die Adresse geteilt werden? Status je Kriterium. |
| [`HANDOFF-2026-10-01-eine-flaeche.md`](HANDOFF-2026-10-01-eine-flaeche.md) | **Letzter Handoff.** Die Variante „Eine Fläche": was gebaut, wie geprüft, was offen ist. |
| [`PLAN-entschlackung-2026-10-01.md`](PLAN-entschlackung-2026-10-01.md) | Der Plan hinter der Variante, mit Stand je Phase. Offen: E0, E6, E8, E-9. |
| [`PLAN-sound-modellwahl-2026-09-03.md`](PLAN-sound-modellwahl-2026-09-03.md) | **Als Nächstes.** Fünf Sound-Modelle unter einer Regel. Sein 30-s-Blocker ist seit E7 technisch weg (290 s für `/api/compose`), live mit Schlüssel nicht geprüft. |
| [`HANDOFF-2026-09-03-sound.md`](HANDOFF-2026-09-03-sound.md) | Was der Sound-Plan voraussetzt; nennt die fehlenden Modal-Variablen auf Vercel. |
| [`PRODUCT_IDENTITY.md`](PRODUCT_IDENTITY.md) | Produktversprechen und Sprache. |
| [`architecture-view.md`](architecture-view.md) | Hülle, Datenfluss, Speicher als Diagramme. |
| [`streaming-status.md`](streaming-status.md) | Wie eine Chat-Antwort fließt (SSE). |
| [`blob-manager.md`](blob-manager.md), [`asset-fallback-service.md`](asset-fallback-service.md) | Zwei Bausteine im Detail. |
| [`design/`](design/) | Die Sound-Attrappen, auf die der Sound-Plan verweist. |

## Benennung

Neue Dokumente liegen **flach in `docs/`**: `PLAN-<thema>-<datum>.md` für einen Plan,
`HANDOFF-<datum>-<thema>.md` für das, was eine Sitzung hinterlässt. Ist ein Plan erledigt,
wandert er mit seinen Handoffs ins Archiv.

> Modell-Listen stehen nirgends in Prosa. Sie leben in `src/config/` und werden mit
> `scripts/check-model-registry.mjs` gegen die Live-Registry geprüft.

## Archiv

[`archive/`](archive/) — siehe [`archive/README.md`](archive/README.md). Links aus archivierten
Dokumenten auf Code zeigen teils ins Leere: der Code ist seitdem umgezogen oder gelöscht.
Archiviertes wird nicht nachgeführt.
