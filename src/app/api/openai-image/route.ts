
import { NextResponse } from 'next/server';

// This route handles 'gptimage' model requests VIA Pollinations.ai API

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

  try {
    const {
      prompt,
      width = 1024, // Default width if not provided
      height = 1024, // Default height if not provided
      seed,
      nologo = true, // Default to nologo=true if not specified
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

    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
        const seedNum = parseInt(String(seed).trim(), 10);
        if (!isNaN(seedNum)) {
            params.append('seed', String(seedNum));
        }
    }
    if (nologo) params.append('nologo', 'true');
    if (isPrivate) params.append('private', 'true');
    if (enhance) params.append('enhance', 'true');
    if (transparent) params.append('transparent', 'true');

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`Requesting image from Pollinations (model: gptimage):`, imageUrl);

    // Using GET method to call Pollinations API, with no-store cache policy
    const response = await fetch(imageUrl, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API Error (model: gptimage, status: ${response.status}): RAW TEXT:`, errorText);

      let errorDetail = errorText.substring(0, 500); // Limit length of error detail from external API
      try {
        const parsedError = JSON.parse(errorText); // Attempt to parse if it's JSON
        if (parsedError && parsedError.error) {
          errorDetail = typeof parsedError.error === 'string' ? parsedError.error : JSON.stringify(parsedError.error);
        } else if (parsedError && parsedError.message) {
          errorDetail = typeof parsedError.message === 'string' ? parsedError.message : JSON.stringify(parsedError.message);
        }
      } catch (e) {
        // Error response was not JSON, use the raw text (already captured in errorDetail)
      }

      return NextResponse.json({
        error: `Pollinations API request failed for model gptimage: ${response.status} - ${errorDetail.substring(0,200)}`, // Further limit for client display
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
        'Cache-Control': 'no-store', // Ensure client and proxies don't cache
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
