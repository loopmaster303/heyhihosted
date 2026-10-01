# Playground UI-Redesign — SDD-Plan

**Datum:** 2026-08-10
**Branch:** `playground/redesign` (abgezweigt von `playground/multimedia` @ `506b620`)
**Worktree:** `/Users/johnmeckel/heyhihosted-playground`
**Mockup (freigegeben):** https://claude.ai/code/artifact/6fc9e819-e1bb-4eda-9449-778fb51e5456

## Warum

Der Playground wurde als **zweites Design-System** neben heyhihosted gebaut: 1112 Zeilen handgeschriebenes CSS-Modul, keine shadcn-Komponenten, Emoji statt lucide-Icons, eigene Dropdowns ohne Click-Outside/Keyboard. Das Ergebnis wirkt fremd und ist teilweise kaputt (Dropdown schließt nicht, Referenz-Bilder nicht entfernbar, Empty-States fehlen, 2 % Kontrast zwischen Grund und Fläche).

Dieser Plan ersetzt das durch **die vorhandenen heyhihosted-Bausteine**.

## Was schon da ist — NICHT neu bauen

| Zweck | Vorhanden |
|---|---|
| Glas-Flächen | `.glass-panel` `.glass-input` `.glass-popover` `.glass-button` in `src/app/globals.css` (@layer utilities) |
| Buttons | `src/components/ui/button.tsx` — Varianten `default`(=glass-button) `outline` `ghost` `secondary` `destructive`, Größen `default` `sm` `lg` `icon` |
| Dropdowns | `src/components/ui/dropdown-menu.tsx` (Radix) |
| Modal | `src/components/ui/popup.tsx` — `variant="modal"`, Portal + framer-motion |
| Mobile-Sheet | `src/components/ui/drawer.tsx` (vaul) |
| Slider | `src/components/ui/slider.tsx` (Radix) |
| Inputs | `input.tsx` `textarea.tsx` `label.tsx` `badge.tsx` `scroll-area.tsx` |
| Icons | `lucide-react` ^0.475 |
| Klassen-Merge | `cn()` aus `@/lib/utils` |

**Verboten:** neue CSS-Module, neue Farbwerte, neue Radix-Deps, eigene Dropdown-/Modal-Implementierungen, Emoji als Icons.

## Zielzustand

```
┌────────────────┬─────────────────────────────┬──────────┐
│ SIDEBAR        │ GALERIE                     │ META     │
│ glass-panel    │ Karten behalten ihr echtes  │ RAIL     │
│ 300px fix      │ Seitenverhältnis, kein Crop │ ≥1280px  │
│                │                             │          │
│ 1 Provider ▾   │                             │          │
│   ● Lampe      │                             │          │
│ 2 t2i i2i      │                             │          │
│   t2v i2v      │                             │          │
│ 3 Modell ▾     ├─────────────────────────────┴──────────┤
│ 4 Params       │ PROMPT (glass-input, wächst mit Text)  │
│                │                    Enhance · Senden    │
└────────────────┴────────────────────────────────────────┘
```

Verbindliche Details aus dem Mockup:
- **Keine horizontalen Borders** an Topbar und Prompt-Bar. Trennung entsteht durch Glas.
- **Ambient-Hintergrund** auf dem App-Grund, damit `backdrop-blur` überhaupt etwas zu verwischen hat:
  `radial-gradient(78% 52% at 10% -6%, hsl(var(--primary)/0.16), transparent 64%)` +
  `radial-gradient(62% 48% at 92% 104%, hsl(325 72% 60%/0.10), transparent 62%)`
- **Prompt-Feld wächst** mit dem Inhalt, Deckel bei 45 % der Fensterhöhe, erst dann `overflow-y:auto`.
- **„Senden"** als Wort, ohne Pfeil-Icon.
- **Verbunden = nur grüne Lampe**, kein Text. Nur der Fehlzustand bekommt eine Zeile: „Kein Key — Einstellungen".
- **Keine Prompt-Vorschläge** im leeren Zustand. Nur Icon + „Noch nichts generiert" + „Schreib einen Prompt und drück Senden."
- **Galerie-Karten nicht beschneiden.**
- Der **Hero entfällt** als eigenes Element. `Hero.tsx` wird gelöscht.

## Worker-Setup

Jeder Task geht an einen frischen **opencode**-Worker:

```bash
opencode run \
  --model opencode-go/kimi-k2.7-code \
  --dir /Users/johnmeckel/heyhihosted-playground \
  --auto \
  "<Task-Text — NUR der eine Abschnitt aus diesem Plan>"
```

Im Hintergrund starten, auf Exit warten, dann Ergebnis prüfen.

**Regeln:**
- Kein Worker bekommt diesen Plan als Ganzes — nur seinen Abschnitt plus den Block „Gemeinsame Regeln".
- Fehler eines Workers werden **nie inline** vom Orchestrator gefixt. Neuer Worker mit präzisem Fix-Prompt, ohne Bezug auf den Vorgänger.
- Nach jedem Task: `npm run lint` + `npm run typecheck` + betroffene Tests. Rot → Fix-Worker, max 5 Runden.
- Ledger: `.superpowers/sdd/2026-08-10-playground-redesign/progress.md`.

## Gemeinsame Regeln (an JEDEN Worker mitgeben)

```
Projekt: Next.js 16 App Router, TypeScript, Tailwind, shadcn/Radix.
Styling AUSSCHLIESSLICH über Tailwind-Klassen + cn() aus '@/lib/utils'.
NIEMALS: neue .module.css Dateien, Inline-Hex-Farben, Emoji als Icons,
eigene Dropdown-/Modal-Implementierungen.
IMMER: Komponenten aus '@/components/ui/*', Icons aus 'lucide-react',
Farben nur über Tailwind-Tokens (bg-background, text-muted-foreground,
border-border, bg-primary …) oder die Glas-Utilities
glass-panel / glass-input / glass-popover / glass-button.
Texte auf Deutsch über useLanguage() t('...') wo der Code das schon tut.
Fokus sichtbar lassen — kein outline:none ohne Ersatz.
Schreib die Datei(en) und sonst nichts. Keine Erklärung.
```

### Test-Regeln (Pflicht in JEDEM Test, der eine Komponente rendert)

Jest transformiert `node_modules` nicht. `lucide-react` und die Radix-basierten
shadcn-Komponenten sind ESM und lassen die ganze Suite mit
`SyntaxError: Cannot use import statement outside a module` platzen.
Die Fehlermeldung zeigt dabei auf die falsche Zeile — meist auf einen
shadcn-Import, obwohl `lucide-react` schuld ist.

Deshalb ganz oben in jeden Test, **vor** den Imports der Komponente:

```tsx
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));
```

Zusätzlich jede benutzte shadcn-Komponente per `jest.mock` durch schlichte
DOM-Stellvertreter ersetzen. Vorbild:
`src/components/chat/input/MobileOptionsMenu.test.tsx`.
Ein gestubbtes `DropdownMenuContent` muss seine Kinder **immer** rendern,
sonst sind Menüeinträge nicht abfragbar. `DropdownMenuItem` verdrahtet
`onSelect` auf `onClick`.

---

# Tasks

## Task 1 — Layout-Shell

**Datei:** `src/app/playground/PlaygroundShell.tsx` (umschreiben)

Ersetze das Grid-Markup. Struktur:

```
<div class="h-dvh grid grid-rows-[46px_1fr] relative isolate text-foreground
            bg-[radial-gradient(78%_52%_at_10%_-6%,hsl(var(--primary)/0.16),transparent_64%),radial-gradient(62%_48%_at_92%_104%,hsl(325_72%_60%/0.10),transparent_62%)]
            bg-background">
  <header class="flex items-center justify-between px-3.5
                 bg-glass-background/55 backdrop-blur-2xl">
     Logo links (Punkt + "heyhi / playground"), Settings-Zahnrad rechts (Button variant=ghost size=icon, lucide Settings)
  </header>
  <div class="grid grid-cols-1 md:grid-cols-[300px_1fr] min-h-0">
     <PlaygroundSidebar />
     <main class="grid grid-rows-[1fr_auto] min-h-0 min-w-0">
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_296px] min-h-0"> Galerie + MetaRail </div>
        <PromptBar />
     </main>
  </div>
</div>
```

Keine `border-b` an der Topbar. Die gesamte bestehende Logik (`usePlaygroundState`, `usePlaygroundModels`, `onGenerate`, `onEnhance`, Reset-Effect, Sentinel-Persistenz) **unverändert übernehmen** — nur das JSX und die Imports ändern sich. `Hero`-Import und `heroState`/`heroMedia` bleiben vorerst drin, Task 7 baut sie um.

Die Kind-Komponenten `PlaygroundSidebar`, `PromptBar`, `MetaRail` gibt es noch nicht — leg für diesen Task Platzhalter-Dateien an, die nur ein leeres `<aside>`/`<div>` mit den obigen Klassen rendern. Spätere Tasks füllen sie.

**Verifikation:** `npm run typecheck` + `npm run lint`.

---

## Task 2 — ProviderSelect

**Neu:** `src/components/playground/ProviderSelect.tsx`
**Löschen:** `src/components/playground/ProviderSwitch.tsx` + `.test.tsx`, `ApiKeyField.tsx` + `.test.tsx`

Ein `DropdownMenu` (aus `@/components/ui/dropdown-menu`) als Provider-Wahl.

- Trigger: `Button variant="outline"` volle Breite, links ein 6px-Statuspunkt, dann Providername, rechts `ChevronDown`.
- Statuspunkt: verbunden → `bg-[hsl(150_55%_50%)]` mit weichem Glow; kein Key → `bg-[hsl(38_85%_60%)]`. (Diese zwei Zustandsfarben sind erlaubt, sie sind semantisch, kein Akzent.)
- Items: „Pollinations" und „Pruna", jeweils mit Punkt, rechts als `DropdownMenuShortcut`-artiger Hinweis die Modellanzahl bzw. „Key fehlt". Aktives Item bekommt ein `Check`-Icon.
- Unter dem Trigger: **nur wenn kein Key vorhanden** eine Zeile `text-xs text-[hsl(38_85%_60%)]` mit „Kein Key — " und einem unterstrichenen Button „Einstellungen", der `onOpenSettings()` ruft. Bei vorhandenem Key **gar nichts** rendern.
- Props: `{ onOpenSettings: () => void }`. Provider-State über `useProviderMode()`, Key-Präsenz über `useHasPollenKey()` bzw. `useHasPrunaKey()` (beide existieren in `src/hooks/`).

**Test:** `ProviderSelect.test.tsx` — (1) zeigt keine Textzeile wenn Key da, (2) zeigt „Einstellungen"-Button wenn Key fehlt und ruft `onOpenSettings`, (3) Wechsel des Providers ruft `setProviderMode`.

---

## Task 3 — SettingsDialog

**Neu:** `src/components/playground/SettingsDialog.tsx`

Modal über `Popup` aus `@/components/ui/popup.tsx` mit `variant="modal"`.

Inhalt:
- Kopfzeile „Einstellungen" + Schließen-Button (`X` aus lucide, `Button variant="ghost" size="icon"`).
- Block **Pollinations**: Name, Statuspunkt, Statuswort. `Input type="password"` mit dem Key + Button „Verbinden" bzw. „Trennen". Darunter `text-xs text-muted-foreground`: „Wird für Chat, Bilder und Video geteilt. Liegt im Browser-Speicher."
- Trennlinie `h-px bg-border`.
- Block **Pruna**: analog, Hinweistext „Schaltet die p-* Modellfamilie frei — Upscale, Video, Edit."
- Trennlinie.
- Block **Standardmodelle** mit `Badge variant="secondary"` „später" und einer Zeile Erklärtext. Keine Funktion.

Keys lesen/schreiben: Pollen über `usePollenKey()` (`connectManual` / `disconnect`), Pruna über `localStorage['prunaApiKey']` — Initialwert per **lazy** `useState(() => …)`, nicht im Effect setzen (Lint-Regel `react-hooks/set-state-in-effect`).

Props: `{ open: boolean; onClose: () => void }`.

**Test:** `SettingsDialog.test.tsx` — rendert beide Key-Blöcke, „Verbinden" bei leerem Pruna-Feld schreibt in localStorage.

---

## Task 4 — ModeTabs

**Neu:** `src/components/playground/ModeTabs.tsx`
**Löschen:** `src/components/playground/ModeSwitch.tsx` + `.test.tsx`

Vier Segmente nebeneinander: `t2i i2i t2v i2v`.

- Container: `grid grid-cols-4 gap-0.5 p-0.5 rounded-xl bg-background/60 border border-border`.
- Segment: `role="tab"`, aktiv → `bg-primary text-primary-foreground font-semibold`, inaktiv → `text-muted-foreground hover:text-foreground`. `rounded-lg`, `text-xs`, `py-2`.
- Props: `{ value: PlaygroundMode; onChange: (m: PlaygroundMode) => void }` — Typ aus `@/lib/playground/mode-mapping`.

**Test:** vier Tabs vorhanden, Klick ruft `onChange`, aktiver hat `aria-selected="true"`.

---

## Task 5 — ModelPicker

**Neu:** `src/components/playground/ModelPicker.tsx`
**Löschen:** `src/components/playground/ModelSelect.tsx` + `.test.tsx`

`DropdownMenu` mit Gruppen.

- Trigger: `Button variant="outline"` volle Breite, Modellname links, rechts ein `Badge variant="secondary"` mit „frei" / „Key" und `ChevronDown`.
- Menü: `DropdownMenuLabel` als Gruppenüberschrift („Frei", „Key nötig"), darunter die Items. Aktives Item mit `Check`-Icon. Max-Höhe ~260px, scrollbar.
- Gruppierung: Modelle mit `isFree === true` unter „Frei", der Rest unter „Key nötig". Feld kommt aus dem `PlaygroundModelEntry`; falls es dort nicht liegt, über `getUnifiedModel(id)?.isFree` auflösen.
- Props unverändert übernehmen aus dem alten `ModelSelect`: `{ entries, mode, value, onChange, loading, fallbackActive }`. Bei `fallbackActive` eine Zeile `text-xs text-muted-foreground bg-muted rounded-md px-2 py-1` über dem Trigger mit `t('playground.fallbackNotice')`.

**Test:** gruppiert korrekt, Klick ruft `onChange`, disabled bei `loading`.

---

## Task 6 — Params-Block

**Neu/umschreiben:**
- `src/components/playground/AspectRatioPills.tsx` — Pills als `Button variant="outline" size="sm"` mit `rounded-full`; aktiv → `variant="default"`. Bestehende Props und Preset-Quelle beibehalten.
- `src/components/playground/ReferenceSlots.tsx` (ersetzt `ReferenceUploads.tsx` + `.test.tsx`) — Grid `grid-cols-2 gap-2`, Slot ist `aspect-square rounded-xl border border-dashed`. Gefüllter Slot: Bild `object-cover absolute inset-0`, oben links `Badge` mit „Start"/„Ende"/„#n", oben rechts ein **Entfernen-Button** (`X`, `Button variant="ghost" size="icon"` mit dunklem Backdrop). Der Entfernen-Knopf fehlt aktuell komplett — er ist Pflicht. Upload-Funktion `uploadPlaygroundReference` unverändert übernehmen.
- `src/components/playground/DurationSlider.tsx` — auf `Slider` aus `@/components/ui/slider` umstellen, rechts daneben der Wert in `tabular-nums`.
- `src/components/playground/AdvancedPanel.tsx` — Collapsible per lokalem State. **Lesbare deutsche Labels** statt Variablennamen: „Negativ-Prompt", „Seed", „Guidance", „Schritte". Negativ-Prompt als `Textarea`, die anderen als `Input type="number"`. Feld-Sichtbarkeit nach `unifiedModelConfigs[modelId].inputs` wie bisher.

**Test:** ReferenceSlots — Entfernen-Button leert den Slot und ruft `onChange` mit dem gekürzten Array.

---

## Task 7 — Gallery + MetaRail

**Umschreiben:** `src/components/playground/Gallery.tsx`
**Neu:** `src/components/playground/MetaRail.tsx`
**Löschen:** `src/components/playground/Hero.tsx`

**Gallery:**
- Kopf: `Ausgabe` (uppercase, `text-[10px] tracking-widest text-muted-foreground`) links, Anzahl rechts.
- Grid: `grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(168px,1fr))]`.
- Karte: `<button>` mit `relative rounded-xl overflow-hidden border border-border hover:border-primary/55 hover:-translate-y-0.5 transition`. Ausgewählt → `border-primary ring-1 ring-primary`.
- **Bild/Video behält sein Seitenverhältnis** — `w-full h-auto`, kein `object-cover`, kein festes `aspect-*`.
- Video-Karten bekommen oben rechts ein `Play`-Badge.
- Hover/Selected blendet unten einen Verlaufsschleier + Modellname und Ratio ein.
- **Leerer Zustand:** zentriert, `ImageIcon` in einem `rounded-xl border` Kästchen, darunter „Noch nichts generiert" und „Schreib einen Prompt und drück Senden." **Keine Vorschläge.**
- Sentinel-Query (`conversationId === PLAYGROUND_CONVERSATION_ID`) unverändert.
- Props: `{ selectedId: string | null; onSelect: (item: GalleryItem) => void }`.

**MetaRail:**
- `glass-panel border-l`, scrollbar, nur ab `xl` sichtbar (Sichtbarkeit steuert Task 1 im Grid).
- Inhalt bei Auswahl: `Badge` „Bild"/„Video", Vorschau, Prompt in Sans, dann Parameter als kleine Tags (`Modell`, `ar`, `seed`, `steps`, `guidance`, relative Zeit), darunter drei Buttons: „Laden" (`Download`), „Nochmal" (`RotateCcw`), „Als Referenz übernehmen" (`Plus`, volle Breite).
- Ohne Auswahl: zentrierter `text-xs text-muted-foreground` „Wähl ein Ergebnis, um Prompt und Parameter zu sehen."

**Test:** Gallery zeigt Empty-State ohne Items; Klick auf Karte ruft `onSelect`.

---

## Task 8 — PromptBar

**Neu:** `src/components/playground/PromptBar.tsx`
**Löschen:** `src/components/playground/PromptPanel.tsx` + `.test.tsx`, `GenerateButton.tsx`, `MobileBar.tsx` + `.test.tsx`

- Äußerer Container: `px-4 pt-3 pb-3.5`, **kein** `border-t`, transparenter Hintergrund.
- Feld-Container: `glass-input rounded-2xl border border-border/80 shadow-lg flex items-end gap-2.5 pl-4 pr-2.5 py-2.5`, bei `focus-within` Ring `ring-[3px] ring-primary/15 border-primary/55`.
- `Textarea` ohne eigenen Rahmen, `resize-none`, `overflow-hidden`. **Auto-Grow per `useLayoutEffect`:** Höhe auf `auto`, dann auf `min(scrollHeight, 45vh)`; überschreitet der Inhalt den Deckel → `overflow-y:auto`.
- Rechts: „Enhance" (`Button variant="outline"` mit `Sparkles`-Icon, `rounded-full`) und „Senden" (`Button variant="default"` `rounded-full`, **Text ohne Icon**). Während des Generierens wird „Senden" zu „Abbrechen".
- Unter dem Feld eine Statuszeile `text-[10px] text-muted-foreground`: Modell · Ratio · Provider, rechts der Zeichenzähler `tabular-nums`.
- Mobil: Enhance zeigt nur das Icon (`sr-only` Text).
- Props: `{ value, onChange, onEnhance, enhancing, onSend, onCancel, sending, modelName, ratio, providerName }`.

**Test:** Auto-Grow setzt `style.height`; „Senden" ist deaktiviert bei leerem Prompt; im Sendezustand erscheint „Abbrechen".

---

## Task 9 — Sidebar + Mobile

**Neu:** `src/components/playground/PlaygroundSidebar.tsx` (ersetzt den Platzhalter aus Task 1)

- Desktop: `glass-panel border-r border-border/45 flex flex-col min-h-0`, innen `ScrollArea` mit `flex flex-col gap-4 p-3.5`.
- Reihenfolge streng: **Provider → Modus → Modell → Seitenverhältnis → Referenzen → Dauer → Erweitert**.
- Jede Gruppe hat ein Label `text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75`.
- **Referenzen** nur bei `mode === 'i2i' | 'i2v'`, **Dauer** nur bei `mode === 't2v' | 'i2v'`.
- Mobil (`< md`): Sidebar steckt in einem `Drawer` (vaul, `direction="left"`), Trigger ist ein `Menu`-Icon-Button in der Topbar. Derselbe Inhalt, kein zweiter Code-Pfad.

**Verifikation:** `npm run lint` + `npm run typecheck`.

---

## Task 10 — Aufräumen + Abschluss

- `src/app/playground/playground.module.css` **löschen**. Prüfen, dass kein Import mehr darauf zeigt: `grep -rn "playground.module.css" src/`.
- Verwaiste Tests der gelöschten Komponenten entfernen.
- `src/config/translations.ts`: alle im Redesign benutzten Keys in DE und EN ergänzen.
- `src/app/playground/playground.e2e.test.tsx` an die neue Struktur anpassen (Selektoren auf Rollen/Labels umstellen).

**Abschlussverifikation:**
```bash
npm run lint
npm run typecheck
CI=1 npm test -- --runInBand
```

Danach Dev-Server für den manuellen Durchgang:
```bash
npm run dev
```

## Gate

Merge zurück nach `playground/multimedia` erst wenn:
1. Lint 0 Errors, Typecheck clean, Tests grün
2. Mein Review PASS
3. Dein Durchgang auf `localhost:3000/playground` grün

Danach steht die Merge-nach-`main`-Frage neu — der Plan `2026-08-08-playground-preflight-and-merge-fixes.md` gilt dafür weiter, seine Preflight-Findings sind durch dieses Redesign teilweise gegenstandslos.
