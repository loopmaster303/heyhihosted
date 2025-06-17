
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const resp = await fetch('https://image.pollinations.ai/models', { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Error fetching image models from Pollinations:', resp.status, text);
      // Return a default list or an error with more specific info
      return NextResponse.json({ 
        error: `Failed to fetch models from Pollinations: ${resp.status} ${text}`.substring(0, 200),
        // Provide a minimal fallback list if API fails
        models: ['flux', 'turbo', 'sdxl', 'dall-e-3'] 
      }, { status: resp.status === 404 ? 404 : 502 }); // 502 Bad Gateway if Pollinations server error
    }
    const modelsData = await resp.json(); 
    // Pollinations /models endpoint returns an array of strings like ["flux", "turbo"]
    if (Array.isArray(modelsData) && modelsData.every(item => typeof item === 'string')) {
      return NextResponse.json({ models: modelsData });
    } else {
      console.error('Unexpected format from Pollinations /models endpoint:', modelsData);
      return NextResponse.json({ 
        error: 'Unexpected format received from Pollinations models API.',
        models: ['flux', 'turbo', 'sdxl', 'dall-e-3'] // Fallback
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Internal error in /api/image/models:', err);
    return NextResponse.json({ 
      error: `Internal server error: ${err.message || 'Unknown error'}`,
      models: ['flux', 'turbo', 'sdxl', 'dall-e-3'] // Fallback
    }, { status: 500 });
  }
}

    