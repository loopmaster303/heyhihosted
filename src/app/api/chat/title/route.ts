
import { NextResponse } from 'next/server';
import { generateChatTitle, type GenerateChatTitleInput } from '@/ai/flows/generate-chat-title';

export async function POST(request: Request) {
  try {
    const body: GenerateChatTitleInput = await request.json();

    if (!body.messages || body.messages.trim() === '') {
      return NextResponse.json({ error: 'Messages cannot be empty' }, { status: 400 });
    }

    const result = await generateChatTitle(body);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/chat/title:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
