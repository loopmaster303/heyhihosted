
import { NextResponse } from 'next/server';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.messages || !body.modelId) {
      return NextResponse.json({ error: 'Missing required fields: messages and modelId' }, { status: 400 });
    }

    // Securely add the API key on the server-side
    const apiInput: PollinationsChatInput = {
      ...body,
      apiKey: process.env.POLLINATIONS_API_TOKEN,
    };

    const result = await getPollinationsChatCompletion(apiInput);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/chat/completion:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
