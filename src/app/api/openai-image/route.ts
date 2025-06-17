
import { NextResponse } from 'next/server';

const POLLINATIONS_API_TOKEN = process.env.POLLINATIONS_API_TOKEN;
const DEFAULT_REFERRER = 'FluxFlowAI-GPTImageTool';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('Failed to parse request JSON in /api/openai-image (Pollinations gptimage):', e);
    return NextResponse.json({
      error: "Invalid JSON in request body.",
      details: (e instanceof Error ? e.message : String(e))
    }, { status: 400 });
  }

  // Check for the API token
  if (!POLLINATIONS_API_TOKEN) {
    console.error('CRITICAL: POLLINATIONS_API_TOKEN is not set in .env for /api/openai-image route.');
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
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.', modelUsed: 'gptimage' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('model', 'gptimage'); // Hardcode gptimage for this route
    params.append('width', String(width));
    params.append('height', String(height));
    params.append('nologo', nologo ? 'true' : 'false');
    params.append('private', isPrivate ? 'true' : 'false');
    params.append('enhance', enhance ? 'true' : 'false');
    params.append('transparent', transparent ? 'true' : 'false');
    params.append('referrer', DEFAULT_REFERRER);


    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
        const seedNum = parseInt(String(seed).trim(), 10);
        if (!isNaN(seedNum)) {
            params.append('seed', String(seedNum));
        }
    }
    
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`Requesting image from Pollinations (model: gptimage, authenticated):`, imageUrl);

    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${POLLINATIONS_API_TOKEN}`,
        'Referer': DEFAULT_REFERRER,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText.substring(0, 500);
      try {
        const parsedError = JSON.parse(errorText);
        if (parsedError && parsedError.error) {
          errorDetail = typeof parsedError.error === 'string' ? parsedError.error : JSON.stringify(parsedError.error);
        } else if (parsedError && parsedError.message) {
          errorDetail = typeof parsedError.message === 'string' ? parsedError.message : JSON.stringify(parsedError.message);
        }
      } catch (e) {
        // Error response was not JSON
      }
      console.error(`Pollinations API Error (model: gptimage, status: ${response.status}): ${errorDetail}`);
      return NextResponse.json({
        error: `Pollinations API request failed for model gptimage: ${response.status} - ${errorDetail.substring(0,200)}`,
        modelUsed: 'gptimage'
      }, { status: response.status });
    }

    const contentTypeHeader = response.headers.get('content-type');
    if (!contentTypeHeader || !contentTypeHeader.startsWith('image/')) {
        const responseText = await response.text();
        console.error(`Pollinations API (model: gptimage) did not return an image. Content-Type:`, contentTypeHeader, 'Body (limited):', responseText.substring(0, 200));
        return NextResponse.json({ error: `Pollinations API (model: gptimage) did not return an image. Received: ${contentTypeHeader}`, modelUsed: 'gptimage' }, { status: 502 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Length': String(imageBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    console.error('Error in /api/openai-image (Pollinations gptimage handler):', error);
    return NextResponse.json({
        error: `Internal server error in gptimage (Pollinations) handler: ${error.message || 'Unknown error'}`,
        modelUsed: 'gptimage'
    }, { status: 500 });
  }
}
