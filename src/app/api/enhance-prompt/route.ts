import { NextRequest, NextResponse } from 'next/server';
import { ENHANCEMENT_PROMPTS, DEFAULT_ENHANCEMENT_PROMPT } from '@/config/enhancement-prompts';
import { getPollinationsChatCompletion } from '@/ai/flows/pollinations-chat-flow';

// Map UI model keys to enhancement prompt keys if they differ
const MODEL_ALIASES: Record<string, string> = {
  // Keep identical mapping explicit for clarity and future drift checks
  'wan-2.2-image': 'wan-2.2-image',
  'flux-krea-dev': 'flux-krea-dev',
  'qwen-image': 'qwen-image',
  'qwen-image-edit': 'qwen-image-edit',
  'ideogram-character': 'ideogram-character',
  'flux-kontext-pro': 'flux-kontext-pro',
  'runway-gen4': 'runway-gen4',
  'wan-video': 'wan-video',
  'hailuo-02': 'hailuo-02',
  // Config uses 'seedream-4.0' but UI uses 'seedream-4'
  'seedream-4': 'seedream-4.0',
  'seedream-pro': 'seedream-pro',
  'wan-2.5-t2v': 'wan-video',
  'wan-2.5-i2v': 'wan-video',
  'veo-3-fast': 'veo-3-fast',
  'veo-3.1-fast': 'veo-3.1-fast',
  'veo': 'veo-3.1-fast', // Pollinations Veo uses same guidelines as Veo 3.1 Fast
  'flux-2-pro': 'flux-2-pro',
  'nano-banana-pro': 'nano-banana-pro',
  'z-image-turbo': 'z-image-turbo',
  'qwen-image-edit-plus': 'qwen-image-edit',
  'seedance-pro': 'seedance-pro',
  'gpt-image': 'default', // Generic model, uses default prompt
  'nanobanana': 'nano-banana',
  'nanobanana-pro': 'nano-banana-pro',
};

function selectGuidelines(modelId: string): string {
  const key = MODEL_ALIASES[modelId] || modelId;
  if (key === 'default') {
    return DEFAULT_ENHANCEMENT_PROMPT;
  }
  return ENHANCEMENT_PROMPTS[key] || DEFAULT_ENHANCEMENT_PROMPT;
}

function sanitizeEnhancedPrompt(text: string): string {
  if (!text) return '';
  let out = text.trim();
  // Remove code fences and quotes around entire text
  out = out.replace(/^```[a-z]*\n([\s\S]*?)\n```$/i, '$1').trim();
  out = out.replace(/^"([\s\S]*)"$/m, '$1').trim();
  out = out.replace(/^'([\s\S]*)'$/m, '$1').trim();

  // Clean up structural labels and list markers by line
  const lines = out.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  const cleanedLines: string[] = [];
  const labelRegex = /^(Referenz|Änderung|Änderungen|Zielobjekt|Zielbild|Motiv|Stiltransfer|Charakterstruktur|Perspektive|Texturen|Humor|Ergebnis|Ausgabe|Output|Prompt|Szene|Setting|Komposition|Farbpalette|Reference|Target object|Target|Subject|Change|Changes|Identity|Identity preserved|Style transfer|Scene|Setting|Composition|Palette|Color palette|Perspective|Textures|Result|Background|Lighting|Wardrobe|Eyes|Skin tones|Crop)\s*:/i;
  const labelTokens = new Set([
    'referenz', 'änderung', 'änderungen', 'zielobjekt', 'zielbild', 'motiv', 'stiltransfer', 'charakterstruktur', 'perspektive', 'texturen', 'humor', 'ergebnis', 'ausgabe', 'output', 'prompt', 'szene', 'setting', 'komposition', 'farbpalette',
    'reference', 'target object', 'target', 'subject', 'change', 'changes', 'identity', 'identity preserved', 'style transfer', 'scene', 'setting', 'composition', 'palette', 'color palette', 'perspective', 'textures', 'result', 'background', 'lighting', 'wardrobe', 'eyes', 'skin tones', 'crop'
  ]);
  for (let line of lines) {
    // Strip leading numeric list markers first (handles "1Target ..." cases)
    line = line.replace(/^\d+(?:[)\.:\-])?\s*/, '');
    line = line.replace(/^\d+(?=[A-Za-z])/, '');

    if (labelRegex.test(line)) {
      line = line.replace(labelRegex, '').trim();
      if (!line) continue;
    }
    // Handle multi-label headers like "Reference, change, identity preserved: ..."
    if (/:/.test(line)) {
      const idx = line.indexOf(':');
      const head = line.slice(0, idx).trim();
      const body = line.slice(idx + 1).trim();
      const headParts = head.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (headParts.length > 0 && headParts.every(p => labelTokens.has(p))) {
        line = body;
      }
    }
    // Strip leading bullets / numbering
    line = line
      .replace(/^[-–•\*]\s+/, '')
      .replace(/^\d+\)\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();
    if (line) cleanedLines.push(line);
  }
  out = cleanedLines.join(' ');

  // Drop common prefixes
  out = out.replace(/^Verbesserter Prompt:\s*/i, '')
    .replace(/^Enhanced Prompt:\s*/i, '')
    .replace(/^Improved:\s*/i, '')
    .replace(/^Result:\s*/i, '')
    .trim();
  // Remove mid-sentence labels like "... Change: ..." or "... Target object: ..."
  out = out.replace(/(^|[\.;,!?\)])\s*(Referenz|Änderung|Änderungen|Zielobjekt|Zielbild|Motiv|Stiltransfer|Charakterstruktur|Perspektive|Texturen|Humor|Ergebnis|Ausgabe|Output|Prompt|Szene|Setting|Komposition|Farbpalette|Reference|Target object|Target|Subject|Change|Changes|Identity|Identity preserved|Style transfer|Scene|Setting|Composition|Palette|Color palette|Perspective|Textures|Result|Background|Lighting|Wardrobe|Eyes|Skin tones|Crop)\s*:\s*/gi, '$1 ');
  // Collapse whitespace/newlines
  out = out.replace(/[ \t\f\v]+/g, ' ');
  out = out.replace(/\s*\n+\s*/g, ' ');
  return out.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId, language } = await request.json();

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'Prompt and modelId are required' },
        { status: 400 }
      );
    }



    // Get model-specific enhancement guidelines and build strict instruction
    const baseGuidelines = selectGuidelines(modelId);
    const strictOutputGuard = [
      // Force English output regardless of input
      'Always respond only in English.',
      'Antworte ausschließlich mit dem finalen, zusammenhängenden Prompt, ohne Einleitung, Erklärung, Listen oder Markdown.',
      'Keine Anführungszeichen, keine Code-Fences, keine Überschriften.',
      'Erwähne nicht, was geändert wurde; gib nur die Zielbeschreibung aus.',
      'Verwende keine Label-Schlüssel oder Vorworte wie "Target object", "Referenz", "Änderung", "Change", "Identity preserved", "Style transfer", "Subject", "Palette" usw.',
      'Formuliere natürlich und beschreibend statt befehlend; vermeide Imperative wie "remove", "apply", "use".',
      'Wenn angemessen, halte dich unter 500 Zeichen.',
    ].join(' ');

    const systemMessage = `${baseGuidelines}\n\n${strictOutputGuard}`;

    // Always use Pollinations (Pollen) with Claude Sonnet 3.7
    const pollenKey = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    let enhancedText: string | null = null;

    try {
      const result = await getPollinationsChatCompletion({
        modelId: 'claude', // maps to Claude 3.7 Sonnet on Pollinations
        messages: [
          { role: 'user', content: prompt },
        ],
        systemPrompt: systemMessage,
        apiKey: pollenKey,
        maxCompletionTokens: 500,
      });
      enhancedText = result.responseText;
    } catch (pollinationsError) {
      const message = pollinationsError instanceof Error ? pollinationsError.message : String(pollinationsError);
      if (message.includes('Input text exceeds maximum length')) {
        console.warn('Pollinations prompt too long, returning original prompt without enhancement.');
        enhancedText = prompt;
      } else {
        throw pollinationsError;
      }
    }

    const cleaned = sanitizeEnhancedPrompt(enhancedText || prompt);



    return NextResponse.json({
      enhancedPrompt: cleaned,
      originalPrompt: prompt,
      modelId,
      usedModel: 'claude',
      via: 'pollinations',
    });

  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return NextResponse.json(
      { error: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
