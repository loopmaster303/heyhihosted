# PLAN — Phase 2: Create-Identität

**Datum:** 2026-08-27
**Phase im Fahrplan:** [`docs/FAHRPLAN-create.md`](FAHRPLAN-create.md), Phase 2 (P1, P2, P3, P4)
**Status dieses Dokuments:** Blueprint + Reality Check nach [`AGENTS.md`](../AGENTS.md).
**Kein Code geschrieben, nichts committet.** Phase 4 (Ausführung) startet erst nach
ausdrücklicher Freigabe und nach Beantwortung der Rückfragen in Abschnitt 4.

---

## 1. Ziel

Der Playground heißt in der Oberfläche **Create**, ist unter einer eigenen Adresse
`create.hey-hi.cloud` erreichbar, und Chat und Create sind mit je einem Klick in beide
Richtungen erreichbar — ohne Umbenennung von Verzeichnissen, Routen-Pfaden,
Übersetzungsschlüsseln oder gespeicherten Datenwerten.

---

## 2. Ausgangslage und Annahmen

### 2.1 Annahme zum Arbeitsbaum (geprüft am 2026-08-27)

`git status --porcelain` meldet **93 Einträge**. Phase 0 ist **nicht abgeschlossen**.
Von den Dateien, die dieser Plan anfasst, liegen bereits offen:

| Datei | Zustand im Arbeitsbaum |
|---|---|
| `next.config.ts` | **M** — geändert |
| `src/config/translations.ts` | **M** — geändert |
| `src/app/playground/PlaygroundShell.tsx` | **M** — geändert |
| `CLAUDE.md` | **M** |
| `README.md` | **M** |
| `HANDOFF.md` | **M** |
| `docs/README.md` | **M** |
| `src/components/layout/AppSidebar.tsx` | sauber |
| `src/app/playground/page.tsx` | sauber |
| `AGENTS.md`, `GEMINI.md` | sauber |

**Annahme, unter der dieser Plan geschrieben ist:** Phase 0 landet zuerst, die genannten
Dateien sind bei Ausführung committet, und die Ausführung setzt auf dem konsolidierten Stand
auf. Wird dieser Plan vorher ausgeführt, vermischen sich seine Änderungen mit sieben bereits
offenen Dateien und Phase 0 wird unsortierbar. **Empfehlung: nicht vor Phase 0 ausführen.**

Der Plan selbst (dieses Dokument) ist davon nicht betroffen — er legt nur eine neue Datei an.

### 2.2 Domain — was tatsächlich registriert ist (live geprüft, 2026-08-27)

Die Falle aus dem Handoff ist real und ist hiermit geklärt:

| Hostname | Auflösung | Befund |
|---|---|---|
| `hey-hi.cloud` (**mit** Bindestrich) | `172.67.169.36`, `104.21.27.113` | **registriert und live** |
| `www.hey-hi.cloud` | dieselben IPs | live |
| `chat.hey-hi.cloud` | dieselben IPs, HTTP 200 | live |
| `create.hey-hi.cloud` | **NXDOMAIN** | existiert noch nicht |
| `heyhi.cloud` (ohne Bindestrich) | **NXDOMAIN** | **existiert nicht** |

**Verbindlich für alle Schritte: die Domain heißt `hey-hi.cloud` mit Bindestrich.**

### 2.3 Zusätzlicher Befund: die Domain läuft über Cloudflare, nicht direkt auf Vercel

Antwort-Header von `https://chat.hey-hi.cloud`:

```
server: cloudflare
cf-ray: a31a317129fbe521-TXL
cf-cache-status: DYNAMIC
x-vercel-id: fra1::6psqx-...
x-vercel-cache: HIT
```

Cloudflare steht als Proxy vor Vercel. **Konsequenz:** Der neue DNS-Eintrag entsteht in
**Cloudflare**, nicht bei einem Registrar und nicht in Vercel. Vercel braucht die Domain
trotzdem im Projekt eingetragen, sonst antwortet es auf einen unbekannten `Host` mit
„Deployment not found". Das sind zwei getrennte Handgriffe an zwei getrennten Stellen —
Abschnitt 6.

Im Handoff stand diese Schicht nicht. Wer nur „Domain in Vercel eintragen" plant, wartet
danach auf eine DNS-Propagierung, die nie kommt.

### 2.4 Einstiegspunkte, nachgeprüft

| Sache | Fundort | Zustand |
|---|---|---|
| Sidebar-Link Chat → Playground | `src/components/layout/AppSidebar.tsx:122–131` | vorhanden, Beschriftung kommt aus `t('playground.sidebarLink')` |
| Rückweg Create → Chat | — | **existiert nicht.** Kein `router.push`, kein `href`, kein `next/link` in `PlaygroundShell.tsx` |
| Kopfzeile des Playgrounds | `PlaygroundShell.tsx:388–392` | `heyhi / playground`, **fest verdrahtet**, nicht über `t()` |
| Seitentitel | `src/app/playground/page.tsx:3` | `metadata = { title: 'heyhi / playground' }` |
| Beschriftungen | `src/config/translations.ts:56–62` (de) und `318–324` (en) | zweimal, je Sprache |
| Weiterleitung | `next.config.ts` | **kein** `rewrites()`, **kein** `redirects()`. Nur `headers`, `turbopack`, `allowedDevOrigins`, `images` |
| Root-Route `/` | `src/app/page.tsx` | `export { default } from './unified/page'` — **kein Redirect**, eine echte Seite. Ein Rewrite auf `/` kollidiert also mit nichts |

**Zusatzbefund zu den Übersetzungen:** Der **deutsche** Block (Zeilen 56–62) enthält heute
englische Strings — `'Playground →'`, `'Generate'`, `'Cancel'`, `'Enhance'`. Die Datei ist an
dieser Stelle bereits halb übersetzt. Bei der Gelegenheit wird das mitgezogen.

**Zusatzbefund zu toten Schlüsseln:** Von den sieben `playground.*`-Schlüsseln werden nur
**zwei** gelesen — `playground.sidebarLink` (AppSidebar) und `playground.fallbackNotice`
(`ModelPicker.tsx:59`). `playground.title`, `playground.prunaEmpty`, `playground.generate`,
`playground.cancel`, `playground.enhance` stehen in keiner Komponente. Damit erreicht auch der
Satz **„Add a Pruna key to unlock 14 Pruna models" nie einen Nutzer**. Siehe Abschnitt 11.

### 2.5 Was Next.js 16.3.0 hier tatsächlich kann (gegen `node_modules/next/dist/docs` geprüft)

`rewrites()` unterstützt `has: [{ type: 'host', value: '…' }]` — `key` entfällt bei `host`.
Die Auswertungsreihenfolge im App Router lautet: `headers` → `redirects` → `proxy` →
`beforeFiles`-Rewrites → statische Dateien und Seiten → dynamische Routen → `fallback`.

Ein `beforeFiles`-Rewrite greift also **vor** der Seitenauflösung. Das ist die richtige Stufe:
`source: '/'` mit `has: host` wird zu `/playground` umgeschrieben, bevor `src/app/page.tsx`
überhaupt in Betracht kommt.

---

## 3. Fertig-Kriterien aus dem Fahrplan, in prüfbare Schritte übersetzt

Der Fahrplan sagt: *„`create.hey-hi.cloud` öffnet Create · `chat.hey-hi.cloud` öffnet den
Chat · beide Richtungen sind ein Klick · kein Dokument nennt nur noch die alte Adresse."*

| # | Prüfbarer Satz | Prüfung |
|---|---|---|
| **F1** | `curl -sI https://create.hey-hi.cloud/` antwortet 200 und der Rumpf enthält die Create-Oberfläche, nicht die Chat-Landing. | `curl -s https://create.hey-hi.cloud/ \| grep -c 'create'` bzw. Sichtprüfung im Browser |
| **F2** | `curl -sI https://chat.hey-hi.cloud/` antwortet weiterhin 200 mit der Chat-Landing. Der Rewrite hat den Chat nicht angefasst. | wie F1, gegen `chat.` |
| **F3** | In der Chat-Sidebar steht **Create**, nicht **Playground** — in DE und EN. | Sprache umschalten, Beschriftung lesen |
| **F4** | Die Kopfzeile des Create und der Browser-Tab-Titel sagen **create**. | Sichtprüfung |
| **F5** | Aus dem Create führt ein sichtbares Bedienelement mit einem Klick in den Chat. | Klick, Landung auf `/unified` |
| **F6** | Aus dem Chat führt der bestehende Sidebar-Link mit einem Klick ins Create. | Klick |
| **F7** | Kein aktuelles Wahrheitsdokument nennt nur `chat.hey-hi.cloud/playground` als Adresse des Create. | `grep -rn "hey-hi.cloud" README.md CLAUDE.md AGENTS.md GEMINI.md HANDOFF.md docs/README.md` |
| **F8** | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` grün. | Kommandozeile |

**Nicht** zu den Fertig-Kriterien gehört, dass beide Adressen dieselben lokalen Daten sehen —
siehe Rückfrage 1.

---

## 4. Offene Entscheidungen — **Rückfragen, vor der Ausführung zu beantworten**

### Rückfrage 1 (blockierend) — Subdomains teilen keinen Browser-Ursprung

Die Begründung der Domain-Entscheidung lautet im Handoff:

> „beide Adressen müssen denselben Browser-Ursprung teilen, sonst wäre die gemeinsame
> IndexedDB-Galerie aus Phase 5 unmöglich"

**Diese Voraussetzung trifft nicht zu.** Ein Browser-Ursprung ist Schema + Host + Port.
`https://chat.hey-hi.cloud` und `https://create.hey-hi.cloud` sind **zwei verschiedene
Ursprünge**, auch wenn beide dasselbe Vercel-Projekt und dieselbe Anwendung ausliefern.
IndexedDB und `localStorage` sind pro Ursprung getrennt. Konsequenz, wenn Create wirklich
unter `create.hey-hi.cloud` läuft:

- Gespräche, Assets, gespeicherte Parameter: **zweimal, getrennt**
- BYOP-Schlüssel (`pollenApiKey`, `prunaApiKey`): **zweimal einzutragen**
- Die gemeinsame Galerie aus **Phase 5 ist damit nicht erreichbar** — der gemeinsame Pool
  entstünde nur innerhalb je einer Adresse

Das ist eine Eigenschaft des Browsers, nicht des Deployments. „Ein Vercel-Projekt" löst es
nicht. Cookies ließen sich über `Domain=.hey-hi.cloud` teilen, IndexedDB nicht.

**Drei Wege, in der Reihenfolge meiner Empfehlung:**

| | Variante | Adresse im Browser | Ein Ursprung? | Phase 5 möglich? | Aufwand |
|---|---|---|---|---|---|
| **B** *(Empfehlung)* | `create.hey-hi.cloud` **leitet weiter** auf `chat.hey-hi.cloud/playground` | `chat.hey-hi.cloud/playground` | **ja** | **ja** | gleich |
| **A** | `create.hey-hi.cloud` **liefert** Create aus (Rewrite, wie entschieden) | `create.hey-hi.cloud` | nein | nein | gleich |
| **C** | alles auf den Apex `hey-hi.cloud` ziehen, `chat.*` und `create.*` leiten dorthin | `hey-hi.cloud/…` | ja | ja | größer, **und die vorhandenen lokalen Daten auf `chat.hey-hi.cloud` wären verwaist** |

Variante **B** liefert die gewünschte Vanity-Adresse (jemand tippt `create.hey-hi.cloud` und
landet im Create) **und** erhält den geteilten Ursprung, den die Entscheidung eigentlich
sichern sollte. Der Preis ist kosmetisch: nach der Landung steht `chat.hey-hi.cloud/playground`
in der Adresszeile.

Variante **C** ist langfristig die sauberste, ist aber in einer local-first-App riskant: alle
heute auf `chat.hey-hi.cloud` liegenden Gespräche und Assets wären nach dem Umzug nicht mehr
erreichbar. Nicht ohne Migrationsweg.

Der Rest dieses Plans ist so geschrieben, dass **A und B sich nur in genau einem Schritt
unterscheiden** (Schritt 5). Alles andere ist identisch. Ohne Antwort wird Schritt 5 nicht
ausgeführt.

### Rückfrage 2 (nicht blockierend) — soll die Adresszeile `create` behalten?

Nur relevant, falls Variante B gewählt wird und dich `…/playground` in der Adresszeile stört:
Der Routen-Pfad ließe sich zusätzlich von `/playground` auf `/create` ziehen, mit einem
Redirect vom alten Pfad. Das ist **nicht** die im Auftrag ausgeschlossene
Verzeichnisumbenennung, aber es berührt `AppSidebar` (`currentPath`-Vergleich), die
Metadaten, vier Testdateien und jede Doku-Zeile, die `/playground` nennt. Mein Vorschlag:
**vertagen**, nicht in dieser Phase. Sag Bescheid, wenn du es anders willst.

### Rückfrage 3 (nicht blockierend) — Icon und Wortlaut

Der Sidebar-Link nutzt heute das `Play`-Icon und den Text `Playground →`. Vorschlag:
`Create →` (EN) / `Create →` (DE — als Produktname unübersetzt), Icon unverändert. Falls du
`Sparkles`, `Wand2` oder ähnliches willst: ein Wort genügt.

---

## 5. Component Mapping

### 5.1 Geändert

| Datei | Änderung | Begründung |
|---|---|---|
| `src/config/translations.ts` | `playground.sidebarLink` und `playground.title` **an beiden Stellen** (de: 56–62, en: 318–324) auf „Create" ziehen. Bei der Gelegenheit die restlichen fünf Schlüssel im **de**-Block tatsächlich ins Deutsche übersetzen. | P1. Der Handoff nennt genau diese Doppelung als Falle: wer nur eine Stelle ändert, übersetzt halb. |
| `src/app/playground/page.tsx` | `metadata.title` → `'heyhi / create'` | P1. Browser-Tab und Lesezeichen. Einzeiler. |
| `src/app/playground/PlaygroundShell.tsx` | (a) Kopfzeilen-Brotkrume `playground` → `create` (Zeile 391). (b) **Neu:** Rückweg-Link in der Kopfzeile, links neben dem Zahnrad. | P1 + **P4**. Der Rückweg fehlt komplett; die Kopfzeile ist die einzige gemeinsame Leiste, die auf jeder Fenstergröße sichtbar ist. |
| `next.config.ts` | **Neu:** `rewrites()` bzw. `redirects()` mit `has: [{ type: 'host', value: 'create.hey-hi.cloud' }]`. Der Hostname als eine benannte Konstante im Kopf der Datei. | P2. Der Hook existiert heute nicht und muss neu entstehen. Eine Konstante, weil der Hostname sonst als Literal in einem `if`-artigen Objekt steht und der Bindestrich-Vertipper genau dort passiert. |
| `src/app/playground/PlaygroundShell.test.tsx` | Eine Zusicherung auf den Rückweg-Link. | Der Link ist neuer Bedienweg, also gehört er in den bestehenden Smoke-Test des Shells. |
| `README.md` | Zeilen 18–19: Create statt Playground, neue Adresse nennen. | P3 |
| `CLAUDE.md` | Zeilen 21, 25, 76, 78 und der Abschnitt „Playground — read before touching `/playground`": Produktname **Create**, Routen-Pfad bleibt `/playground` und wird als solcher benannt. Zeile 197 (Deploy-Wahrheit) um die zweite Adresse **und um die Cloudflare-Schicht** ergänzen. | P3. Zeile 197 ist heute unvollständig: sie nennt Vercel, nicht den davorliegenden Proxy. |
| `AGENTS.md` | Zeile 54: Adresse ergänzen. | P3 |
| `GEMINI.md` | Zeilen 24, 26 — Spiegel von `CLAUDE.md`. | P3. `CLAUDE.md`, `README.md`, `GEMINI.md` sind laut Cleanup Rules synchrone Adapter. |
| `HANDOFF.md` | Zeilen 8–9, 29: „Geplant" → live, Adressen aktualisieren. | P3 |
| `docs/README.md` | Nur die **aktuellen** Aussagen (Zeile 48). | P3 |

### 5.2 Angelegt

| Datei | Zweck |
|---|---|
| `docs/PLAN-phase-2-create-identitaet.md` | dieses Dokument; Namensmuster `PLAN-phase-N-*` steht so in `docs/README.md` |
| *optional:* ein kleiner Test auf die Rewrite-Regel | siehe Abschnitt 9.3 |

### 5.3 Gelöscht

**Nichts.**

### 5.4 Ausdrücklich **nicht** angefasst

| Sache | Warum nicht |
|---|---|
| `src/components/playground/`, `src/lib/playground/` | Vom Auftrag ausgeschlossen. Eine Verzeichnisumbenennung überzöge jede parallel laufende Phase mit Konflikten. |
| Routen-Pfad `/playground` | Siehe Rückfrage 2. |
| Übersetzungsschlüssel `playground.*` | Schlüssel sind interne Bezeichner, kein sichtbarer Text — dieselbe Kategorie wie Verzeichnisnamen, dieselbe Begründung. Ein Umbenennen berührte `AppSidebar`, `ModelPicker` und drei Testdateien ohne einen einzigen sichtbaren Unterschied. |
| `PLAYGROUND_CONVERSATION_ID = '__playground__'` (`src/lib/playground/constants.ts:6`) | **Gespeicherter Datenwert**, nicht Code. Jedes bereits erzeugte Asset trägt ihn. Ein Umbenennen macht die vorhandene Galerie leer. |
| `localStorage`-Schlüssel `playgroundState` (`usePlaygroundState.ts:42`) und `playgroundShowCommunityModels` (`useShowCommunityModels.ts:6`) | Dieselbe Begründung: gespeicherter Zustand. Ein Umbenennen setzt jedem Nutzer seine Parameter zurück. |
| `src/components/layout/AppSidebar.tsx` | **Braucht keine Änderung.** Die Beschriftung kommt bereits aus `t('playground.sidebarLink')`, der Routen-Pfad bleibt. Nur falls Rückfrage 3 ein anderes Icon ergibt. |
| `src/app/about/page.tsx` und `src/components/page/about/` | Enthalten keine Erwähnung des Playgrounds — geprüft. Der Handoff führt `/about` als Doku-Ziel; das ist eine Fehlspur. |
| Archiv-Doks unter `docs/superpowers/`, `docs/plans/`, `docs/archive/` | Beschreiben, was damals war. Historische Texte werden nicht umgeschrieben; `docs/README.md` verbietet das Erweitern dieser Ordner ohnehin. |

---

## 6. Schritte im Vercel- und Cloudflare-Dashboard (macht **der Nutzer**, kein Code)

Getrennt vom Code, weil nichts davon im Repo landet und nichts davon ein Agent tun kann.

> **Reihenfolge beachten:** erst der Code deployen, dann die Domain eintragen. Umgekehrt
> zeigt `create.hey-hi.cloud` für die Zwischenzeit den **Chat** — und ein Browser, der das
> einmal gesehen hat, hält es je nach Cache-Header eine Weile fest.

### Schritt V1 — Vercel: Domain am Projekt eintragen

1. Vercel → Projekt (das, das `chat.hey-hi.cloud` bedient) → **Settings → Domains**
2. **Add Domain** → `create.hey-hi.cloud` (Bindestrich!)
3. Als Ziel **Production** / Branch `main` — dieselbe Zuordnung wie `chat.hey-hi.cloud`
4. **Kein** „Redirect to" in Vercel setzen. Die Umleitung entsteht im Code (Schritt 5),
   weil Vercels Domain-Redirect nur die Domain tauscht und den Pfad `/` mitnähme — damit
   landete man im Chat, nicht im Create.
5. Vercel zeigt jetzt den erwarteten DNS-Eintrag und den Status **Invalid Configuration** —
   das ist erwartet, bis V2 gemacht ist.

### Schritt V2 — Cloudflare: DNS-Eintrag anlegen

1. Cloudflare → Zone `hey-hi.cloud` → **DNS → Records**
2. Den **bestehenden Eintrag für `chat`** ansehen und **exakt spiegeln**: gleicher Record-Typ,
   gleiches Ziel, **gleicher Proxy-Status** (orange = proxied vs. grau = DNS only).
   Nur der Name ändert sich: `chat` → `create`.
3. Nicht raten. Die Zone läuft nachweislich als Proxy (`server: cloudflare`,
   `cf-cache-status` in der Antwort von `chat.hey-hi.cloud`); ein abweichender Proxy-Status
   auf dem neuen Eintrag erzeugt entweder ein Zertifikatsproblem oder einen Redirect-Loop.
4. An den SSL/TLS-Einstellungen der Zone **nichts** ändern — sie gelten zonenweit und
   funktionieren für `chat.` bereits.

### Schritt V3 — Prüfen

| Prüfung | Erwartung |
|---|---|
| `nslookup create.hey-hi.cloud` | löst auf; **nicht** mehr NXDOMAIN |
| Vercel → Settings → Domains | `create.hey-hi.cloud` zeigt **Valid Configuration** |
| `curl -sI https://create.hey-hi.cloud/` | 200 (Variante A) bzw. 307/308 mit `location: https://chat.hey-hi.cloud/playground` (Variante B) |
| `curl -sI https://chat.hey-hi.cloud/` | unverändert 200 |

### Was **nicht** ins Dashboard gehört

- Der Rewrite bzw. Redirect selbst — der steht in `next.config.ts`.
- `vercel.json` bleibt in dieser Phase `{}`. Das fehlende `maxDuration` ist Phase 4.
- Environment-Variablen: keine. Der Hostname steht im Code, nicht in der Umgebung — eine
  Variable dafür wäre Konfigurierbarkeit, die niemand angefordert hat.

---

## 7. Reihenfolge der Schritte, je mit Verifikation

Jeder Schritt ist für sich prüfbar. Bricht einer ab, ist der vorige Stand lauffähig.

### Schritt 1 — Beschriftungen (P1)

`src/config/translations.ts`, **beide** Blöcke.

- de (56–62): `playground.sidebarLink` → `'Create →'`, `playground.title` → `'Create'`,
  und die verbliebenen englischen Strings (`Generate`, `Cancel`, `Enhance`,
  `Offline list — …`) ins Deutsche ziehen
- en (318–324): `playground.sidebarLink` → `'Create →'`, `playground.title` → `'Create'`

**Verifikation:**
`grep -n "playground\." src/config/translations.ts` liefert 14 Zeilen, in beiden Blöcken
identische Schlüssel und **kein** „Playground" mehr als Wert.
`npm run dev` → Sidebar zeigt „Create →" · Sprache umschalten → weiterhin „Create →".

### Schritt 2 — Seitentitel (P1)

`src/app/playground/page.tsx`: `title: 'heyhi / create'`.

**Verifikation:** Browser-Tab auf `/playground` liest „heyhi / create".

### Schritt 3 — Kopfzeile (P1)

`PlaygroundShell.tsx:391`: `playground` → `create`.

**Verifikation:** Sichtprüfung. `npm test -- --runInBand src/app/playground` bleibt grün —
kein bestehender Test prüft diesen Text (geprüft: keine Zusicherung auf „playground" oder
„heyhi" in `PlaygroundShell.test.tsx` oder `playground.e2e.test.tsx`).

### Schritt 4 — Rückweg Create → Chat (**P4**)

In der Kopfzeile von `PlaygroundShell.tsx`, links neben dem Zahnrad: ein
**einfacher `<a href="/unified">`**, beschriftet `← chat`, im Mono-Stil der Brotkrume.

Drei Begründungen, warum ein Anker und kein `useRouter`:

1. `PlaygroundShell.test.tsx` mockt `next/navigation` **nicht**. Ein `useRouter` bräuchte
   einen neuen Mock in zwei Testdateien; ein Anker braucht nichts.
2. Create und Chat teilen keinen Provider — der Playground hat bewusst keinen
   `ChatProvider`. Ein voller Seitenwechsel ist hier der ehrlichere Übergang, nicht der teure.
3. Der Pfad bleibt **relativ**. Damit funktioniert er im Dev, auf `chat.`, auf `create.` und
   auf jeder Preview-Adresse — ohne Fallunterscheidung. Ein fest verdrahtetes
   `https://chat.hey-hi.cloud/unified` wäre unter Variante A sogar **schädlich**: es risse
   den Nutzer aus dem Ursprung, in dem seine Create-Daten liegen (Rückfrage 1).

**Verifikation:** Klick im Create landet auf `/unified` mit der Chat-Landing.
Zurück über die Sidebar. Beide Richtungen je ein Klick → **F5**, **F6**.

### Schritt 5 — Weiterleitung in `next.config.ts` (P2) · **hängt an Rückfrage 1**

Der Hostname als benannte Konstante, dann **eine** der beiden Formen:

**Variante A (wie entschieden) — Rewrite:**

```ts
const CREATE_HOST = 'create.hey-hi.cloud';

async rewrites() {
  return {
    beforeFiles: [
      {
        source: '/',
        has: [{ type: 'host', value: CREATE_HOST }],
        destination: '/playground',
      },
    ],
    afterFiles: [],
    fallback: [],
  };
}
```

`beforeFiles`, weil ein Rewrite dort **vor** der Seitenauflösung greift — sonst gewänne
`src/app/page.tsx`. Nur `source: '/'`, damit jede andere Adresse unter `create.` weiterhin
das tut, was sie überall tut.

**Variante B (Empfehlung) — Redirect, zwei Regeln, Reihenfolge zählt:**

```ts
async redirects() {
  return [
    {
      source: '/',
      has: [{ type: 'host', value: CREATE_HOST }],
      destination: 'https://chat.hey-hi.cloud/playground',
      permanent: false,
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: CREATE_HOST }],
      destination: 'https://chat.hey-hi.cloud/:path*',
      permanent: false,
    },
  ];
}
```

Die zweite Regel verhindert, dass ein geteilter Link wie `create.hey-hi.cloud/gallery` eine
zweite Datensilo-Adresse aufmacht. `permanent: false` (307/308 statt 301/308-permanent):
ein dauerhafter Redirect wird von Browsern hart zwischengespeichert und ließe sich später
nicht mehr zurücknehmen.

**Verifikation, lokal, ohne Deploy:**

```bash
curl -s -H 'Host: create.hey-hi.cloud' -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/
```

Gegen den laufenden `npm run dev`. Erwartung Variante A: `200`, und
`curl -s -H 'Host: create.hey-hi.cloud' http://localhost:3000/` liefert die Create-Oberfläche.
Erwartung Variante B: `307` mit `redirect_url` auf `chat.hey-hi.cloud/playground`.
Gegenprobe **ohne** den Host-Header: Chat-Landing, unverändert.

**Wichtig zum Verständnis, damit es später niemand „repariert":** Auf Preview-Deployments
(`*.vercel.app`) und im Dev unter `localhost` greift die Regel **nicht** — der Host stimmt
nicht. Das ist richtig so und kein Fehler.

### Schritt 6 — Dashboard (V1–V3 aus Abschnitt 6)

**Erst nachdem Schritt 5 deployed ist.** Verifikation: Abschnitt 6, Schritt V3.

### Schritt 7 — Dokumente nachziehen (P3)

`README.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `HANDOFF.md`, `docs/README.md` gemäß
Abschnitt 5.1. In `CLAUDE.md` zusätzlich die Cloudflare-Schicht in Zeile 197 ergänzen —
sie ist heute nicht dokumentiert und war in dieser Sitzung ein echter Fund.

**Verifikation:**
`grep -rn "hey-hi.cloud" README.md CLAUDE.md AGENTS.md GEMINI.md HANDOFF.md docs/README.md`
— jede Fundstelle nennt die für sie richtige Adresse; keine nennt `heyhi.cloud` ohne
Bindestrich. → **F7**

### Schritt 8 — Gesamtverifikation

```bash
npm run lint && npm run typecheck && CI=1 npm test && npm run build
```

→ **F8**. Danach F1–F6 am Live-Deploy.

**Zum Browser:** Für die Sichtprüfungen (F1–F6) starte ich keinen Browser selbstständig —
das ist so festgehalten. Ich sage, was zu sehen sein muss; du schaust hin, oder du gibst
den Browser-Start frei.

---

## 8. Reality Check (AGENTS.md, Phase 3)

**„Führt das zu Spaghetti-Code?"**
Nein. Vier Einzeiler in Beschriftungen und Metadaten, ein Anker in einer Kopfzeile, ein
Konfigurations-Hook von etwa zehn Zeilen in einer Datei, die drei vergleichbare Hooks bereits
hat. Keine neue Abstraktion, kein neuer Zustand, kein neuer Hook, keine neue Komponente.

**„Breche ich bestehende Hooks?"**
Nein — geprüft, nicht angenommen:
- `usePlaygroundState`, `usePlaygroundModels`, `useProviderMode`, `usePollenKey`,
  `useUnifiedImageToolState`, `useChatState`: nicht berührt.
- Schritt 4 fügt ein `<a>` ein — kein Hook, keine Reihenfolge-Regel, kein Render-Zyklus.
- Der einzige Hook-artige Eingriff ist `next.config.ts`, und der läuft im Routing, nicht in
  React.

**„Gibt es einen einfacheren, idiomatischeren Weg?"**
Ja, und er steht als Rückfrage 1: Variante B ist derselbe Aufwand, liefert dieselbe
Vanity-Adresse und erhält zusätzlich den geteilten Ursprung, den die ursprüngliche
Entscheidung sichern wollte. Ich setze das nicht eigenmächtig um — es ist deine
Entscheidung, und der Preis (Adresszeile) ist sichtbar.

**Wo droht Verschlimmbesserung — und was dagegen steht:**

| Risiko | Gegenmaßnahme |
|---|---|
| Beim „Aufräumen" werden `playground.*`-Schlüssel, Verzeichnisse oder der Routen-Pfad mitumbenannt und jede parallel laufende Phase kollidiert. | Abschnitt 5.4 zählt jede dieser Sachen namentlich als nicht anzufassen auf. |
| `PLAYGROUND_CONVERSATION_ID` oder ein `localStorage`-Schlüssel wird „konsistent" mitgezogen — und leert stillschweigend die Galerie bzw. setzt die Parameter jedes Nutzers zurück. | Beide in 5.4, mit Begründung „gespeicherter Datenwert, nicht Code". |
| Der Hostname wird ohne Bindestrich getippt und der Rewrite greift nie. Der Fehler ist stumm: die Seite antwortet, sie antwortet nur falsch. | Eine benannte Konstante statt eines Literals (5.1), die lokale `curl -H 'Host: …'`-Prüfung in Schritt 5, der optionale Test in 9.3, und die live geprüfte Tabelle in 2.2. |
| Domain vor dem Code eingetragen → `create.` zeigt für die Zwischenzeit den Chat und landet so im Browser-Cache. | Reihenfolge in Abschnitt 6 ausdrücklich festgehalten. |
| Preview-Deployments zeigen unter `/` weiterhin den Chat; jemand hält das für einen Fehler und weitet die Regel auf `/:path*` ohne Host-Bedingung aus — was den Chat auf allen Adressen zerstörte. | In Schritt 5 als erwartetes Verhalten benannt. |
| Ein absoluter Rückweg-Link (`https://chat.hey-hi.cloud/unified`) reißt den Nutzer unter Variante A aus seinem Datenursprung. | Schritt 4, Begründung 3: bewusst relativ. |

**Was dieser Plan **nicht** löst und auch nicht vorgibt zu lösen:** die Ursprungstrennung
unter Variante A. Sie wird in Rückfrage 1 benannt, nicht wegdefiniert.

---

## 9. Testplan

### 9.1 Bestehende Tests, die betroffen sind

Geprüft, nicht vermutet:

| Test | Betroffen? | Warum |
|---|---|---|
| `src/app/playground/PlaygroundShell.test.tsx` | **ja, additiv** | Mockt `useLanguage` als `t: (k) => k`, prüft also Schlüssel statt Texte — Schritt 1 kann ihn nicht brechen. Schritt 4 fügt einen Link ein, der dort zugesichert wird. |
| `src/app/playground/playground.e2e.test.tsx` | nein | Keine Zusicherung auf Kopfzeile oder Beschriftungen. |
| `src/components/playground/ModelPicker.test.tsx` | nein | Prüft den **Schlüssel** `playground.fallbackNotice`, nicht seinen Wert. Der Schlüssel bleibt. |
| `src/components/playground/PlaygroundSidebar.test.tsx` | nein | dito. |
| Tests zu `AppSidebar` | — | **existieren nicht.** Die Beschriftungsänderung ist ungetestet, wird über F3 sichtgeprüft. |
| Tests zu `translations.ts` | — | **existieren nicht.** |
| **Alle 780 Tests** | **indirekt** | `jest.config.ts` nutzt `next/jest`, das `next.config.ts` lädt. Ein Syntaxfehler oder ein ungültiges `rewrites`-Objekt legt die **gesamte** Suite lahm. Das ist zugleich das beste Netz für Schritt 5: `npm test` fällt sofort auf. |

### 9.2 Neue Zusicherung (verpflichtend)

In `PlaygroundShell.test.tsx`: der Rückweg-Link existiert und zeigt auf `/unified`.
Ein Anker braucht keinen zusätzlichen Mock — genau deshalb ist es ein Anker.

### 9.3 Optionaler Test auf die Rewrite-Regel (empfohlen)

Ein kleiner Test, der `next.config.ts` importiert und zusichert, dass genau eine Regel mit
`type: 'host'` existiert und ihr Wert `create.hey-hi.cloud` **mit Bindestrich** lautet.

Begründung: Der Bindestrich-Vertipper ist die vom Handoff benannte Falle, er scheitert
**stumm**, und er ist von Hand nur am Live-Deploy zu bemerken. Ein Test kostet zwölf Zeilen
und macht die Falle unmöglich. Wenn du Tests auf Konfigurationsdateien grundsätzlich nicht
willst, entfällt der Punkt — die `curl`-Prüfung aus Schritt 5 bleibt.

### 9.4 Manuelle Prüfungen

F1–F7 aus Abschnitt 3, dazu:

- Sprache auf DE und auf EN je einmal durchklicken (Schritt 1 ändert beide Blöcke)
- `curl -s -H 'Host: create.hey-hi.cloud' http://localhost:3000/` **vor** dem Deploy
- Gegenprobe: `chat.hey-hi.cloud/playground` bleibt direkt erreichbar (alte Links Dritter)

---

## 10. Ausdrücklich **nicht** Teil dieser Phase

| Sache | Wohin es gehört |
|---|---|
| Umbenennung von `src/components/playground/` und `src/lib/playground/` | nirgendwohin — vom Nutzer ausgeschlossen |
| Routen-Pfad `/playground` → `/create` | Rückfrage 2, vorerst vertagt |
| Umbenennung der `playground.*`-Übersetzungsschlüssel | vertagt, ohne sichtbaren Nutzen |
| „14 Pruna models" in `playground.prunaEmpty` | **Phase 3** (Modellwahrheit) — und der Schlüssel ist tot, siehe 11.1 |
| Gemeinsame Galerie, Herkunfts-Tag, Löschen im Create | **Phase 5** |
| Create auf dem Telefon, Kopfzeile auf schmalen Geräten | **Phase 6** |
| Modell-Listen, `isFree`-Flags, Registry-Abgleich | **Phase 3** |
| `vercel.json` / `maxDuration`, Fehlermeldungen, Pollen-403 | **Phase 4** |
| Musik als Modus im Create | **Phase 8** |
| ASCII-Effekte im Create | **Phase 9** |
| Wortwahl „Output" (Chat) vs. „Gallery" (Create) | offen, keiner Phase zugeordnet — siehe 11.4 |
| Konsolidierung des Arbeitsbaums | **Phase 0** |

---

## 11. Befunde für andere Phasen (hier aufgenommen, hier nicht gelöst)

### 11.1 Fünf von sieben `playground.*`-Schlüsseln sind tot

Gelesen werden nur `playground.sidebarLink` (`AppSidebar.tsx:130`) und
`playground.fallbackNotice` (`ModelPicker.tsx:59`). `playground.title`,
`playground.prunaEmpty`, `playground.generate`, `playground.cancel` und `playground.enhance`
stehen in keiner Komponente — je zweimal in `translations.ts` und sonst nirgends.

Folge: Der vom Handoff als Falle markierte Satz **„Add a Pruna key to unlock 14 Pruna
models" erreicht nie einen Nutzer.** Die fest verdrahtete Zahl ist damit weniger dringend
als angenommen — aber die toten Schlüssel gehören aufgeräumt. **→ Phase 3**, zusammen mit
der Modellwahrheit.

*(Dieser Plan zieht `playground.title` trotzdem mit, weil ein toter Schlüssel, der beim
nächsten Anfassen wieder auf „Playground" steht, die Umbenennung stillschweigend rückgängig
macht.)*

### 11.2 Der deutsche Übersetzungsblock ist an dieser Stelle englisch

`translations.ts:56–62` liegt im `de`-Block, führt aber `'Generate'`, `'Cancel'`,
`'Enhance'` und `'Offline list — live registry unavailable'`. Schritt 1 zieht das mit, weil
es dieselben sieben Zeilen sind. Ob es anderswo in der Datei ebenso aussieht, wurde **nicht**
geprüft. **→ eigener kleiner Durchgang, keiner Phase zugeordnet.**

### 11.3 Chat und Create teilen keinen Browser-Ursprung — Phase 5 hängt daran

Siehe Rückfrage 1. Wird Variante A gewählt, ist die Voraussetzung von **Phase 5** nicht
erfüllt und Phase 5 muss neu geschnitten werden. **Diese Entscheidung fällt hier, ihre
Rechnung kommt dort.**

### 11.4 `CLAUDE.md` Zeile 197 kennt die Cloudflare-Schicht nicht

Die Deploy-Wahrheit nennt Vercel als Host. Tatsächlich steht Cloudflare als Proxy davor
(`server: cloudflare`, `cf-ray`, `cf-cache-status` in jeder Antwort). Für DNS-, Cache- und
Header-Fragen ist das der Unterschied zwischen „funktioniert nicht" und „an der falschen
Stelle gesucht". Schritt 7 ergänzt es.

---

## 12. Nächster Schritt

**Stopp nach AGENTS.md Phase 3.** Ich warte auf:

1. **Antwort auf Rückfrage 1** — Variante A (wie entschieden) oder B (Empfehlung)?
2. Antwort auf Rückfrage 3 (Wortlaut/Icon), falls dir `Create →` nicht passt
3. Bestätigung, dass Phase 0 vor der Ausführung landet
4. Freigabe („leg los")
