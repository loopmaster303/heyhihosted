import { NextResponse } from 'next/server';

const POLLINATIONS_API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('❌ Failed to parse request JSON in /api/openai-image:', e);
    return NextResponse.json({
      error: 'Invalid JSON in request body.',
      details: (e instanceof Error ? e.message : String(e)),
    }, { status: 400 });
  }

  if (!POLLINATIONS_API_TOKEN) {
    console.error('❌ Missing POLLINATIONS_API_TOKEN in env');
    return NextResponse.json({
      error: 'API configuration error: Missing Pollinations API token on the server.',
      modelUsed: 'gptimage'
    }, { status: 500 });
  }

  try {
    const {
      prompt,
      width = 1024,
      height = 1024,
      seed,
      nologo = true,
      private: isPrivate = false,
      enhance = false,
      transparent = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({
        error: 'Prompt is required and must be a non-empty string.',
        modelUsed: 'gptimage'
      }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('model', 'gptimage');
    params.append('width', String(width));
    params.append('height', String(height));
    if (nologo) params.append('nologo', 'true');
    if (isPrivate) params.append('private', 'true');
    if (enhance) params.append('enhance', 'true');
    if (transparent) params.append('transparent', 'true');
    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
      const seedNum = parseInt(String(seed).trim(), 10);
      if (!isNaN(seedNum)) {
        params.append('seed', String(seedNum));
      }
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`📡 Pollinations image request (via openai-image route):`, imageUrl);
    
    // Return the constructed URL to the client instead of proxying the image.
    // This fixes the localStorage quota issue by allowing the client to store a small URL
    // instead of a large Base64 data URI. The client is responsible for handling potential
    // fetch errors (e.g., 403 Forbidden) from this URL.
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('❌ Server error in /api/openai-image:', error);
    return NextResponse.json({
      error: `Internal server error: ${error.message || 'Unknown error'}`,
      modelUsed: 'gptimage'
    }, { status: 500 });
  }
}
