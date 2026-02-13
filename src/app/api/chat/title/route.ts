import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';
import { z } from 'zod';

const POLLEN_CHAT_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';

// Validation schema
const TitleGenerationSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
});

const buildFallbackTitle = (userMessage: string) => {
  const trimmed = userMessage.trim();
  if (!trimmed) return 'New Chat';
  return trimmed.split(/\s+/).slice(0, 6).join(' ');
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = validateRequest(TitleGenerationSchema, body);

    // Extract user message for title generation
    const userMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content || '';

    const fallbackTitle = buildFallbackTitle(userMessage);

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

    const pollenApiKey = process.env.POLLEN_API_KEY;

    if (!pollenApiKey) {
      console.warn('[Title API] POLLEN_API_KEY not set, returning fallback title');
      return NextResponse.json({
        success: false,
        error: 'POLLEN_API_KEY not set',
        title: fallbackTitle,
        provider: 'fallback'
      });
    }

    try {
      const response = await fetch(POLLEN_CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pollenApiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-fast', // Cost-first: fast and cheap for short responses
          messages: [{ role: 'user', content: titlePrompt }],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Title API] Pollinations error (${response.status}):`, errorText);
        return NextResponse.json({
          success: false,
          error: `Pollinations error: ${response.status}`,
          title: fallbackTitle,
          provider: 'fallback'
        });
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
      return NextResponse.json({
        success: false,
        error: 'Pollinations request failed',
        title: fallbackTitle,
        provider: 'fallback'
      });
    }

  } catch (error) {
    console.error('[Title API] Unexpected error:', error);
    return handleApiError(error);
  }
}
