
import { NextResponse } from 'next/server';

// This route now exclusively handles Pollinations.ai API calls for 'flux', 'turbo' etc.
// OpenAI 'gptimage' calls are handled by /api/openai-image

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('Failed to parse request JSON in /api/generate (Pollinations):', e);
    return NextResponse.json({ 
      error: "Invalid JSON in request body.", 
      details: (e instanceof Error ? e.message : String(e)) 
    }, { status: 400 });
  }

  try {
    const {
      prompt,
      model = 'flux', // Default Pollinations model
      width = 1024,
      height = 1024,
      seed,
      nologo = true,
      enhance = false, // maps to upsampling
      private: isPrivate = false,
      transparent = false, // Pollinations specific transparency
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.', modelUsed: model }, { status: 400 });
    }
    if (!model || typeof model !== 'string' || model.trim() === '' || model.toLowerCase() === 'gptimage') {
      // gptimage should not be routed here.
      return NextResponse.json({ error: `Invalid or unsupported model for Pollinations endpoint: ${model}. 'gptimage' should use the OpenAI endpoint.`, modelUsed: model || 'unknown' }, { status: 400 });
    }

    // --- Pollinations.ai API Logic ---
    const params = new URLSearchParams();
    params.append('width', String(width));
    params.append('height', String(height));
    params.append('model', model);
    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
        const seedNum = parseInt(String(seed).trim(), 10);
        if (!isNaN(seedNum)) {
             params.append('seed', String(seedNum));
        }
    }
    if (nologo) params.append('nologo', 'true');
    if (enhance) params.append('enhance', 'true');
    if (isPrivate) params.append('private', 'true');
    if (transparent) params.append('transparent', 'true'); // For Pollinations models that support it

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`Requesting image from Pollinations (model: ${model}):`, imageUrl);

    const response = await fetch(imageUrl, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): RAW TEXT:`, errorText);

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
        error: `Pollinations API request failed for model ${model}: ${response.status} - ${errorDetail.substring(0,200)}`,
        modelUsed: model
      }, { status: response.status });
    }

    const contentTypeHeader = response.headers.get('content-type');
    if (!contentTypeHeader || !contentTypeHeader.startsWith('image/')) {
        const responseText = await response.text();
        console.error(`Pollinations API (model: ${model}) did not return an image. Content-Type:`, contentTypeHeader, 'Body (limited):', responseText.substring(0, 200));
        return NextResponse.json({ error: `Pollinations API (model: ${model}) did not return an image. Received: ${contentTypeHeader}`, modelUsed: model }, { status: 502 });
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
    console.error('Error in /api/generate (Pollinations handler):', error);
    const modelInError = body?.model || 'unknown'; 
    return NextResponse.json({
        error: `Internal server error in Pollinations handler: ${error.message || 'Unknown error'}`,
        modelUsed: modelInError
    }, { status: 500 });
  }
}
