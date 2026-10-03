import { PRUNA_MODEL_IDS, isPrunaModel } from '@/config/pruna-models';
import { getUnifiedModel } from '@/config/unified-image-models';
import { POLLEN_PAID_CLASSICS, isPollenPaidClassic } from './pollen-model-catalog';

export interface PlaygroundModelEntry {
  id: string;
  name: string;
  provider: 'pollinations' | 'pruna';
  kind: 'image' | 'video';
  supportsReference: boolean;
  requiresReference: boolean;
  maxImages: number;
  referenceMode?: 'multi-image' | 'start-frame' | 'start-end-frame';
  unmapped: boolean;
  supportsEndFrame: boolean;
  supportsAudio: boolean;
  resolutions?: Array<string>;
  paidOnly: boolean;
  /** Von der Community beigesteuert und als experimentell markiert. */
  community: boolean;
  /**
   * Darf der effektive Schluessel dieses Modell wirklich bedienen?
   *
   * Kommt aus der Schluessel-Sicht der Registry (`runnable`). `false` heisst:
   * der Eintrag existiert, laeuft aber nur auf dem Schluessel des Nutzers — so
   * werden die kuratierten Bezahl-Klassiker angeboten, ohne zu luegen.
   */
  runnableOnKey: boolean;
}

export interface PollinationsLiveModel {
  name?: string;
  aliases?: Array<string>;
  title?: string;
  description?: string;
  brand?: string;
  brand_url?: string;
  category?: string;
  input_modalities?: Array<string>;
  output_modalities?: Array<string>;
  video_capabilities?: Array<string>;
  max_reference_images?: number;
  resolutions?: Array<string>;
  paid_only?: boolean;
  alpha?: boolean;
  community?: boolean;
  /** Freigabe des effektiven Schluessels; wird von der Route gestempelt. */
  runnable?: boolean;
}

/**
 * Die einzige Stelle, die entscheidet, welche Pruna-Modelle der Playground
 * zeigt. Neben try-on und avatar fallen die Modelle heraus, für die
 * `SCHEMA_MAP` in param-schema kein handgepflegtes Schema hat: ohne das
 * bekämen sie über den Pollinations-Zweig Regler, die ihre API nicht kennt.
 */
export const PRUNA_HIDDEN_IN_PLAYGROUND: ReadonlySet<string> = new Set([
  'p-image-try-on',
  'p-video-avatar',
  'wan-fast',
  'p-video-animate',
  'p-video-replace',
]);

const PRUNA_REQUIRES_REF: ReadonlySet<string> = new Set([
  'qwen-image-edit-plus',
  'p-image-edit',
  'p-image-upscale',
  'wan-i2v',
]);

const PRUNA_SUPPORTS_END_FRAME: ReadonlySet<string> = new Set(['wan-i2v', 'p-video']);
const PRUNA_SUPPORTS_AUDIO: ReadonlySet<string> = new Set(['p-video']);

export function buildPrunaEntries(): PlaygroundModelEntry[] {
  return PRUNA_MODEL_IDS
    .filter((id) => !PRUNA_HIDDEN_IN_PLAYGROUND.has(id))
    // Abgeschaltet in der Registry heisst abgeschaltet — sonst zeigt der
    // Playground weiter ein Modell, das Visualize laengst ausblendet.
    .filter((id) => getUnifiedModel(id)?.enabled !== false)
    .map((id) => {
      const cfg = getUnifiedModel(id);
      const isVideo = id.includes('video') || (id.startsWith('wan-') && id.endsWith('v'));
      const kind: 'image' | 'video' = cfg?.kind ?? (isVideo ? 'video' : 'image');
      return {
        id,
        name: cfg?.name ?? id,
        provider: 'pruna' as const,
        kind,
        supportsReference: cfg?.supportsReference ?? false,
        requiresReference: PRUNA_REQUIRES_REF.has(id),
        maxImages: cfg?.maxImages ?? (cfg?.supportsReference ? 1 : 0),
        referenceMode: cfg?.referenceMode,
        unmapped: !cfg,
        supportsEndFrame: PRUNA_SUPPORTS_END_FRAME.has(id),
        supportsAudio: PRUNA_SUPPORTS_AUDIO.has(id),
        paidOnly: true,
        community: false,
        // Pruna hat keine Registry-Sicht: ob der Lauf durchgeht, entscheidet
        // der Pruna-Schluessel des Nutzers, nicht dieser Katalog.
        runnableOnKey: true,
      };
    });
}

/**
 * Die kuratierte Bezahl-Auswahl in Registry-Form — immer `runnable: false`.
 *
 * Sie steht damit sichtbar in der Auswahlliste und bleibt ohne eigenen
 * Pollen-Schluessel gesperrt. Eintraege, die die Sicht des Aufrufers schon
 * enthaelt (Name oder Alias), werden uebersprungen: der echte Eintrag kennt die
 * Freigabe des Schluessels und gewinnt gegen die kuratierte Kopie.
 *
 * Live-Beleg 2026-09-10: am Betreiber-Schluessel antwortet jedes dieser Modelle
 * mit 403 ("Model 'flux' is not allowed for this API key") — deshalb
 * `paid_only: true`, auch wo die Registry `paid_only: false` sagt (flux).
 */
export function buildPaidClassicModels(sicht: readonly PollinationsLiveModel[]): PollinationsLiveModel[] {
  const bekannt = new Set<string>();
  for (const model of sicht) {
    for (const name of [model.name, ...(model.aliases ?? [])]) {
      if (name) bekannt.add(name.toLowerCase());
    }
  }

  return POLLEN_PAID_CLASSICS
    .filter((klassiker) =>
      ![klassiker.id, ...klassiker.registryNames].some((name) => bekannt.has(name.toLowerCase())),
    )
    .map((klassiker) => ({
      name: klassiker.id,
      aliases: [...klassiker.registryNames],
      title: klassiker.title,
      input_modalities: klassiker.maxImages > 0 ? ['text', 'image'] : ['text'],
      output_modalities: klassiker.supportsAudio ? [klassiker.kind, 'audio'] : [klassiker.kind],
      video_capabilities: klassiker.supportsAudio ? ['audio_output'] : [],
      max_reference_images: klassiker.maxImages,
      resolutions: klassiker.resolutions ? [...klassiker.resolutions] : undefined,
      paid_only: true,
      runnable: false,
    }));
}

export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[] {
  return live
    .filter((m) => !isPrunaModel(m.name ?? ''))
    // Die Freigabe des effektiven Schluessels entscheidet (live belegt
    // 2026-09-10): was der Schluessel nicht bedienen darf, wird gar nicht erst
    // angeboten — ausser es ist ein kuratierter Bezahl-Klassiker, der bewusst
    // gesperrt daneben steht. Ohne diesen Filter waehlte der Nutzer ein Modell,
    // das erst bei der Generierung mit 403 scheitert.
    .filter((m) => m.runnable !== false || isPollenPaidClassic(m.name))
    .filter((m) => {
      // enabled: false aus der kuratierten Config blendet aus (z. B. Modelle,
      // die am Server-Key scheitern oder synchron nicht lieferbar sind) —
      // aber nur für gemappte Einträge: Registry-only Modelle bleiben
      // stehen, sonst verlöre der Playground seinen Zweck als volle Auswahl.
      // Die Bezahl-Klassiker sind ausgenommen: sie stehen in der Config genau
      // deshalb auf enabled: false, weil der Betreiber-Schluessel sie nicht
      // darf — hier sind sie die Auswahl fuer den eigenen Schluessel. Der
      // Lookup deckt ID, Registry-Namen und Alias ab, weil die Sicht den
      // Klassiker je nach Schluessel unter jedem dieser Namen fuehren kann.
      if (isPollenPaidClassic(m.name)) return true;
      const cfg = getUnifiedModel(m.name ?? '');
      return !cfg || cfg.enabled !== false;
    })
    .map((m) => {
      const cfg = getUnifiedModel(m.name ?? '');
      const out = m.output_modalities ?? [];
      const inp = m.input_modalities ?? [];
      const caps = m.video_capabilities ?? [];
      const isVideo = out.includes('video');
      const maxImages = m.max_reference_images ?? (inp.includes('image') ? 1 : 0);
      return {
        id: m.name ?? '',
        name: m.title ?? cfg?.name ?? (m.name ?? ''),
        provider: 'pollinations' as const,
        kind: isVideo ? ('video' as const) : ('image' as const),
        supportsReference: maxImages > 0,
        requiresReference: isVideo && inp.includes('image') && !inp.includes('text'),
        maxImages,
        referenceMode: caps.includes('end_frame') ? ('start-end-frame' as const) : undefined,
        unmapped: !cfg,
        supportsEndFrame: caps.includes('end_frame'),
        supportsAudio: caps.includes('audio_output'),
        resolutions: m.resolutions,
        // Registry-Wahrheit, unveraendert: die kuratierten Klassiker kommen
        // schon mit paid_only: true aus buildPaidClassicModels.
        paidOnly: m.paid_only ?? false,
        community: m.community ?? false,
        runnableOnKey: m.runnable !== false,
      };
    });
}
