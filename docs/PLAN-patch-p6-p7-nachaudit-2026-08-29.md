# Patch-Plan — Nachaudit Phase 0–7 (2026-08-29)

> **For agentic workers:** REQUIRED: Invoke the `using-superpowers` skill FIRST — before
> any response or action. Then implement this plan with
> `superpowers:subagent-driven-development`: one fresh implementer subagent per task,
> spec-compliance review, then code-quality review, before the next task starts.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle nachgebliebenen Befunde aus dem Nachaudit der Phasen 0–7 beheben und die
Wahrheitsdokumente in Einklang bringen.

**Architecture:** Kleine, dateidisjunkte Tasks: ein Dokumentbefund (P2), ein
A11y-Defekt im Chat-Picker (P3), tote Übersetzungsschlüssel (P3), eine
Performance-Korrektur am Regelaufruf (P3), und zwei geschärfte Phase-5-Befunde:
ein Bestätigungstext, der den Lösch-Umfang verschweigt (P3, nach Vertiefung
heruntergestuft), und ein extern nicht mitgelöschter Medien-Storage-Blob (P2).
Kein Task berührt dieselbe Datei wie ein anderer; jeder ist eine Prüf- und
Commitgrenze.

**Tech Stack:** TypeScript, React, Jest + Testing Library, next-intl-artige
Translations-Map in `src/config/translations.ts`.

**Ausgangsstand:** HEAD `76468d2` (Phase 7 ist inzwischen committet), Arbeitsbaum
enthält nur noch diesen Plan + ein Dokument-Edit. 117 Suiten / 902 Tests grün,
lint/tsc/Registry-Check grün — alles selbst gezogen am 2026-08-29.

**Korrigierter Auditstand (wichtig für die Reviewer):** Der erste Review-Entwurf meldete
einen „Lauf-Store-Eintrag überlebt den synchronen Pfad"-Defekt. **Zurückgezogen:**
`saveStoredRun()` liegt in `requestGeneration.ts` hinter `if (response.status !== 202)
return response;` — der synchrone Pfad schreibt nie in den Store. Phase 6/7 ist am Code
ohne weitere Befunde; dieser Plan deckt genau die restlichen ab.

**Zweite Vertiefung (Phase 5, nach Komponenten-Lektüre):** Der ursprüngliche P2
„Leeren-Knopf kann den gesamten Vault löschen" war **zu scharf formuliert**. Der
Knopf lebt in `GalleryPanel.tsx` (nicht in `GallerySidebarSection`), der Hook wird
in `AppLayout.tsx` mit dem sichtbaren `galleryOrigins`-Filter erzeugt, und der
Bestätigungstext zeigt `totalInScope` der aktuell gewählten Ansicht. Der Knopf
löscht nie mehr, als die gewählte Ansicht zeigt — inklusive des expliziten
„Alle"-Filters. Was bleibt, ist ein P3: Der Bestätigungstext nennt den Umfang
nicht konkret („aus dieser Ansicht" statt „Chat inkl. Compose" / „alle
Herkünfte"). Task 5 wurde entsprechend umgebaut. Der Storage-Blob-Befund bleibt,
wurde aber präzisiert: Lokal gibt es keine Waise (der Blob ist ein Feld der
Dexie-Zeile); die Lücke ist der **externe** Blob bei Pollinations Media Storage
(`storageKey`, 10-Jahre-Expiry), für den es bisher keinen Löschpfad gibt.

**Globale Regeln für alle Tasks:**
- Kein Commit ohne ausdrückliche Freigabe des Betreibers.
- Der Phase-7-Arbeitsbaum ist uncommitted und gehört zur Phase — dieser Patch baut
  **darauf auf**, nicht daneben. Ein Task committet nie Dateien eines anderen Tasks.
- Nach jedem Task: `CI=1 npm test -- --runInBand <betroffene Tests>` grün.

---

### Task 1: LAUNCH_CRITERIA-Wahrheit — L-F.1 zurückstufen

**Files:**
- Modify: `docs/LAUNCH_CRITERIA.md`

**Warum:** L-F.1 verlangt „ausschließlich in B bestätigte Modelle". L-B.4 (Bestätigung
durch tatsächliche Erzeugung) ist offen. Der Phase-7-Plan selbst (Abschnitt „Offene
Punkte", Punkt 1) dokumentiert diese Lücke — „erledigt" ist erst nach L-B.4 erreichbar.
Zudem stehen zwei `**Letzte Prüfung:**`-Zeilen mit widersprüchlicher „Geprüft von"-
Angabe im Kopf (Zeilen 7 und 19).

- [ ] **Schritt 1:** Die zweite Kopfzeile (`**Letzte Prüfung:** 2026-08-29 ·
  **Geprüft von:** Audit Phase 0–3`, ca. Zeile 19) löschen. Die Zeile 7 (Phase 6)
  bleibt und wird zur einzigen Wahrheit.
- [ ] **Schritt 2:** Status von L-F.1 (Zeile ~201) ersetzen:

```markdown
Status: teilweise — strukturell erfüllt (Phase 7: nur schlüsselfreie
Pollinations-Bildmodelle, Video/Pruna abwesend, Create-Verweis im Panel). Vollständig
erst, wenn L-B.4 die drei Modelle durch Erzeugung bestätigt hat.
```

- [ ] **Schritt 3:** Verifizieren: `rg -c "Letzte Prüfung" docs/LAUNCH_CRITERIA.md` → 1.
- [ ] **Schritt 4:** Commit (nach Freigabe):
  `git add docs/LAUNCH_CRITERIA.md && git commit -m "docs: L-F.1 auf teilweise, doppelte Pruefkopfzeile aufgeloest"`

---

### Task 2: Radiogroup-A11y im Desktop-Picker — roving tabindex ohne Pfeiltasten

**Files:**
- Modify: `src/components/chat/input/ImageModelOptions.tsx`
- Modify: `src/components/chat/input/ImageModelOptions.test.tsx`

**Warum:** `role="radio"` + `tabIndex={isActive ? 0 : -1}` verspricht das
roving-tabindex-Muster, aber es gibt keine ArrowKey-Behandlung. Tastatur-Nutzer landen
in einer Gruppe, in der nur das aktive Radio tabbar ist und Pfeiltasten nichts tun.
Der ehrlichste Minimalfix: die Semantik auf „Gruppe von Umschaltknöpfen" senken statt
Pfeiltastenlogik neu zu bauen (3 Modelle, eine Zeile — eine Radiogruppe wäre oversized).

- [ ] **Schritt 1:** Fehlschlagenden Test anpassen — im Test `zeigt genau die
  schluesselfreien Bildmodelle` `getAllByRole('radio')` durch eine Suche nach
  Umschaltknöpfen (`aria-pressed`) ersetzen:

```tsx
const options = screen
  .getAllByRole('button')
  .filter((el) => el.hasAttribute('aria-pressed'))
  .map((el) => el.textContent);
expect(options).toHaveLength(3);
```

Im Test `zeigt kein Video- und kein Pruna-Modell` `getByRole('radiogroup')` durch
`getByRole('group')` ersetzen.

- [ ] **Schritt 2:** Test laufen lassen: `CI=1 npm test -- --runInBand
  src/components/chat/input/ImageModelOptions.test.tsx` → FAIL (rollen noch radio).
- [ ] **Schritt 3:** Komponente umstellen — Wrapper `role="group"` (bleibt, mit
  `aria-label`), je Modell-Button:

```tsx
<button
  key={model.id}
  type="button"
  aria-pressed={isActive}
  disabled={disabled}
  onClick={() => onModelChange(model.id)}
  className={cn(/* unverändert */)}
>
```

`role="radio"`, `aria-checked`, `tabIndex` entfallen. Alle Buttons sind damit tabbar.
- [ ] **Schritt 4:** Test laufen lassen → PASS. Danach `npm run typecheck`.
- [ ] **Schritt 5:** Commit (nach Freigabe):
  `git add src/components/chat/input/ImageModelOptions.tsx src/components/chat/input/ImageModelOptions.test.tsx && git commit -m "fix(phase-7): Modellwahl als group of toggle buttons statt defekter Radiogruppe"`

---

### Task 3: Tote Übersetzungsschlüssel `visualize.showMore` / `visualize.showLess`

**Files:**
- Modify: `src/config/translations.ts` (Zeilen ~249–250 DE, ~518–519 EN)

**Warum:** Phase 7 hat den „Mehr anzeigen"-Umschalter samt `advancedGroups` entfernt;
die Schlüssel haben keine Code-Verwendung mehr. Anti-Slop: weg damit.

- [ ] **Schritt 1:** Verifizieren, dass sie wirklich tot sind:
  `rg -n "visualize\\.show(More|Less)" src --glob '!**/translations.ts'` → nur Treffer
  in `VisualizeInlineHeader.test.tsx` als `queryByText(...)`-Negativ Assertions erlaubt
  (sie prüfen Abwesenheit). Kein produktiver Treffer.
- [ ] **Schritt 2:** Beide Schlüssel in beiden Sprachblöcken löschen.
- [ ] **Schritt 3:** `CI=1 npm test -- --runInBand
  src/components/tools/visualize/VisualizeInlineHeader.test.tsx` → PASS
  (queryByText-Assertion auf Abwesenheit bleibt wahr).
- [ ] **Schritt 4:** Commit (nach Freigabe):
  `git add src/config/translations.ts && git commit -m "chore(phase-7): tote visualize.showMore/showLess Schluessel entfernt"`

---

### Task 4: Chat-Modellgruppen einmalig statt pro Mount berechnen

**Files:**
- Modify: `src/config/unified-image-models.ts` (Funktion `getChatImageModelGroups`, Zeilen ~642–655)

**Warum:** Jeder Mount von `ImageModelOptions` und `VisualizeInlineHeader` mappt/filtert
`UNIFIED_IMAGE_MODELS` neu, obwohl die Eingabe ein unveränderliches Modul-Const ist. Der
Chat öffnet/schließt diese Panels mit jeder Badge-Row — wiederholte Identitätsarbeit auf
dem Interaktionspfad. Fix: einmal auf Modulebene berechnen, Funktion gibt das fertige
Array zurück. Die Stelligkeit (Test `expect(getChatImageModelGroups).toHaveLength(0)`)
bleibt unverändert.

- [ ] **Schritt 1:** Vor der Funktion ein Modul-Const einführen:

```ts
const CHAT_IMAGE_MODEL_GROUPS: Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> =
  (() => {
    const models = UNIFIED_IMAGE_MODELS.filter((model) =>
      model.provider === 'pollinations' &&
      model.kind === 'image' &&
      model.isFree === true &&
      (model.enabled ?? true)
    );
    return VISUALIZE_GROUP_DEFINITIONS
      .filter((group) => group.key === 'image-free')
      .map((group) => ({ ...group, modelIds: models.map((model) => model.id), models }))
      .filter((group) => group.models.length > 0);
  })();

export function getChatImageModelGroups(): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  return CHAT_IMAGE_MODEL_GROUPS;
}
```

Der Kommentarblock über der Funktion bleibt stehen und wandert über das Const.
- [ ] **Schritt 2:** `CI=1 npm test -- --runInBand src/config/__tests__/model-invariants.test.ts`
  → PASS (alle drei Regel-Tests unverändert grün).
- [ ] **Schritt 3:** Commit (nach Freigabe):
  `git add src/config/unified-image-models.ts && git commit -m "perf(phase-7): Chat-Modellgruppen einmalig auf Modulebene"`

---

### Task 5: Lösch-Bestätigung nennt den Umfang nicht (Phase 5, P3)

**Files:**
- Modify: `src/components/gallery/GalleryPanel.tsx` (Textwahl der Bestätigung, ~Zeile 439)
- Modify: `src/config/translations.ts` (neue Schlüssel, DE + EN)
- Test: bestehende Panel-Tests ergänzen (Pfad beim Commit notieren)

**Warum:** Der Knopf „Leeren" löscht exakt den Umfang der gewählten
Herkunfts-Ansicht (`useGalleryAssets(galleryOrigins)` in `AppLayout.tsx:106`,
`deleteAssetsInScope(origins)` im Hook) — der Umfang ist korrekt begrenzt. Aber der
Bestätigungstext sagt nur „{count} Objekte aus dieser Ansicht löschen?" und nennt
nicht, welche Herkünfte das sind. Beim Default-Filter („Chat" = chat + compose)
und beim „Alle"-Filter unterschätzt der Nutzer, was weg ist. Der Fix ist rein
sprachlich; der `confirm()`-Aufruf bleibt.

- [ ] **Schritt 1:** Neue Translations-Schlüssel anlegen (DE + EN, beide Blöcke in
  `src/config/translations.ts`):
  `gallery.clearConfirmChat` = „{count} Objekte aus Chat und Compose löschen?" /
  „Delete {count} items from Chat and Compose?" und `gallery.clearConfirmAll` =
  „{count} Objekte über ALLE Herkünfte löschen?" / „Delete {count} items across
  ALL origins?". Bestehende Schlüssel unverändert lassen.
- [ ] **Schritt 2:** Test ergänzen: beim Filter „Chat" erscheint der Chat-Text,
  beim Filter „Alle" der All-Text — jeweils mit dem ehrlichen `totalAssetCount`.
- [ ] **Schritt 3:** `GalleryPanel.tsx` ~Zeile 439: Textwahl über das
  `origins`-Prop — `origins?.includes('create') ? 'gallery.clearConfirmCreate'`
  (analog anzulegen), sonst `origins ? 'gallery.clearConfirmChat' :
  'gallery.clearConfirmAll'`.
- [ ] **Schritt 4:** Tests laufen lassen → PASS.
- [ ] **Schritt 5:** Commit (nach Freigabe):
  `git add src/components/gallery/GalleryPanel.tsx src/config/translations.ts && git commit -m "fix(phase-5): Loesch-Bestaetigung nennt den Herkunfts-Umfang"`

### Task 6: Blob bleibt beim Löschen eines Medien-Storage-Assets als Waise zurück (Phase 5, P2)

**Files:**
- Modify: `src/lib/assets/delete-assets.ts`
- Create: `src/app/api/media/delete/route.ts` (Server-Proxy zum Storage-DELETE)
- Test: `src/app/api/media/delete/route.test.ts`
- Test: `src/lib/assets/delete-assets.test.ts`

**Warum:** `deleteAssetById()` löscht die Dexie-Zeile samt dem lokal gebackenen Blob
(Feld der Zeile) — lokal gibt es keine Waise. Aber Assets, die über
`OutputService.saveGeneratedAsset` mit `sessionId` liefen, tragen ein `storageKey`
in den externen Pollinations Media Storage (`media.pollinations.ai/{key}`,
Expiry 10 Jahre). Diese Kopie überlebt das lokale Löschen. Ob Pollinations einen
DELETE-Endpunkt anbietet, ist ungeprüft: `DELETE /test` antwortete 404 — mit einem
erfundenen Key vereinbar mit einem echten Endpunkt, aber auch mit keinem. Der Plan
implementiert den Löschpfad optimistisch und dokumentiert das Residuum ehrlich.

- [ ] **Schritt 1:** Fehlschlagenden Test schreiben — Asset mit `storageKey` anlegen,
  `deleteAssetById` aufrufen, erwarten, dass der Proxy-Aufruf mit dem `storageKey`
  passiert (fetch-Mock). Asset ohne `storageKey`: kein Proxy-Aufruf, Zeile stirbt.
- [ ] **Schritt 2:** Proxy-Route implementieren: `DELETE /api/media/delete?key=…`
  — Key validieren (nur das Zeicheninventar echter `ingest.key`-Werte, keine
  Pfad-Tricks), `resolvePollenKey(request)` wie in
  `src/app/api/media/ingest/route.ts`, dann
  `fetch('https://media.pollinations.ai/' + encodeURIComponent(key), { method:
  'DELETE', Authorization: Bearer … })`. 2xx und 404 gelten als Erfolg (404 =
  schon weg), 401/403 als ApiError, alles andere als 502 weitergereicht.
- [ ] **Schritt 3:** `deleteAssetById(id)`: Zeile lesen, bei vorhandenem
  `storageKey` den Proxy aufrufen (try/catch: Fehler loggen, weiter), dann
  `db.assets.delete(id)` — die Zeile stirbt in jedem Fall.
  `deleteAssetsInScope` iteriert `deleteAssetById` statt `bulkDelete`, damit jeder
  externe Blob mitgeräumt wird.
- [ ] **Schritt 4:** Tests laufen lassen → PASS; danach `CI=1 npm test` gesamt.
- [ ] **Schritt 5:** Commit (nach Freigabe):
  `git add src/lib/assets/delete-assets.ts src/lib/assets/delete-assets.test.ts src/app/api/media/delete/route.ts src/app/api/media/delete/route.test.ts && git commit -m "fix(phase-5): Loeschen raumt den Media-Storage-Blob mit auf"`
- [ ] **Schritt 6:** Ehrlichkeits-Notiz in `docs/LAUNCH_CRITERIA.md` (Bereich L,
  Restrisiken): „Externer Media-Storage-Blob wird beim Asset-Löschen via Proxy
  mitgelöscht; Endpunkt-Support durch Pollinations ist bei L-K.1 mit echtem Key zu
  verifizieren. Ohne Support: Waise bis zum 10-Jahre-Expiry, dokumentiert."

### Task 7: Abschlussprüfung des Patches

- [ ] `CI=1 npm test` — null fehlgeschlagene Tests; Suiten-/Testzahl notieren.
- [ ] `npm run typecheck && npm run lint` — keine Fehler.
- [ ] `node scripts/check-model-registry.mjs` — „Keine Abweichungen — Modellwahrheit hält."
- [ ] `git status` — nur die aus diesem Plan erwarteten Änderungen.
- [ ] Finaler code-quality Review über den gesamten Patch (Subagent, widened scope).
