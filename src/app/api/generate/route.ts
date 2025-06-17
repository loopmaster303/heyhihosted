
import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('Failed to parse request JSON in /api/generate:', e);
    return NextResponse.json({ 
      error: "Invalid JSON in request body.", 
      details: (e instanceof Error ? e.message : String(e)) 
    }, { status: 400 });
  }

  try {
    const {
      prompt,
      model = 'flux', // Default model if not provided
      width = 1024,
      height = 1024,
      seed,
      nologo = true,
      enhance = false, // maps to upsampling
      private: isPrivate = false,
      transparent = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.', modelUsed: model }, { status: 400 });
    }
    // Check model explicitly because of the default
    if (!model || typeof model !== 'string' || model.trim() === '') {
      // It's unlikely to hit this due to default, but good for robustness
      return NextResponse.json({ error: 'Model is required and must be a non-empty string.', modelUsed: model || 'unknown' }, { status: 400 });
    }

    // --- OpenAI API Logic for 'gptimage' ---
    if (model && model.trim().toLowerCase() === 'gptimage') {
      if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not configured.');
        return NextResponse.json({ error: 'OpenAI API key not configured on server.', modelUsed: model }, { status: 500 });
      }

      const openAiPayload: any = {
        prompt: prompt.trim(),
        model: "gpt-image-1", 
        n: 1, 
        size: "1024x1024", 
      };

      if (transparent) {
        openAiPayload.background = "transparent";
        openAiPayload.output_format = "png"; 
      } else {
        openAiPayload.background = "auto";
        openAiPayload.output_format = "png";
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
        return NextResponse.json({ error: errorDetail, modelUsed: model }, { status: openaiResponse.status });
      }

      if (!openaiData.data || !openaiData.data[0] || !openaiData.data[0].b64_json) {
        console.error('OpenAI API Error: Invalid response structure or missing b64_json data.', openaiData);
        return NextResponse.json({ error: 'OpenAI API returned invalid image data.', modelUsed: model }, { status: 500 });
      }

      const imageBuffer = Buffer.from(openaiData.data[0].b64_json, 'base64');
      const contentType = transparent ? 'image/png' : 'image/png'; // gpt-image-1 with b64_json output is png

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(imageBuffer.byteLength),
        },
      });

    } else {
      // --- Pollinations.ai API Logic (existing) ---
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
      if (enhance) params.append('enhance', 'true'); // 'enhance' from client maps to Pollinations 'enhance'
      if (isPrivate) params.append('private', 'true');
      if (transparent) params.append('transparent', 'true'); // Pollinations also has a transparent param

      const encodedPrompt = encodeURIComponent(prompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

      console.log(`Requesting image from Pollinations (model: ${model}):`, imageUrl);

      const response = await fetch(imageUrl, { method: 'GET', cache: 'no-store' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): RAW TEXT:`, errorText);

        let errorDetail = errorText.substring(0, 500);
        let parsedError: any = null;
        try {
          parsedError = JSON.parse(errorText);
          if (parsedError && parsedError.error) {
            errorDetail = typeof parsedError.error === 'string' ? parsedError.error : JSON.stringify(parsedError.error);
          } else if (parsedError && parsedError.message) {
            errorDetail = typeof parsedError.message === 'string' ? parsedError.message : JSON.stringify(parsedError.message);
          }
          // console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): PARSED JSON:`, parsedError);
        } catch (e) {
          // console.warn(`Pollinations API Error (model: ${model}, status: ${response.status}): Failed to parse error response as JSON. Raw text (limited) was: ${errorText.substring(0,200)}`);
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
    }

  } catch (error: any) {
    console.error('Error in /api/generate (main logic):', error);
    // body might not be defined if the error happened very early before destructuring,
    // though the initial JSON parse is now handled.
    const modelInError = body?.model || 'unknown'; 
    return NextResponse.json({
        error: `Internal server error: ${error.message || 'Unknown error'}`,
        modelUsed: modelInError
    }, { status: 500 });
  }
}
