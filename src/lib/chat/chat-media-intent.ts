/**
 * chat-media-intent
 * -----------------
 * Extracts image-generation intents from raw LLM assistant output.
 *
 * Marker syntax, case-sensitive:
 *   [IMAGE_GEN: <prompt>]
 *
 * `[MUSIC_GEN: …]` was retired with Compose. Older prompts or cached model
 * behaviour may still emit it, so it is cut from the text like any marker —
 * it just never becomes an intent.
 *
 * Everything between the colon and the first closing `]` becomes the prompt.
 * Deterministic, side-effect-free, single pass over the input string.
 */

export type MediaIntentKind = 'image';

export interface MediaIntent {
  kind: MediaIntentKind;
  /** Trimmed prompt text. */
  prompt: string;
  /** Start index of the marker (inclusive) in the original input. */
  index: number;
  /** Original substring including the surrounding brackets. */
  raw: string;
}

export interface MediaIntentParseResult {
  /** The input with every matched marker removed, whitespace normalised. */
  cleanText: string;
  /** All matched intents, in order of appearance. */
  markers: MediaIntent[];
}

const MARKER_TAGS = ['IMAGE_GEN', 'MUSIC_GEN'] as const;
const MARKER_PATTERN = /\[(IMAGE_GEN|MUSIC_GEN):\s*([^\]]*?)\s*\]/g;

/**
 * Fenced Code-Bloecke und Inline-Code. Ein Marker darin ist Anschauungsmaterial,
 * keine Anweisung: erklaert das Modell die Syntax, darf sie nicht feuern. Sich
 * dafuer allein auf den System-Prompt zu verlassen hiesse, auf Modellfolgsamkeit
 * zu wetten — der Parser entscheidet das selbst.
 */
const CODE_SPAN_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

function codeRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const match of text.matchAll(CODE_SPAN_PATTERN)) {
    const start = match.index ?? 0;
    ranges.push([start, start + match[0].length]);
  }
  return ranges;
}

function isInsideCode(index: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function normaliseWhitespace(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses `text` and returns the cleaned text plus all image intents.
 *
 *  - Empty input → `{ cleanText: '', markers: [] }`
 *  - Unclosed `[IMAGE_GEN: foo` → not a marker, kept inside `cleanText`
 *  - Empty body `[IMAGE_GEN: ]` → cut from the text, but no intent
 *  - Mismatched case `[image_gen: foo]` → not a marker
 *  - Markers inside code spans stay visible and never fire
 */
export function parseMediaIntents(text: string): MediaIntentParseResult {
  if (typeof text !== 'string' || text.length === 0) {
    return { cleanText: '', markers: [] };
  }

  const markers: MediaIntent[] = [];
  const ranges = codeRanges(text);
  const cuts: Array<[number, number]> = [];

  for (const match of text.matchAll(MARKER_PATTERN)) {
    const [raw, markerTag, promptBody] = match;
    const index = match.index ?? 0;
    if (isInsideCode(index, ranges)) continue;
    cuts.push([index, index + raw.length]);

    if (markerTag !== 'IMAGE_GEN') continue;
    const prompt = promptBody.replace(/\s+/g, ' ').trim();
    if (prompt.length === 0) continue;
    markers.push({ kind: 'image', prompt, index, raw });
  }

  // Von hinten nach vorne, damit die vorderen Positionen gueltig bleiben.
  let stripped = text;
  for (let i = cuts.length - 1; i >= 0; i -= 1) {
    const [start, end] = cuts[i];
    stripped = stripped.slice(0, start) + stripped.slice(end);
  }

  return { cleanText: normaliseWhitespace(stripped), markers };
}

/**
 * Was der Nutzer *waehrend* einer Antwort sieht. Vollstaendige Marker fallen
 * heraus, und ein noch offener am Ende (`[IMAGE_GEN: deep wa…`) bleibt
 * verborgen, bis er sich schliesst. Sonst stuende der englische Bild-Prompt
 * fuer Sekunden als Rohtext in der Antwort — genau das war der Fehler.
 */
export function stripMarkersForDisplay(text: string): string {
  if (typeof text !== 'string' || text.length === 0) return '';
  let visible = parseMediaIntents(text).cleanText;

  const lastOpen = visible.lastIndexOf('[');
  if (lastOpen !== -1) {
    const tail = visible.slice(lastOpen);
    const isOpenMarker = !tail.includes(']') && MARKER_TAGS.some((tag) => {
      const head = `[${tag}:`;
      return head.startsWith(tail) || tail.startsWith(head);
    });
    if (isOpenMarker) visible = visible.slice(0, lastOpen).trimEnd();
  }
  return visible;
}
