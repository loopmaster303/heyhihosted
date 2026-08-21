/**
 * chat-media-intent
 * -----------------
 * Extracts structured media-generation intents from raw LLM assistant output.
 *
 * Two marker syntaxes are recognised, both case-sensitive:
 *   [IMAGE_GEN: <prompt>]
 *   [MUSIC_GEN: <prompt>]
 *
 * Everything between the colon and the first closing `]` becomes the prompt.
 * Prompts are trimmed; newlines inside the prompt are preserved.
 *
 * Deterministic, side-effect-free, single-pass over the input string.
 * Designed to be consumed by the chat render layer to spawn image or
 * music generation without parsing the whole assistant message.
 */

export type MediaIntentKind = 'image' | 'music';

export interface MediaIntent {
  /** Which media kind was requested. */
  kind: MediaIntentKind;
  /** Trimmed prompt text. Empty string if the model emitted an empty marker (not matched, see regex). */
  prompt: string;
  /** Start index of the marker (inclusive) in the original input. */
  index: number;
  /** Original substring including the surrounding brackets, exactly as it appeared. */
  raw: string;
}

export interface MediaIntentParseResult {
  /** The input with every matched marker removed, whitespace normalised. */
  cleanText: string;
  /** All matched intents, in order of appearance. */
  markers: MediaIntent[];
}

const MARKER_PATTERN = /\[(IMAGE_GEN|MUSIC_GEN):\s*([^\]]*?)\s*\]/g;

/**
 * Fenced Code-Bloecke und Inline-Code. Ein Marker darin ist Anschauungsmaterial,
 * keine Anweisung: erklaert das Modell die Syntax, darf sie nicht feuern. Sich
 * dafuer allein auf den System-Prompt zu verlassen hiesse, auf Modellfolgsamkeit
 * zu wetten — der Parser entscheidet das selbst.
 */
const CODE_SPAN_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

/** Die von Code-Spans belegten Bereiche des Textes, in Reihenfolge. */
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

const KIND_MAP: Record<'IMAGE_GEN' | 'MUSIC_GEN', MediaIntentKind> = {
  IMAGE_GEN: 'image',
  MUSIC_GEN: 'music',
};

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
 * Parses `text` and returns the cleaned text plus all media intents.
 *
 * Behaviour:
 *  - Empty input → `{ cleanText: '', markers: [] }`
 *  - No markers  → input returned (whitespace-normalised), empty `markers`
 *  - Unclosed `[IMAGE_GEN: foo` → not a marker, kept inside `cleanText`
 *  - Empty body `[IMAGE_GEN: ]`   → not a marker (regex requires at least one non-`]` char in the captured group, but trailing whitespace is allowed; an actually-empty prompt after trim is dropped)
 *  - Mismatched case `[image_gen: foo]` → not a marker
 *  - Multiple markers → returned in source order
 *  - `cleanText` collapses runs of blank lines to max 2 and trims per line
 */
export function parseMediaIntents(text: string): MediaIntentParseResult {
  if (typeof text !== 'string' || text.length === 0) {
    return { cleanText: '', markers: [] };
  }

  const markers: MediaIntent[] = [];
  const ranges = codeRanges(text);
  // Positionen, die aus dem Text fallen: jeder syntaktische Treffer ausserhalb
  // von Code — auch der mit leerem Prompt, der kein Intent wird, aber als
  // Rauschen ebenso wenig in der Antwort stehenbleiben soll. Was im Code-Block
  // steht, gehoert dagegen zur Antwort und bleibt sichtbar.
  const cuts: Array<[number, number]> = [];

  for (const match of text.matchAll(MARKER_PATTERN)) {
    const [raw, markerTag, promptBody] = match;
    const index = match.index ?? 0;
    if (isInsideCode(index, ranges)) {
      continue;
    }
    cuts.push([index, index + raw.length]);

    const prompt = promptBody.replace(/\s+/g, ' ').trim();
    if (prompt.length === 0) {
      continue;
    }
    markers.push({
      kind: KIND_MAP[markerTag as 'IMAGE_GEN' | 'MUSIC_GEN'],
      prompt,
      index,
      raw,
    });
  }

  // Von hinten nach vorne, damit die vorderen Positionen gueltig bleiben.
  let stripped = text;
  for (let i = cuts.length - 1; i >= 0; i -= 1) {
    const [start, end] = cuts[i];
    stripped = stripped.slice(0, start) + stripped.slice(end);
  }

  return { cleanText: normaliseWhitespace(stripped), markers };
}
