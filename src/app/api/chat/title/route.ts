import { NextRequest, NextResponse } from 'next/server';
import { getMistralChatCompletion } from '@/ai/flows/mistral-chat-flow';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

const POLLEN_CHAT_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';

// Validation schema
const TitleGenerationSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  mistralFallbackEnabled: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, mistralFallbackEnabled } = validateRequest(TitleGenerationSchema, body);

    // Extract user message for title generation
    const userMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content || '';

    if (!userMessage.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No user message found for title generation',
        title: 'New Chat'
      }, { status: 400 });
    }

    // Create title generation prompt
    const titlePrompt = `Generate a short, descriptive title (max 5 words) for this conversation. The title should capture the main topic or theme.

Last message: "${userMessage}"

Rules:
- Maximum 5 words
- No quotes or special characters
- Descriptive and clear
- Use the same language as the conversation

Return ONLY the title, nothing else.`;

    // Check if we should use Mistral directly
    const useMistralDirectly = mistralFallbackEnabled === true;

    if (useMistralDirectly) {

      return await generateTitleWithMistral(titlePrompt);
    }

    // Try Pollinations first


    const pollenApiKey = process.env.POLLEN_API_KEY;

    if (!pollenApiKey) {
      console.warn('[Title API] POLLEN_API_KEY not set, falling back to Mistral');
      return await generateTitleWithMistral(titlePrompt);
    }

    try {
      const response = await fetch(POLLEN_CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pollenApiKey}`,
        },
        body: JSON.stringify({
          model: 'claude', // Fast and reliable for short responses
          messages: [{ role: 'user', content: titlePrompt }],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Title API] Pollinations error (${response.status}):`, errorText);

        // Fall back to Mistral on error

        return await generateTitleWithMistral(titlePrompt);
      }

      const result = await response.json();
      const title = result.choices?.[0]?.message?.content?.trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .substring(0, 50) || 'New Chat'; // Limit length

      return NextResponse.json({
        success: true,
        title,
        provider: 'pollinations'
      });

    } catch (pollinationsError) {
      console.error('[Title API] Pollinations request failed:', pollinationsError);

      // Fall back to Mistral

      return await generateTitleWithMistral(titlePrompt);
    }

  } catch (error) {
    console.error('[Title API] Unexpected error:', error);
    return handleApiError(error);
  }
}

/**
 * Helper function to generate title using Mistral
 */
async function generateTitleWithMistral(titlePrompt: string): Promise<NextResponse> {
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!mistralApiKey) {
    console.error('[Title API] Mistral API key is not configured');

    // Final fallback: extract from prompt
    const match = titlePrompt.match(/Last message: "(.+?)"/);
    const fallbackTitle = match?.[1]?.split(/\s+/).slice(0, 6).join(' ') || 'New Chat';

    return NextResponse.json({
      success: false,
      error: 'No API keys configured',
      title: fallbackTitle,
      provider: 'fallback'
    }, { status: 500 });
  }

  try {
    const mistralResponse = await getMistralChatCompletion({
      messages: [{ role: 'user', content: titlePrompt }],
      modelId: 'mistral-small', // Fast and cost-effective for titles
      apiKey: mistralApiKey,
      maxCompletionTokens: 50,
      temperature: 0.3
    });

    const title = mistralResponse.responseText.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .substring(0, 50); // Limit length

    return NextResponse.json({
      success: true,
      title: title || 'New Chat',
      provider: 'mistral'
    });

  } catch (mistralError) {
    console.error('[Title API] Mistral title generation failed:', mistralError);

    // Final fallback to simple title from prompt
    const match = titlePrompt.match(/Last message: "(.+?)"/);
    const fallbackTitle = match?.[1]?.split(/\s+/).slice(0, 6).join(' ') || 'New Chat';

    return NextResponse.json({
      success: false,
      error: 'All title generation methods failed',
      title: fallbackTitle,
      provider: 'fallback'
    }, { status: 500 });
  }
}
