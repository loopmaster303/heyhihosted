# Plan — Phase 5: Eine Galerie

**Datum:** 2026-08-29
**Branch:** `main`, HEAD **`625523c`**, Arbeitsbaum **leer**, `origin/main == HEAD` (gepusht)
**Ausgangsstand der Tests:** **109 Suiten, 852 Tests grün** — selbst gezogen am 2026-08-29
mit `CI=1 npm test`. Die Zahl darf in keinem Paket sinken.
**Deckt ab:** P5 und P6 aus [`FAHRPLAN-create.md`](FAHRPLAN-create.md)
**Fertig-Kriterien:** L-D.1 – L-D.3 aus [`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md) — das
Gate-Dokument ist die Statusquelle, nicht der Fahrplan-Text.
**Art:** Plan. Kein Produktivcode in der Planungssitzung geschrieben. Ausführung in einer
eigenen Sitzung, nach Freigabe des Betreibers.

> **Zum Format:** `superpowers:writing-plans` sieht ein getrenntes Spec-Dokument vor. Der
> Betreiber hat ein einziges Dokument im Format der bestehenden `PLAN-phase-N-*`-Dateien
> angefordert; Spec und Plan fallen hier zusammen. Die Entscheidungen in Abschnitt 3 sind
> der Spec-Teil, die Pakete in Abschnitt 7 der Plan-Teil.

---

## 1. Reihenfolge — was vorher geklärt sein muss

### Phase 4 steht **nicht** auf `main`

Geprüft, nicht abgeschrieben: `docs/LAUNCH_CRITERIA.md` führt **L-C.1 bis L-C.4 auf
„offen"**. Der Commit `e9b75b0 "feat: Phase 4 — Create-Route: /playground nach /create
verlegt"` ist eine **Namenskollision** — das ist die Phase 4 aus `AGENTS.md` Abschnitt 3
(Playground-Merge), nicht die Fahrplan-Phase 4 (Fehlerklarheit). Der Fahrplan führt
Phase 4 folgerichtig ohne Erledigt-Vermerk.

**Folge:** Phase 4 wird dieselben zwei Dateien anfassen, die dieser Plan anfasst:

| Datei | Was Phase 4 dort vorhat (laut `PLAN-phase-4-fehlerklarheit.md`) | Was Phase 5 dort vorhat |
|---|---|---|
| `src/components/playground/Gallery.tsx` | `FailedCard`: `line-clamp-3` entfernen, Handlungs-Link, aufklappbares Detail · `RunningCard`: `m:ss` statt `700 s` | Query auf Herkunftsfilter umstellen, Umschalter, Object-URL-Freigabe beim Löschen |
| `src/app/create/PlaygroundShell.tsx` | `messageFrom()` → `readErrorResponse()` + `describeError()` | Filterzustand, Löschpfad, Object-URL-Freigabe im Generierungspfad |

Die Überschneidung ist **gering und trennbar**: Phase 4 arbeitet an `RunningCard` /
`FailedCard` und am Fehlerpfad, Phase 5 an der Asset-Query, am Umschalter und am
Löschpfad. Kein gemeinsamer Block.

**Zusätzlich:** `PLAN-phase-4-fehlerklarheit.md` verweist an **vier** Stellen auf
`src/app/playground/PlaygroundShell.tsx`. Diesen Pfad gibt es seit `e9b75b0` nicht mehr.
Wer Phase 4 ausführt, muss das vorher korrigieren — hier nur als Warnung vermerkt,
**nicht** Umfang dieses Plans.

**Empfehlung:** Phase 4 zuerst. Falls Phase 5 vorgezogen wird, ist das tragbar — dann
muss die Ausführung von Phase 4 die beiden Dateien gegen den dann aktuellen Stand neu
lesen, statt gegen ihre eigenen Zeilennummern zu arbeiten.

### Ausgangsstand ist sauber

```
HEAD                    625523c79009b5b1f9882288b486885faaadaadc
git status --porcelain  (leer)
origin/main             625523c  (identisch)
CI=1 npm test           109 Suiten, 852 Tests, alle grün
```

---

## 2. Ziel

**In einem Satz:** Chat und Create lesen denselben Asset-Pool, zeigen standardmäßig ihre
eigene Herkunft, lassen sich auf die andere umschalten, und Löschen wirkt an genau einer
Stelle richtig — Eintrag, Blob und Object-URL.

`PLAYGROUND_CONVERSATION_ID` wird dabei vom **Trennkriterium** zum **Herkunfts-Tag**. Der
Bezeichner und sein Wert `'__playground__'` bleiben unverändert — er steckt als Sentinel
in der Spalte `assets.conversationId` bereits gespeicherter Nutzerdaten.

### Fertig-Kriterien, in prüfbare Schritte übersetzt

| # | Kriterium | Prüfschritt | Herkunft |
|---|---|---|---|
| **F1** | Ein in Create erzeugtes Bild überlebt den Reload | Bild in Create erzeugen, `F5`, Galerie zeigt es, Vorschau lädt | L-D.1 |
| **F2** | Ein im **Chat** erzeugtes Bild erscheint im **Create**, sobald der Filter umgestellt ist | Bild im Chat erzeugen, `/create` öffnen, Filter auf „Chat" — Eintrag sichtbar **und anzeigbar** | L-D.3 |
| **F3** | Ein in **Create** erzeugtes Bild erscheint im **Chat**, sobald der Filter umgestellt ist | Umkehrung von F2, im `GalleryPanel` | Fahrplan P6 („beide Oberflächen lesen denselben Pool") |
| **F4** | Nach jedem Reload steht der Filter auf der **eigenen** Herkunft | In Create auf „Chat" umschalten, `F5` — Filter steht wieder auf „Create" | Betreiber-Entscheidung E5.2 |
| **F5** | Ein Ergebnis lässt sich im Create löschen | Ergebnis wählen, in `MetaRail` löschen — sowohl in der Rail (≥1280 px) **als auch** im Bottom-Drawer (<1280 px) | Fahrplan P5 |
| **F6** | Löschen entfernt den Eintrag dauerhaft | Löschen, `F5` — Eintrag ist nicht zurück | L-D.2 |
| **F7** | Löschen gibt die Object-URL sofort frei | `BlobManager.getStats().totalURLs` vor und nach dem Löschen eines blob-gestützten Assets in der Konsole — der Zähler sinkt um 1, **ohne** Reload | L-D.2, Betreiber-Entscheidung E5.6 |
| **F8** | Der Generierungspfad leckt keine Object-URL mehr | Pruna-Lauf ohne Pollen-Token starten; nach Abschluss ist die `'playground'`-URL in `getStats().byContext` **nicht** mehr enthalten | Betreiber-Entscheidung E5.6 |
| **F9** | Einzellöschen wirkt **global** | Ein im Chat erzeugtes Bild im Create (Filter „Chat") löschen; im Chat ist es weg | Betreiber-Entscheidung E5.3 |
| **F10** | „Alles löschen" wirkt nur auf die **sichtbare** Herkunft | Im Chat mit Filter „Chat" alles löschen — Create-Assets sind vollzählig da | Betreiber-Entscheidung E5.3 |
| **F11** | Die Bestätigung nennt **Anzahl und Herkunft in Worten** | Text lautet z. B. „142 Objekte aus dieser Ansicht löschen?" — nicht „Output wirklich leeren?" | Betreiber-Entscheidung E5.3 |
| **F12** | Die genannte Anzahl ist die **echte**, nicht die auf 50 limitierte | Mit >50 Assets im Pool: die Zahl in der Bestätigung ist größer als 50 | Befund B4 |
| **F13** | `/gallery` hat keinen „Vault leeren"-Knopf mehr | `grep -n "clearAllAssets" src/app/gallery/page.tsx` findet nichts | Betreiber-Entscheidung E5.5 |
| **F14** | Die Wahrheitsdokumente stimmen | Fahrplan-Satz „/gallery zeigt weiterhin alles" ist korrigiert; L-D.1–L-D.3 auf „erledigt"; `CLAUDE.md` kennt `assetOrigin()` | Fahrplan-Konvention |

**F1 ist vermutlich schon heute erfüllt** — beide Speicherpfade (`remoteUrl` und `blob`)
werden von `toItem()` in [`Gallery.tsx:44-60`](../src/components/playground/Gallery.tsx)
nach einem Reload wieder aufgelöst. Es ist deshalb ein **Verifikationsschritt, keine
Bauaufgabe**. Der eine bekannte Randfall steht als Befund B6.

---

## 3. Entscheidungen des Betreibers (2026-08-29)

Diese sechs sind vor dem Schreiben dieses Plans getroffen worden und stehen nicht mehr
zur Debatte. Sie sind hier festgehalten, damit ein Worker sie nicht neu erfindet.

### E5.1 — Kein Dexie 5, keine Migration

Die Herkunft bleibt im Sentinel `assets.conversationId`. Sie wird künftig von **genau
einer reinen Funktion** gelesen:

```ts
assetOrigin(asset) → 'chat' | 'create' | 'compose'
```

`isGalleryAsset()` wird nicht nur von Ausschluss zu Klassifikation umgedreht, sondern
**ersetzt**. `assetOrigin()` ist ab dann der einzige Ort im Code, an dem
`conversationId` als Herkunft interpretiert wird.

> **Begründung des Betreibers, wörtlich übernommen:** Die Daten liegen nur im Browser des
> Nutzers, ohne Kopie — eine destruktive Migration ist die einzige unumkehrbare Operation
> hier und hat keinen Gegenwert. Ein additives `origin`-Feld bezahlt Driftrisiko und eine
> im Nutzerbrowser nicht prüfbare Migration für einen Index, der sich bei lokalen
> Asset-Mengen nicht verdient. Es bleibt jederzeit nachrüstbar, falls eine spätere Phase
> wirklich nach Herkunft abfragen muss.

**Die dritte Klasse wird jetzt benannt statt später erfunden.** `'compose'` ist Teil des
Rückgabetyps ab Tag eins, auch wenn Compose hinter `FEATURES.compose = false` liegt.

### E5.2 — Der Filter ist flüchtig, nicht persistent

Kein `localStorage`. Zwei getrennte Zustände, einer je Oberfläche, beide mit der eigenen
Herkunft als Vorgabe. „Session-lokal" heißt: **überlebt keinen Reload**, soll aber eine
Navigation innerhalb desselben Seitenladens überstehen.

> **Begründung des Betreibers, wörtlich übernommen:** L-D.1 und L-D.3 sind
> Reload-Kriterien. Ein persistenter Filter macht sie mehrdeutig, weil der Reload dann
> nicht mehr denselben Ausgangszustand herstellt — ein Gate mit versteckter Vorbedingung
> ist kein Gate. Und ein Nutzer, der einmal auf „alles" stellt, verliert die Trennung
> dauerhaft und still; genau die Trennung ist der Zweck der Phase.

**Auflage:** Der Prüfweg von L-D.3 darf keinen gemerkten Zustand voraussetzen. Nach jedem
Reload steht der Filter auf der eigenen Herkunft, und genau darauf stützt sich F2.

### E5.3 — Löschsemantik: Einzeln global, Menge sichtbar

- **Einzellöschen wirkt global**, weil der Nutzer auf **ein eindeutiges Objekt** zeigt.
- **„Alles löschen" wirkt auf genau das, was der aktive Herkunftsfilter zeigt**, weil der
  Nutzer dort auf eine **Menge** zeigt und die Menge die sichtbare sein muss.
- Die Bestätigung nennt **Anzahl und Herkunft in Worten** („142 Bilder aus dieser
  Ansicht"), nicht nur „sicher?".

Damit fällt der heutige `isGalleryAsset`-Gate in `clearAllAssets` weg und wird durch den
Filterstand ersetzt.

### E5.4 — `/gallery` wird nur mitgezogen

Kein Ausbau, kein Herkunftsfilter, kein Design. Die Route erbt, was der Hook liefert, und
zeigt danach also auch Create-Assets. Der Fahrplan-Satz „/gallery zeigt weiterhin alles"
wird korrigiert.

### E5.5 — Der „Vault leeren"-Knopf auf `/gallery` fällt weg

> **Begründung des Betreibers, wörtlich übernommen:** Ab Phase 5 ist es ein Pool, und
> diese Seite hat nach E5.4 keinen Herkunftsfilter. „Sichtbare Auswahl" heißt dort also
> alles — ein Klick auf einer unverlinkten, als umgezogen markierten Seite zerstört dann
> die komplette Create-Arbeit. Genau der Unfall, den die Löschsemantik aus E5.3 verhindern
> soll. Entweder müsste ich die Scoping-Regel dort ein zweites Mal pflegen, oder die
> destruktive Aktion verschwindet aus einer Ansicht, in der sie ohnehin keinen Zweck mehr
> hat. Ich wähle Letzteres.

Route, Banner, Anzeigen und Einzellöschen bleiben.

### E5.6 — Beide Object-URL-Lecks werden geschlossen

Sie gehören zu L-D.2, weil „Löschen entfernt Eintrag und Blob" sonst nur **nach** einem
Reload wahr ist und nicht im laufenden Tab. Details unter Befund B3.

---

## 4. Reality Check — was der Fahrplan behauptet und was der Code sagt

Alles unten ist am 2026-08-29 **selbst gegen `625523c` gelesen**, nicht aus einem Dokument
übernommen. Der wiederkehrende Fehler dieses Repos ist ein Plan gegen einen Stand, den es
bei der Ausführung nicht mehr gibt.

### B1 — „/gallery zeigt weiterhin alles" ist doppelt falsch

**Der Fahrplan behauptet es. Der Code sagt zweierlei anderes.**

Erstens: [`useGalleryAssets.ts:12-14`](../src/hooks/useGalleryAssets.ts) schließt
Create-Assets **ausdrücklich** aus — der Kommentar sagt `must not contaminate`. Der Filter
gilt für Vault, Sidebar-Galerie und `GalleryPanel` gleichermaßen.

```ts
export function isGalleryAsset(a: Asset): boolean {
  return a.conversationId !== PLAYGROUND_CONVERSATION_ID;
}
```

Zweitens: Dieselbe Funktion gated in [Zeile 49](../src/hooks/useGalleryAssets.ts)
`clearAllAssets` — **Create-Assets überleben heute ein „alles löschen".**

```ts
const clearAllAssets = async () => {
  await db.assets.filter(isGalleryAsset).delete();
};
```

### B2 — `/gallery` ist bereits als DEPRECATED markiert

[`src/app/gallery/page.tsx:1-10`](../src/app/gallery/page.tsx) trägt einen
Datei-Kommentar: *„DEPRECATED — standalone /gallery route … Nicht löschen —
Legacy-Kompatibilität."* Die Seite zeigt ein Banner *„This view has moved. Your output is
now available directly in the chat sidebar."*

**Verifiziert:** Kein einziger Verweis auf `/gallery` außerhalb von `src/app/gallery/` —
weder im Code noch in `next.config.ts`.

```bash
grep -rn "'/gallery'\|\"/gallery\"\|href=.*gallery" src/ next.config.ts | grep -v "^src/app/gallery/"
# (kein Treffer)
```

Die aktive Chat-Galerie ist `GalleryPanel`, gerendert aus
[`AppLayout.tsx:314-322`](../src/components/layout/AppLayout.tsx).

### B3 — Es gibt **keine** verwaisten Blobs in IndexedDB. Es gibt zwei Object-URL-Lecks.

Diese Korrektur ist wichtig, weil der Fahrplan und das Gate-Kriterium von „verwaistem
Blob-Speicher" sprechen und damit ein Problem beschreiben, das der Datenaufbau ausschließt.

**Verifiziert:** Es gibt **genau eine** Dexie-Datenbank (`HeyHiVault`), **einen**
`assets`-Store, kein `caches.open`, kein zweites `indexedDB.open`.

```bash
grep -rn "caches\.open\|indexedDB\.open\|new Dexie\|\.stores(" src/
# nur src/lib/services/database.ts:61 und :68
```

Der Blob ist ein **Feld dieser Zeile** ([`database.ts:35-48`](../src/lib/services/database.ts)):

```ts
export interface Asset {
  id: string;
  blob?: Blob;          // ← liegt IN der Zeile, nicht in einem eigenen Store
  contentType: string;
  ...
}
```

`db.assets.delete(id)` und `.filter(...).delete()` entfernen die Zeile **samt Blob**.
**L-D.2 ist für den persistenten Speicher heute schon erfüllt.** Ein Aufräumlauf für
Alt-Waisen ist gegenstandslos: es kann keine geben.

**Was wirklich leckt, sind zwei Object-URLs:**

| # | Ort | Was passiert |
|---|---|---|
| **L1** | [`PlaygroundShell.tsx:220`](../src/app/create/PlaygroundShell.tsx) | Der Pruna-Byte-Pfad erzeugt `BlobManager.createURL(blob, 'playground')` und gibt sie **nie** frei. `cleanupOld()` überspringt sie, weil [`blob-manager.ts:131`](../src/lib/blob-manager.ts) bei `refCount > 0` per `continue` aussteigt. Jeder Pruna-Lauf ohne Pollen-Token hält seinen Blob **bis zum Reload** im RAM. |
| **L2** | [`Gallery.tsx:176-207`](../src/components/playground/Gallery.tsx) | `ownedUrls` hält die URLs des letzten Ladelaufs. Wird ein Asset gelöscht, bleibt seine URL bis zum nächsten `refreshKey` oder Unmount registriert. |

**Das strukturelle Argument des Betreibers bleibt richtig, mit anderer Begründung:**
Einzel- und Massenlöschen laufen heute über zwei getrennte Queries
(`db.assets.delete(id)` gegen `db.assets.filter(...).delete()`). Sobald Löschen mehr tut
als die Zeile zu entfernen — und ab E5.6 tut es das —, driften die beiden Pfade
auseinander. Ein gemeinsamer **Auswahlpfad** gehört in den Plan.

### B4 — `.limit(50)` — und `clearAllAssets` löscht heute mehr, als die Ansicht zeigt

[`useGalleryAssets.ts:34`](../src/hooks/useGalleryAssets.ts) limitiert auf 50.

**Entwarnung für den Chat:** Dexie limitiert **nach** dem Filter. Solange der
Herkunftsfilter je Oberfläche auf der eigenen Herkunft steht, bekommt der Chat weiterhin
seine 50 Chat-Assets. Aus Phase 5 folgt für `GalleryPanel` **kein** Verlust.

**Betroffen ist nur `/gallery`**, weil die Seite nach E5.4 keinen Filter bekommt: sie
zeigt danach 50 aus einem größeren Pool, also potenziell weniger Chat-Bilder als heute.
**Betreiber-Entscheidung: hinnehmen, hier vermerken, nichts ändern** — auf einer
unverlinkten, als umgezogen markierten Seite ist das folgenlos. Dieser Absatz existiert,
damit es niemand später als Regression meldet.

**Der Folgebefund gehört bisher niemandem:** Die Query ist auf 50 begrenzt, das Löschen
nicht. `totalAssetCount={galleryData.assets.length}`
([`AppLayout.tsx:318`](../src/components/layout/AppLayout.tsx)) zeigt darum **nie mehr als
50**. Die Auflage aus E5.3 („die Bestätigung nennt die Anzahl") braucht deshalb erst eine
ehrliche Zahl — siehe F12 und Paket **U2**.

### B5 — Es gibt heute drei Herkünfte, nicht zwei

[`useComposeMusicState.ts:104-109`](../src/hooks/useComposeMusicState.ts) speichert Musik
**ohne `conversationId`**:

```ts
OutputService.saveGeneratedAsset({
  url: data.audioUrl,
  prompt,
  modelId: selectedModel,
  isPollinations: false,
});   // ← kein conversationId
```

**Verifiziert, dass das die einzige Quelle von `undefined` ist:** Chat-Assets tragen
immer eine — `conversationId: string` (nicht optional) in
[`chat-send-orchestrator.ts:10`](../src/lib/chat/chat-send-orchestrator.ts), und Uploads
bekommen `conversationId: convId` in
[`chat-send-coordinator.ts:307`](../src/lib/chat/chat-send-coordinator.ts).

**Grenze der Aussage, die im Code stehen muss:** `undefined → 'compose'` ist eine
**Zuordnung per Ausschluss**, keine Aussage der Daten. Altbestand aus früheren Versionen
kann ebenfalls `undefined` tragen, ohne von Compose zu stammen. Ein späteres aktives
Taggen beim Speichern gehört zu Phase 8 (Musik), nicht hierher.

### B6 — Randfall zu F1: ein Ergebnis kann verschwinden, das die Karte gezeigt hat

[`output-service.ts:104-107`](../src/lib/services/output-service.ts) verwirft Blobs unter
`SMALL_BLOB_SKIP_BYTES` und gibt `undefined` zurück. In `PlaygroundShell` fällt der
`GalleryItem` dann auf `id: ${Date.now()}` zurück und ist im Store **nicht** vorhanden —
nach einem Reload ist er weg, obwohl die Karte da war. Bekannt, **nicht** Umfang dieses
Plans, hier für den Prüfweg von F1 vermerkt.

### B7 — `MetaRail` wird an **zwei** Stellen gerendert

[`PlaygroundShell.tsx:436-443`](../src/app/create/PlaygroundShell.tsx) (Rail ab 1280 px)
und [`Zeile 489-503`](../src/app/create/PlaygroundShell.tsx) (Bottom-Drawer darunter). Ein
Löschknopf, der nur an einer Stelle verdrahtet wird, ist auf dem Telefon unsichtbar. Genau
die Art Lücke, die Paket **U3** fangen soll.

### B8 — Zwei Test-Mocks hängen an der heutigen Query-Form

[`Gallery.test.tsx:20-31`](../src/components/playground/Gallery.test.tsx) und
[`PlaygroundShell.test.tsx:76`](../src/app/create/PlaygroundShell.test.tsx) mocken
`db.assets.where(col).equals(val).reverse().sortBy()` und antworten nur auf
`col === 'conversationId' && val === '__playground__'`. Stellt Paket **W1** die Query auf
`orderBy().filter()` um, brechen **beide** Mocks. Sie müssen im selben Paket mitgezogen
werden.

---

## 5. Component Mapping — Datei für Datei, mit Begründung

### Neu

| Datei | Verantwortung | Warum eigene Datei |
|---|---|---|
| `src/lib/assets/asset-origin.ts` | `AssetOrigin`-Typ, `assetOrigin()`, `ORIGIN_LABELS` | Der **einzige** Ort, an dem `conversationId` als Herkunft gelesen wird (E5.1). Reine Funktion ohne Dexie-Import, deshalb in `lib/assets/` und nicht in `hooks/`. Nicht in `lib/playground/constants.ts`, weil sie über die Herkunft *aller drei* Klassen entscheidet, nicht nur über Create. |
| `src/lib/assets/asset-origin.test.ts` | Abdeckung für alle vier Eingaben | Reine Logik, kein DOM — der billigste Ort für Abdeckung. |
| `src/lib/assets/delete-assets.ts` | `assetIdsInScope()`, `deleteAssetById()`, `deleteAssetsInScope()` | Der gemeinsame **Auswahl**pfad aus Befund B3. Getrennt von `useGalleryAssets`, weil `PlaygroundShell` ihn ohne den Hook braucht. |
| `src/lib/assets/delete-assets.test.ts` | Abdeckung für Auswahl und Freigabe | s. o. |
| `src/components/gallery/OriginFilter.tsx` | Der Umschalter, ein Segmented Control | Wird von `GalleryPanel` **und** der Create-Galerie gerendert. Ein zweites Mal bauen hieße, ihn zweimal pflegen. |
| `src/components/gallery/OriginFilter.test.tsx` | Abdeckung für Beschriftung und Umschaltung | s. o. |

### Geändert

| Datei | Änderung | Warum |
|---|---|---|
| [`src/hooks/useGalleryAssets.ts`](../src/hooks/useGalleryAssets.ts) | `isGalleryAsset` entfällt · Hook nimmt `origins` · zweite Query für die echte Anzahl · `deleteAsset`/`clearAllAssets` über den gemeinsamen Pfad | Befunde B1, B3, B4. Das ist der Kern der Phase. |
| [`src/hooks/useGalleryAssets.test.ts`](../src/hooks/useGalleryAssets.test.ts) | Die vier `isGalleryAsset`-Tests werden zu `assetOrigin`-Tests und wandern in die neue Testdatei; hier bleibt der Hook-Vertrag | Der Test in Zeile 27 prüft heute ausdrücklich, dass Create-Assets ein „alles löschen" überleben — genau das kehrt sich um. |
| [`src/components/playground/Gallery.tsx`](../src/components/playground/Gallery.tsx) | Query von `where().equals()` auf `orderBy().filter()` · `origins`-Prop · `onDelete` · id→URL-Zuordnung für die Freigabe | Befunde B1, B3 (L2), B8 |
| [`src/components/playground/Gallery.test.tsx`](../src/components/playground/Gallery.test.tsx) | Mock auf die neue Query-Form | Befund B8 |
| [`src/components/playground/MetaRail.tsx`](../src/components/playground/MetaRail.tsx) | Vierte Aktion „Löschen", optionales `onDelete` | Fahrplan P5: „Löschen im Create fehlt." |
| [`src/components/playground/MetaRail.test.tsx`](../src/components/playground/MetaRail.test.tsx) | Test für die neue Aktion | s. o. |
| [`src/app/create/PlaygroundShell.tsx`](../src/app/create/PlaygroundShell.tsx) | Filterzustand · Löschpfad an **beide** `MetaRail`-Stellen · Object-URL-Freigabe nach dem Speichern | Befunde B3 (L1), B7 |
| [`src/app/create/PlaygroundShell.test.tsx`](../src/app/create/PlaygroundShell.test.tsx) | Mock auf die neue Query-Form | Befund B8 |
| [`src/components/gallery/GalleryPanel.tsx`](../src/components/gallery/GalleryPanel.tsx) | `OriginFilter` im Kopf · Bestätigungstext mit Anzahl und Herkunft | E5.3, F11 |
| [`src/components/layout/AppLayout.tsx`](../src/components/layout/AppLayout.tsx) | Filterzustand · `totalAssetCount` aus der ehrlichen Query | Befund B4 |
| [`src/app/gallery/page.tsx`](../src/app/gallery/page.tsx) | „Vault leeren"-Knopf **entfernen**, sonst nichts | E5.5 |
| [`src/config/translations.ts`](../src/config/translations.ts) | Neue Schlüssel DE/EN für Filter und Bestätigung · `gallery.clearConfirm` wird parametrisiert | F11 |
| [`docs/FAHRPLAN-create.md`](FAHRPLAN-create.md) | Phase 5 auf erledigt · der Satz „/gallery zeigt weiterhin alles" korrigiert | F14, Befund B1 |
| [`docs/LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md) | L-D.1 – L-D.3 auf erledigt, mit Datum | F14 |
| [`CLAUDE.md`](../CLAUDE.md) | Abschnitt „Asset Persistence": `assetOrigin()` als einzige Interpretation, der gemeinsame Löschpfad, der Filter als flüchtig | F14 |
| [`docs/README.md`](README.md) | Eine Zeile unter „Start Here" für diesen Plan | Auftrag |

### Ausdrücklich **nicht** angefasst

- **Kein Dexie 5, keine `version(5).stores()`, keine Upgrade-Funktion** (E5.1).
- **`PLAYGROUND_CONVERSATION_ID` und `'__playground__'` werden nicht umbenannt.**
  `LAUNCH_CRITERIA.md` Bereich M schließt das ausdrücklich aus, und der Wert steckt in
  gespeicherten Nutzerdaten.
- **`/gallery` bekommt keinen Herkunftsfilter und kein Design** (E5.4).
- **Kein Paginierungsumbau** (Befund B4, Betreiber-Entscheidung).
- **Kein Aufräumlauf für Alt-Waisen** — es kann keine geben (Befund B3).
- **`src/lib/services/asset-fallback-service.ts`** — sein Blob-Cache schreibt in dieselbe
  Zeile und ist von der Löschsemantik nicht betroffen.
- **Der Compose-Speicherpfad** bekommt kein aktives Herkunfts-Tag (Befund B5, Phase 8).

---

## 6. Ausführungsregeln

### 6.1 Zweistufige Ausführung

Der Plan ist so geschnitten, dass er in zwei Stufen läuft:

| Stufe | Pakete | Wer |
|---|---|---|
| **Urteilsbildung** | **U1**, **U2**, **U3** | Hauptagent, **nicht delegierbar** |
| **Mechanisch** | **W1** – **W7** | Worker-Subagent unter `superpowers:subagent-driven-development` |

Ablauf je Worker-Paket, wie in [`PLAN-audit-patch-2026-08-29.md`](PLAN-audit-patch-2026-08-29.md):

1. Hauptagent gibt das Paket **wörtlich** an einen Worker.
2. Worker arbeitet nur die genannten Dateien an, führt die genannte Verifikation aus und
   meldet Ergebnis **plus Verifikationsausgabe** zurück.
3. Hauptagent prüft das Fertig-Kriterium **selbst** nach — er glaubt dem Worker nicht, er
   führt die Verifikation nochmal aus.
4. Erst dann das nächste Paket.

**Kein Worker committet.** Commits macht ausschließlich der Hauptagent.

### 6.2 Modellwahl

| Umgebung | Worker-Modell |
|---|---|
| Claude Code (`Agent`-Tool) | **Sonnet 5** — `model: "sonnet"` |
| OpenCode oder anderer Coding-Agent | **GLM 5.3 Flash** oder **DeepSeek Flash** |

Der Hauptagent bleibt auf dem stärkeren Modell. Jedes Worker-Paket nennt Datei, exakte
Änderung und Prüfung; wo eine Entscheidung nötig war, steht sie **schon im Paket**.

### 6.3 Verbote für Worker

- Keine Datei anfassen, die im Paket nicht genannt ist.
- Kein „nebenbei aufräumen", kein Umformatieren, keine Umbenennung von Symbolen.
- Kein `git commit`, `git push`, `git stash`.
- **Nicht** `PLAYGROUND_CONVERSATION_ID`, `src/components/playground/`,
  `src/lib/playground/`, `PlaygroundShell` oder die `playground.*`-Übersetzungsschlüssel
  umbenennen.
- **Kein `db.version(5)`.**
- Nie `URL.createObjectURL` direkt aufrufen — immer `BlobManager` (`CLAUDE.md`).
- Bei Unklarheit: **abbrechen und zurückmelden, nicht raten.**

### 6.4 Verifikation

Voller Durchlauf:

```bash
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build
```

Ausgangsstand: **109 Suiten, 852 Tests grün**. Die Testzahl darf in keinem Paket sinken.

### 6.5 Reihenfolge

```
U1 ──► W1 ──► U2 ──┬─► W2 ─┐
                   ├─► W3 ─┤
                   ├─► W4 ─┼──► W6 ──► W7 ──► U3
                   └─► W5 ─┘
```

- **U1 blockiert alles** — ohne `assetOrigin()` und die Hook-Signatur hat kein Paket eine
  Schnittstelle.
- **W1 vor U2**, weil U2 die Create-Galerie als Löschziel braucht.
- **W2–W5 sind untereinander unabhängig** und können in beliebiger Reihenfolge laufen.
- **U3 ist immer das letzte Paket**, nach dem letzten Arbeitspaket und **vor** dem Handoff.

---

## 7. Die Pakete

### U1 — Herkunftsmodell und Filterzustand *(Hauptagent, nicht delegieren)*

**Warum nicht delegierbar:** Hier entstehen die Schnittstellen, die alle anderen Pakete
konsumieren. Die Zuordnung `undefined → 'compose'` ist eine Zuordnung per Ausschluss
(Befund B5) und braucht ein Urteil darüber, wie ehrlich der Code darüber sein muss.

**Dateien:**
- Neu: `src/lib/assets/asset-origin.ts`, `src/lib/assets/asset-origin.test.ts`
- Ändern: `src/hooks/useGalleryAssets.ts`, `src/hooks/useGalleryAssets.test.ts`

**Produziert (die anderen Pakete verlassen sich darauf):**

```ts
// src/lib/assets/asset-origin.ts
export type AssetOrigin = 'chat' | 'create' | 'compose';
export const ALL_ORIGINS: readonly AssetOrigin[];
export function assetOrigin(a: Pick<Asset, 'conversationId'>): AssetOrigin;
export function isInScope(a: Pick<Asset, 'conversationId'>, origins?: readonly AssetOrigin[]): boolean;
```

```ts
// src/hooks/useGalleryAssets.ts
export function useGalleryAssets(origins?: readonly AssetOrigin[]): {
  assets: Asset[];        // auf 50 begrenzt, nach dem Filter
  totalInScope: number;   // NICHT begrenzt — die ehrliche Zahl fuer F12
  isLoading: boolean;
  deleteAsset: (id: string) => Promise<void>;
  clearAllAssets: () => Promise<void>;   // wirkt nur auf `origins`
  toggleStarred: (id: string) => Promise<void>;
};
```

- [ ] **Schritt 1: Failing test für `assetOrigin` schreiben**

`src/lib/assets/asset-origin.test.ts`:

```ts
import { assetOrigin, isInScope, ALL_ORIGINS } from './asset-origin';

describe('assetOrigin', () => {
  it('erkennt Create am Sentinel', () => {
    expect(assetOrigin({ conversationId: '__playground__' })).toBe('create');
  });

  it('erkennt Chat an einer echten Konversations-ID', () => {
    expect(assetOrigin({ conversationId: 'chat-1' })).toBe('chat');
  });

  // Zuordnung per Ausschluss, siehe Befund B5: Compose speichert ohne
  // conversationId. Altbestand kann ebenfalls hier landen.
  it('ordnet fehlende conversationId Compose zu', () => {
    expect(assetOrigin({ conversationId: undefined })).toBe('compose');
  });

  it('behandelt den leeren String wie fehlend', () => {
    expect(assetOrigin({ conversationId: '' })).toBe('compose');
  });
});

describe('isInScope', () => {
  it('ohne Filter ist alles im Bereich', () => {
    expect(isInScope({ conversationId: '__playground__' })).toBe(true);
    expect(isInScope({ conversationId: 'chat-1' })).toBe(true);
  });

  it('mit Filter nur die genannten Herkuenfte', () => {
    expect(isInScope({ conversationId: 'chat-1' }, ['chat'])).toBe(true);
    expect(isInScope({ conversationId: '__playground__' }, ['chat'])).toBe(false);
  });

  it('ALL_ORIGINS deckt alle drei ab', () => {
    expect([...ALL_ORIGINS].sort()).toEqual(['chat', 'compose', 'create']);
  });
});
```

- [ ] **Schritt 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
CI=1 npx jest --silent src/lib/assets/asset-origin.test.ts
```

Erwartet: FAIL — `Cannot find module './asset-origin'`.

- [ ] **Schritt 3: `asset-origin.ts` schreiben**

```ts
import type { Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';

/**
 * Herkunft eines Assets. Beide Oberflaechen lesen seit Phase 5 denselben
 * Pool; die Herkunft ist ein Tag, kein Trennkriterium mehr.
 */
export type AssetOrigin = 'chat' | 'create' | 'compose';

export const ALL_ORIGINS: readonly AssetOrigin[] = ['chat', 'create', 'compose'];

/**
 * Der EINZIGE Ort, an dem `assets.conversationId` als Herkunft gelesen wird.
 *
 * Der Sentinel '__playground__' bleibt bewusst stehen — er steckt in bereits
 * gespeicherten Nutzerdaten, und eine Schemamigration waere die einzige
 * unumkehrbare Operation an einem Speicher ohne Kopie (Entscheidung E5.1).
 *
 * ACHTUNG: 'compose' ist eine Zuordnung per Ausschluss, keine Aussage der
 * Daten. Compose speichert ohne conversationId (useComposeMusicState.ts);
 * Altbestand aus frueheren Versionen kann ebenfalls hier landen. Wer eine
 * belastbare Compose-Herkunft braucht, muss beim Speichern aktiv taggen —
 * das gehoert zu Phase 8, nicht hierher.
 */
export function assetOrigin(a: Pick<Asset, 'conversationId'>): AssetOrigin {
  if (a.conversationId === PLAYGROUND_CONVERSATION_ID) return 'create';
  if (!a.conversationId) return 'compose';
  return 'chat';
}

/** `origins` undefined heisst: kein Filter, alles im Bereich. */
export function isInScope(
  a: Pick<Asset, 'conversationId'>,
  origins?: readonly AssetOrigin[],
): boolean {
  return !origins || origins.includes(assetOrigin(a));
}
```

- [ ] **Schritt 4: Test laufen lassen, grün bestätigen**

```bash
CI=1 npx jest --silent src/lib/assets/asset-origin.test.ts
```

Erwartet: PASS, 7 Tests.

- [ ] **Schritt 5: `useGalleryAssets.ts` umbauen**

Vollständiger neuer Inhalt:

```ts
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import { DatabaseService } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';

const PREVIEW_LIMIT = 50;

/** Keep Dexie's timestamp ordering, but float starred items to the top. */
function sortStarredFirst(a: Asset, b: Asset): number {
  if (a.starred && !b.starred) return -1;
  if (!a.starred && b.starred) return 1;
  return 0;
}

/**
 * Reaktive Liste der Assets im gewaehlten Herkunftsbereich.
 *
 * `origins` undefined = kein Filter (so liest /gallery, siehe E5.4).
 *
 * `assets` ist auf 50 begrenzt — Dexie filtert VOR dem Limit, eine Oberflaeche
 * mit gesetztem Filter bekommt also weiterhin 50 aus ihrer eigenen Herkunft.
 * `totalInScope` ist NICHT begrenzt: die Loeschbestaetigung braucht die echte
 * Zahl (F12), und `assets.length` war dafuer nie geeignet.
 */
export function useGalleryAssets(origins?: readonly AssetOrigin[]) {
  // Ein Array-Literal aendert bei jedem Render seine Identitaet und wuerde die
  // Query in einer Schleife neu ausloesen.
  const key = origins ? [...origins].sort().join(',') : '';

  const assets = useLiveQuery(
    async () => {
      const all = await db.assets
        .orderBy('timestamp')
        .reverse()
        .filter((a) => isInScope(a, origins))
        .limit(PREVIEW_LIMIT)
        .toArray();

      return all.sort(sortStarredFirst);
    },
    [key]
  );

  const totalInScope = useLiveQuery(
    async () => db.assets.filter((a) => isInScope(a, origins)).count(),
    [key]
  );

  const isLoading = assets === undefined;

  const deleteAsset = async (id: string) => {
    await deleteAssetById(id);
  };

  const clearAllAssets = async () => {
    await deleteAssetsInScope(origins);
  };

  const toggleStarred = async (id: string) => {
    await DatabaseService.toggleStarred(id);
  };

  return {
    assets: useMemo(() => assets || [], [assets]),
    totalInScope: totalInScope ?? 0,
    isLoading,
    deleteAsset,
    clearAllAssets,
    toggleStarred,
  };
}
```

`deleteAssetById` und `deleteAssetsInScope` kommen aus **U2** — bis dahin importiert der
Hook sie noch nicht. In diesem Schritt bleiben die beiden Funktionen inline wie bisher
(`db.assets.delete(id)` bzw. `db.assets.filter(...).delete()`), und U2 zieht sie heraus.
Das hält U1 für sich testbar.

- [ ] **Schritt 6: `useGalleryAssets.test.ts` ersetzen**

Die vier bisherigen `isGalleryAsset`-Tests sind durch `asset-origin.test.ts` abgedeckt.
Der Test in Zeile 27 („playground assets survive bulk clear") prüft ausdrücklich das
Verhalten, das E5.3 umkehrt — er wird **gelöscht**, nicht angepasst. An seine Stelle tritt
ein Vertragstest für den Bereich:

```ts
import { isInScope } from '@/lib/assets/asset-origin';
import type { Asset } from '@/lib/services/database';

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: 'a',
    remoteUrl: 'https://x/1.png',
    contentType: 'image/png',
    timestamp: 1,
    ...overrides,
  };
}

describe('Bereichsauswahl der Galerie-Query', () => {
  const rows = [
    asset({ id: 'chat', conversationId: 'chat-1' }),
    asset({ id: 'create', conversationId: '__playground__' }),
    asset({ id: 'compose', conversationId: undefined }),
  ];

  it('ohne Filter liefert die Query alle drei Herkuenfte', () => {
    expect(rows.filter((a) => isInScope(a)).map((a) => a.id))
      .toEqual(['chat', 'create', 'compose']);
  });

  it('Filter "chat" blendet Create und Compose aus', () => {
    expect(rows.filter((a) => isInScope(a, ['chat'])).map((a) => a.id))
      .toEqual(['chat']);
  });

  // Kehrt den geloeschten Test von 2026-08 um: Create-Assets ueberleben ein
  // "alles loeschen" NICHT mehr, wenn der Filter sie zeigt (Entscheidung E5.3).
  it('Filter "create" waehlt Create-Assets fuer das Massenloeschen aus', () => {
    expect(rows.filter((a) => isInScope(a, ['create'])).map((a) => a.id))
      .toEqual(['create']);
  });
});
```

- [ ] **Schritt 7: Volle Verifikation**

```bash
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent
```

Erwartet: lint sauber, `tsc` sauber, **mindestens 852 Tests grün**.
`grep -rn "isGalleryAsset" src/` findet **nichts**.

- [ ] **Schritt 8: Commit**

```bash
git add src/lib/assets/ src/hooks/useGalleryAssets.ts src/hooks/useGalleryAssets.test.ts
git commit -m "feat: Phase 5 — assetOrigin als einzige Herkunftsdeutung, Galerie-Hook mit Bereich"
```

**Fertig, wenn:** `grep -rn "isGalleryAsset" src/` ist leer · `assetOrigin` existiert in
genau einer Datei · `useGalleryAssets(['chat'])` liefert keine Create-Assets ·
`totalInScope` ist unabhängig von `PREVIEW_LIMIT` · Testzahl ≥ 852.

---

### W1 — Create-Galerie auf den Bereich umstellen *(Worker)*

**Befund:** [`Gallery.tsx:184-188`](../src/components/playground/Gallery.tsx) fragt heute
per Index `where('conversationId').equals(PLAYGROUND_CONVERSATION_ID)` — eine Query, die
Chat-Assets **strukturell** nicht liefern kann. Ohne diese Umstellung ist F2
unmöglich. Befund B8: zwei Test-Mocks hängen an genau dieser Query-Form.

**Dateien:** `src/components/playground/Gallery.tsx`,
`src/components/playground/Gallery.test.tsx`,
`src/app/create/PlaygroundShell.test.tsx`

**Konsumiert aus U1:** `isInScope`, `AssetOrigin`

**Exakte Änderungen:**

1. In `Gallery.tsx` den Import tauschen:

```ts
// alt
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
// neu
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';
```

2. `Props` um zwei Felder erweitern:

```ts
interface Props {
  selectedId: string | null;
  onSelect: (item: GalleryItem) => void;
  /** Bump to re-read the store after a generation lands. */
  refreshKey?: number;
  /** Sichtbarer Herkunftsbereich. undefined = alles. */
  origins?: readonly AssetOrigin[];
  /** Laufende und gescheiterte Generierungen, neueste zuerst. */
  runs?: GalleryRun[];
  onCancelRun?: (id: string) => void;
  onRetryRun?: (id: string) => void;
  onDismissRun?: (id: string) => void;
}
```

und in der Destrukturierung `origins,` ergänzen.

3. Die Query in [Zeile 184-188](../src/components/playground/Gallery.tsx) ersetzen:

```ts
// alt
const rows = await db.assets
  .where('conversationId')
  .equals(PLAYGROUND_CONVERSATION_ID)
  .reverse()
  .sortBy('timestamp');

// neu
const rows = await db.assets
  .orderBy('timestamp')
  .reverse()
  .filter((a) => isInScope(a, origins))
  .limit(50)
  .toArray();
```

4. Das `.slice(0, 50)` in Zeile 190 **entfernen** — das Limit sitzt jetzt in der Query:

```ts
const next = rows
  .map((a) => toItem(a, created))
  .filter((x): x is GalleryItem => x !== null);
```

5. Die Effekt-Abhängigkeit in Zeile 202 erweitern. `origins` ist ein Array und ändert
   seine Identität; deshalb über einen stabilen Schlüssel:

```ts
const originKey = origins ? [...origins].sort().join(',') : '';
// ...
}, [refreshKey, originKey]);
```

`originKey` wird **vor** dem `useEffect` berechnet.

6. In `Gallery.test.tsx` den Datenbank-Mock (Zeilen 18-31) ersetzen:

```ts
let mockRows: Record<string, unknown>[] = [];

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      orderBy: () => ({
        reverse: () => ({
          filter: (pred: (a: Record<string, unknown>) => boolean) => ({
            limit: () => ({
              toArray: async () => mockRows.filter(pred),
            }),
          }),
        }),
      }),
    },
  },
}));
```

7. In `PlaygroundShell.test.tsx` Zeile 76 denselben Mock einsetzen. Die Zeile lautet heute:

```ts
sortBy: async () => (col === 'conversationId' && val === '__playground__' ? rows : []),
```

Sie wird durch dieselbe `orderBy/reverse/filter/limit/toArray`-Kette ersetzt. Die
Testdaten in Zeile 68 tragen bereits `conversationId: '__playground__'` und passen den
Prädikat-Filter ohne Änderung.

**Verifikation:**

```bash
CI=1 npx jest --silent src/components/playground/Gallery.test.tsx src/app/create/PlaygroundShell.test.tsx src/app/create/create.e2e.test.tsx
npx tsc --noEmit
grep -n "PLAYGROUND_CONVERSATION_ID" src/components/playground/Gallery.tsx
```

**Fertig, wenn:** Die drei Testdateien sind grün · `tsc` sauber · der letzte `grep` findet
**nichts** (Gallery.tsx liest den Sentinel nicht mehr selbst) · `grep -n "slice(0, 50)"
src/components/playground/Gallery.tsx` findet nichts.

---

### U2 — Löschsemantik und der gemeinsame Auswahlpfad *(Hauptagent, nicht delegieren)*

**Warum nicht delegierbar:** Hier fällt die Entscheidung, wie weit „ein gemeinsamer Pfad"
reicht, und der Bestätigungstext braucht eine Zahl, die es heute nicht gibt (Befund B4).

**Die Abweichung, die benannt gehört:** Der Betreiber hat verlangt, Massenlöschen müsse
„über denselben Pfad wie Einzellöschen laufen, nicht über eine eigene Query". Umgesetzt
wird das als **eine gemeinsame Auswahlfunktion, zwei Ausführungen**: `assetIdsInScope()`
liefert die Ids, `deleteAssetById()` löscht eine, `deleteAssetsInScope()` ruft die Auswahl
und löscht per `bulkDelete`. Der geteilte Teil ist die **Auswahl** — dort saß der Fehler
(zwei getrennte Prädikate). Ein Löschen in N Einzelaufrufen wäre bei mehreren hundert
Assets ohne Gegenwert langsamer. Falls der Betreiber die wörtliche Fassung will, wird
Schritt 3 zu einer Schleife über `deleteAssetById`.

**Dateien:**
- Neu: `src/lib/assets/delete-assets.ts`, `src/lib/assets/delete-assets.test.ts`
- Ändern: `src/hooks/useGalleryAssets.ts`, `src/config/translations.ts`

**Produziert:**

```ts
export async function assetIdsInScope(origins?: readonly AssetOrigin[]): Promise<string[]>;
export async function deleteAssetById(id: string): Promise<void>;
export async function deleteAssetsInScope(origins?: readonly AssetOrigin[]): Promise<number>;
```

- [ ] **Schritt 1: Failing test schreiben**

`src/lib/assets/delete-assets.test.ts` — mit demselben Dexie-Mock-Muster wie W1, damit
kein echter IndexedDB nötig ist. Der Test deckt drei Aussagen ab: die Auswahl respektiert
den Bereich, Einzellöschen ruft `delete` mit genau einer Id, Massenlöschen ruft
`bulkDelete` mit genau den Ids im Bereich.

```ts
const del = jest.fn(async () => {});
const bulkDel = jest.fn(async () => {});
let rows: { id: string; conversationId?: string }[] = [];

jest.mock('@/lib/services/database', () => ({
  db: {
    assets: {
      delete: (id: string) => del(id),
      bulkDelete: (ids: string[]) => bulkDel(ids),
      filter: (pred: (a: unknown) => boolean) => ({
        primaryKeys: async () => rows.filter(pred).map((r) => r.id),
      }),
    },
  },
}));

import { assetIdsInScope, deleteAssetById, deleteAssetsInScope } from './delete-assets';

beforeEach(() => {
  del.mockClear();
  bulkDel.mockClear();
  rows = [
    { id: 'c1', conversationId: 'chat-1' },
    { id: 'p1', conversationId: '__playground__' },
    { id: 'm1', conversationId: undefined },
  ];
});

describe('delete-assets', () => {
  it('assetIdsInScope respektiert den Bereich', async () => {
    expect(await assetIdsInScope(['create'])).toEqual(['p1']);
    expect(await assetIdsInScope()).toEqual(['c1', 'p1', 'm1']);
  });

  it('deleteAssetById loescht genau eine Zeile', async () => {
    await deleteAssetById('c1');
    expect(del).toHaveBeenCalledWith('c1');
    expect(bulkDel).not.toHaveBeenCalled();
  });

  // Kehrt das Verhalten von vor Phase 5 um: Create-Assets ueberlebten ein
  // "alles loeschen" (Entscheidung E5.3).
  it('deleteAssetsInScope loescht genau die Ids im Bereich', async () => {
    const n = await deleteAssetsInScope(['create']);
    expect(bulkDel).toHaveBeenCalledWith(['p1']);
    expect(n).toBe(1);
  });

  it('deleteAssetsInScope ohne Bereich loescht alles', async () => {
    const n = await deleteAssetsInScope();
    expect(bulkDel).toHaveBeenCalledWith(['c1', 'p1', 'm1']);
    expect(n).toBe(3);
  });
});
```

- [ ] **Schritt 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
CI=1 npx jest --silent src/lib/assets/delete-assets.test.ts
```

Erwartet: FAIL — `Cannot find module './delete-assets'`.

- [ ] **Schritt 3: `delete-assets.ts` schreiben**

```ts
import { db } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';

/**
 * Die gemeinsame AUSWAHL fuer beide Loeschwege.
 *
 * Vor Phase 5 hatten Einzel- und Massenloeschen getrennte Praedikate
 * (`db.assets.delete(id)` gegen `db.assets.filter(isGalleryAsset).delete()`).
 * Sobald Loeschen mehr tut als die Zeile zu entfernen — seit E5.6 gibt es
 * Object-URLs freizugeben — driften zwei Praedikate auseinander.
 */
export async function assetIdsInScope(origins?: readonly AssetOrigin[]): Promise<string[]> {
  const keys = await db.assets.filter((a) => isInScope(a, origins)).primaryKeys();
  return keys as string[];
}

/**
 * Loescht eine Zeile. Der Blob ist ein Feld dieser Zeile (database.ts:37) —
 * es gibt keinen zweiten Speicher, aus dem eine Waise bleiben koennte.
 * Die zugehoerige Object-URL gibt der Aufrufer frei; nur er kennt sie.
 */
export async function deleteAssetById(id: string): Promise<void> {
  await db.assets.delete(id);
}

/** Loescht alles im Bereich. Gibt die Anzahl der geloeschten Zeilen zurueck. */
export async function deleteAssetsInScope(origins?: readonly AssetOrigin[]): Promise<number> {
  const ids = await assetIdsInScope(origins);
  if (ids.length === 0) return 0;
  await db.assets.bulkDelete(ids);
  return ids.length;
}
```

- [ ] **Schritt 4: Test laufen lassen, grün bestätigen**

```bash
CI=1 npx jest --silent src/lib/assets/delete-assets.test.ts
```

Erwartet: PASS, 4 Tests.

- [ ] **Schritt 5: `useGalleryAssets.ts` auf den gemeinsamen Pfad ziehen**

Die beiden inline gebliebenen Funktionen aus U1 Schritt 5 durch Importe ersetzen:

```ts
import { deleteAssetById, deleteAssetsInScope } from '@/lib/assets/delete-assets';
// ...
const deleteAsset = async (id: string) => { await deleteAssetById(id); };
const clearAllAssets = async () => { await deleteAssetsInScope(origins); };
```

- [ ] **Schritt 6: Übersetzungsschlüssel für die Bestätigung**

`gallery.clearConfirm` lautet heute `'Output wirklich leeren?'` / `'Clear output?'` —
ohne Anzahl, ohne Herkunft. Ersetzen durch parametrisierte Schlüssel plus
Herkunftsbeschriftungen:

```ts
// DE
'gallery.clearConfirmScoped': '{count} Objekte aus dieser Ansicht löschen?',
'gallery.originAll':     'alles',
'gallery.originChat':    'aus dem Chat',
'gallery.originCreate':  'aus Create',
'gallery.originCompose': 'aus Compose',
'gallery.filterAll':     'alles',
'gallery.filterChat':    'chat',
'gallery.filterCreate':  'create',

// EN
'gallery.clearConfirmScoped': 'Delete {count} items from this view?',
'gallery.originAll':     'everything',
'gallery.originChat':    'from chat',
'gallery.originCreate':  'from Create',
'gallery.originCompose': 'from Compose',
'gallery.filterAll':     'all',
'gallery.filterChat':    'chat',
'gallery.filterCreate':  'create',
```

`gallery.clearConfirm` bleibt vorerst stehen — `/gallery` nutzt ihn bis W6, und ein
entfernter Schlüssel bräche den Build vorher.

- [ ] **Schritt 7: Volle Verifikation**

```bash
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent
```

- [ ] **Schritt 8: Commit**

```bash
git add src/lib/assets/delete-assets.ts src/lib/assets/delete-assets.test.ts \
        src/hooks/useGalleryAssets.ts src/config/translations.ts
git commit -m "feat: Phase 5 — gemeinsamer Loeschpfad, ehrliche Anzahl in der Bestaetigung"
```

**Fertig, wenn:** `grep -rn "db.assets.filter" src/hooks/` findet nichts mehr (die Auswahl
liegt in `delete-assets.ts`) · `deleteAssetsInScope(['create'])` löscht Create-Assets ·
Testzahl steigt um 4.

---

### W2 — Der Herkunftsumschalter als eigene Komponente *(Worker)*

**Befund:** Der Umschalter wird von `GalleryPanel` **und** der Create-Galerie gebraucht.
Zweimal gebaut hieße zweimal gepflegt.

**Dateien:** Neu — `src/components/gallery/OriginFilter.tsx`,
`src/components/gallery/OriginFilter.test.tsx`

**Konsumiert aus U1:** `AssetOrigin`, `ALL_ORIGINS`

**Exakte Änderung — vollständiger Inhalt von `OriginFilter.tsx`:**

```tsx
"use client";

import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import type { AssetOrigin } from '@/lib/assets/asset-origin';

/**
 * Herkunftsumschalter. `value === undefined` heisst "alles".
 *
 * Der Zustand ist bewusst FLUECHTIG und wird vom Elternteil gehalten
 * (Entscheidung E5.2): L-D.1 und L-D.3 sind Reload-Kriterien und werden
 * mehrdeutig, sobald ein gemerkter Filter den Ausgangszustand verschiebt.
 * Deshalb hier kein localStorage.
 */
export interface OriginFilterProps {
  value: readonly AssetOrigin[] | undefined;
  onChange: (next: readonly AssetOrigin[] | undefined) => void;
  className?: string;
}

const CHOICES: { key: string; origins: readonly AssetOrigin[] | undefined; labelKey: string }[] = [
  { key: 'chat',   origins: ['chat', 'compose'], labelKey: 'gallery.filterChat' },
  { key: 'create', origins: ['create'],          labelKey: 'gallery.filterCreate' },
  { key: 'all',    origins: undefined,           labelKey: 'gallery.filterAll' },
];

function keyOf(value: readonly AssetOrigin[] | undefined): string {
  if (!value) return 'all';
  return value.includes('create') ? 'create' : 'chat';
}

export function OriginFilter({ value, onChange, className }: OriginFilterProps) {
  const { t } = useLanguage();
  const active = keyOf(value);

  return (
    <div
      role="radiogroup"
      aria-label={t('gallery.filterAll')}
      className={cn('flex items-center gap-0.5 rounded-lg border border-border/50 p-0.5', className)}
    >
      {CHOICES.map((c) => (
        <button
          key={c.key}
          type="button"
          role="radio"
          aria-checked={active === c.key}
          onClick={() => onChange(c.origins)}
          className={cn(
            'rounded-md px-2 py-0.5 font-mono text-[10.5px] lowercase transition-colors',
            active === c.key
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(c.labelKey)}
        </button>
      ))}
    </div>
  );
}
```

**Beachte:** Der Chat-Bereich ist `['chat', 'compose']`, nicht nur `['chat']` — Compose-
Tracks entstehen im Chat und gehören in dessen Ansicht (Befund B5). Die Schaltfläche
heißt trotzdem nur „chat", weil Compose hinter `FEATURES.compose = false` liegt.
Beschriftung monospace/lowercase nach der Schriftregel in `CLAUDE.md`: das sind Zustände,
kein Fließtext.

**Test — vollständiger Inhalt von `OriginFilter.test.tsx`:**

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OriginFilter } from './OriginFilter';

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

describe('OriginFilter', () => {
  it('markiert die aktive Wahl', () => {
    render(<OriginFilter value={['create']} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'gallery.filterCreate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'gallery.filterChat' })).not.toBeChecked();
  });

  it('undefined bedeutet alles', () => {
    render(<OriginFilter value={undefined} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'gallery.filterAll' })).toBeChecked();
  });

  it('meldet den Chat-Bereich inklusive Compose', async () => {
    const onChange = jest.fn();
    render(<OriginFilter value={['create']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'gallery.filterChat' }));
    expect(onChange).toHaveBeenCalledWith(['chat', 'compose']);
  });

  it('meldet undefined fuer alles', async () => {
    const onChange = jest.fn();
    render(<OriginFilter value={['create']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'gallery.filterAll' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
```

**Verifikation:**

```bash
CI=1 npx jest --silent src/components/gallery/OriginFilter.test.tsx
npx tsc --noEmit
```

**Fertig, wenn:** 4 Tests grün · `tsc` sauber · `grep -n "localStorage"
src/components/gallery/OriginFilter.tsx` findet **nichts**.

---

### W3 — Umschalter und Bestätigung im Chat verdrahten *(Worker)*

**Befund:** `AppLayout` hält den Hook, `GalleryPanel` zeigt die Assets. Der Filterzustand
gehört nach `AppLayout`, weil dort der Hook aufgerufen wird.
`totalAssetCount={galleryData.assets.length}` ist auf 50 begrenzt und damit als Zahl in
der Bestätigung unbrauchbar (Befund B4).

**Dateien:** `src/components/layout/AppLayout.tsx`,
`src/components/gallery/GalleryPanel.tsx`

**Konsumiert:** `useGalleryAssets` (U1), `OriginFilter` (W2), `gallery.clearConfirmScoped`
(U2)

**Exakte Änderungen:**

1. In `AppLayout.tsx`, bei den übrigen `useState` um Zeile 97:

```tsx
// Fluechtig, kein localStorage (Entscheidung E5.2): nach jedem Reload steht
// der Filter auf der eigenen Herkunft, und genau darauf stuetzt sich der
// Pruefweg von L-D.3.
const [galleryOrigins, setGalleryOrigins] =
  useState<readonly AssetOrigin[] | undefined>(['chat', 'compose']);
```

mit `import type { AssetOrigin } from '@/lib/assets/asset-origin';`

2. Zeile 100 ändern:

```tsx
const galleryData = useGalleryAssets(galleryOrigins);
```

3. Die `GalleryPanel`-Props (Zeilen 314-322) erweitern und `totalAssetCount` korrigieren:

```tsx
<GalleryPanel
  isOpen={galleryPanelOpen}
  onClose={() => setGalleryPanelOpen(false)}
  assets={galleryData.assets}
  totalAssetCount={galleryData.totalInScope}
  origins={galleryOrigins}
  onOriginsChange={setGalleryOrigins}
  onDelete={galleryData.deleteAsset}
  onClearAll={galleryData.clearAllAssets}
  onToggleStar={galleryData.toggleStarred}
/>
```

Die übrigen bestehenden Props unverändert lassen.

4. In `GalleryPanel.tsx` das Props-Interface (ab Zeile 314) um zwei Felder erweitern:

```tsx
origins: readonly AssetOrigin[] | undefined;
onOriginsChange: (next: readonly AssetOrigin[] | undefined) => void;
```

und in der Destrukturierung (ab Zeile 326) `origins, onOriginsChange,` ergänzen.

5. Den `OriginFilter` in die Tab-Leiste bei Zeile 447 setzen, rechtsbündig neben die
   bestehenden Tabs:

```tsx
<div role="tablist" aria-label={t('nav.gallery')} className="flex items-center gap-1 px-4 pt-3 pb-2 shrink-0">
  {/* die beiden bestehenden Tab-Buttons unveraendert */}
  <OriginFilter value={origins} onChange={onOriginsChange} className="ml-auto" />
</div>
```

6. Den Bestätigungstext bei Zeile 428 ersetzen:

```tsx
onClick={() => {
  if (totalAssetCount === 0) return;
  const msg = t('gallery.clearConfirmScoped').replace('{count}', String(totalAssetCount));
  if (confirm(msg)) onClearAll();
}}
```

**Verifikation:**

```bash
npx tsc --noEmit
CI=1 npx jest --silent
grep -n "galleryData.assets.length" src/components/layout/AppLayout.tsx
grep -n "gallery.clearConfirm'" src/components/gallery/GalleryPanel.tsx
```

**Fertig, wenn:** `tsc` sauber · alle Tests grün · die beiden `grep` finden **nichts**
(die alte Zählung und der alte Bestätigungsschlüssel sind weg) ·
`grep -n "localStorage" src/components/layout/AppLayout.tsx` zeigt keinen neuen Treffer
für den Filter.

---

### W4 — Umschalter und Löschen im Create verdrahten *(Worker)*

**Befund B7 — die Falle dieses Pakets:** `MetaRail` wird an **zwei** Stellen gerendert:
[`PlaygroundShell.tsx:436`](../src/app/create/PlaygroundShell.tsx) (Rail ab 1280 px) und
[`Zeile 489`](../src/app/create/PlaygroundShell.tsx) (Bottom-Drawer darunter). **Beide**
brauchen `onDelete`, sonst fehlt der Knopf auf dem Telefon.

**Dateien:** `src/app/create/PlaygroundShell.tsx`,
`src/components/playground/MetaRail.tsx`, `src/components/playground/MetaRail.test.tsx`,
`src/components/playground/Gallery.tsx`

**Konsumiert:** `deleteAssetById` (U2), `OriginFilter` (W2), `origins`-Prop (W1)

**Exakte Änderungen:**

1. In `MetaRail.tsx` das Props-Interface (Zeile 54-60) erweitern:

```tsx
interface Props {
  item: GalleryItem | null;
  className?: string;
  onLoad?: (item: GalleryItem) => void;
  onRerun?: (item: GalleryItem) => void;
  onUseAsReference?: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem) => void;
}
```

`onDelete` in die Destrukturierung aufnehmen, `Trash2` aus `lucide-react` importieren.

2. Den Aktionsblock (Zeilen 112-130) um eine vierte Aktion ergänzen, **nach** „Als Referenz
   übernehmen":

```tsx
{onDelete && (
  <Button
    variant="outline"
    size="sm"
    className="col-span-2 gap-1.5 text-destructive hover:border-destructive/55 hover:text-destructive"
    onClick={() => onDelete(item)}
  >
    <Trash2 className="h-3 w-3" />
    Löschen
  </Button>
)}
```

3. In `MetaRail.test.tsx` einen Test ergänzen:

```tsx
it('zeigt Loeschen nur mit onDelete und reicht das Item durch', async () => {
  const onDelete = jest.fn();
  const { rerender } = render(<MetaRail item={ITEM} />);
  expect(screen.queryByRole('button', { name: /löschen/i })).toBeNull();

  rerender(<MetaRail item={ITEM} onDelete={onDelete} />);
  await userEvent.click(screen.getByRole('button', { name: /löschen/i }));
  expect(onDelete).toHaveBeenCalledWith(ITEM);
});
```

`ITEM` ist das im Testkopf bereits vorhandene Item-Objekt.

4. In `Gallery.tsx` die von diesem Lauf gehaltenen URLs **id-zuordenbar** machen, damit
   Löschen sie sofort freigeben kann (Leck L2, F7). `ownedUrls` von `string[]` auf
   `Map<string, string>` umstellen:

```tsx
const ownedUrls = useRef<Map<string, string>>(new Map());
```

`toItem` bekommt die Map statt des Arrays:

```tsx
function toItem(a: Asset, created: Map<string, string>): GalleryItem | null {
  let url = a.remoteUrl;
  if (!url && a.blob) {
    url = BlobManager.createURL(a.blob, 'playground-gallery');
    created.set(a.id, url);
  }
  if (!url) return null;
  return { id: a.id, url, kind: a.contentType?.startsWith('video/') ? 'video' : 'image',
           prompt: a.prompt ?? '', modelId: a.modelId ?? '', timestamp: a.timestamp, params: a.params };
}
```

Alle `created.forEach((u) => BlobManager.releaseURL(u))` bleiben gültig — `Map.forEach`
liefert den Wert als erstes Argument. Der Aufruf in Zeile 197 wird zu
`ownedUrls.current.forEach((u) => BlobManager.releaseURL(u))` (unverändert) gefolgt von
`ownedUrls.current = created;`.

Neu exportieren, damit der Shell die URL beim Löschen freigeben kann:

```tsx
/** Gibt die von dieser Galerie fuer `id` gehaltene Object-URL frei, falls es eine gibt. */
export function releaseOwnedUrl(ownedUrls: Map<string, string>, id: string): void {
  const url = ownedUrls.get(id);
  if (url) {
    BlobManager.releaseURL(url);
    ownedUrls.delete(id);
  }
}
```

Diese Map über eine neue Prop nach oben reichen ist unnötig verschachtelt — stattdessen
bekommt `Gallery` eine `onDelete`-Prop und ruft die Freigabe **selbst**:

```tsx
interface Props {
  // ... bestehende
  origins?: readonly AssetOrigin[];
  onDeleteItem?: (id: string) => Promise<void>;
}
```

und stellt sie dem Shell über den `onSelect`-Weg nicht zur Verfügung, sondern
**PlaygroundShell ruft `onDelete` an `MetaRail` und erhöht danach `galleryKey`** — der
Ladelauf gibt die alten URLs ohnehin frei (Zeile 197). Für F7 genügt das nicht, weil die
Freigabe erst beim nächsten Lauf greift; deshalb der explizite Weg unten in Schritt 5.

5. In `PlaygroundShell.tsx` den Filterzustand und den Löschpfad ergänzen:

```tsx
// Fluechtig, kein localStorage (E5.2).
const [galleryOrigins, setGalleryOrigins] =
  useState<readonly AssetOrigin[] | undefined>(['create']);

const deleteItem = async (item: GalleryItem) => {
  await deleteAssetById(item.id);
  // Sofort freigeben statt auf den naechsten Ladelauf zu warten (F7).
  if (item.url.startsWith('blob:')) BlobManager.releaseURL(item.url);
  if (selectedRef.current?.id === item.id) {
    selectedRef.current = null;
    setSelected(null);
  }
  setDetailsOpen(false);
  setGalleryKey((k) => k + 1);
};
```

Importe: `deleteAssetById` aus `@/lib/assets/delete-assets`, `AssetOrigin` als Typ,
`OriginFilter` aus `@/components/gallery/OriginFilter`.

6. `origins={galleryOrigins}` an `Gallery` (Zeile 423) durchreichen und den `OriginFilter`
   in die Kopfzeile neben den `← chat`-Anker setzen (Zeile 395):

```tsx
<div className="flex items-center gap-1">
  <OriginFilter value={galleryOrigins} onChange={setGalleryOrigins} className="mr-2" />
  <a href="/unified" ... >← chat</a>
  {/* Rest unveraendert */}
</div>
```

7. `onDelete={deleteItem}` an **beide** `MetaRail`-Stellen — Zeile 436 (Rail) **und**
   Zeile 489 (Drawer).

**Verifikation:**

```bash
npx tsc --noEmit
CI=1 npx jest --silent src/components/playground/ src/app/create/
grep -c "onDelete={deleteItem}" src/app/create/PlaygroundShell.tsx
```

**Fertig, wenn:** `tsc` sauber · alle Create- und Playground-Tests grün · der letzte
`grep` gibt **`2`** aus — nicht 1 (Befund B7).

---

### W5 — Das Object-URL-Leck im Generierungspfad schließen *(Worker)*

**Befund B3 (L1):** [`PlaygroundShell.tsx:220`](../src/app/create/PlaygroundShell.tsx)
erzeugt beim Pruna-Byte-Pfad eine Object-URL und gibt sie nie frei. `cleanupOld()`
überspringt sie, weil [`blob-manager.ts:131`](../src/lib/blob-manager.ts) bei
`refCount > 0` per `continue` aussteigt. Sie überlebt bis zum Reload.

**Warum nicht einfach sofort freigeben:** Die URL wird nach dem Speichern noch für den
`GalleryItem` gebraucht, der die Detailansicht füllt. Freigeben darf man sie erst, wenn
der Ladelauf der Galerie eine eigene URL aus dem gespeicherten Blob gebaut hat — also
nach `setGalleryKey`.

**Datei:** `src/app/create/PlaygroundShell.tsx` (nur der Block ab Zeile 217)

**Exakte Änderung** — im `else`-Zweig die URL merken und nach dem Galerie-Refresh
freigeben:

```tsx
let ownedBlobUrl: string | null = null;
if (ct.startsWith('application/json')) {
  // ... unveraendert
} else {
  const blob = await res.blob();
  mediaUrl = BlobManager.createURL(blob, 'playground');
  ownedBlobUrl = mediaUrl;
  kind = ct.startsWith('video/') ? 'video' : 'image';
}
```

und nach `setGalleryKey((k) => k + 1);` (Zeile 249):

```tsx
setRuns((rs) => rs.filter((r) => r.id !== run.id));
setGalleryKey((k) => k + 1);

// Der Ladelauf der Galerie baut aus dem gespeicherten Blob eine eigene URL.
// Ohne diese Freigabe haelt jeder Pruna-Lauf ohne Pollen-Token seinen Blob
// bis zum Reload im Speicher — cleanupOld() ueberspringt ihn, weil sein
// refCount > 0 ist (blob-manager.ts:131).
if (ownedBlobUrl && assetId) {
  BlobManager.releaseURL(ownedBlobUrl);
  ownedBlobUrl = null;
}
```

**Bedingung `&& assetId` ist wesentlich:** Wenn `saveGeneratedAsset` `undefined` liefert
(Befund B6 — Blob unter `SMALL_BLOB_SKIP_BYTES`), gibt es kein gespeichertes Asset, aus
dem die Galerie eine neue URL bauen könnte. Die URL muss dann stehen bleiben, sonst zeigt
die Detailansicht ins Leere.

Im `catch`-Zweig ebenfalls freigeben, damit ein Fehler nach dem `createURL` nichts hält:

```tsx
} catch (e) {
  if (ownedBlobUrl) { BlobManager.releaseURL(ownedBlobUrl); ownedBlobUrl = null; }
  // ... bestehender Fehlerpfad unveraendert
```

**Verifikation:**

```bash
npx tsc --noEmit
CI=1 npx jest --silent src/app/create/
grep -c "releaseURL(ownedBlobUrl)" src/app/create/PlaygroundShell.tsx
```

**Fertig, wenn:** `tsc` sauber · Create-Tests grün · der letzte `grep` gibt **`2`** aus
(Erfolgs- und Fehlerpfad).

---

### W6 — `/gallery`: den „Vault leeren"-Knopf entfernen *(Worker)*

**Befund (E5.5, verifiziert):** [`src/app/gallery/page.tsx:239-251`](../src/app/gallery/page.tsx)
trägt einen Knopf, der `clearAllAssets()` hinter einem nackten
`confirm(t('gallery.clearConfirm'))` auslöst. Die Seite ist DEPRECATED, unverlinkt
(`grep` über `src/` und `next.config.ts` findet keinen Verweis) und bekommt nach E5.4
keinen Herkunftsfilter — „sichtbare Auswahl" hieße dort **alles**.

**Datei:** `src/app/gallery/page.tsx` — **nur** dieser Block, sonst nichts.

**Exakte Änderung:** Den gesamten Block Zeile 239-251 löschen:

```tsx
{assets.length > 0 && (
   <Button
     variant="ghost"
     size="sm"
     onClick={() => {
        if(confirm(t('gallery.clearConfirm'))) clearAllAssets();
     }}
     className="text-red-500 hover:text-red-400 hover:bg-red-950/20 gap-2"
   >
     <Trash2 className="w-4 h-4" />
     <span className="hidden sm:inline">{t('action.clearVault')}</span>
   </Button>
)}
```

Danach die dadurch verwaisten Bezüge in **derselben Datei** entfernen — und nur die:

- Zeile 172: `clearAllAssets` aus der Destrukturierung von `useGalleryAssets()` streichen.
- Zeile 25: `Trash2` aus dem `lucide-react`-Import streichen, **falls** die Datei ihn sonst
  nirgends nutzt. Vorher prüfen: `grep -c "Trash2" src/app/gallery/page.tsx`.

Die Übersetzungsschlüssel `gallery.clearConfirm` und `action.clearVault` **stehen lassen** —
sie sind Wörterbucheinträge und kein toter Code im Sinne der Aufräumregel.

**Was nicht angefasst wird:** Route, DEPRECATED-Banner, Tabs, Lightbox, Einzellöschen,
Sternmarkierung, das Design.

**Verifikation:**

```bash
npx tsc --noEmit && npm run lint
grep -n "clearAllAssets\|clearVault" src/app/gallery/page.tsx
CI=1 npx jest --silent
```

**Fertig, wenn:** Der `grep` findet **nichts** · `tsc` und `lint` sauber · alle Tests grün ·
`git diff --stat src/app/gallery/page.tsx` zeigt nur Löschungen.

---

### W7 — Die Wahrheitsdokumente nachziehen *(Worker)*

**Dateien:** `docs/FAHRPLAN-create.md`, `docs/LAUNCH_CRITERIA.md`, `CLAUDE.md`,
`docs/README.md`

**Exakte Änderungen:**

1. In `docs/FAHRPLAN-create.md`, Abschnitt „Phase 5 — Eine Galerie": Überschrift auf
   `### Phase 5 — Eine Galerie (**P5**, **P6**) · ✅ ERLEDIGT am <Datum>` setzen und den
   Aufzählungspunkt

   ```
   - `/gallery` zeigt weiterhin alles
   ```

   ersetzen durch:

   ```
   - `/gallery` ist seit dem Umbau auf `GalleryPanel` als DEPRECATED markiert und
     unverlinkt. Die Seite wird nur mitgezogen: sie erbt den Pool und zeigt danach
     auch Create-Assets, bekommt aber keinen Herkunftsfilter. Ihr „Vault leeren"-Knopf
     ist entfallen, weil er ohne Filter alles gelöscht hätte. Sie zeigt weiterhin
     höchstens 50 Einträge — bewusst hingenommen (Betreiber, 2026-08-29).
   ```

   Im Abschnitt „Galerie" denselben Satz bei **P6** korrigieren: „Create filtert nur auf
   `PLAYGROUND_CONVERSATION_ID`" bleibt als historische Beschreibung stehen, bekommt aber
   den Zusatz „— bis Phase 5; seither liest `assetOrigin()` den Sentinel als Herkunfts-Tag."

2. In `docs/LAUNCH_CRITERIA.md`: bei **L-D.1**, **L-D.2** und **L-D.3** jeweils
   `Status: offen` auf `Status: erledigt (<Datum>)` setzen. **Nur** diese drei Zeilen.
   Das Kopfdatum „Letzte Prüfung" mitziehen.

3. In `CLAUDE.md`, Abschnitt „Asset Persistence", vor dem Unterabschnitt „Long runs answer
   202" einfügen:

   ```markdown
   ### Herkunft: ein Pool, drei Tags (seit Phase 5)

   Chat und Create schreiben in denselben `db.assets`-Store und lesen ihn beide.
   `assetOrigin()` in [src/lib/assets/asset-origin.ts](src/lib/assets/asset-origin.ts) ist
   der **einzige** Ort, an dem `assets.conversationId` als Herkunft gelesen wird:
   `'__playground__'` → `create`, keine `conversationId` → `compose`, sonst → `chat`.
   `PLAYGROUND_CONVERSATION_ID` bleibt der Sentinel in gespeicherten Nutzerdaten — der
   Bezeichner wird nicht umbenannt, nur seine Rolle hat sich geändert. Kein Dexie 5,
   keine Migration.

   `compose` ist eine Zuordnung per Ausschluss, keine Aussage der Daten: Compose
   speichert ohne `conversationId`, Altbestand kann ebenfalls dort landen.

   Der Herkunftsfilter je Oberfläche ist **flüchtig** — kein `localStorage`. Nach jedem
   Reload steht er auf der eigenen Herkunft; L-D.1 und L-D.3 stützen sich darauf.

   Löschen läuft über **eine** Auswahlfunktion in
   [src/lib/assets/delete-assets.ts](src/lib/assets/delete-assets.ts). Einzellöschen wirkt
   global, „alles löschen" nur auf den aktiven Filterbereich. Der Blob ist ein Feld der
   Asset-Zeile — es gibt keinen zweiten Speicher und damit keine verwaisten Blobs. Was
   freigegeben werden muss, ist die **Object-URL**: beim Löschen sofort, im
   Generierungspfad nach dem Speichern.
   ```

4. In `docs/README.md` unter „Start Here", **direkt nach** der Zeile zu
   `PLAN-audit-patch-2026-08-29.md`, einfügen:

   ```markdown
   - `PLAN-phase-5-eine-galerie.md` — implementation plan for Phase 5: one asset pool for
     chat and Create, `PLAYGROUND_CONVERSATION_ID` turned from a separator into an origin
     tag, a per-surface origin filter, and deletion that also frees the object URL. Carries
     the reality check that corrects two false Fahrplan claims (`/gallery` never showed
     everything, and it is already deprecated).
   ```

**Verifikation:**

```bash
grep -n "zeigt weiterhin alles" docs/FAHRPLAN-create.md
grep -c "Status: offen" docs/LAUNCH_CRITERIA.md
grep -n "assetOrigin" CLAUDE.md
grep -n "PLAN-phase-5" docs/README.md
```

**Fertig, wenn:** Der erste `grep` findet **nichts** · der zweite Zähler ist **um 3
gesunken** gegenüber dem Wert vor dem Paket (vorher notieren!) · der dritte und vierte
finden je mindestens einen Treffer.

---

### U3 — Querlesen gegen alle vorherigen Pakete *(Hauptagent, nicht delegierbar, PFLICHT)*

**Warum dieses Paket existiert.** Aus
[`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md), Abschnitt 6,
wörtlich:

> Die Doppelverifikation je Paket hat innerhalb der Pakete alles gefangen. Alle drei
> Befunde entstanden trotzdem — weil niemand über das Ganze geschaut hat, bevor der
> Handoff geschrieben wurde. **Ein Plan mit N Paketen braucht ein Paket N+1: „Querlesen
> gegen alle vorherigen Pakete".** Es ist nicht delegierbar an einen Worker, der nur ein
> Paket kennt.

Es läuft **nach dem letzten Arbeitspaket und vor dem Handoff**. Der Handoff wird **nach**
dem Push geschrieben.

**Was geprüft wird — die Stellen, an denen mehrere Pakete sich berühren:**

- [ ] **Q1 — Die zweifach gerenderte `MetaRail`.** `grep -c "onDelete={deleteItem}"
      src/app/create/PlaygroundShell.tsx` muss **2** ergeben. W4 verlangt es; nur hier
      fällt auf, wenn ein Worker die zweite Stelle übersehen hat (Befund B7).

- [ ] **Q2 — Kein zweiter Ort, der `conversationId` als Herkunft deutet.**
      `grep -rn "PLAYGROUND_CONVERSATION_ID" src/ | grep -v "asset-origin\|constants.ts\|\.test\."`
      darf nur noch `PlaygroundShell.tsx` beim **Schreiben** treffen (`conversationId:
      PLAYGROUND_CONVERSATION_ID` in `saveGeneratedAsset`), nie beim **Lesen**. E5.1
      verlangt genau einen Leseort.

- [ ] **Q3 — Kein `localStorage` für den Filter.** `grep -rn "galleryOrigins"
      src/ | grep -i "localstorage\|useLocalStorageState"` muss leer sein. E5.2 ist der
      Grund, warum F2 und F4 sich nicht widersprechen.

- [ ] **Q4 — Beide Löschwege nutzen dieselbe Auswahl.** `grep -rn "db.assets.filter\|db.assets.delete\|bulkDelete" src/`
      darf außerhalb von `src/lib/assets/delete-assets.ts` und `database.ts` keinen Treffer
      mehr haben. Befund B3.

- [ ] **Q5 — Die Zahl in der Bestätigung ist die echte.** `grep -rn "totalAssetCount"
      src/` — der Wert muss aus `totalInScope` stammen, nirgends mehr aus
      `assets.length`. Befund B4, F12.

- [ ] **Q6 — Die Übersetzungsschlüssel existieren in beiden Sprachen.** Für jeden in U2
      angelegten Schlüssel: `grep -c "gallery.filterChat" src/config/translations.ts`
      muss **2** ergeben (DE und EN). Ein einsprachiger Schlüssel fällt in keinem
      Einzelpaket auf.

- [ ] **Q7 — Kriterien-Buchführung.** Für jedes von F1 bis F14: steht ein Paket dahinter,
      und ist es gelaufen? Insbesondere **F1**, das kein Paket baut, sondern nur verifiziert
      — es darf nicht durchrutschen, weil ihm kein Paket zugeordnet ist.

- [ ] **Q8 — Hat ein Paket ein Gate-Kriterium verschoben, ohne dass ein anderes davon
      wusste?** Konkret: W6 entfernt eine destruktive Aktion aus `/gallery`. Berührt das
      ein Kriterium außerhalb von Bereich D? `grep -n "gallery\|Vault" docs/LAUNCH_CRITERIA.md`
      und die Treffer einzeln lesen.

- [ ] **Q9 — Voller Durchlauf gegen den Endstand.**

      ```bash
      npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build
      ```

      Erwartet: alles grün, Testzahl **≥ 852 + die neu hinzugekommenen** (U1: 7+3, U2: 4,
      W2: 4, W4: 1 → mindestens **871**). Sinkt die Zahl, ist ein Test still gelöscht
      worden.

- [ ] **Q10 — `git diff` gegen `625523c` von Hand lesen.** Jede geänderte Zeile muss sich
      auf ein Paket zurückführen lassen. Was sich nicht zurückführen lässt, ist
      Scope-Kriechen und wird rückgängig gemacht.

**Fertig, wenn:** Q1 bis Q10 abgehakt sind und jeder Befund entweder behoben oder
schriftlich als bewusst offen vermerkt ist.

---

## 8. Offene Rückfragen an den Betreiber

Diese vier sind **nicht** entschieden. Sie stehen hier ausdrücklich als Fragen, nicht als
Annahmen. Die Ausführung darf ohne Antwort auf **R1** nicht in Paket U2 starten; R2 bis R4
können bis U3 offenbleiben.

### R1 — Was passiert mit markierten (starred) Assets bei „alles löschen"?

*Vom Betreiber selbst aufgeworfen, ausdrücklich nicht von mir zu entscheiden.*

Heute ist die Sternmarkierung eine reine Sortierhilfe
([`useGalleryAssets.ts:17-21`](../src/hooks/useGalleryAssets.ts) — `sortStarredFirst`) und
schützt nichts. Drei Lesarten:

| | Bedeutung | Preis |
|---|---|---|
| **a** | Stern ist nur Sortierung. „Alles löschen" löscht auch Markierte. | Nichts zu bauen. Aber ein Nutzer, der etwas markiert, tut das plausibel als „behalten" — und verliert es. |
| **b** | Stern schützt. „Alles löschen" überspringt Markierte, die Bestätigung sagt es. | Die Bedeutung des Sterns ändert sich still für Bestandsdaten. `assetIdsInScope` bekommt einen zweiten Parameter. |
| **c** | Stern schützt, aber der Nutzer kann es abwählen („auch markierte löschen"). | Ehrlichste Variante, teuerste Oberfläche — ein zweites Bedienelement in einem `confirm()`, das keins hat. |

Der Plan ist so geschnitten, dass **a** ohne Änderung herauskommt. **b** wäre ein
Zusatz in U2 Schritt 3 (`assetIdsInScope(origins, { keepStarred })`), **c** zusätzlich ein
eigenes Dialogfenster statt `confirm()`.

### R2 — Soll der flüchtige Filter gegen einen künftigen Navigationsumbau abgesichert werden?

Deine Präzisierung war: session-lokal heißt „überlebt keinen Reload", nicht „überlebt
keine Navigation". **Verifiziert:** Chat → Create ist `router.push('/create')`
([`AppSidebar.tsx:64`](../src/components/layout/AppSidebar.tsx)) — client-side. Create →
Chat ist ein plain `<a href="/unified">`
([`PlaygroundShell.tsx:396`](../src/app/create/PlaygroundShell.tsx)) — **voller
Seitenladen**, kein `next/link` in der Datei.

**Folge:** Es gibt heute keinen Seitenladen, der Chat → Create → Chat überspannt. Deine
Anforderung ist erfüllt, aber nur durch die heutige Navigationsform. Baut jemand den `<a>`
später auf `<Link>` um — ein plausibler Griff, etwa in Phase 6 —, ändert sich das
Verhalten still, und kein Test fängt es.

| | Vorgehen | Preis |
|---|---|---|
| **a** | Zwei schlichte `useState`, ein Kommentar am `<a>`, der erklärt, warum er kein `<Link>` ist. | Nichts zu bauen. Der Schutz ist ein Kommentar. |
| **b** | Zusätzlich ein Modul-Singleton als Zustandsort, der einen Umbau überlebt. | Baut einen Zustand für eine Strecke, die es nicht gibt — Aufwand ohne heutigen Gegenwert. |

Der Plan setzt **a** um (W3 Schritt 1, W4 Schritt 5). Bei **b** käme eine siebte Datei
unter `src/lib/assets/` dazu.

### R3 — Heißt der Chat-Bereich `['chat', 'compose']` oder nur `['chat']`?

W2 legt fest: die Schaltfläche „chat" wählt **`['chat', 'compose']`**, weil Compose-Tracks
im Chat entstehen und Compose hinter `FEATURES.compose = false` liegt — ein eigener
Bereich hätte heute keinen Inhalt. Sobald Phase 8 Musik ins Create holt, kippt diese
Zuordnung: die Tracks entstehen dann im Create. Der Plan hält die Zuordnung deshalb an
**einer** Stelle (`CHOICES` in `OriginFilter.tsx`), damit Phase 8 sie in einer Zeile dreht.
Wenn du das anders willst, ist jetzt der Zeitpunkt.

### R4 — Soll die wörtliche Fassung von „derselbe Pfad" gelten?

Siehe Vorbemerkung zu U2: umgesetzt wird **eine gemeinsame Auswahl, zwei Ausführungen**
(`bulkDelete` für die Menge). Die wörtliche Fassung wäre eine Schleife über
`deleteAssetById`. Der Unterschied ist Laufzeit bei mehreren hundert Assets, sonst nichts.
Sag Bescheid, wenn die Schleife gewünscht ist.

---

## 9. Gesamtverifikation vor dem Handoff

```bash
# Ausgangsstand zum Vergleich
git log --oneline -1                    # muss auf 625523c aufbauen
CI=1 npm test                           # Vorher: 109 Suiten, 852 Tests

# Endstand
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build
```

**Erwartet:** lint sauber · `tsc` sauber · **mindestens 871 Tests** in **mindestens 112
Suiten** (drei neue Testdateien: `asset-origin.test.ts`, `delete-assets.test.ts`,
`OriginFilter.test.tsx`) · Build erfolgreich.

**Nicht automatisierbar, im Browser zu prüfen** — F1 bis F12 verlangen echte Läufe. Nach
`AGENTS.md` („Anti-Browser Tool") führt der Betreiber sie durch; der Agent liefert die
Prüfschritte aus der Tabelle in Abschnitt 2 und wertet die Rückmeldung aus. Ohne diese
Läufe darf **kein** Kriterium in `LAUNCH_CRITERIA.md` auf „erledigt" gesetzt werden — W7
Schritt 2 ist deshalb erst nach der Browser-Runde auszuführen, nicht davor.

---

## 10. Was dieser Plan bewusst offen lässt

- **Phase 4 ist nicht ausgeführt** und wird dieselben zwei Dateien anfassen (Abschnitt 1).
- **`PLAN-phase-4-fehlerklarheit.md` nennt vier tote Pfade** (`src/app/playground/…`) —
  Aufgabe der Phase-4-Sitzung, nicht dieser.
- **Befund B6** (Ergebnis unter `SMALL_BLOB_SKIP_BYTES` verschwindet nach Reload) bleibt
  bestehen; er gehört in den Fehlerpfad von Phase 4.
- **Compose bekommt kein aktives Herkunfts-Tag** — Phase 8.
- **`/gallery` bleibt bei 50 Einträgen** — bewusst hingenommen (E5.4, Befund B4).
- **Keine Paginierung**, kein Dexie 5, keine Umbenennung von `PLAYGROUND_CONVERSATION_ID`.
