# Playground-Parametrierung — Umsetzungsplan

**Spec:** `docs/superpowers/specs/2026-08-10-playground-param-schema.md`
**Branch:** `playground/redesign`
**Worktree:** `/Users/johnmeckel/heyhihosted-playground`

Dieser Plan ist so geschrieben, dass ein Agent ohne Vorwissen ihn Task für Task abarbeiten kann. Jeder Task enthält alles Nötige: Pfade, konkrete Werte, Prüfbefehle. Ein Task geht an einen Worker; Worker bekommen **nur ihren Abschnitt plus den Block „Gemeinsame Regeln"**, niemals den ganzen Plan.

---

## Ausgangslage in einem Absatz

Der Playground zeigt Parameter an, die bei den APIs nichts bewirken, und verschweigt Parameter, die es gibt. Ursache: die Parameter-Wahrheit liegt verteilt auf `unified-image-models.ts`, `unified-model-configs.ts` und die hartkodierten `buildInput`-Funktionen in `pruna-models.ts`, und diese drei widersprechen sich gegenseitig und den APIs. Dieser Plan gibt dem Playground eine eigene, korrekte Parameter-Quelle, ohne Chat und Visualize anzufassen.

## Gemeinsame Regeln — an JEDEN Worker mitgeben

```
Projekt: Next.js 16 App Router, TypeScript, Tailwind, shadcn/Radix.
Arbeitsverzeichnis: /Users/johnmeckel/heyhihosted-playground

EXECUTE NOW. Kein Plan, keine Rückfrage, keine Zusammenfassung.
Nutze sofort das Write-Tool. Schreib nur die genannten Dateien.

Styling ausschliesslich mit Tailwind-Klassen plus cn() aus '@/lib/utils'.
Verboten: neue .module.css Dateien, Emoji als Icons, eigene Dropdown- oder
Modal-Implementierungen, erfundene CSS-Tokens.
Vorgeschrieben: Komponenten aus '@/components/ui/*', Icons aus 'lucide-react',
Farben nur ueber Tailwind-Tokens.
UI-Texte auf Deutsch.

JEST-FALLSTRICK: node_modules wird nicht transformiert. 'lucide-react' und die
Radix-basierten ui-Komponenten sind ESM und sprengen sonst die ganze Suite mit
"SyntaxError: Cannot use import statement outside a module". Die Fehlermeldung
zeigt dabei auf die FALSCHE Zeile. Deshalb in JEDEN Test, der eine Komponente
rendert, ganz oben vor den Imports:

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

Dazu jede benutzte shadcn-Komponente per jest.mock durch schlichte DOM-Vertreter
ersetzen. Vorbild: src/components/playground/ProviderSelect.test.tsx
Ein gestubbtes DropdownMenuContent muss seine Kinder IMMER rendern.
DropdownMenuItem verdrahtet onSelect auf onClick.
```

## Nicht anfassen

`src/config/unified-image-models.ts`, `src/config/unified-model-configs.ts` und die Liste `PRUNA_MODEL_IDS` bleiben unverändert — Chat und Visualize hängen daran. Ausnahme: Task 2 ergänzt zwei neue Modelle, ohne bestehende zu ändern.

## Reihenfolge

Bindend. Erst die Datenquellen, dann der Server, dann die Oberfläche. Andersherum entstehen Regler, die nichts bewirken — genau der Fehler, den dieser Plan behebt.

| Task | Inhalt | hängt ab von |
|---|---|---|
| 1 | Registry korrekt auslesen | — |
| 2 | Dauer-Tabelle und Pixel-Tabelle | — |
| 3 | Pruna-Parameter-Schema | — |
| 4 | Zwei neue Pruna-Modelle | 3 |
| 5 | `buildInput` öffnen | 3 |
| 6 | Pollinations-Request korrigieren | 2 |
| 7 | Generische Parameter-Regler | 1, 2, 3 |
| 8 | Verdrahtung | 5, 6, 7 |
| 9 | Abschluss | alle |

---

# Task 1 — Registry korrekt auslesen

**Problem:** `https://gen.pollinations.ai/image/models` liefert die Felder in snake_case. `src/lib/playground/model-source.ts` liest sie in camelCase. Dadurch ist `input_modalities` und `output_modalities` bei jedem Modell `undefined`, `isVideo` immer falsch und `acceptsImage` immer falsch. Nur weil die lokale Config als Rückfall dient, fällt das nicht überall auf — für Modelle, die dort fehlen, ist die Einordnung schlicht falsch.

Ausserdem verschenkt der Typ vier Felder, die die Registry mitliefert und die wir sonst hartkodieren müssten.

**Datei:** `src/lib/playground/model-source.ts`

**Echte Feldnamen der Registry** (verifiziert an der Live-Antwort, 54 Modelle):

```
name, aliases, title, description, brand, brand_url, category,
input_modalities, output_modalities, video_capabilities,
max_reference_images, resolutions, paid_only, pricing,
pricing_variants, pricing_default_label, capabilities,
flat_rate, alpha, community, added_date
```

`video_capabilities` enthält je Modell eine Teilmenge von `start_frame`, `end_frame`, `audio_output`.

**Ändere `PollinationsLiveModel` auf:**

```ts
export interface PollinationsLiveModel {
  name: string;
  title?: string;
  aliases?: string[];
  input_modalities?: string[];
  output_modalities?: string[];
  video_capabilities?: string[];
  max_reference_images?: number;
  resolutions?: string[];
  paid_only?: boolean;
  alpha?: boolean;
  community?: boolean;
}
```

Beachte: das Feld heisst `name`, nicht `id`. Die bisherige Verwendung von `m.id` muss auf `m.name` umgestellt werden, und `m.name` als Anzeigename wird zu `m.title`.

**Erweitere `PlaygroundModelEntry` um:**

```ts
  supportsEndFrame: boolean;   // video_capabilities enthält 'end_frame'
  supportsAudio: boolean;      // video_capabilities enthält 'audio_output'
  resolutions?: string[];      // nur wo die Registry welche nennt
  paidOnly: boolean;
```

**Schreibe `buildPollinationsEntries` neu.** Die Registry hat Vorrang, die lokale Config dient nur noch für den Anzeigenamen, wenn `title` fehlt:

```ts
export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[] {
  return live
    .filter((m) => !isPrunaModel(m.name))
    .map((m) => {
      const cfg = getUnifiedModel(m.name);
      const out = m.output_modalities ?? [];
      const inp = m.input_modalities ?? [];
      const caps = m.video_capabilities ?? [];
      const isVideo = out.includes('video');
      const maxImages = m.max_reference_images ?? (inp.includes('image') ? 1 : 0);
      return {
        id: m.name,
        name: m.title ?? cfg?.name ?? m.name,
        provider: 'pollinations' as const,
        kind: isVideo ? ('video' as const) : ('image' as const),
        supportsReference: maxImages > 0,
        // Ein Videomodell, das ausschliesslich Bilder annimmt, braucht zwingend eines.
        requiresReference: isVideo && inp.includes('image') && !inp.includes('text'),
        maxImages,
        referenceMode: caps.includes('end_frame') ? ('start-end-frame' as const) : undefined,
        supportsEndFrame: caps.includes('end_frame'),
        supportsAudio: caps.includes('audio_output'),
        resolutions: m.resolutions,
        paidOnly: m.paid_only ?? false,
        unmapped: !cfg,
      };
    });
}
```

**`buildPrunaEntries` ergänzen:** die neuen Felder mit `supportsEndFrame: false`, `supportsAudio: false`, `paidOnly: true` befüllen. Task 5 setzt `supportsEndFrame` für `wan-i2v` und `p-video` auf `true`.

**Fallback in `src/hooks/usePlaygroundModels.ts` anpassen.** Dort wird bei leerer oder fehlgeschlagener Antwort aus `UNIFIED_IMAGE_MODELS` ein Ersatz gebaut. Die dort erzeugten Objekte müssen auf die neuen Feldnamen umgestellt werden: `name` statt `id`, `input_modalities`/`output_modalities` statt der camelCase-Varianten, `title` für den Anzeigenamen.

**Test:** `src/lib/playground/model-source.test.ts` erweitern.

```ts
it('reads the registry snake_case fields', () => {
  const [e] = buildPollinationsEntries([{
    name: 'veo', title: 'Veo 3.1 Fast',
    input_modalities: ['text', 'image'], output_modalities: ['video'],
    video_capabilities: ['start_frame', 'end_frame', 'audio_output'],
    max_reference_images: 2, resolutions: ['720p', '1080p'], paid_only: true,
  }]);
  expect(e.kind).toBe('video');
  expect(e.maxImages).toBe(2);
  expect(e.supportsEndFrame).toBe(true);
  expect(e.supportsAudio).toBe(true);
  expect(e.referenceMode).toBe('start-end-frame');
  expect(e.paidOnly).toBe(true);
  expect(e.name).toBe('Veo 3.1 Fast');
});

it('treats a text-only image model as t2i without references', () => {
  const [e] = buildPollinationsEntries([{
    name: 'zimage', title: 'Z-Image Turbo',
    input_modalities: ['text'], output_modalities: ['image'], paid_only: false,
  }]);
  expect(e.kind).toBe('image');
  expect(e.maxImages).toBe(0);
  expect(e.supportsReference).toBe(false);
  expect(e.paidOnly).toBe(false);
});
```

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/lib/playground/model-source.test.ts
npm run typecheck
```

---

# Task 2 — Dauer-Tabelle und Pixel-Tabelle

Die Registry nennt **keine** Dauer-Werte. Die bleiben handgepflegt aus der Pollinations-Spezifikation.

**Neu:** `src/lib/playground/pollinations-caps.ts`

```ts
/**
 * Was die Registry nicht sagt. Werte aus der Pollinations-Spezifikation für
 * GET /image/{prompt}, Stand 2026-08-10.
 */

/** Sekunden pro Videomodell. Leer = Modell akzeptiert keine Dauer. */
export const DURATION_OPTIONS: Record<string, number[]> = {
  veo: [4, 6, 8],
  'seedance-pro': [2, 4, 6, 8, 10],
  'seedance-2.0': [4, 6, 8, 10, 12, 15],
  wan: [2, 5, 10, 15],
  'wan-fast': [2, 5, 10, 15],
  'wan-pro': [2, 5, 10, 15],
  'nova-reel': [6, 12, 18, 24, 30, 60, 120],
  'p-video': [5, 10, 15, 20],
};

/**
 * Nicht dokumentiert: grok-video-pro, grok-imagine-video-1.5, happyhorse-1.1.
 * Die bekommen keinen Dauer-Regler, bis die Werte belegt sind — lieber kein
 * Regler als einer, der Werte anbietet, die das Modell nicht liefert.
 */

/** Seed wird laut Spezifikation nur von diesen Modellen beachtet. */
export const SEED_MODELS = new Set(['flux', 'zimage', 'seedream', 'klein', 'seedance', 'nova-reel']);

/** quality low|medium|high|hd gibt es nur hier. */
export const QUALITY_MODELS = new Set(['gptimage', 'gptimage-large', 'gpt-image-2']);

/** Transparenter Hintergrund nur hier. */
export const TRANSPARENT_MODELS = new Set(['gptimage', 'gptimage-large']);

/**
 * Seitenverhältnis in Pixel, rund ein Megapixel. Pollinations wertet
 * aspectRatio NUR bei Videomodellen aus; Bilder brauchen width/height.
 */
export const ASPECT_TO_PIXELS: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '4:3':  { width: 1152, height: 896 },
  '3:4':  { width: 896,  height: 1152 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768,  height: 1344 },
  '3:2':  { width: 1216, height: 832 },
  '2:3':  { width: 832,  height: 1216 },
  '21:9': { width: 1536, height: 640 },
};

/** Videomodelle kennen nur diese beiden. */
export const VIDEO_ASPECT_RATIOS = ['16:9', '9:16'] as const;

export function durationOptionsFor(modelId: string): number[] {
  return DURATION_OPTIONS[modelId] ?? [];
}

export function pixelsForAspect(ratio: string): { width: number; height: number } | undefined {
  return ASPECT_TO_PIXELS[ratio];
}
```

**Test:** `pollinations-caps.test.ts` — jedes Pixelpaar liegt zwischen 0,8 und 1,2 Megapixel und beide Seiten sind durch 16 teilbar; `durationOptionsFor` liefert für ein unbekanntes Modell ein leeres Feld.

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/lib/playground/pollinations-caps.test.ts
```

---

# Task 3 — Pruna-Parameter-Schema

**Neu:** `src/lib/playground/param-schema.ts`

Für Pruna gibt es keine Registry, deshalb wird hier handgepflegt. Alle Werte stammen aus `docs.api.pruna.ai/guides/models/*`, abgerufen 2026-08-10.

**Typen:**

```ts
export type ParamField =
  | { kind: 'number'; name: string; label: string; min: number; max: number;
      step?: number; default?: number; unit?: string; showIf?: (v: ParamValues) => boolean }
  | { kind: 'enum'; name: string; label: string;
      options: { value: string; label: string }[]; default?: string;
      showIf?: (v: ParamValues) => boolean }
  | { kind: 'boolean'; name: string; label: string; default?: boolean;
      showIf?: (v: ParamValues) => boolean }
  | { kind: 'text'; name: string; label: string; multiline?: boolean;
      placeholder?: string; showIf?: (v: ParamValues) => boolean }
  | { kind: 'seconds'; name: string; label: string; options: number[]; default?: number;
      showIf?: (v: ParamValues) => boolean }
  | { kind: 'frames'; name: string; label: string; min: number; max: number;
      fpsField: string; fpsDefault: number; default?: number;
      showIf?: (v: ParamValues) => boolean };

export type ParamValues = Record<string, string | number | boolean>;

export interface ModelParamSchema {
  promptRequired: boolean;
  images: { min: number; max: number; roles?: string[] };
  sourceVideo?: boolean;
  groups: { label: string; advanced?: boolean; fields: ParamField[] }[];
}
```

Der Typ `frames` zeigt Sekunden an, sendet aber Frames. Er braucht deshalb das Feld, aus dem die Bildrate kommt.

**Einträge.** Fett war in der alten Oberfläche nicht erreichbar.

```
zimage  (Doku: z-image-turbo)
  promptRequired true, images {min:0,max:0}
  Gruppe "Bild":      width 64–2048 (1024), height 64–2048 (1024)
  Gruppe "Qualität" advanced:
      num_inference_steps 1–50 (8)
      guidance_scale 0–20 step 0.5 (0)
      go_fast bool (false)
      seed number
      output_format enum png|jpg|webp (jpg)
      output_quality 0–100 (80)

qwen-image
  promptRequired true, images {min:0,max:1}
  Gruppe "Bild":      aspect_ratio enum 1:1|16:9|9:16|4:3|3:4|3:2|2:3 (16:9)
  Gruppe "Qualität" advanced:
      guidance 0–10 step 0.5 (3)
      num_inference_steps 1–50 (30)
      negative_prompt text multiline
      strength 0–1 step 0.05 (0.9)   showIf: mindestens ein Bild hochgeladen
      enhance_prompt bool (false)
      go_fast bool (true)
      image_size enum optimize_for_quality|optimize_for_speed
      seed number
      output_format enum webp|jpg|png (webp)
      output_quality 0–100 (80)

qwen-image-edit-plus
  promptRequired true, images {min:1,max:2}
  Gruppe "Bild":      aspect_ratio enum match_input_image|16:9|9:16|1:1|4:3|3:4 (match_input_image)
  Gruppe "Qualität" advanced:
      go_fast bool (true), seed number
      output_format enum webp|jpg|png (webp), output_quality 0–100 (95)

wan-image-small
  promptRequired true, images {min:0,max:0}
  Gruppe "Bild":      aspect_ratio enum 1:1|16:9|9:16|4:3|3:4|21:9|custom (16:9)
                      width  step 16   showIf: aspect_ratio === 'custom'
                      height step 16   showIf: aspect_ratio === 'custom'
  Gruppe "Qualität" advanced:
      juiced bool (false), seed number
      output_format enum png|jpg|webp (jpg), output_quality 1–100 (80)

p-flux-klein  (Doku: flux-2-klein-4b)                                     NEU
  promptRequired true, images {min:0,max:5}
  Gruppe "Bild":      aspect_ratio enum 1:1|16:9|21:9|3:2|2:3|4:5|5:4|3:4|4:3|9:16|9:21|match_input_image (1:1)
                      output_megapixels enum 0.25|0.5|1|2|4 (1)
  Gruppe "Qualität" advanced:
      go_fast bool (false), seed number
      output_format enum png|jpg|webp (jpg), output_quality 0–100 (95)

p-image
  promptRequired true, images {min:0,max:0}
  Gruppe "Bild":      aspect_ratio enum 1:1|16:9|9:16|4:3|3:4|3:2|2:3|custom (16:9)
                      width  256–1440 step 16   showIf: custom
                      height 256–1440 step 16   showIf: custom
  Gruppe "Qualität" advanced:
      prompt_upsampling bool (false), seed number

p-image-edit
  promptRequired true, images {min:1,max:5}
  Gruppe "Bild":      aspect_ratio enum match_input_image|1:1|16:9|9:16|4:3|3:4|3:2|2:3 (match_input_image)
  Gruppe "Qualität" advanced:  turbo bool (true), seed number

p-image-upscale
  promptRequired FALSE, images {min:1,max:1,roles:['Quelle']}
  Gruppe "Hochskalieren":
      target 1–128 (4) unit 'MP'
      enhance_details bool (false)
      enhance_realism bool (false)
  Gruppe "Qualität" advanced:
      output_format enum webp|jpg|png (jpg), output_quality 0–100 (80)

p-image-ideogram                                                          NEU
  promptRequired true, images {min:0,max:0}
  Gruppe "Bild":      aspect_ratio enum 1:1|16:9|9:16|4:3|3:4|3:2|2:3|custom (1:1)
                      width  bis 2560   showIf: custom
                      height bis 2560   showIf: custom
                      image_size enum 1K|2K (2K)
  Gruppe "Qualität" advanced:
      thinking enum very low|low|medium|high (medium)
      prompt_upsampling bool (true), seed number
      output_format enum png|jpg|webp (jpg), output_quality 0–100 (80)

wan-t2v
  promptRequired true, images {min:0,max:0}
  Gruppe "Video":     num_frames FRAMES 81–121 (81), fpsField 'frames_per_second', fpsDefault 16
                      frames_per_second 5–30 (16)
                      resolution enum 480p|720p (480p)
                      aspect_ratio enum 16:9|9:16 (16:9)
  Gruppe "Qualität" advanced:
      interpolate_output bool (true), go_fast bool (true)
      optimize_prompt bool (false)
      sample_shift 1–20 step 0.5 (12)
      seed number

wan-i2v
  promptRequired true, images {min:1,max:2,roles:['Start','Ende']}
  Felder wie wan-t2v, interpolate_output Vorgabe false

vace
  promptRequired true, images {min:0,max:3}, sourceVideo true
  Gruppe "Video":     size enum 832*480|480*832|1280*720|720*1280 (832*480)
                      frame_num 1–200 (81)
  Gruppe "Qualität" advanced:
      speed_mode enum drei Stufen, Vorgabe "Lightly Juiced 🍊 (more consistent)"
      sample_steps 1–100 (50)
      sample_solver enum unipc|dpm++ (unipc)
      sample_guide_scale 0–20 step 0.5 (5)
      sample_shift 1–30 (16)
      seed number

p-video
  promptRequired true, images {min:0,max:2,roles:['Start','Ende']}
  Gruppe "Video":     duration SECONDS [1,5,10,15,20] (5)
                      resolution enum 720p|1080p (720p)
                      fps enum 24|48 (24)
                      aspect_ratio enum 16:9|9:16|4:3|3:4|3:2|2:3|1:1 (16:9)
                          showIf: kein Bild hochgeladen — die API ignoriert es sonst
  Gruppe "Qualität" advanced:
      draft bool (false), save_audio bool (true)
      prompt_upsampling bool (true), seed number
```

**Exportiere ausserdem:**

```ts
export const PLAYGROUND_PRUNA_IDS = [
  'zimage', 'qwen-image', 'qwen-image-edit-plus', 'wan-image-small', 'p-flux-klein',
  'p-image', 'p-image-edit', 'p-image-upscale', 'p-image-ideogram',
  'wan-t2v', 'wan-i2v', 'vace', 'p-video',
] as const;

export function schemaFor(modelId: string): ModelParamSchema | undefined;

/** Vorgaben eines Schemas als flaches Objekt — für den Zustand beim Modellwechsel. */
export function defaultsFor(schema: ModelParamSchema): ParamValues;
```

Der Playground zeigt bei Pruna **nur** diese dreizehn. `PRUNA_MODEL_IDS` in `src/config/pruna-models.ts` bleibt unberührt, weil Chat und Visualize daran hängen.

**Test:** `param-schema.test.ts` — alle dreizehn haben einen Eintrag; Feldnamen sind je Schema eindeutig; jedes `default` liegt im erlaubten Bereich; `p-image-upscale` hat `promptRequired: false`; `wan-i2v` hat die Rollen Start und Ende.

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/lib/playground/param-schema.test.ts
npm run typecheck
```

---

# Task 4 — Zwei neue Pruna-Modelle

**Abhängig von Task 3.**

**Datei:** `src/config/pruna-models.ts`

Zwei Einträge in `PRUNA_MODEL_MAP` ergänzen und beide IDs an `PRUNA_MODEL_IDS` anhängen. Bestehende Einträge nicht verändern.

`p-image-ideogram`: `prunaModel: 'p-image-ideogram'`, `endpoint: 'default'`, `mode: 'sync'`, `isVideo: false`.
`p-flux-klein`: `prunaModel: 'flux-2-klein-4b'`, `endpoint: 'default'`, `mode: 'sync'`, `isVideo: false`.

**Wichtig:** die interne ID lautet `p-flux-klein`, nicht `klein` — `klein` ist bereits als Pollinations-Modell vergeben. Der Wert von `prunaModel` ist der echte Name bei Pruna.

`buildInput` beider Modelle nimmt `f.prompt`, `f.seed`, `f.aspectRatio` und reicht `f.params` durch (siehe Task 5). `p-flux-klein` mappt hochgeladene Bilder auf `images` als Feld, bis zu fünf.

**Datei:** `src/config/unified-image-models.ts` — für beide einen Eintrag mit `provider: 'pruna'`, `enabled: true`, `isFree: false`, `byopVisible: true`, passendem `kind` und Anzeigenamen. Nur ergänzen, nichts Bestehendes ändern.

**Test:** `src/config/__tests__/pruna-models.test.ts` um beide erweitern — `isPrunaModel` erkennt sie, `buildInput` liefert den Prompt.

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/config/__tests__/pruna-models.test.ts src/config/__tests__/model-invariants.test.ts
```

---

# Task 5 — buildInput öffnen

**Abhängig von Task 3.**

**Datei:** `src/config/pruna-models.ts`

Heute stehen in jedem `buildInput` Konstanten, die die Oberfläche nicht überschreiben kann — etwa `resolution: '480p'` und `frames_per_second: 16` bei den wan-Modellen, `guidance: 3` und `num_inference_steps: 30` bei `qwen-image`.

**Ergänze das Eingabeobjekt:**

```ts
export interface PrunaFieldInput {
  // bestehende Felder unverändert lassen, damit der Chat-Pfad weiterläuft
  params?: Record<string, string | number | boolean>;
}
```

**Regel für jedes der dreizehn Modelle:** die bisherigen Konstanten bleiben als Vorgabe stehen, `f.params` überschreibt sie. Am Ende jedes `buildInput`:

```ts
return { ...input, ...(f.params ?? {}) };
```

**Zusätzlich pro Modell:**

- **`wan-i2v`** — zweites Bild als `last_image` senden, statt es zu verwerfen. Heute steht dort `image: Array.isArray(f.image) ? f.image[0] : f.image` und der Rest fällt weg.
- **`p-video`** — zweites Bild als `last_frame_image`.
- **`vace`** — `f.video` als `src_video` durchreichen; Referenzbilder gehen als `src_ref_images`.
- **`p-image-upscale`** — ohne Prompt lauffähig; `prompt` nicht ins Eingabeobjekt aufnehmen.
- **überall wo die API es kennt** — `disable_safety_checker: true` mitsenden, bei `p-video` heisst es `disable_safety_filter: true`. Das ist eine feste Vorgabe, kein Bedienelement.

**Datei:** `src/lib/playground/model-source.ts` — in `buildPrunaEntries` bei `wan-i2v` und `p-video` `supportsEndFrame: true` und `maxImages: 2` setzen.

**Test:** `src/config/__tests__/pruna-models.test.ts`

```ts
it('lets a schema value beat the baked-in default', () => {
  const input = PRUNA_MODEL_MAP['wan-t2v'].buildInput({
    prompt: 'x', params: { resolution: '720p', frames_per_second: 24 },
  });
  expect(input.resolution).toBe('720p');
  expect(input.frames_per_second).toBe(24);
});

it('sends the second image as the end frame for wan-i2v', () => {
  const input = PRUNA_MODEL_MAP['wan-i2v'].buildInput({
    prompt: 'x', image: ['https://a/1.png', 'https://a/2.png'],
  });
  expect(input.image).toBe('https://a/1.png');
  expect(input.last_image).toBe('https://a/2.png');
});

it('passes a source video to vace', () => {
  const input = PRUNA_MODEL_MAP['vace'].buildInput({
    prompt: 'x', video: 'https://a/clip.mp4',
  });
  expect(input.src_video).toBe('https://a/clip.mp4');
});

it('builds an upscale request without a prompt', () => {
  const input = PRUNA_MODEL_MAP['p-image-upscale'].buildInput({
    prompt: '', image: 'https://a/1.png', params: { target: 8 },
  });
  expect(input.prompt).toBeUndefined();
  expect(input.target).toBe(8);
});
```

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/config/__tests__/pruna-models.test.ts
npm run typecheck
```

---

# Task 6 — Pollinations-Request korrigieren

**Abhängig von Task 2.**

Drei Fehler in der Weitergabe an Pollinations.

**Datei:** `src/lib/pollinations-sdk.ts`

Heute wird `aspectRatio` bei Bild und Video roh an die Query gehängt. Laut Spezifikation gilt `aspectRatio` **nur für Videomodelle** und kennt nur `16:9` und `9:16`; Bilder brauchen `width`/`height` in Pixeln. Die Pills im Playground bewirken bei Bildmodellen deshalb nichts.

In `imageUrl` (Bildpfad): `aspectRatio` **nicht** an die Query hängen. Stattdessen über `pixelsForAspect` aus `@/lib/playground/pollinations-caps` in `width`/`height` auflösen. Ausdrücklich übergebene `width`/`height` haben Vorrang.

In `videoUrl`: `aspectRatio` bleibt, aber nur `16:9` und `9:16` durchlassen; andere Werte weglassen.

**Datei:** `src/app/api/generate/route.ts`

- `quality: 'hd' as const` steht im `imageOptions`-Objekt fest verdrahtet. Laut Spezifikation verstehen nur `gptimage`, `gptimage-large` und `gpt-image-2` diesen Parameter. Nur für diese drei senden — `QUALITY_MODELS` aus `pollinations-caps` benutzen.
- Zod-Schema um `resolution` (`'480p' | '720p' | '1080p'`) erweitern und an `videoUrl` durchreichen.
- Mehrere Referenzbilder werden mit `|` verbunden übergeben.

**Test:** `src/app/api/generate/route.test.ts`

```ts
it('turns an aspect ratio into pixels for image models', async () => {
  // flux mit aspectRatio 16:9 → width 1344, height 768, kein aspectRatio in der URL
});
it('keeps the aspect ratio for video models', async () => {
  // veo mit 9:16 → aspectRatio bleibt
});
it('only sends quality to the gptimage family', async () => {
  // flux → kein quality; gptimage → quality vorhanden
});
```

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/app/api/generate/
npm run typecheck
```

---

# Task 7 — Generische Parameter-Regler

**Abhängig von Task 1, 2, 3.**

**Neu:** `src/components/playground/ParamControls.tsx`

Erzeugt aus einem `ModelParamSchema` die Bedienelemente.

```ts
export function ParamControls({ schema, values, onChange, uploadCount }: {
  schema: ModelParamSchema;
  values: ParamValues;
  onChange: (patch: ParamValues) => void;
  uploadCount: number;   // für showIf-Bedingungen, die von Bildern abhängen
})
```

Ein Feldtyp, ein Baustein:

| Typ | Baustein |
|---|---|
| `number` | `Input type="number"` mit `min`, `max`, `step`; Einheit als Suffix rechts |
| `enum` | `DropdownMenu` aus `@/components/ui/dropdown-menu` |
| `boolean` | `Switch` aus `@/components/ui/switch` |
| `text` | `Input`, bei `multiline` `Textarea` |
| `seconds` | `Slider` über die erlaubten Werte, Anzeige „5s" |
| `frames` | `Slider`, zeigt Sekunden, meldet Frames |

**Der Typ `frames` ist der Kern.** Er löst das Problem, dass die wan-Modelle keine Dauer kennen, sondern Frames. Umrechnung: `sekunden = frames / fps`, wobei `fps` aus `values[field.fpsField] ?? field.fpsDefault` kommt. Der Regler bietet nur Sekundenwerte an, die zu einer erlaubten Frame-Zahl führen. Bei `wan-t2v` mit 81–121 Frames und 16 fps sind das 5,1 bis 7,6 Sekunden — und genau die stehen zur Wahl, statt der heute angebotenen 5 und 10, von denen der zweite Wert unerreichbar ist. Ändert sich die Bildrate, ändert sich die Skala mit.

Felder mit `showIf` werden nur gerendert, wenn die Bedingung auf den aktuellen Werten wahr ist.

Gruppen mit `advanced: true` liegen hinter einem Aufklapper („Erweitert", `ChevronRight`, dreht sich beim Öffnen), alle anderen stehen offen.

Jede Gruppe bekommt eine Überschrift: `text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75`.

**Test:** `ParamControls.test.tsx` — jeder Feldtyp rendert und meldet Änderungen; ein Feld mit unerfüllter `showIf`-Bedingung fehlt; ein `frames`-Feld zeigt Sekunden und meldet Frames; erweiterte Gruppen sind zunächst zu.

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/components/playground/ParamControls.test.tsx
```

---

# Task 8 — Verdrahtung

**Abhängig von Task 5, 6, 7.**

**`src/hooks/usePlaygroundState.ts`**
Die vier festen Felder `seed`, `negativePrompt`, `guidance`, `steps` weichen einem `params: ParamValues`. `setAdvanced` wird zu `setParams(patch: ParamValues)`. Beim Modellwechsel setzt `resetForModel` `params` auf `defaultsFor(schema)` des neuen Modells — alte Werte dürfen nicht überleben, weil die Feldnamen je Modell andere sind.

**`src/components/playground/PlaygroundSidebar.tsx`**
`AdvancedPanel` weicht `ParamControls`. Die Reihenfolge bleibt: Provider, Modus, Modell, dann Parameter, dann Referenzen. `AspectRatioPills` und `DurationSlider` entfallen als eigene Bausteine — beide sind jetzt Felder im Schema. Für Modelle mit `sourceVideo` ein Feld zum Hochladen eines Quellvideos; das befüllt den heute toten `sourceVideo`-Zustand.

**`src/components/playground/ReferenceSlots.tsx`**
Anzahl und Beschriftung kommen aus `schema.images` statt aus `referenceMode`. Bei Pollinations-Modellen ohne Schema aus `entry.maxImages` und `entry.supportsEndFrame` — bei Endframe-Unterstützung heissen die Steckplätze „Start" und „Ende".

**`src/lib/playground/generate-request.ts`**
`buildGenerateBody` schickt `params` mit. Die bisherige Sonderbehandlung von `seed`, `negative_prompt`, `guidance` und `steps` entfällt — die stecken jetzt in `params`.

**`src/components/playground/PromptBar.tsx`**
Neue Eigenschaft `promptRequired?: boolean` mit Vorgabe `true`. Ist sie `false`, bleibt „Senden" auch bei leerem Prompt bedienbar. Das macht `p-image-upscale` überhaupt erst benutzbar.

**`src/app/playground/PlaygroundShell.tsx`**
Schema über `schemaFor(currentModel.id)` holen und an Sidebar und Prompt-Leiste geben. Die Modell-Liste des Playgrounds filtert Pruna auf `PLAYGROUND_PRUNA_IDS`.

**Test:** `PlaygroundShell.test.tsx` um einen Fall erweitern: nach einem Modellwechsel stehen die Parameter auf den Vorgaben des neuen Schemas, nicht mehr auf denen des alten.

**Prüfen:**
```bash
CI=1 npm test -- --runInBand src/app/playground/ src/components/playground/ src/hooks/usePlaygroundState.test.ts
npm run typecheck
```

---

# Task 9 — Abschluss

- `src/components/playground/AdvancedPanel.tsx` löschen. Prüfen, dass nichts mehr darauf zeigt: `grep -rn "AdvancedPanel" src/`
- `AspectRatioPills.tsx` und `DurationSlider.tsx` löschen, sofern Task 8 sie ersetzt hat — sonst behalten und im Bericht vermerken.
- Deutsche Beschriftungen für alle Schema-Felder in `src/config/translations.ts`, englische dazu.
- Das tote `temporalControl` samt `getDurationOptionsSeconds` und `getDefaultDurationSeconds` aus `unified-image-models.ts` **nicht** entfernen — Chat-Pfade könnten es importieren. Erst prüfen: `grep -rn "getDurationOptionsSeconds\|temporalControl" src/`. Nur wenn ausschliesslich Playground-Dateien treffen, entfernen.

**Vollprüfung:**
```bash
npm run lint
npm run typecheck
CI=1 npm test -- --runInBand
npm run build
```

Alle vier grün, sonst nicht abschliessen.

## Gate

Merge nach `playground/multimedia` erst wenn:
1. Lint ohne Fehler, Typecheck sauber, alle Tests grün, Build durch
2. Review durch
3. Durchgang auf `localhost:3000/playground` sitzt, besonders: ein wan-Video mit verstellter Bildrate, ein Upscale ohne Prompt, ein Endframe bei `wan-i2v`, ein Pollinations-Bild mit 16:9 das auch wirklich 1344×768 liefert
