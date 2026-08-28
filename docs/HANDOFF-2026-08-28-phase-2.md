# Session-Handoff — Phase 2 abgeschlossen: Create heißt Create, der Redirect steht

**Datum:** 2026-08-28
**Branch:** `main`, Vorgänger `741c08c`
**Status:** Committet und gepusht am 2026-08-28 (Freigabe des Nutzers). Live läuft
weiterhin `chat.hey-hi.cloud/playground` — die create-Domain wurde bewusst **noch nicht**
umgezogen (Nutzerentscheidung 2026-08-28: „das mach ich später"). Abschnitt 4 gilt fort.
**Art der Sitzung:** Audit und Ausführung von
[`PLAN-phase-2-create-identitaet.md`](PLAN-phase-2-create-identitaet.md) nach
Entscheidungsrounde. Der Plan stammte vom 2026-08-27 und wurde vor der Ausführung
gegen `741c08c` geprüft — Details in Abschnitt 2.

---

## 1. Was entstanden und entschieden ist

### Die vier Entscheidungen des Nutzers (2026-08-28, bindend)

1. **Rückfrage 1 → Variante B.** `create.hey-hi.cloud` **redirectet** auf
   `chat.hey-hi.cloud/playground` (307), statt per Rewrite unter dem eigenen Host
   auszuliefern. Grund: Chat und Create teilen damit einen Browser-Ursprung —
   **Phase 5 (gemeinsamer Asset-Pool) bleibt machbar**, BYOP-Schlüssel werden nicht doppelt
   gebraucht. Preis: die Adresszeile zeigt nach der Landung `chat.hey-hi.cloud/playground`.
2. **Phase-0-Erbe gelöscht.** Die konsumentenlosen Schlüssel `chat.with` (de + en) und
   `chat.placeholder.visualizeWith` (nur en; der DE-Block hatte ihn nie) sind raus.
   Damit ist auch die vom Phase-0-Handoff notierte DE/EN-Asymmetrie weg.
3. **L-A.4-Scope erweitert.** `PRODUCT_IDENTITY.md` und `FAHRPLAN-create.md` wurden
   mitgezogen — sonst wäre das Gate-Kriterium L-A.4 („kein ‚Playground' als Produktname")
   nach Phase 2 rot geblieben. Beide standen nicht im Plan.
4. **Rückfrage 3:** Beschriftung `Create →` in DE **und** EN (Produktname unübersetzt),
   Icon bleibt `Play`.

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/config/translations.ts` | Beide `playground.*`-Blöcke: `sidebarLink`/`title` → Create; DE-Block: `fallbackNotice`, `generate`, `cancel`, `enhance` endlich deutsch. Tote `chat.with`/`chat.placeholder.visualizeWith` gelöscht. |
| `src/app/playground/page.tsx` | `metadata.title` → `'heyhi / create'` |
| `src/app/playground/PlaygroundShell.tsx` | Brotkrume `playground` → `create`; **neu:** `← chat`-Anker (`href="/unified"`, bewusst relativ, links neben dem Zahnrad) |
| `next.config.ts` | **Neu:** `redirects()` mit `CREATE_HOST`-Konstante, zwei Regeln (`/` zuerst, dann `/:path*`), `permanent: false` |
| `next.config.test.ts` | **Neu:** Zusicherung beider Redirect-Regeln inkl. Bindestrich (die Falle, die stumm scheitert) |
| `src/app/playground/PlaygroundShell.test.tsx` | Zusicherung: Rückweg-Link existiert und zeigt auf `/unified` |
| `README.md`, `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `HANDOFF.md`, `docs/README.md` | Produktname Create, Route bleibt `/playground`; `CLAUDE.md` Zeile 197 nennt jetzt auch die **Cloudflare-Proxy-Schicht** und die create-Domain |
| `docs/PRODUCT_IDENTITY.md` | `### Playground` → `### Create`, Redirect vermerkt |
| `docs/FAHRPLAN-create.md` | P2 auf Variante B (Redirect) korrigiert, P4 als umgesetzt vermerkt, Produktnennungen angepasst |

**Nicht angefasst** (wie im Plan, Abschnitt 5.4): Verzeichnisnamen, Routen-Pfad,
`playground.*`-Schlüsselnamen, `PLAYGROUND_CONVERSATION_ID`, `localStorage`-Schlüssel,
`vercel.json`.

---

## 2. Audit des Plans — was vor der Ausführung auffiel

Der Plan plante gegen `f880389` plus offenen Arbeitsbaum (2026-08-27). Geprüft wurde gegen
`741c08c`. **Haltbar:** alle Zeilenrefs in `translations.ts` (56–62/318–324 trafen exakt zu),
die toten `playground.*`-Schlüssel, `AppSidebar.tsx:122–131`, `next.config.ts` ohne
rewrites/redirects, Root `/` als echter Seitenexport, Next 16.3.0 mit `has: type:'host'` in
`beforeFiles` (Doku in `node_modules/next/dist/docs` verifiziert),
`PlaygroundShell.test.tsx` ohne `next/navigation`-Mock.

**Befunde, die die Ausführung änderten:**

1. Der Plan schwieg zum Phase-0-Erbe (`chat.with`, `chat.placeholder.visualizeWith`) —
   durch Entscheidung 2 gelöst.
2. L-A.4 aus `LAUNCH_CRITERIA.md` ist weiter geschnitten als der Plan — durch
   Entscheidung 3 gelöst.
3. Kosmetik: Brotkrume lag bei Zeile 393 (Plan: 391); der Reality-Check nannte „drei
   vergleichbare Hooks" in `next.config.ts`, real war es einer (`headers()`); die
   Testzahl war 780, nicht 781. Ohne Folgen.

**Vor Ausführung galt:** Phase 1 war zwischenzeitlich committet und gepusht (`741c08c`) —
die Voraussetzung des Plans („Phase 0 zuerst landen") war damit erfüllt, der Arbeitsbaum
sauber bis auf autogen-`next-env.d.ts`.

---

## 3. End-to-End-Verifikation

| Prüfung | Ergebnis |
|---|---|
| `npm run lint` | sauber |
| `npx tsc --noEmit` | sauber |
| `CI=1 npx jest --silent` | **107 Suiten, 781 Tests** grün (vorher 106/780; +1 ist `next.config.test.ts`) |
| `npm run build` | erfolgreich, `/playground` statisch |
| `curl -H 'Host: create.hey-hi.cloud' localhost:3000/` | **307 → `https://chat.hey-hi.cloud/playground`** |
| `curl -H 'Host: create.hey-hi.cloud' localhost:3000/gallery` | **307 → `https://chat.hey-hi.cloud/gallery`** (zweite Regel reicht Unterpfade durch) |
| Gegenprobe ohne Sonder-Host | 200, Chat-Landing unberührt |
| Gegenprobe `Host: chat.hey-hi.cloud` | 200, Regel greift nicht (richtig so) |

Alle `chat.*`-Gegenproben gegen den **laufenden Dev-Server**, der die neue Config bereits
geladen hatte. Die Live-Prüfungen F1–F2 setzen den Deploy + die Dashboard-Schritte voraus.

---

## 4. Was offen bleibt — die Dashboard-Schritte (macht der Nutzer, aufgeschoben)

Der Code allein macht `create.hey-hi.cloud` nicht erreichbar. Reihenfolge beachten:
**erst deployen, dann Domain eintragen** — sonst zeigt `create.` für eine Übergangszeit
den Chat und landet evtl. im Browser-Cache. Stand 2026-08-28: der Code ist auf `main`,
die Domain läuft noch nicht — `create.hey-hi.cloud` ist NXDOMAIN (geprüft gegen
1.1.1.1 und 8.8.8.8); der Nutzer hat den Umzug bewusst aufgeschoben. Der Redirect wird
also erst mit den Schritten 2–3 scharf.

1. **Commit/Push freigeben** (dieser Stand liegt uncommitted im Baum).
2. **Vercel** → Projekt → Settings → Domains → `create.hey-hi.cloud` (Bindestrich!) als
   Production-Domain. **Kein** „Redirect to" in Vercel setzen — die Umleitung steht im Code.
3. **Cloudflare** → Zone `hey-hi.cloud` → DNS → den bestehenden `chat`-Eintrag ansehen und
   für `create` **exakt spiegeln** (gleicher Typ, gleiches Ziel, gleicher Proxy-Status).
   An den SSL/TLS-Einstellungen nichts ändern.
4. **Prüfen:** `nslookup create.hey-hi.cloud` löst auf · Vercel zeigt Valid Configuration ·
   `curl -sI https://create.hey-hi.cloud/` → **307** mit `location:
   https://chat.hey-hi.cloud/playground` · `chat.hey-hi.cloud/` bleibt 200.
5. Danach F1–F6 aus dem Plan im Browser sichten (L-A.1 bis L-A.3 sind genau das; die
   Status-Spalten in `LAUNCH_CRITERIA.md` Bereich A dann auf „erledigt" ziehen).

---

## 5. Bewusste Ausnahmen (dokumentiert, nicht übersehen)

- **Historische „Playground"-Nennungen bleiben:** `CLAUDE.md` Zeile 165 (Vorfall-Bericht
  zum Upload-Bug) und `FAHRPLAN-create.md` Zeile 378 („Lehre aus den
  Playground-Sitzungen im August") beschreiben die Vergangenheit. Eine Umbenennung würde
  Historie umschreiben. L-A.4 verlangt Produktnennungen in der Gegenwart — ein Prüfer,
  der streng grept, wird diese zwei Fundstellen sehen und bewusst werten müssen.
- **`playground.prunaEmpty` bleibt im DE-Block englisch** — der Schlüssel ist tot (kein
  Konsument) und gehört zusammen mit der Modellwahrheit zu **Phase 3**.
- **`HANDOFF.md` nennt als Deploy-Stand weiterhin `aa3eac4`** für die Live-Site; der
  Repo-Stand im Kopf ist auf `741c08c` korrigiert. Phase 1 ist docs-only, der
  ausgelieferte Artefakt-Stand ändert sich dadurch nicht sichtbar.

## 6. Für den nächsten Thread

1. Commit/Push nachholen, sobald der Nutzer freigibt; danach V1–V3 (Abschnitt 4).
2. `LAUNCH_CRITERIA.md` Bereich A: erst nach den Live-Prüfungen auf Status setzen.
3. Phase 3 (Modellwahrheit) erbt: die toten `playground.*`-Schlüssel (fünf Stück,
   inkl. der „14 Pruna models"-Zahl) sind weiterhin zu räumen — beim Anfassen der
   Registry-Flags mitrechnen.
4. Der Ansatz „Redirect statt Rewrite" ist für Phase 5 bindend: **nie** Rewrite-Regeln
   ergänzen, die Create unter einem zweiten Ursprung ausliefern — sonst entsteht das
   Datensilo doch wieder.
