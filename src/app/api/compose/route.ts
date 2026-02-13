import { NextRequest, NextResponse } from 'next/server';

const POLLINATIONS_BASE = 'https://gen.pollinations.ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration = 60, instrumental = false } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate duration (3-300 seconds)
    const validDuration = Math.max(3, Math.min(300, Number(duration)));

    // Build Universal request (GET)
    const encodedPrompt = encodeURIComponent(prompt);
    // Pollinations expects duration as seconds (number), without a trailing "s".
    const url = `${POLLINATIONS_BASE}/audio/${encodedPrompt}?model=elevenmusic&duration=${validDuration}&instrumental=${instrumental}`;

    console.log('[Compose] Requesting audio (Universal):', url);

    // Get API key if available
    const apiKey = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY;

    const headers: HeadersInit = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Fetch audio from Pollinations
    const response = await fetch(url, { 
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Compose] API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Pollinations API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    // Return audio as base64 for easy client handling
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:${contentType};base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUrl,
      prompt,
      duration: validDuration,
      instrumental,
    });

  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json(
      { error: `Music generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
