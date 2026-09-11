/**
 * Was der effektive Schluessel wirklich kann — und was er nur mit dem
 * Schluessel des Nutzers koennen darf.
 *
 * Live-Beleg 2026-09-10 gegen `gen.pollinations.ai/image/models`: MIT
 * Betreiber-Schluessel antwortet der Anbieter mit genau fuenf Eintraegen
 * (tongyi-mai/z-image-turbo, lykon/dreamshaper-8-lcm, openai/gpt-image-2,
 * black-forest-labs/flux.2-klein-4b, black-forest-labs/flux.1-kontext-pro),
 * OHNE Schluessel mit 83. Jedes andere Modell scheiterte am Betreiber-Schluessel
 * mit 403 ("Model 'flux' is not allowed for this API key") — erst bei der
 * Generierung, also nach der Auswahl. Diese Datei zieht die Grenze vor die
 * Auswahl: die Freiliste steht hier, die Bezahl-Auswahl ebenfalls.
 */

/**
 * Die kostenlosen Modelle, die der Betreiber-Schluessel laut Live-Messung
 * (2026-09-10) bedienen darf — als IDs der gefuehrten Config.
 *
 * Die Registry nennt sie tongyi-mai/z-image-turbo, openai/gpt-image-2 und
 * black-forest-labs/flux.2-klein-4b. Die beiden weiteren Eintraege der
 * Live-Antwort fehlen bewusst: lykon/dreamshaper-8-lcm hat keinen
 * Config-Eintrag, black-forest-labs/flux.1-kontext-pro ist dort enabled:false.
 *
 * WARUM eine eigene Liste, obwohl die Config schon isFree kennt: deren Flag ist
 * gegen die Registry gepflegt (isFree ⇔ !paid_only) und nicht gegen die
 * Freigabe des Betreiber-Schluessels. gptimage-large traegt dort isFree:true und
 * antwortet live trotzdem mit 403. Der Rueckfallpfad der Auswahlliste darf sich
 * deshalb nicht auf isFree verlassen.
 */
export const POLLEN_SERVER_KEY_FREE_IDS: readonly string[] = ['z-image', 'gpt-image-2', 'klein'];

/**
 * Ein kuratiertes Bezahl-Modell.
 *
 * `id` ist der Name, der in der Auswahlliste steht und den die Generierung
 * sendet. `registryNames` sind die Namen und Aliase der Live-Registry — nur
 * darueber finden /api/generate und der Prompt-Verstaerker die Metadaten des
 * Modells (`findLiveImageModel`), denn die gefuehrte Config kennt diese IDs
 * nicht.
 */
export interface PollenPaidClassic {
  id: string;
  registryNames: readonly string[];
  title: string;
  kind: 'image' | 'video';
  /** Referenzbilder laut Live-Registry (max_reference_images). */
  maxImages: number;
  resolutions?: readonly string[];
  supportsAudio?: boolean;
}

/**
 * Die Bezahl-Auswahl: Klassiker, die nur auf dem Schluessel des Nutzers laufen.
 *
 * WARUM sie ueberhaupt in der Liste stehen, obwohl der Betreiber-Schluessel sie
 * nicht darf: ohne sie verschwindet ein Modell aus der Oberflaeche, sobald der
 * Betreiber-Schluessel es nicht freigibt — der Nutzer mit eigenem Guthaben sieht
 * dann nicht mehr, was er kaufen koennte. Sie stehen deshalb sichtbar, aber
 * gesperrt in der Auswahlliste.
 *
 * NICHT in dieser Liste, weil Freikontingent des Betreiber-Schluessels:
 * gpt-image-2, klein, kontext, z-image-turbo.
 */
export const POLLEN_PAID_CLASSICS: readonly PollenPaidClassic[] = [
  // Bild
  { id: 'nanobanana-2', registryNames: ['google/gemini-3.1-flash-image', 'nanobanana2'], title: 'Nano Banana 2', kind: 'image', maxImages: 14 },
  { id: 'nanobanana-pro', registryNames: ['google/gemini-3-pro-image'], title: 'Nano Banana Pro', kind: 'image', maxImages: 14 },
  { id: 'grok-imagine', registryNames: ['x-ai/grok-imagine-image', 'grok-imagine-image'], title: 'Grok Imagine', kind: 'image', maxImages: 1 },
  { id: 'grok-imagine-pro', registryNames: ['x-ai/grok-imagine-image-quality', 'grok-aurora', 'aurora', 'grok-imagine-image-quality', 'grok-imagine-image-pro'], title: 'Grok Imagine Pro', kind: 'image', maxImages: 1 },
  { id: 'grok-imagine-image-2.0', registryNames: ['x-ai/grok-imagine-image-2.0'], title: 'Grok Imagine 2.0', kind: 'image', maxImages: 3, resolutions: ['1k', '2k'] },
  { id: 'seedream5', registryNames: ['bytedance/seedream-5.0-lite'], title: 'Seedream 5.0 Lite', kind: 'image', maxImages: 14 },
  { id: 'qwen-image-3', registryNames: ['qwen/qwen-image-3'], title: 'Qwen Image 3', kind: 'image', maxImages: 3 },
  { id: 'gptimage', registryNames: ['openai/gpt-image-1-mini', 'gpt-image-1-mini', 'gpt-image'], title: 'GPT Image 1 Mini', kind: 'image', maxImages: 16 },
  { id: 'gptimage-large', registryNames: ['openai/gpt-image-1.5', 'gpt-image-1.5', 'gpt-image-large'], title: 'GPT-Image 1.5', kind: 'image', maxImages: 16 },
  // flux traegt in der Registry paid_only:false und antwortet am
  // Betreiber-Schluessel trotzdem mit 403 — fuer uns ist es damit Bezahl-Auswahl.
  { id: 'flux', registryNames: ['black-forest-labs/flux.1-schnell'], title: 'Flux.1 Schnell', kind: 'image', maxImages: 0 },
  // Video
  { id: 'veo', registryNames: ['google/veo-3.1-fast', 'veo-3.1-fast'], title: 'Veo 3.1 Fast', kind: 'video', maxImages: 2, resolutions: ['720p', '1080p'] },
  { id: 'grok-imagine-video-1.5', registryNames: ['x-ai/grok-imagine-video-1.5'], title: 'Grok Imagine Video 1.5', kind: 'video', maxImages: 1, supportsAudio: true },
  { id: 'seedance-2.5', registryNames: ['bytedance/seedance-2.5'], title: 'Seedance 2.5', kind: 'video', maxImages: 2, resolutions: ['480p', '720p'], supportsAudio: true },
];

/**
 * Lookup ueber ID und Registry-Namen. Die Auswahlliste filtert damit ihre
 * Eintraege: bezahlte Klassiker bleiben stehen, auch wenn die Config sie als
 * `enabled: false` fuehrt.
 */
const PAID_CLASSIC_LOOKUP: ReadonlySet<string> = new Set(
  POLLEN_PAID_CLASSICS.flatMap((klassiker) =>
    [klassiker.id, ...klassiker.registryNames].map((name) => name.toLowerCase()),
  ),
);

export function isPollenPaidClassic(nameOrAlias: string | undefined): boolean {
  return !!nameOrAlias && PAID_CLASSIC_LOOKUP.has(nameOrAlias.toLowerCase());
}
