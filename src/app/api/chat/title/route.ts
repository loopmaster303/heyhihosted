import { NextRequest, NextResponse } from 'next/server';
import { getMistralChatCompletion } from '@/ai/flows/mistral-chat-flow';
import { getMistralModel } from '@/config/mistral-models';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('[Title API] Using Mistral directly for title generation');

    // Extract user message for title generation
    const userMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content || '';

    if (!userMessage.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No user message found for title generation',
        title: 'New Chat'
      }, { status: 400 });
    }

    // Use Mistral directly for title generation
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    if (!mistralApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Mistral API key is not configured',
        title: 'New Chat'
      }, { status: 500 });
    }

    try {
      const titlePrompt = `Generate a short, descriptive title (max 5 words) for this conversation. The title should capture the main topic or theme.

Last message: "${userMessage}"

Rules:
- Maximum 5 words
- No quotes or special characters
- Descriptive and clear
- Use the same language as the conversation

Return ONLY the title, nothing else.`;

      const mistralResponse = await getMistralChatCompletion({
        messages: [{ role: 'user', content: titlePrompt }],
        modelId: 'mistral-medium', // Maps to mistral-large-latest
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
      console.error('Mistral title generation failed:', mistralError);

      // Fallback to simple title from user message
      const fallbackTitle = userMessage.split(/\s+/).slice(0, 6).join(' ') || 'New Chat';

      return NextResponse.json({
        success: false,
        error: 'Mistral title generation failed',
        title: fallbackTitle,
        provider: 'fallback'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Title generation error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to generate title',
      title: 'New Chat',
      provider: 'error'
    }, { status: 500 });
  }
}
