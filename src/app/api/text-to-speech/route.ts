
import { NextResponse } from 'next/server';

// This is the documented base URL for TTS GET requests
const POLLINATIONS_TTS_API_URL = 'https://text.pollinations.ai';

export async function POST(request: Request) {
  try {
    // We receive a POST from our frontend to hide the text from browser history and avoid GET limits there
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    const encodedText = encodeURIComponent(text.trim());
    const queryParams = new URLSearchParams({
      model: 'openai-audio',
      voice: voice,
    });
    
    // Construct the URL according to the documentation: https://text.pollinations.ai/{prompt}?params
    const fullUrl = `${POLLINATIONS_TTS_API_URL}/${encodedText}?${queryParams.toString()}`;

    // The API documentation specifies a GET request for TTS
    const ttsResponse = await fetch(fullUrl, { method: 'GET' });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Pollinations TTS API Error (GET):', errorText, 'URL:', fullUrl.substring(0, 500)); // Log truncated URL
      let details = `API responded with status ${ttsResponse.status}.`;
      try {
        const errorJson = JSON.parse(errorText);
        details = errorJson.error?.message || errorText;
      } catch (e) {
        // Not a JSON error, use raw text but truncate
        details = errorText.substring(0, 200);
      }
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details }, { status: ttsResponse.status });
    }

    const contentType = ttsResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('audio/')) {
        const responseText = await ttsResponse.text();
        console.error('Pollinations TTS API - Unexpected content type:', contentType, 'Response body:', responseText);
        return NextResponse.json({ error: 'API returned an unexpected response format instead of audio.' }, { status: 500 });
    }

    // Stream the audio response back to the client
    const audioBlob = await ttsResponse.blob();
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('Error in TTS route:', error);
    // This catches errors in my own backend route, like network issues to Pollinations or URL length errors
    if (error instanceof TypeError && error.message.includes('URI malformed')) {
        return NextResponse.json({ error: 'The text is too long to convert to speech with the current API.', details: error.message }, { status: 414 });
    }
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
