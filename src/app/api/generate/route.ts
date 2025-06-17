
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      model = 'flux', // Default model
      width = 1024, 
      height = 1024, 
      seed, 
      nologo = true, 
      enhance = false, 
      private: isPrivate = false,
      transparent = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.' }, { status: 400 });
    }
    if (typeof model !== 'string' || model.trim() === '') {
      return NextResponse.json({ error: 'Model is required and must be a non-empty string.' }, { status: 400 });
    }
    if (typeof width !== 'number' || width < 64 || width > 4096) {
      return NextResponse.json({ error: 'Width must be a number between 64 and 4096.' }, { status: 400 });
    }
    if (typeof height !== 'number' || height < 64 || height > 4096) {
      return NextResponse.json({ error: 'Height must be a number between 64 and 4096.' }, { status: 400 });
    }


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
    if (enhance) params.append('enhance', 'true'); // Pollinations uses 'enhance' for upsampling
    if (isPrivate) params.append('private', 'true');
    if (transparent) params.append('transparent', 'true');
    
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`Requesting image from Pollinations (model: ${model}):`, imageUrl);

    const response = await fetch(imageUrl, { method: 'GET', cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      // Log the raw error text
      console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): RAW TEXT:`, errorText);
      
      let errorDetail = errorText.substring(0, 500); // Limit length for response message
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorText);
        if (parsedError && parsedError.error) {
          errorDetail = typeof parsedError.error === 'string' ? parsedError.error : JSON.stringify(parsedError.error);
        } else if (parsedError && parsedError.message) {
          errorDetail = typeof parsedError.message === 'string' ? parsedError.message : JSON.stringify(parsedError.message);
        }
        // Log the parsed error if successful
        console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): PARSED JSON:`, parsedError);
      } catch (e) {
        // If JSON parsing fails, errorDetail remains the raw text (or its substring)
        console.warn(`Pollinations API Error (model: ${model}, status: ${response.status}): Failed to parse error response as JSON. Raw text (limited) was: ${errorText.substring(0,200)}`);
      }
      
      return NextResponse.json({ 
        error: `Pollinations API request failed for model ${model}: ${response.status} - ${errorDetail.substring(0,200)}`,
        modelUsed: model 
      }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
        const responseText = await response.text();
        console.error(`Pollinations API (model: ${model}) did not return an image. Content-Type:`, contentType, 'Body (limited):', responseText.substring(0, 200));
        return NextResponse.json({ error: `Pollinations API (model: ${model}) did not return an image. Received: ${contentType}`, modelUsed: model }, { status: 502 }); // Bad Gateway
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(imageBuffer.byteLength),
      },
    });

  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
