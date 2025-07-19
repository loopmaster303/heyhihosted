
import { NextResponse } from 'next/server';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';

export async function POST(request: Request) {
  try {
    const body: PollinationsChatInput = await request.json();

    // Basic validation
    if (!body.messages || !body.modelId) {
      return NextResponse.json({ error: 'Missing required fields: messages and modelId' }, { status: 400 });
    }

    const result = await getPollinationsChatCompletion(body);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/chat/completion:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
