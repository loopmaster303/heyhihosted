
import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('Failed to parse request JSON in /api/openai-image:', e);
    return NextResponse.json({ 
      error: "Invalid JSON in request body.", 
      details: (e instanceof Error ? e.message : String(e)) 
    }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured.');
    return NextResponse.json({ error: 'OpenAI API key not configured on server.', modelUsed: 'gpt-image-1' }, { status: 500 });
  }

  try {
    const {
      prompt,
      size = "1024x1024", // Default size for gpt-image-1
      background = "auto", // auto, transparent, opaque
      quality = "auto", // auto, high, medium, low
      // n is assumed to be 1 as client handles batching
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.', modelUsed: 'gpt-image-1' }, { status: 400 });
    }

    const openAiPayload: any = {
      prompt: prompt.trim(),
      model: "gpt-image-1", 
      n: 1, 
      size: size,
      quality: quality,
      // response_format is not needed for gpt-image-1 as it always returns b64_json
    };

    if (background === "transparent") {
      openAiPayload.background = "transparent";
      openAiPayload.output_format = "png"; // Transparency needs png or webp
    } else if (background === "opaque") {
      openAiPayload.background = "opaque";
      openAiPayload.output_format = "png"; // Default to png
    } else {
      openAiPayload.background = "auto";
      openAiPayload.output_format = "png"; // Default to png
    }
    
    console.log(`Requesting image from OpenAI (model: gpt-image-1):`, JSON.stringify(openAiPayload, null, 2));

    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openAiPayload),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error(`OpenAI API Error (model: gpt-image-1, status: ${openaiResponse.status}):`, openaiData);
      const errorDetail = openaiData.error?.message || `OpenAI API request failed with status ${openaiResponse.status}`;
      return NextResponse.json({ error: errorDetail, modelUsed: 'gpt-image-1' }, { status: openaiResponse.status });
    }

    if (!openaiData.data || !openaiData.data[0] || !openaiData.data[0].b64_json) {
      console.error('OpenAI API Error: Invalid response structure or missing b64_json data.', openaiData);
      return NextResponse.json({ error: 'OpenAI API returned invalid image data.', modelUsed: 'gpt-image-1' }, { status: 500 });
    }

    const imageBuffer = Buffer.from(openaiData.data[0].b64_json, 'base64');
    // Determine content type based on output_format, default to png
    const contentType = openAiPayload.output_format === 'jpeg' ? 'image/jpeg' : 
                        openAiPayload.output_format === 'webp' ? 'image/webp' : 'image/png';


    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(imageBuffer.byteLength),
      },
    });

  } catch (error: any) {
    console.error('Error in /api/openai-image:', error);
    return NextResponse.json({
        error: `Internal server error in OpenAI handler: ${error.message || 'Unknown error'}`,
        modelUsed: 'gpt-image-1'
    }, { status: 500 });
  }
}
