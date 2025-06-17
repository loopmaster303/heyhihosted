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
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log(`📡 Pollinations image request:`, imageUrl);

    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${POLLINATIONS_API_TOKEN}`,
      },
      cache: 'no-store',
    });

    // 🔐 TOKEN ACCESS CHECK
    if (response.status === 403) {
      const text = await response.text();
      console.warn('🚫 403 Forbidden from Pollinations:', text);
      return NextResponse.json({
        error: 'Access denied – your token may not be authorized for gptimage. Try contacting Pollinations support or test with model=flux.',
        modelUsed: 'gptimage',
      }, { status: 403 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText.substring(0, 500);
      try {
        const parsedError = JSON.parse(errorText);
        if (parsedError?.error) {
          errorDetail = typeof parsedError.error === 'string' ? parsedError.error : JSON.stringify(parsedError.error);
        } else if (parsedError?.message) {
          errorDetail = typeof parsedError.message === 'string' ? parsedError.message : JSON.stringify(parsedError.message);
        }
      } catch (e) {
        // Non-JSON error body
      }
      console.error(`❌ Pollinations API error (${response.status}): ${errorDetail}`);
      return NextResponse.json({
        error: `Pollinations API request failed: ${response.status} - ${errorDetail}`,
        modelUsed: 'gptimage',
      }, { status: response.status });
    }

    const contentTypeHeader = response.headers.get('content-type');
    if (!contentTypeHeader?.startsWith('image/')) {
      const fallbackText = await response.text();
      return NextResponse.json({
        error: `Pollinations API did not return an image. Content-Type: ${contentTypeHeader}, Body: ${fallbackText.substring(0, 200)}`,
        modelUsed: 'gptimage'
      }, { status: 502 });
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
    console.error('❌ Server error in /api/openai-image:', error);
    return NextResponse.json({
      error: `Internal server error: ${error.message || 'Unknown error'}`,
      modelUsed: 'gptimage'
    }, { status: 500 });
  }
}