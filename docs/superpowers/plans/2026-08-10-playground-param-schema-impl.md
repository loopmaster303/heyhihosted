# Playground-Parametrierung — Umsetzungsplan

**Spec:** `docs/superpowers/specs/2026-08-10-playground-param-schema.md`
**Branch:** `playground/redesign` (Basis `161b970`)
**Worktree:** `/Users/johnmeckel/heyhihosted-playground`

**Grundsatz:** Kein Eingriff in Chat oder Visualize. `unified-image-models.ts`, `unified-model-configs.ts` und `PRUNA_MODEL_IDS` bleiben unangetastet. Der Playground bekommt seine eigene Parameter-Wahrheit.

## Reihenfolge

Task 1 legt das Schema an, Task 2–4 machen es serverseitig wirksam, Task 5–6 bringen es an die Oberfläche, Task 7 räumt auf. Die Reihenfolge ist bindend: eine Oberfläche vor der Serverseite würde Regler zeigen, die nichts bewirken.

---

## Task 1 — Schema-Datei

**Neu:** `src/lib/playground/param-schema.ts`

Typen wie in der Spec, Abschnitt 3. Dazu die Einträge für die dreizehn Pruna-Modelle und die geläufigen Pollinations-Modelle.

Verbindliche Werte aus der Doku, pro Modell:

```
zimage (z-image-turbo)      keine Bilder, Prompt Pflicht
  width/height 64–2048 (1024) · num_inference_steps 1–50 (8)
  guidance_scale 0–20 (0) · go_fast (aus) · seed · output_format png|jpg|webp (jpg)
  output_quality 0–100 (80)

qwen-image                  1 Bild optional, Prompt Pflicht
  aspect_ratio 1:1|16:9|9:16|4:3|3:4|3:2|2:3 (16:9)
  guidance 0–10 (3) · num_inference_steps 1–50 (30) · negative_prompt
  strength 0–1 (0.9, nur mit Bild) · enhance_prompt (aus) · go_fast (an)
  image_size optimize_for_quality|optimize_for_speed
  seed · output_format webp|jpg|png (webp) · output_quality 0–100 (80)

qwen-image-edit-plus        1–2 Bilder PFLICHT, Prompt Pflicht
  aspect_ratio match_input_image|16:9|9:16|1:1|4:3|3:4 (match_input_image)
  go_fast (an) · seed · output_format webp|jpg|png (webp) · output_quality 0–100 (95)

wan-image-small             keine Bilder, Prompt Pflicht
  aspect_ratio 1:1|16:9|9:16|4:3|3:4|21:9|custom (16:9)
  width/height nur bei custom, Vielfache von 16
  juiced (aus) · seed · output_format png|jpg|webp (jpg) · output_quality 1–100 (80)

flux-2-klein-4b             bis 5 Bilder optional, Prompt Pflicht          NEU
  aspect_ratio 1:1|16:9|21:9|3:2|2:3|4:5|5:4|3:4|4:3|9:16|9:21|match_input_image (1:1)
  output_megapixels 0.25|0.5|1|2|4 (1) · go_fast (aus)
  seed · output_format png|jpg|webp (jpg) · output_quality 0–100 (95)

p-image                     keine Bilder, Prompt Pflicht
  aspect_ratio 1:1|16:9|9:16|4:3|3:4|3:2|2:3|custom (16:9)
  width/height 256–1440 Vielfache von 16, nur bei custom
  prompt_upsampling (aus) · seed

p-image-edit                1–5 Bilder PFLICHT, Prompt Pflicht
  aspect_ratio match_input_image|1:1|16:9|9:16|4:3|3:4|3:2|2:3 (match_input_image)
  turbo (an) · seed

p-image-upscale             1 Bild PFLICHT, KEIN Prompt
  target 1–128 MP (4) · enhance_details (aus) · enhance_realism (aus)
  output_format webp|jpg|png (jpg) · output_quality 0–100 (80)

p-image-ideogram            keine Bilder, Prompt Pflicht                    NEU
  thinking very low|low|medium|high (medium) · image_size 1K|2K (2K)
  aspect_ratio 1:1|16:9|9:16|4:3|3:4|3:2|2:3|custom (1:1)
  width/height bis 2560, nur bei custom
  prompt_upsampling (an) · seed · output_format png|jpg|webp (jpg)
  output_quality 0–100 (80)

wan-t2v                     keine Bilder, Prompt Pflicht
  FRAMES num_frames 81–121 (81) bei frames_per_second → zeigt Sekunden
  frames_per_second 5–30 (16) · resolution 480p|720p (480p)
  aspect_ratio 16:9|9:16 (16:9) · interpolate_output (an) · go_fast (an)
  optimize_prompt (aus) · sample_shift 1–20 (12) · seed

wan-i2v                     1 Bild PFLICHT + Endframe optional, Prompt Pflicht
  wie wan-t2v, interpolate_output Vorgabe aus
  zweites Bild geht als last_image

vace                        1–3 Referenzbilder optional, Quellvideo optional
  size 720*1280|1280*720|480*832|832*480 (832*480)
  frame_num (81) · speed_mode 3 Stufen · sample_steps (50)
  sample_solver unipc|dpm++ (unipc) · sample_guide_scale (5)
  sample_shift (16) · seed

p-video                     1 Bild optional + Endframe optional, Prompt Pflicht
  duration 1–20 s (5) · resolution 720p|1080p (720p) · fps 24|48 (24)
  aspect_ratio 16:9|9:16|4:3|3:4|3:2|2:3|1:1 (16:9), entfällt bei Eingabebild
  draft (aus) · save_audio (an) · prompt_upsampling (an) · seed
```

**Pollinations.** Modellabhängige Regeln aus der Spezifikation:
- `seed` nur bei `flux`, `zimage`, `seedream`, `klein`, `seedance`, `nova-reel`
- `quality` low|medium|high|hd nur bei `gptimage`, `gptimage-large`, `gpt-image-2`
- `transparent` nur bei `gptimage`, `gptimage-large`
- `resolution` 480p|720p|1080p nur bei `veo`, `wan-pro`, `p-video`, `seedance-pro`
- `aspectRatio` nur Video, nur 16:9|9:16 — Bilder über width/height
- Endframe nur bei `veo`, `seedance-2.0`, `wan-fast`, `wan-pro`
- `duration`: veo 4|6|8 · seedance-pro 2–10 · seedance-2.0 4–15 · wan 2–15 · nova-reel 6–120 in 6er-Schritten
- Referenzbilder nur bei `kontext`, `gptimage`, `seedream`, `klein`, `nanobanana`

Dazu die Pixeltabelle aus der Spec als `ASPECT_TO_PIXELS`.

**Test:** `param-schema.test.ts` — jeder Eintrag hat eindeutige Feldnamen, jedes `default` liegt im erlaubten Bereich, `frames`-Felder liefern nur erreichbare Sekundenwerte.

---

## Task 2 — Zwei neue Pruna-Modelle

**Bearbeiten:** `src/config/pruna-models.ts`

`p-image-ideogram` und `flux-2-klein-4b` in `PRUNA_MODEL_MAP` und `PRUNA_MODEL_IDS` ergänzen, mit `buildInput` nach den Werten aus Task 1. Beide `endpoint: 'default'`, `mode: 'sync'`, `isVideo: false`.

Achtung beim Namen: `flux-2-klein-4b` darf nicht mit dem bestehenden Pollinations-`klein` kollidieren. Eigene ID vergeben, etwa `p-flux-klein`.

Ergänzend Einträge in `unified-image-models.ts`, damit die Modelle einen Anzeigenamen bekommen — `enabled: true`, `isFree: false`, `byopVisible: true`.

**Test:** `pruna-models.test.ts` um beide erweitern.

---

## Task 3 — buildInput auf das Schema umstellen

**Bearbeiten:** `src/config/pruna-models.ts`

`PrunaFieldInput` bekommt ein offenes Feld für die Schema-Werte:

```ts
export interface PrunaFieldInput {
  // … bestehende Felder bleiben, damit der Chat-Pfad unverändert läuft
  params?: Record<string, string | number | boolean>;
}
```

Jedes `buildInput` der dreizehn Modelle übernimmt `f.params` und überschreibt damit seine Konstanten. Konkret sind das die heute einbetonierten Werte: `resolution: '480p'` und `frames_per_second: 16` bei den wan-Modellen, `guidance: 3` und `num_inference_steps: 30` bei `qwen-image`, `go_fast` überall.

Zusätzlich pro Modell:
- **`wan-i2v`**: zweites Bild als `last_image` senden statt zu verwerfen
- **`p-video`**: zweites Bild als `last_frame_image`
- **`vace`**: `f.video` als `src_video` durchreichen
- **`p-image-upscale`**: ohne Prompt lauffähig
- **überall wo die API es kennt**: `disable_safety_checker: true` bzw. `disable_safety_filter: true`

**Test:** je Modell ein Fall, der prüft, dass ein Schema-Wert die Vorgabe schlägt und dass Endframe beziehungsweise Quellvideo ankommen.

---

## Task 4 — Pollinations-Seitenverhältnis in Pixel

**Bearbeiten:** `src/app/api/generate/route.ts` und `src/lib/pollinations-sdk.ts`

- Für **Bildmodelle**: `aspectRatio` über `ASPECT_TO_PIXELS` in `width`/`height` auflösen und `aspectRatio` **nicht** mitsenden. Explizit gesetzte `width`/`height` haben Vorrang.
- Für **Videomodelle**: `aspectRatio` bleibt, beschränkt auf `16:9` und `9:16`.
- `quality: 'hd'` nicht mehr pauschal senden, sondern nur bei `gptimage`, `gptimage-large`, `gpt-image-2`.
- Zod-Schema um `resolution`, `transparent`, `quality` erweitern und durchreichen.
- Mehrere Referenzbilder mit `|` verbinden.

**Test:** `route.test.ts` — ein Bildmodell mit `aspectRatio: '16:9'` erzeugt 1344×768 und keinen `aspectRatio`-Parameter; ein Videomodell behält ihn; `quality` erscheint nur bei der gptimage-Familie.

---

## Task 5 — Generischer Parameter-Regler

**Neu:** `src/components/playground/ParamControls.tsx`

Erzeugt aus einem `ModelParamSchema` die Bedienelemente. Ein Feldtyp, ein Baustein:
- `number` → `Input type="number"` mit `min`/`max`/`step`
- `enum` → `DropdownMenu` bei bis zu sechs Werten, sonst `Select`
- `boolean` → `Switch` aus `@/components/ui/switch`
- `text` → `Input` oder `Textarea` bei `multiline`
- `seconds` → `Slider` mit den erlaubten Werten
- `frames` → `Slider`, zeigt Sekunden, meldet Frames zurück

Gruppen mit `advanced: true` liegen hinter dem bestehenden Aufklapper, alle anderen stehen offen in der Sidebar.

**Ersetzt** `AdvancedPanel.tsx`, dessen vier feste Felder damit hinfällig sind. `AspectRatioPills` und `DurationSlider` bleiben, werden aber vom Schema gespeist.

**Test:** jeder Feldtyp rendert und meldet Änderungen; ein Feld mit unerfüllter Sichtbarkeitsbedingung fehlt.

---

## Task 6 — Verdrahtung

**Bearbeiten:** `usePlaygroundState.ts`, `PlaygroundSidebar.tsx`, `generate-request.ts`, `PromptBar.tsx`, `ReferenceSlots.tsx`

- State bekommt `params: Record<string, string | number | boolean>` statt der vier festen Advanced-Felder. Bei Modellwechsel auf die Vorgaben des neuen Schemas zurücksetzen.
- `buildGenerateBody` schickt `params` mit.
- Der Senden-Knopf respektiert `promptRequired`.
- `ReferenceSlots` liest `images.min`/`max`/`roles` aus dem Schema; die Beschriftungen kommen von dort statt aus `referenceMode`.
- Für Modelle mit `sourceVideo` ein Feld zum Hochladen eines Quellvideos — das ist der bislang tote `sourceVideo`-State.
- Die Modell-Liste des Playgrounds filtert auf Einträge mit Schema.

**Test:** Shell-Smoke um einen Fall erweitern, in dem ein Modellwechsel die Parameter auf die neuen Vorgaben zurücksetzt.

---

## Task 7 — Abschluss

- `AdvancedPanel.tsx` und sein Test löschen.
- Deutsche Beschriftungen für alle Felder in `translations.ts`, englische dazu.
- `npm run lint`, `npm run typecheck`, `CI=1 npm test`, `npm run build`.

## Gate

Merge erst wenn Lint, Typecheck, Tests und Build grün sind, mein Review durch ist und dein Durchgang auf `localhost:3000/playground` sitzt — besonders: ein wan-Video mit verstellter Bildrate, ein Upscale ohne Prompt, ein Endframe bei `wan-i2v`.
