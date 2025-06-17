
import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  const body = await request.json(); // Declare body here
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
      return NextResponse.json({ error: 'Prompt is required and must be a non-empty string.' }, { status: 400 });
    }
    // Check model explicitly because of the default
    if (!model || typeof model !== 'string' || model.trim() === '') {
      return NextResponse.json({ error: 'Model is required and must be a non-empty string.' }, { status: 400 });
    }

    // --- OpenAI API Logic for 'gptimage' ---
    if (model && model.trim().toLowerCase() === 'gptimage') {
      if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not configured.');
        return NextResponse.json({ error: 'OpenAI API key not configured on server.', modelUsed: model }, { status: 500 });
      }

      const openAiPayload: any = {
        prompt: prompt.trim(),
        model: "gpt-image-1", // Using the specific OpenAI model that supports transparency and b64_json output
        n: 1, // Client handles batching by calling this API multiple times
        size: "1024x1024", // Defaulting to a supported size for gpt-image-1
        // response_format: "b64_json", // REMOVED: gpt-image-1 always returns b64_json and doesn't support this param
      };

      if (transparent) {
        openAiPayload.background = "transparent";
        openAiPayload.output_format = "png"; // Required for transparency
      } else {
        openAiPayload.background = "auto";
        openAiPayload.output_format = "png"; // Default output format
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
      const contentType = transparent ? 'image/png' : 'image/png';

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
      if (enhance) params.append('enhance', 'true');
      if (isPrivate) params.append('private', 'true');
      if (transparent) params.append('transparent', 'true');

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
          console.error(`Pollinations API Error (model: ${model}, status: ${response.status}): PARSED JSON:`, parsedError);
        } catch (e) {
          console.warn(`Pollinations API Error (model: ${model}, status: ${response.status}): Failed to parse error response as JSON. Raw text (limited) was: ${errorText.substring(0,200)}`);
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
    console.error('Error in /api/generate:', error);
    const modelInError = body?.model || 'unknown';
    return NextResponse.json({
        error: `Internal server error: ${error.message || 'Unknown error'}`,
        modelUsed: modelInError
    }, { status: 500 });
  }
}
