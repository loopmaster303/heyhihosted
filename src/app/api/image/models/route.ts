
import { NextResponse } from 'next/server';

const SUPPORTED_IMAGE_MODELS = ['flux', 'turbo', 'gptimage'];

export async function GET() {
  try {
    const resp = await fetch('https://image.pollinations.ai/models', { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Error fetching image models from Pollinations:', resp.status, text);
      return NextResponse.json({ 
        error: `Failed to fetch models from Pollinations: ${resp.status} ${text}`.substring(0, 200),
        models: SUPPORTED_IMAGE_MODELS // Use accurate fallback
      }, { status: resp.status === 404 ? 404 : 502 });
    }
    const modelsData = await resp.json(); 
    if (Array.isArray(modelsData) && modelsData.every(item => typeof item === 'string')) {
      // Filter the received models to only include those we know are supported,
      // in case the API returns more than expected or deprecated ones.
      const filteredModels = modelsData.filter(model => SUPPORTED_IMAGE_MODELS.includes(model));
      if (filteredModels.length === 0) { // If filtering results in empty, use our known list
        return NextResponse.json({ models: SUPPORTED_IMAGE_MODELS });
      }
      return NextResponse.json({ models: filteredModels });
    } else {
      console.error('Unexpected format from Pollinations /models endpoint:', modelsData);
      return NextResponse.json({ 
        error: 'Unexpected format received from Pollinations models API.',
        models: SUPPORTED_IMAGE_MODELS // Use accurate fallback
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Internal error in /api/image/models:', err);
    return NextResponse.json({ 
      error: `Internal server error: ${err.message || 'Unknown error'}`,
      models: SUPPORTED_IMAGE_MODELS // Use accurate fallback
    }, { status: 500 });
  }
}

    
