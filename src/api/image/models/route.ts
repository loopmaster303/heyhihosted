
import { NextResponse } from 'next/server';

const SUPPORTED_POLLINATIONS_MODELS = ['flux', 'turbo']; // "gptimage" is now a selectable option

export async function GET() {
  try {
    // We now fetch all models and filter to our supported list, which includes gptimage.
    const resp = await fetch('https://image.pollinations.ai/models', { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Error fetching image models from Pollinations:', resp.status, text);
      return NextResponse.json({ 
        error: `Failed to fetch models from Pollinations: ${resp.status} ${text}`.substring(0, 200),
        models: SUPPORTED_POLLINATIONS_MODELS 
      }, { status: resp.status === 404 ? 404 : 502 });
    }
    const modelsData = await resp.json(); 
    if (Array.isArray(modelsData) && modelsData.every(item => typeof item === 'string')) {
      // Filter the fetched models against our explicit list of supported ones.
      const filteredModels = modelsData.filter(model => SUPPORTED_POLLINATIONS_MODELS.includes(model));
      if (filteredModels.length === 0) { 
        // If API returns empty or none of our supported models, fallback to our known good ones
        return NextResponse.json({ models: SUPPORTED_POLLINATIONS_MODELS });
      }
      return NextResponse.json({ models: filteredModels });
    } else {
      console.error('Unexpected format from Pollinations /models endpoint:', modelsData);
      return NextResponse.json({ 
        error: 'Unexpected format received from Pollinations models API.',
        models: SUPPORTED_POLLINATIONS_MODELS 
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Internal error in /api/image/models:', err);
    return NextResponse.json({ 
      error: `Internal server error: ${err.message || 'Unknown error'}`,
      models: SUPPORTED_POLLINATIONS_MODELS
    }, { status: 500 });
  }
}

    
