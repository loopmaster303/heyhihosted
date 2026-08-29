# Handoff — Phase 7: Chat entschlanken (2026-08-29)

**Ausgangspunkt:** `1a136c5` (Plan: [`PLAN-phase-7-chat-entschlanken.md`](PLAN-phase-7-chat-entschlanken.md))
**End-HEAD:** `76468d2` — **gepusht**, `origin/main = 76468d2` (selbst verifiziert).
**Nachgetragen:** Dieses Dokument entstand am 2026-08-29 in einer Review-Sitzung, nicht
in der ausführenden. Phase 7 war die einzige Phase ohne Handoff, und ihre zwei Commits
lagen zwei Tage nur lokal — beides in Abschnitt 5 als Befund festgehalten.

---

## 1. Was geliefert wurde

| Commit | Inhalt |
|---|---|
| `c2f74a0` | `feat(phase-7)`: Chat auf die schlüsselfreie Bildauswahl reduziert — 11 Dateien |
| `76468d2` | `docs`: Fahrplan, `LAUNCH_CRITERIA.md`, `CLAUDE.md`, `docs/README.md` nachgezogen |

### Die Regel statt einer Liste

Der Kern ist `getChatImageModelGroups()` in
[`unified-image-models.ts`](../src/config/unified-image-models.ts). Sie führt **keine
kuratierte Modell-Liste**, sondern ein Prädikat:

```
provider === 'pollinations' && kind === 'image' && isFree === true && enabled
```

Heute ergibt das `flux`, `gpt-image`, `klein`. Fällt eines davon aus der Registry oder
wird schlüsselpflichtig, verschwindet es aus dem Chat, ohne dass jemand eine Liste
pflegt — die Modellwahrheit aus Phase 3 trägt bis in den Chat durch. Der
Registry-Check und `registry-truth.test.ts` sehen von dieser Funktion nichts; sie liest
nur, was dort ohnehin geprüft wird.

### Die zwei Verbrauchsstellen

`ImageModelOptions.tsx` (Eingabeleiste) und `VisualizeInlineHeader.tsx` lesen **beide**
dieselbe Funktion. Vorher zogen beide `getVisualizeModelGroupsForProvider()` — dieselbe
Quelle wie das Create — und zeigten damit 16 Modelle in drei Gruppen, davon 13 aus der
Pruna-Familie, die ohne eigenen Schlüssel nicht laufen.

### Der Provider-Schalter scopet den Chat nicht mehr

Bewusst und im Code kommentiert: Die Regel ist providerunabhängig formuliert, damit ein
hinterlegter Pruna-Schlüssel im Chat keine BYOP-Modelle aufblättern kann. Im Create
scopet der Schalter unverändert weiter — das ist die Semantik aus `CLAUDE.md`.

### Der Weg ins Create

Als letzte Zeile im Modell-Panel selbst, nicht nur in der Sidebar: dort, wo die
Verkürzung spürbar wird. Beschriftet, `router.push('/create')`.

---

## 2. Entscheidungen (Betreiber, 2026-08-29)

- **E7-1:** Der Chat führt genau die schlüsselfreie Bildauswahl — kein handkuratierter
  Schnitt, sondern die Regel oben.
- **E7-2:** **Keine Videomodelle im Chat.** Seit Phase 3 ist Video vollständig
  schlüsselpflichtig (E1-A); ein Videoeintrag im Chat wäre ein Angebot, das ohne
  Schlüssel nie liefert.
- **E7-3:** **Keine Pruna-Modelle im Chat**, auch nicht mit Schlüsselhinweis. Die volle
  Auswahl ist der Zweck des Create; ein zweiter Ort mit Pollenwall verdoppelt nur die
  Pflegestelle.

---

## 3. Kriterienstand

| Kriterium | Status |
|---|---|
| **L-F.1** | `teilweise` — strukturell erfüllt (nur schlüsselfreie Pollinations-Bildmodelle, Video und Pruna abwesend, Create-Verweis im Panel). Vollständig erst, wenn **L-B.4** die drei Modelle durch echte Erzeugung bestätigt hat. |
| **L-I.2** | `teilweise` — Text seit Phase 3 (Pollenwall im `ModelSelectorPanel`), Bild/Video seit Phase 7 durch Abwesenheit statt Kennzeichnung. |

`teilweise` blockiert die Freigabe wie `offen` — seit dem 2026-08-29 steht diese
Bedeutung ausdrücklich in `LAUNCH_CRITERIA.md`, Statuswerte-Tabelle. Beide Kriterien
hängen an einer Prüfung im Browser, nicht an weiterem Code.

---

## 4. Verifikation

Zum Zeitpunkt von `76468d2`, in der Review-Sitzung erneut gezogen:

```text
npm run lint           → sauber
npx tsc --noEmit       → sauber
npm run build          → erfolgreich, /create statisch
node scripts/check-model-registry.mjs → "Keine Abweichungen", Exit 0
```

Gegenprobe zur Trennung von Chat und Create:

```text
getChatImageModelGroups()          → IMAGE FREE: flux, gpt-image, klein
getVisualizeModelGroups({})        → 16 Modelle in drei Gruppen (Create, unverändert)
```

Genau so soll es sein: der Chat verkürzt, das Create zeigt weiterhin alles. Es wurde
**kein** Modell aus `unified-image-models.ts` entfernt oder abgeschaltet — die Registry
bleibt Wahrheit, der Chat liest nur eine Teilmenge.

---

## 5. Befunde aus dem Nachaudit (2026-08-29)

Zwei Verfahrensbefunde, die diese Phase betreffen und hier festgehalten sind, damit sie
nicht wieder verlorengehen:

1. **Die Commits lagen unveröffentlicht.** `c2f74a0` und `76468d2` standen auf `main`
   lokal, während `origin/main` noch auf `1a136c5` zeigte — Fahrplan und
   `LAUNCH_CRITERIA.md` behaupteten Phase 7 also bereits, live lief sie nicht.
   Nachgeholt am 2026-08-29.
2. **Es gab keinen Handoff.** Jede andere Phase hat einen; die Prüfspur brach
   ausgerechnet bei der Phase ab, die auch nicht gepusht war. Dieses Dokument schließt
   das rückwirkend — mit dem Nachteil, dass es aus dem Code rekonstruiert ist und die
   Erwägungen der ausführenden Sitzung nicht kennt.

Beides ist dieselbe Regel wie in
[`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md), Abschnitt 6:
**der Handoff wird nach dem Push geschrieben** — und wenn er fehlt, ist die Phase nicht
fertig, egal wie grün die Tests sind.

---

## 6. Für den nächsten Thread

1. **L-B.4 im Browser** — `flux`, `gpt-image` und `klein` je einmal erzeugen. Danach
   geht L-F.1 von `teilweise` auf `erledigt`, ohne dass Code entsteht.
2. **L-I.2** braucht dieselbe Browser-Sicht: ohne Schlüssel prüfen, dass im Chat kein
   Angebot steht, das erst nach dem Absenden nach einem Schlüssel verlangt.
3. Die Regel in `getChatImageModelGroups()` ist bewusst kein kuratierter Schnitt. Wer
   sie ändert, ändert sie am Prädikat — **nicht** durch eine Liste daneben.
