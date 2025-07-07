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
    const constructedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`📡 Proxying Pollinations image request (via openai-image route):`, constructedUrl);
    
    // Fetch the image from the constructed URL on the backend
    const imageResponse = await fetch(constructedUrl, {
        headers: {
            'Authorization': `Bearer ${POLLINATIONS_API_TOKEN}`
        }
    });

    if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error(`❌ Pollinations API returned an error: ${imageResponse.status}`, errorText);
        throw new Error(`Failed to fetch image from Pollinations. Status: ${imageResponse.status}. Details: ${errorText.substring(0, 150)}`);
    }

    // Get the image data as a buffer, then convert to a base64 data URI
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';
    
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // Return the data URI to the client for robust display
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('❌ Server error in /api/openai-image:', error);
    return NextResponse.json({
      error: `Internal server error: ${error.message || 'Unknown error'}`,
      modelUsed: 'gptimage'
    }, { status: 500 });
  }
}
