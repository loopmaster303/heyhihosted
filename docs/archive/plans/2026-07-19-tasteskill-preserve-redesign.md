# Plan: tasteskill Preserve-Redesign (Step 3)

**Datum:** 2026-07-19
**Quelle:** tasteskill v2 Audit (Step 1) + Mode-Deklaration (Step 2), Chat-Protokoll
**Mode:** Redesign — **Preserve** | **Dials:** VARIANCE 3 / MOTION 7 / DENSITY 3 (Ist-Reading, gematcht)
**Regelwerk:** ausschließlich tasteskill v2 (`~/taste-skill/skills/taste-skill/SKILL.md`)

---

## 0. Rahmen

| Was | Wert |
|---|---|
| Scope | Marketing-Flächen `/` (LandingView) + `/about`, globale Foundation (Fonts, Tokens, SEO) |
| Out of Scope | Chat, GalleryPanel, Settings, alle Hooks (`ChatProvider`, `useUnifiedImageToolState`, `useComposeMusicState`), API-Routes (Section 13: App-UI) |
| Preservation-Lock (11.F) | URLs, Nav-Labels, Formfeldnamen, ASCII-Wordmark, Copy-Stimme, Legal-Texte — unverändert |
| Verification | `npm run build` + `npm run typecheck` nach jedem WP; `npm run lint` am Ende |

**Offene Entscheidungen (Default = wird so gebaut, sofern nicht widersprochen):**

1. **Font:** System-Mono-Stack behalten (kein Webfont). Alternative: Geist Mono self-hosted via `next/font`.
2. **`lang`-Attribut:** `de` (Default-Content ist Deutsch). Alternative: `en` behalten.
3. **„beta test phase"-Label im AboutCTA:** behalten (echter Produktstatus, 9.F-Ermessensfall). Alternative: entfernen.

---

## WP1 — Typography Foundation (Lever 1)

**Ziel:** Broken Font-Request + toter Inter-Link raus. Null visuelle Änderung.

| Datei | Änderung |
|---|---|
| `src/app/layout.tsx` | Beide Google-Fonts-`<link>` (Inter, Code) + beide `preconnect`-Links entfernen |
| `tailwind.config.ts` | `fontFamily.body/code/mono`: führendes `'Code'` entfernen → `['ui-monospace', 'monospace', 'Menlo', 'Consolas', '"Courier New"', 'serif']`. Klassennamen bleiben identisch, keine Component-Änderung nötig |

**Verifizieren:** Build grün; keine `fonts.googleapis.com`-Requests mehr im Netzwerk-Tab; Landing/About sehen pixelgleich aus (Code-Font hat eh nie geladen).

---

## WP2 — SEO Foundation (11.B Risiko #1)

**Ziel:** Kaputte Basis-Metadata reparieren, ohne URLs anzufassen.

| Datei | Änderung |
|---|---|
| `src/app/layout.tsx` | Metadata: Title-Template (`%s · hey.hi`), reparierte Description (ohne `</hey.hi>`-Artefakt), `metadataBase`, OpenGraph, Twitter-Card, `robots`. `lang="de"` (s. Entscheidung 2) |
| `src/app/about/layout.tsx` *(neu)* | Server-Layout, nur `export const metadata` (Title/Description/Canonical für /about) |
| `src/app/chat/layout.tsx` *(neu)* | Metadata + `alternates.canonical: '/'` |
| `src/app/unified/layout.tsx` *(neu)* | Metadata + `alternates.canonical: '/'` |
| `src/app/settings/layout.tsx` *(neu)* | Metadata + `robots: { index: false }` |
| `src/app/gallery/layout.tsx` *(neu)* | Metadata + `robots: { index: false }` (deprecated Route) |
| `src/app/robots.ts` *(neu)* | Next-Convention, allow all + Sitemap-Verweis |
| `src/app/sitemap.ts` *(neu)* | `/` + `/about` (die einzigen indexierbaren Marketing-Flächen) |
| `src/app/opengraph-image.tsx` *(neu)* | `ImageResponse`: Off-Black-Grund, Brand-Lila #B388FF, „hey.hi" + Tagline. Kein Em-Dash |

**Nicht:** Redirects (URLs bleiben erreichbar), Structured Data (kein echter Content dafür vorhanden).

**Verifizieren:** Build grün; `view-source:` zeigt korrekte Tags pro Route; keine 404 in Sitemap.

---

## WP3 — Color Recalibration (Lever 3)

**Ziel:** Reines #000 raus (9.A), dekorativen Glow rationieren. Brand-Lila unangetastet.

| Datei | Änderung |
|---|---|
| `src/app/globals.css` | `.dark`: `--background: 0 0% 0%` → `240 6% 4%` (Off-Black, gleiche Neutralfamilie wie bestehende Card-Tokens); dunkle `--surface-container-*` (aktuell alle `0 0% 0%`) auf abgestufte Off-Blacks |
| `src/components/page/about/AboutCTA.tsx` | Dekorativen `textShadow`-Glow auf der Headline entfernen, Farbe #B388FF behalten |

**Explizit behalten:** `glow-purple/green/blue` (semantische Tool-Menü-States), Brand-Lila `hsl(267 78% 55%/65%)`, Mode-Farben, Glass-System.

**Risiko:** Dark-Token-Kaskade trifft App-UI (Chat-Bubbles, Inputs). Mitigation: nur `--background` + `--surface-container-*` ändern, Card/Popover unangetastet, Dark-Mode-Sichtprüfung Chat + Gallery.

**Verifizieren:** Kontrast Background↔Foreground unverändert AA; kein sichtbarer Sprung in App-UI.

---

## WP4 — Slop-Removal (Section 9, nur sichtbare Copy + Marketing-Flächen)

| # | Datei | Änderung | Regel |
|---|---|---|---|
| 4.1 | `src/config/translations.ts` | 20 Em-Dashes (`—`) in sichtbaren Strings → Komma/Punkt/Doppelpunkt, Satzrhythmus behalten (de + en). Keys unverändert | 9.G |
| 4.2 | `src/components/page/about/AboutHero.tsx` | Scroll-Cue-Block entfernen (motion.div + ChevronDown + `about.hero.scroll`); verwaiste Imports (`motion`, `ChevronDown`) + Translation-Key `about.hero.scroll` (de/en) mit entfernen | 9.F |
| 4.3 | `src/config/translations.ts` | Kicker `// open · local-first · login optional` → `// open · local-first, login optional` (max 1 `·` pro Zeile, de + en) | 9.F |
| 4.4 | `src/components/ui/PageLoader.tsx` | `h-screen` → `min-h-[100dvh]` | 3.E |
| 4.5 | `src/components/ui/popup.tsx` | `window.addEventListener('scroll', updatePosition)` → IntersectionObserver: Popup schließt, wenn der Anker aus dem Viewport scrollt | 5.D |

**Nicht angefasst:** Em-Dashes in LLM-Prompts (`enhancement-prompts.ts`, `chat-options.ts` etc.) und Code-Kommentaren — 9.G gilt nur sichtbarem Text.

**Achtung bei 4.5:** Einzige Verhaltensänderung im gesamten Plan. Popup folgt dem Scroll nicht mehr, sondern schließt. Vor dem Bauen Usage von `popup.tsx` prüfen (Wo eingesetzt? Wäre Schließen dort störend?).

**Verifizieren:** `grep "—" src/config/translations.ts` = 0; `grep "addEventListener.*scroll" src/` = 0; Popup manuell testen.

---

## WP5 — AboutFeatures Layout (Lever 5, einziger Layout-Eingriff)

| Datei | Änderung |
|---|---|
| `src/components/page/about/AboutFeatures.tsx` | `lg:grid-cols-3` (5 gleiche Karten, 9.C-Tell) → `lg:grid-cols-6` mit 3+2-Rhythmus: Zeile 1 = 3× `lg:col-span-2`, Zeile 2 = 2× `lg:col-span-3`. Mobile bleibt 1-spaltig |

**Verifizieren:** Desktop + Mobile Sichtprüfung; keine Content-Änderung.

---

## WP6 — Step-4-Audits (schriftlich, Abnahme-Gate)

1. **Em-Dash-Audit:** `grep -rn "—\|–"` über sichtbare Copy (translations, About-, Landing-Components) → muss 0 sein.
2. **Pre-Flight Check (Section 14):** relevante Boxen schriftlich abhaken (Em-Dash, Theme-Lock, Color-Lock, Shape-Lock, Kontrast-Checks, Hero-Discipline, Motion-Motivation, `min-h-[100dvh]`, Cleanup-Functions, Icons, Reduced Motion, Web Vitals plausibel).
3. **Preservation-Audit:** Liste aller geänderten URLs, Nav-Labels, Formfelder, Anchor-IDs → **muss leer sein**.
4. **Brand-Fidelity-Audit:** Lila #8B5CF6/#B388FF, Mono-Type, ASCII-Wordmark, Glass-System — Screenshot-Vergleich vorher/nachher (Landing + About, light + dark).

**Jeder Fail blockiert Fertigstellung.**

---

## Reality Check (Phase 3, bereits auditiert)

- **Spaghetti-Risiko:** Keins. Neue Dateien sind Next-Conventions (metadata layouts, robots, sitemap), keine neuen Abstraktionen.
- **Hooks gebrochen?** Nein. Kein Hook wird angefasst; `ChatProvider`-Baum bleibt unverändert.
- **Größtes Restrisiko:** WP3 Dark-Token-Kaskade (App-UI-Kontraste) und WP4.5 Popup-Verhalten. Beide manuell verifizierbar, beide einzeln revertbar.
- **Einfacherer Weg?** Nein — jeder WP mappt 1:1 auf einen Audit-Befund aus Step 1.

## Commit-Strategie

Ein Branch, ein Commit pro WP (`WP1`…`WP5`), WP6 als Abschluss-Report. Jeder WP einzeln revertbar.

## Aufwand

| WP | Größe |
|---|---|
| WP1 Fonts | XS |
| WP2 SEO | M |
| WP3 Color | S |
| WP4 Slop | S–M |
| WP5 Features-Grid | XS |
| WP6 Audits | S |
