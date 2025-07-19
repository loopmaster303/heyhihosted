
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

    const token = process.env.POLLINATIONS_API_TOKEN;
    if (!token) {
        console.warn("POLLINATIONS_API_TOKEN is not set. Image generation might fail.");
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

    // Instead of fetching the image on the backend, we return the URL to the client.
    // This allows the client to handle the image and avoids server bandwidth for proxying.
    // It also solves the localStorage quota issue by allowing the client to store the URL
    // instead of a large base64 data URI.
    return NextResponse.json({ imageUrl });


  } catch (error: any)
 {
    console.error('Error in /api/generate (Pollinations handler):', error);
    const modelInError = body?.model || 'unknown'; 
    return NextResponse.json({
        error: `Internal server error in Pollinations handler: ${error.message || 'Unknown error'}`,
        modelUsed: modelInError
    }, { status: 500 });
  }
}
