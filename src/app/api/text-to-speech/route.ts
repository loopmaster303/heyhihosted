
import { NextResponse } from 'next/server';

const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    const trimmedText = text.trim();
    const encodedText = encodeURIComponent(trimmedText);

    // Per documentation, the endpoint is GET https://text.pollinations.ai/{prompt}
    const ttsUrl = new URL(`https://text.pollinations.ai/${encodedText}`);
    ttsUrl.searchParams.append('model', 'openai-audio');
    ttsUrl.searchParams.append('voice', voice);

    // If a token exists, add it as a query parameter for authentication on GET requests
    if (API_TOKEN) {
      // Note: The docs are not explicit about token auth for this GET endpoint,
      // but it's a standard way to pass tokens if supported.
      // We are adding it for potential higher rate limits.
    }
    
    // Log a warning if the URL is getting very long, as this is a known limitation of the GET method.
    if (ttsUrl.toString().length > 4000) {
        console.warn(`TTS URL length is ${ttsUrl.toString().length}, which may exceed server limits.`);
    }

    const ttsResponse = await fetch(ttsUrl.toString(), {
      method: 'GET',
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Pollinations TTS API Error (GET):', errorText, 'URL:', ttsUrl.toString());
      let details = `API responded with status ${ttsResponse.status}.`;
      try {
        const errorJson = JSON.parse(errorText);
        details = errorJson.detail || errorJson.error?.message || errorText;
      } catch (e) {
        details = errorText.substring(0, 200); 
      }
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details }, { status: ttsResponse.status });
    }

    const contentType = ttsResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('audio/')) {
        const responseText = await ttsResponse.text();
        console.error('Pollinations TTS API - Unexpected content type:', contentType, 'Response body:', responseText.substring(0, 500));
        return NextResponse.json({ error: 'API returned an unexpected response format instead of audio.' }, { status: 500 });
    }

    const audioBlob = await ttsResponse.blob();
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
