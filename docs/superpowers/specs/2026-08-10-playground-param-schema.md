# Playground-Parametrierung — Spezifikation

**Datum:** 2026-08-10
**Zweck:** Der Playground soll jeden Modell-Parameter korrekt anzeigen und bedienbar machen. Das ist das Profi-Feature von hey.hi hosted und der Unterschied zum Chat, dessen Visualize-Funktion parallel auf zwei bis drei Modelle ohne tiefe Konfiguration eingedampft wird.

**Geltungsbereich:** ausschließlich `/playground`. Kein Eingriff in den Chat-Pfad.

---

## 1. Warum das nicht mit einem größeren Advanced-Panel geht

Die Parameter-Wahrheit liegt heute an drei Stellen, die sich gegenseitig widersprechen:

| Datei | Was sie behauptet | Problem |
|---|---|---|
| `unified-image-models.ts` | Sichtbarkeit, `kind`, `maxImages`, `referenceMode`, `durationRange` | `referenceMode` bei fast allen Pruna-Modellen leer, `durationRange` pauschal `[5,10]` |
| `unified-model-configs.ts` | ein `inputs`-Array je Modell | für fast alle Modelle identisch (`prompt, width, height, seed, output_format`) — bildet die APIs nicht ab |
| `pruna-models.ts` | `buildInput` je Modell | hier steht die echte Wahrheit, aber hartkodiert und für die UI unsichtbar |

Ein größeres Advanced-Panel würde weiterhin aus `unified-model-configs.ts` lesen und damit weiterhin das Falsche anzeigen.

## 2. Belegte Abweichungen

Quellen: `docs.api.pruna.ai/guides/models/*` (13 Modellseiten, abgerufen 2026-08-10) und die Pollinations-Spezifikation für `GET /image/{prompt}`.

### 2.1 Pollinations

| Parameter | Laut Spezifikation gültig für | Ist-Zustand |
|---|---|---|
| `seed` | nur `flux`, `zimage`, `seedream`, `klein`, `seedance`, `nova-reel` — andere ignorieren ihn | in `unified-model-configs.ts` für jedes Modell deklariert |
| `quality` (`low`/`medium`/`high`/`hd`) | nur `gptimage`, `gptimage-large`, `gpt-image-2` | in `route.ts` hart auf `'hd'` für alle |
| `transparent` | nur `gptimage`, `gptimage-large` | nie angeboten |
| `resolution` (`480p`/`720p`/`1080p`) | nur `veo`, `wan-pro`, `p-video`, `seedance-pro` | nie angeboten |
| `aspectRatio` | **nur Videomodelle**, nur `16:9` und `9:16` | `AspectRatioPills` bietet fünf Werte auch für Bildmodelle an; `pollinations-sdk.ts` hängt den Wert roh an die Query, wo er für Bilder wirkungslos ist |
| `width`/`height` | bei Bildern exakte Pixel; bei Video nur zur Ableitung des Verhältnisses | für Bilder nie aus dem Seitenverhältnis abgeleitet |
| `image[1]` als Endframe | nur `veo`, `seedance-2.0`, `wan-fast`, `wan-pro` — andere verwerfen ihn stillschweigend | nirgends erreichbar |
| `duration` | `veo` 4/6/8 · `seedance-pro` 2–10 · `seedance-2.0` 4–15 · `wan` 2–15 · `nova-reel` 6–120 in 6er-Schritten | pauschal `[5,10]` bzw. `[5,10,15]` |
| `audio` | nur Video; `wan` erzeugt Audio unabhängig vom Flag, `veo` braucht `true` | nie angeboten |
| `safe` | Kommaliste: `privacy`, `secrets`, `sexual`, `violence`, `shield`, `true`, `nsfw` | nie angeboten |

**Bildmodelle mit Referenzbild-Unterstützung:** `kontext`, `gptimage`, `seedream`, `klein`, `nanobanana`.
**Mehrere Referenzen** werden per `|` oder `,` getrennt übergeben.

### 2.2 Pruna

Pro Modell die tatsächlichen Felder. Fett markiert, was heute weder Oberfläche noch Verdrahtung hat.

| Modell | Bilder | Parameter |
|---|---|---|
| `z-image-turbo` | keine | `width`/`height` 64–2048 (Vorgabe 1024), **`num_inference_steps` 1–50 (8)**, **`guidance_scale` 0–20 (0)**, **`go_fast`**, `seed`, `output_format`, **`output_quality` 0–100** |
| `qwen-image` | 1 (i2i) | **`guidance` 0–10 (3)**, `negative_prompt`, **`num_inference_steps` 1–50 (30)**, **`strength` 0–1 (0.9)**, `aspect_ratio`, **`image_size` Qualität/Tempo**, **`enhance_prompt`**, **LoRA** |
| `qwen-image-edit-plus` | **1–2, Pflicht** | **`go_fast`**, `aspect_ratio` inkl. `match_input_image`, `seed`, `output_format`, **`output_quality`** |
| `p-image` | keine | `aspect_ratio` inkl. **`custom`**, dann `width`/`height` 256–1440 in 16er-Schritten, **`lora_weights`**, **`lora_scale` −1…3**, **`prompt_upsampling`**, `seed`, **`disable_safety_checker`** |
| `p-image-edit` | **1–5, Pflicht** | **`turbo` (an)**, `aspect_ratio` Vorgabe `match_input_image`, `seed` |
| `p-image-upscale` | 1 | **kein Prompt nötig**, **`target` 1–128 MP (4)**, `output_format`, **`output_quality`**, **`enhance_details`**, **`enhance_realism`** |
| `p-image-ideogram` | keine | **`thinking` sehr niedrig…hoch**, **`image_size` 1K/2K**, **`prompt_upsampling` (an)**, `aspect_ratio` inkl. `custom`, `width`/`height` bis 2560 |
| `wan-image-small` | keine | `aspect_ratio` inkl. **`21:9`** und `custom`, `width`/`height` in 16er-Schritten, **`num_outputs` 1–4**, **`juiced`**, `output_format`, **`output_quality`** |
| `flux-2-klein-4b` | **bis 5** | `aspect_ratio` (12 Werte inkl. `match_input_image`), **`output_megapixels` 0.25–4**, **`go_fast`**, `seed`, `output_format`, **`output_quality`** |
| `wan-t2v` | keine | **`num_frames` 81–121 (81)**, **`resolution` 480p/720p**, `aspect_ratio` nur 16:9/9:16, **`frames_per_second` 5–30 (16)**, **`interpolate_output`**, **`go_fast`**, **`optimize_prompt`**, **`sample_shift` 1–20 (12)**, **LoRA**, `seed` |
| `wan-i2v` | 1 + **`last_image` als Endframe** | wie `wan-t2v` |
| `vace` | **1–3** über `src_ref_images` | **`src_video`**, **`src_mask`**, `size` (4 Werte), `frame_num` (81), `speed_mode` (3 Stufen), `sample_steps` (50), **`sample_solver` unipc/dpm++**, **`sample_guide_scale` (5)**, **`sample_shift` (16)**, `seed` |
| `p-video` | 1 + **`last_frame_image`** | **`audio` als Datei**, `duration` 1–20 (5, **wird bei Audio ignoriert**), **`resolution` 720p/1080p**, **`fps` 24/48**, `aspect_ratio` (**bei Eingabebild ignoriert**), **`draft`**, **`save_audio`**, **`prompt_upsampling`** |

### 2.3 Konkrete Fehler im laufenden Code

**Der Dauer-Regler ist bei den wan-Modellen unbrauchbar.** `wan-t2v` und `wan-i2v` kennen keinen `duration`-Parameter. `buildInput` rechnet `duration × 16 fps` und klemmt auf 81–121 Frames, also **5,06 bis 7,56 Sekunden**. Die Config bietet `[5, 10]` an — der zweite Wert ist unerreichbar, beide Werte liefern nicht, was auf dem Regler steht.

**`temporalControl` ist toter Code.** Der Typ existiert, `getDurationOptionsSeconds` wertet ihn aus, aber **kein einziges Modell setzt das Feld**. Alles fällt auf `durationRange.options` zurück.

**Endframes sind unerreichbar.** `wan-i2v` (`last_image`) und `p-video` (`last_frame_image`) haben echte Endframe-Parameter. `buildInput` nimmt `f.image[0]` und verwirft den Rest; `maxImages` steht auf 1. `referenceMode: 'start-end-frame'` ist bei keinem Pruna-Modell gesetzt.

**`guidance` und `steps` verpuffen bei Pruna.** Kein einziges `buildInput` liest sie. Bei `qwen-image` und `z-image-turbo` existieren sie in der API, sind dort aber als Konstanten einbetoniert.

**`p-image-upscale` ist unbenutzbar.** Das Modell braucht keinen Prompt, aber die Prompt-Leiste sperrt „Senden" bei leerem Feld.

**`sourceVideo` im State ist tot.** Kein UI-Pfad setzt es — obwohl `vace` mit `src_video` und `p-video-animate`/`p-video-replace` genau darauf angewiesen sind.

---

## 3. Lösung: ein Schema pro Modell

Eine neue Datei `src/lib/playground/param-schema.ts` als **einzige Quelle** für die Playground-Parametrierung. Sie beschreibt pro Modell, welche Felder es gibt, welchen Typ und Wertebereich sie haben und wann sie sichtbar sind. Aus demselben Schema erzeugt die Oberfläche ihre Regler **und** der Request-Builder seine Nutzlast. Ein Widerspruch zwischen Anzeige und Versand wird damit strukturell unmöglich.

```ts
type ParamField =
  | { kind: 'number';  name: string; label: string; min: number; max: number;
      step?: number; default?: number; unit?: string }
  | { kind: 'enum';    name: string; label: string; options: { value: string; label: string }[];
      default?: string }
  | { kind: 'boolean'; name: string; label: string; default?: boolean }
  | { kind: 'text';    name: string; label: string; multiline?: boolean; placeholder?: string }
  | { kind: 'seconds'; name: string; label: string; options: number[]; default?: number }
  | { kind: 'frames';  name: string; label: string; min: number; max: number; fps: number;
      default?: number };  // zeigt Sekunden, sendet Frames

interface ModelParamSchema {
  promptRequired: boolean;        // p-image-upscale: false
  images: { min: number; max: number; roles?: string[] };  // roles z.B. ['Start','Ende']
  sourceVideo?: boolean;          // vace, p-video-animate, p-video-replace
  groups: { label: string; advanced?: boolean; fields: ParamField[] }[];
}
```

**`frames` als eigener Feldtyp** löst das wan-Problem: der Regler zeigt Sekunden, kennt aber die echten Frame-Grenzen und die Bildrate, sodass nur tatsächlich erreichbare Werte auswählbar sind.

**`promptRequired`** entsperrt `p-image-upscale`.

**`images.roles`** ersetzt das nie gesetzte `referenceMode` durch echte Beschriftungen pro Steckplatz.

### Abgrenzung

- Das Schema gilt **nur** für den Playground. `unified-image-models.ts` bleibt unangetastet, weil Chat und Visualize davon abhängen.
- Modelle ohne Schema-Eintrag bekommen einen konservativen Standard aus Prompt, Seitenverhältnis und Seed — sie werden nicht unbenutzbar.
- `buildGenerateBody` liest künftig das Schema statt fester Feldnamen.
- Auf der Serverseite müssen `pruna-models.ts` (`buildInput`) und `pollinations-sdk.ts` die zusätzlichen Felder auch durchreichen — sonst zeigt die Oberfläche Regler, die nichts bewirken. Das ist der aufwändigere Teil.

---

## 4. Offene Punkte vor der Umsetzung

1. **Pollinations-Bildseitenverhältnis.** Für Bildmodelle muss aus dem gewählten Verhältnis ein Pixelpaar werden. Braucht eine Tabelle Verhältnis → Breite/Höhe, sinnvollerweise um 1 Megapixel herum.
2. **Sicherheitsflags.** `safe` und `disable_safety_checker` sind heikel. Vorschlag: vorerst nicht anbieten, Standardverhalten beibehalten.
3. **LoRA.** `p-image`, `qwen-image`, `wan-t2v` und `wan-i2v` nehmen LoRA-Gewichte per URL. Echtes Profi-Feature, aber eigener Themenblock — Vorschlag: nicht in dieser Runde.
4. **`num_outputs` bei `wan-image-small`** (bis 4 Bilder pro Lauf) bricht die Annahme „ein Ergebnis pro Generierung" in Galerie und Persistenz.
5. **Drei nicht abgerufene Pruna-Seiten:** `p-video-animate`, `p-video-replace`, `wan-fast`. Deren Felder sind bisher nur aus `buildInput` erschlossen, nicht aus der Doku belegt.
