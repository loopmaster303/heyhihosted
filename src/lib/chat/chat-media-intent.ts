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

  for (const match of text.matchAll(MARKER_PATTERN)) {
    const [raw, markerTag, promptBody] = match;
    const prompt = promptBody.replace(/\s+/g, ' ').trim();
    if (prompt.length === 0) {
      continue;
    }
    markers.push({
      kind: KIND_MAP[markerTag as 'IMAGE_GEN' | 'MUSIC_GEN'],
      prompt,
      index: match.index ?? 0,
      raw,
    });
  }

  const cleanText = normaliseWhitespace(text.replace(MARKER_PATTERN, ''));

  return { cleanText, markers };
}
