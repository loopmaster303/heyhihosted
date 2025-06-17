
import { NextResponse } from 'next/server';

// This route now handles 'gptimage' model requests VIA Pollinations.ai API

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
      // width, height, seed, nologo, isPrivate, enhance are no longer used for gptimage via Pollinations
      transparent = false, // For Pollinations gptimage
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.', modelUsed: 'gptimage' }, { status: 400 });
    }

    // --- Pollinations.ai API Logic for gptimage ---
    const params = new URLSearchParams();
    params.append('model', 'gptimage'); // Hardcode gptimage for this route
    
    // Only add 'transparent' if true, as Pollinations 'gptimage' example shows
    if (transparent) {
      params.append('transparent', 'true');
    }
    // Note: Other parameters like width, height, seed, nologo, private, enhance are omitted
    // as they might not be supported or cause issues with Pollinations' gptimage endpoint.
    // Pollinations will likely use default dimensions for gptimage.

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`Requesting image from Pollinations (model: gptimage):`, imageUrl);

    const response = await fetch(imageUrl, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API Error (model: gptimage, status: ${response.status}): RAW TEXT:`, errorText);

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
