# Antwort auf alle Punkte

## Leitprinzip, das über allem steht

**Die Bedienoberfläche ist für jedes Modell gleich. Übersetzt wird im Backend.** Der Nutzer stellt „16:9" und „8 Sekunden" ein — was das Modell daraus macht, ist unsere Sache, nicht seine. Modellinterne Begriffe wie `match_input_image`, `custom`, `num_frames` oder `size: "832*480"` tauchen in der Oberfläche **nicht** auf.

Das ändert zwei Dinge am Plan, die dort noch anders stehen.

## 1. Seitenverhältnis — Route übersetzt, SDK bleibt unangetastet

Meine Planzeile „in `imageUrl` das `aspectRatio` nicht an die Query hängen" ist hinfällig. `/api/generate` ist zwar der einzige Aufrufer von `imageUrl`/`videoUrl`, aber es ist derselbe Endpoint, den Chat und Visualize benutzen — eine SDK-Änderung träfe die mit.

**Also: `pollinations-sdk.ts` nicht anfassen.** Die Übersetzung passiert in `route.ts`.

Der Nutzer sieht **immer dieselbe Reihe** Seitenverhältnisse. Die Route übersetzt pro Ziel:

| Ziel | Übersetzung |
|---|---|
| Pollinations Bild | über `ASPECT_TO_PIXELS` in `width`/`height`, `aspectRatio` entfällt |
| Pollinations Video | `aspectRatio` bleibt, nur `16:9` und `9:16` |
| Pruna mit `aspect_ratio`-Enum | direkt durchreichen, wenn das Modell den Wert kennt |
| Pruna mit `custom` | `aspect_ratio: 'custom'` plus `width`/`height` aus der Pixeltabelle, auf die Modellgrenzen geklemmt |
| `vace` | in das `size`-Format übersetzen: `16:9`→`832*480`, `9:16`→`480*832` |
| Modell kennt das Verhältnis nicht | Pill sichtbar, aber deaktiviert |

`match_input_image` ist kein Nutzerwert. Es wird automatisch gesetzt, wenn ein Referenzbild hochgeladen ist und das Modell es kennt.

Verhältnisse, die ein Modell nicht kann, bleiben **sichtbar und ausgegraut** statt zu verschwinden — sonst springt die Reihe bei jedem Modellwechsel und wirkt kaputt.

## 2. Dauer — immer Sekunden, Frames sind Backend-Sache

Der Feldtyp `frames` verschwindet aus der Oberfläche. **`frames_per_second` wird kein Bedienelement**, sondern bleibt auf dem Modell-Standard (16 bei wan, 24 bei p-video). Genau das war der verwirrende Teil: eine verstellbare Bildrate verschiebt die Sekunden-Skala unter der Hand.

Der Nutzer sieht überall einen Sekunden-Regler. Die Route rechnet für die wan-Modelle `num_frames = sekunden × fps` und klemmt auf 81–121.

Die **angebotenen Sekundenwerte kommen weiterhin vom Modell**, sonst lügen wir wieder: bei `wan-t2v` sind 81–121 Frames bei 16 fps genau 5 bis 7 Sekunden — also `[5, 6, 7]`, nicht `[2, 5, 10, 15]`. Einheitliche Einheit, ehrliche Auswahl.

Drei Modelle bekommen weiterhin gar keinen Regler, weil weder Doku noch Registry Werte nennen: `grok-video-pro`, `grok-imagine-video-1.5`, `happyhorse-1.1`.

## 3. `params` im Zod-Schema — ja, aber gefiltert

```ts
params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
```

Für **Pruna** vollständig in `buildInput`. Für **Pollinations** nur bekannte Schlüssel über den typisierten Pfad — `quality`, `transparent`, `resolution`, `seed`, `negative_prompt`. Unbekanntes nicht durchreichen: die API ignoriert es zwar, aber dann steht Müll in der URL und Fehler werden schwerer zu finden.

## 4. `sourceVideo` nur für `vace` — bestätigt

`p-video-animate` und `p-video-replace` sind aus der Playground-Liste raus, damit bleibt `vace` der einzige Abnehmer. Das Feld ist ab dann nicht mehr tot, sondern hat genau einen Nutzer.

## 5. Branch — `playground/redesign`

Richtig. `HERMES-SESSION.md` ist eine nicht eingecheckte Notiz aus einer früheren Sitzung und veraltet. Kette: `playground/redesign` → `playground/multimedia` → `main`. Merge-Entscheidung liegt beim Nutzer.

## Noch nicht gefragt, wird dir aber in Task 1 begegnen

Die Registry nennt das Feld `name`, nicht `id`, und den Anzeigenamen `title`. Der bestehende Code liest `m.id` und `m.name` — beides muss mit umgestellt werden, sonst heißen nach Task 1 alle Modelle `undefined`.
