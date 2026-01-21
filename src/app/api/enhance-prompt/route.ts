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
  
  // Only remove code fences and outer quotes - preserve all Markdown structure
  out = out.replace(/^```[a-z]*\n([\s\S]*?)\n```$/i, '$1').trim();
  out = out.replace(/^"([\s\S]*)"$/m, '$1').trim();
  out = out.replace(/^'([\s\S]*)'$/m, '$1').trim();
  
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



    // Get model-specific enhancement guidelines
    const baseGuidelines = selectGuidelines(modelId);
    
    // Only enforce English output - let the enhancement prompts control the format
    const outputLanguageGuard = 'CRITICAL: Always respond only in English, regardless of input language.';
    
    // Prevent AI from sanitizing or softening raw user requests
    const noContentRestrictionsGuard = [
      'IMPORTANT: These image models (especially Flux, Z-Image, etc.) are intentionally unrestricted.',
      'Do NOT soften, sanitize, or "improve" explicit/raw requests.',
      'Stay 100% true to the user\'s original intent, even if unconventional or edgy.',
      'If the user wants something raw, gritty, or provocative, preserve that tone exactly.',
    ].join(' ');
    
    // Prevent AI from adding extra text after the template
    const strictOutputOnlyGuard = [
      'CRITICAL: Output ONLY the requested format (Markdown template OR narrative text).',
      'Do NOT add any explanatory text, summaries, or additional content after the template.',
      'Do NOT write things like "Enhanced Prompt:" or "Here is the enhanced version:".',
      'Your entire response must be ONLY the template itself, nothing before or after.',
    ].join(' ');

    const systemMessage = `${baseGuidelines}\n\n${outputLanguageGuard}\n\n${noContentRestrictionsGuard}\n\n${strictOutputOnlyGuard}`;

    // Always use Pollinations (Pollen) with DeepSeek V3.2
    const pollenKey = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    let enhancedText: string | null = null;

    try {
      const result = await getPollinationsChatCompletion({
        modelId: 'deepseek', // maps to DeepSeek V3.2 on Pollinations
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
      usedModel: 'deepseek',
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
